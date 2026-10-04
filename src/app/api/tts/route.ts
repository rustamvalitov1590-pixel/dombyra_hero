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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawText = body.text || '';
    const locale = body.locale || 'ru';

    const textToSpeak = cleanTextForSpeech(rawText);
    if (!textToSpeak) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Cap at 450 characters to keep audio fast and conserve API quota
    const truncatedText = textToSpeak.length > 450
      ? textToSpeak.slice(0, 450).replace(/[.,!?][^.,!?]*$/, '') + '.'
      : textToSpeak;

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    // Default boy / young energetic voice ID in ElevenLabs (e.g. Antoni / Sam or custom boy voice)
    const elevenLabsVoiceId =
      process.env.ELEVENLABS_VOICE_ID || 'ErXwobaYiN019PkySvjV';

    // 1. Try ElevenLabs (Multilingual v2 with Russian & Kazakh support)
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
        } else {
          const errorText = await elRes.text();
          console.warn('ElevenLabs API error response:', elRes.status, errorText);
        }
      } catch (elErr) {
        console.error('ElevenLabs request failed:', elErr);
      }
    }

    // 2. Fallback: Google Cloud TTS (if configured with API key or token)
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
              // Use pitch shifted youth/boy voice
              name: isKazakh ? 'kk-KZ-Standard-A' : 'ru-RU-Wavenet-D',
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: 4.0, // Child/boy vocal range modulation
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
        } else {
          const gErrText = await gRes.text();
          console.warn('Google Cloud TTS error:', gRes.status, gErrText);
        }
      } catch (gErr) {
        console.error('Google Cloud TTS failed:', gErr);
      }
    }

    // 3. If neither TTS service is configured or worked
    return NextResponse.json(
      {
        error: 'TTS_UNAVAILABLE',
        message:
          'ElevenLabs API key is not configured or request failed. Set ELEVENLABS_API_KEY in .env.local or Vercel.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('TTS Route Exception:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
