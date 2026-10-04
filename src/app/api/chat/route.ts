import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

// Fallback knowledge answers if API key is unconfigured or temporary outage occurs
const FALLBACK_ANSWERS: Record<string, { ru: string; kk: string }> = {
  default: {
    ru: 'Сәлем! Я Нурали — твой наставник по домбре. Традиционный строй домбры — Оң бұрау (G3/D3) и Теріс бұрау (G3/C3). Какой кюй разберём: Адай, Сарыарка или Еркемай? Спрашивай о приёмах, строе или истории!',
    kk: 'Сәлем! Мен Нұрәлімін — домбыра үйретушіңмін. Домбыраның негізгі бұраулары: Оң бұрау (G3/D3) және Теріс бұрау (G3/C3). Қандай күйді үйренеміз: Адай, Сарыарқа әлде Еркемай ма? Сұрағыңды қоя бер!',
  },
  aday: {
    ru: 'Кюй «Адай» Курмангазы — это символ казахского духа и степной свободы! Он играется в быстром темпе в строе Оң бұрау. Главное — четкий ритмичный удар (қағыс) сверху вниз.',
    kk: 'Құрманғазының «Адай» күйі — еркіндік пен батырлықтың символы! Ол Оң бұрауда жылдам екпінмен орындалады. Ең бастысы — қағыстың анық әрі екпінді болуы.',
  },
  tuning: {
    ru: 'Домбра настраивается в двух основных строях: 1) Оң бұрау (прямой): нижняя струна G3 (196 Гц), верхняя D3 (146.8 Гц). 2) Теріс бұрау (обратный): нижняя G3 (196 Гц), верхняя C3 (130.8 Гц). Воспользуйся вкладкой «Тюнер» для настройки через микрофон!',
    kk: 'Домбыраның негізгі екі бұрауы бар: 1) Оң бұрау: төменгі ішек G3 (196 Гц), жоғарғы ішек D3 (146.8 Гц). 2) Теріс бұрау: төменгі ішек G3 (196 Гц), жоғарғы ішек C3 (130.8 Гц). Баптау үшін «Тюнер» бөлімін пайдалан!',
  },
};

function getSmartFallback(lastMsg: string, isKazakh: boolean): string {
  const q = lastMsg.toLowerCase();
  if (q.includes('адай') || q.includes('aday')) {
    return isKazakh ? FALLBACK_ANSWERS.aday.kk : FALLBACK_ANSWERS.aday.ru;
  }
  if (q.includes('бұрау') || q.includes('настрой') || q.includes('тюнер') || q.includes('тюн')) {
    return isKazakh ? FALLBACK_ANSWERS.tuning.kk : FALLBACK_ANSWERS.tuning.ru;
  }
  return isKazakh ? FALLBACK_ANSWERS.default.kk : FALLBACK_ANSWERS.default.ru;
}

export async function POST(req: Request) {
  let locale = 'ru';
  let lastUserMsg = '';
  try {
    const body = await req.json().catch(() => ({}));
    const rawMessages = Array.isArray(body.messages)
      ? body.messages
      : body.message
      ? [{ role: 'user', content: String(body.message) }]
      : [];
    locale = body.locale || 'ru';

    const isKazakh = locale === 'kk';
    lastUserMsg = rawMessages.length > 0 ? (rawMessages[rawMessages.length - 1]?.content || '') : '';

    // If no API key configured on the server, return smart domain-specific response
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ text: getSmartFallback(lastUserMsg, isKazakh) });
    }

    // Format messages for Gemini API
    const formattedMessages = rawMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }],
    }));

    if (formattedMessages.length === 0) {
      formattedMessages.push({ role: 'user', parts: [{ text: 'Сәлем' }] });
    }

    const systemPrompt = isKazakh
      ? 'Сен — Нұрәлісің, домбыра және қазақ ұлттық музыкасының білгірі, мейірімді әрі шабыттандырушы ИИ-ұстазсың. Домбыра пернелері, қағыстары (қағыс түрлері: дара, қос, ілме, шерту), Курманғазы, Дина Нұрпейісова және күйлер туралы білесің. Қазақ тілінде қысқа, нақты, рух беретін сөздермен жауап бер.'
      : 'Ты — Нурали, дружелюбный и вдохновляющий ИИ-учитель казахской национальной музыки и домбры. Ты эксперт по строю домбры (Оң бұрау, Теріс бұрау), ладам, ударам (қағыс: дара, қос, ілме), кюям Курмангазы, Таттимбета, Дины Нурпеисовой. Отвечай дружелюбно, ёмко, используй эмодзи и музыкальные термины. Если вопрос не о музыке, тепло возвращай тему к домбре.';

    const systemInstruction = {
      parts: [{ text: systemPrompt }],
    };

    // Candidate models to try in order of preference (fast, stable, and tested)
    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
    ];
    let lastError: any = null;
    let aiResponse: string | null = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              contents: formattedMessages,
              systemInstruction: systemInstruction,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiResponse) break;
        } else {
          const errText = await response.text();
          console.warn(`Model ${model} returned error ${response.status}:`, errText);
          lastError = errText;
        }
      } catch (err) {
        console.warn(`Fetch error with model ${model}:`, err);
        lastError = err;
      }
    }

    if (!aiResponse) {
      console.error('All Gemini candidate models failed. Last error:', lastError);
      return NextResponse.json({ text: getSmartFallback(lastUserMsg, isKazakh) });
    }

    return NextResponse.json({ text: aiResponse });
  } catch (error) {
    console.error('API Error in /api/chat:', error);
    const isKazakh = locale === 'kk';
    return NextResponse.json({ text: getSmartFallback(lastUserMsg, isKazakh) });
  }
}
