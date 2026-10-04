import { NextResponse } from 'next/server';

function cleanTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    // Remove markdown formatting (*, _, ~, `, #)
    .replace(/[*_#`~>]/g, '')
    // Replace markdown links [label](url) with just label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

async function synthesizeWithEdge(text: string, locale: string): Promise<Buffer> {
  const { MsEdgeTTS, OUTPUT_FORMAT, PITCH } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  const isKazakh = locale === 'kk';
  // Kazakh: Daulet (male) or Russian: Dmitry (male), pitch-shifted to lively young boy
  const voiceName = isKazakh ? 'kk-KZ-DauletNeural' : 'ru-RU-DmitryNeural';
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  return new Promise<Buffer>((resolve, reject) => {
    const { audioStream, metadataStream } = tts.toStream(text, {
      pitch: PITCH.HIGH,
    });

    if (metadataStream) {
      metadataStream.on('error', () => {
        // Prevent unhandled error event on metadataStream
      });
    }

    const chunks: Buffer[] = [];

    audioStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on('end', () => {
      if (chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error('Empty audio stream returned from Edge TTS'));
      }
    });

    audioStream.on('error', (err: any) => {
      if (chunks.length > 1000) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(err);
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawText = body.text || '';
    const locale = body.locale || 'ru';

    const textToSpeak = cleanTextForSpeech(rawText);
    if (!textToSpeak) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Cap at 450 characters to keep audio fast and conserve bandwidth
    const truncatedText = textToSpeak.length > 450
      ? textToSpeak.slice(0, 450).replace(/[.,!?][^.,!?]*$/, '') + '.'
      : textToSpeak;

    // 1. Try ElevenLabs if user configured ELEVENLABS_API_KEY
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoiceId =
      process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV';

    if (elevenLabsApiKey) {
      try {
        const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}?output_format=mp3_44100_128`;
        const elRes = await fetch(elevenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey,
          },
          body: JSON.stringify({
            text: truncatedText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        });

        if (elRes.ok) {
          const audioBuffer = await elRes.arrayBuffer();
          return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      } catch (elErr) {
        console.warn('ElevenLabs TTS failed, falling back to Edge Neural TTS:', elErr);
      }
    }

    // 2. High-Quality Edge Neural TTS (100% Free, No API Key Required)
    // Uses Microsoft Azure Neural voices (Daulet for Kazakh, Dmitry for Russian)
    try {
      const audioBuffer = await synthesizeWithEdge(truncatedText, locale);
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (edgeErr) {
      console.warn('Edge TTS failed, checking Google Cloud TTS fallback:', edgeErr);
    }

    // 3. Optional Fallback: Google Cloud TTS (if configured)
    const googleTtsKey =
      process.env.GOOGLE_CLOUD_TTS_API_KEY ||
      process.env.GOOGLE_TTS_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (googleTtsKey) {
      try {
        const isKazakh = locale === 'kk';
        const googleUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsKey}`;
        const gRes = await fetch(googleUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: truncatedText },
            voice: {
              languageCode: isKazakh ? 'kk-KZ' : 'ru-RU',
              name: isKazakh ? 'kk-KZ-Standard-A' : 'ru-RU-Wavenet-D',
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: 4.0,
              speakingRate: 1.05,
            },
          }),
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.audioContent) {
            const audioBuffer = Buffer.from(gData.audioContent, 'base64');
            return new NextResponse(audioBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=86400',
              },
            });
          }
        }
      } catch (gErr) {
        console.error('Google Cloud TTS fallback failed:', gErr);
      }
    }

    return NextResponse.json(
      { error: 'TTS_FAILED', message: 'Unable to synthesize speech' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('TTS Route Exception:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
