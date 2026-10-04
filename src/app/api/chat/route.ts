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
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

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
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured in environment variables.');
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
      ? `Сен — Нұрәлісің, домбыра шебері әрі тәжірибелі кәсіби ұстазсың.
ҚАТАҢ ЕРЕЖЕЛЕР:
1. ЕШҚАШАН өзіңді «ИИ», «робот», «микросхема», «пиксел» немесе «виртуалды» деп атама. Өзіңді шынайы тәжірибелі домбырашы, ұстаз ретінде ұста.
2. Жұлдызшамен рөлдік қимылдар жазба: «*(қағыс жасайды)*», «*(тын-тырын)*» сияқты сөздерге ҚАТАҢ ТЫЙЫМ салынады.
3. Жасанды эмоциялар мен смайликтерді шектен тыс қолданба (😭, ❤️, т.б. қойма). Ең көбі 1-2 талғамды эмодзи (🪕, ✨).
4. Жауабың қысқа, нақты, сауатты, іскерлік және жылы болсын (2-3 қысқа сөйлем немесе абзац).
5. Күйлер, домбыра құрылысы, пернелер, қағыстар (дара, қос, ілме, шерту) туралы нақты әрі кәсіби жауап бер. Сұрақ музыкаға қатысты болмаса, жылы әрі мәдениетті түрде домбыра тақырыбына бұр.`
      : `Ты — Нурали, профессиональный преподаватель и мастер игры на казахской домбре.
СТРОГИЕ ПРАВИЛА:
1. НИКАКОГО ИИ-СЛОПА И РОБОТИЗИРОВАННОГО РОЛЕПЛЕЯ. НИКОГДА не упоминай, что ты «ИИ», «робот», «состоишь из микросхем/пикселей» или «играешь на виртуальных струнах». Общайся как живой, уважительный, знающий наставник-музыкант.
2. НИКАКИХ действий в звёздочках: строго запрещено писать «*(делаю удар)*», «*(тын-тырын)*», звукоподражания и ролевые ремарки.
3. НИКАКОЙ слащавости, наигранного драматизма и спама эмодзи (никаких «😭❤️», «Эх, аж сердце замерло!»). Максимум 1-2 уместных эмодзи (🪕, ✨).
4. Ответы должны быть ёмкими, конкретными и лаконичными: 2–3 чётких абзаца по существу, без пустой «воды» и долгих вступлений.
5. Говори со знанием дела о строе (Оң бұрау, Теріс бұрау), ладах, ударах (қағыс: дара, қос, ілме, шерту), истории кюев Курмангазы, Таттимбета, Дины Нурпеисовой. Если вопрос не о музыке, кратко и вежливо ответь и верни беседу к домбре.`;

    const systemInstruction = {
      parts: [{ text: systemPrompt }],
    };

    // Candidate models to try in order of preference (gemini-3.5-flash is ultra-fast & highly available)
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
    ];
    let lastError: any = null;
    let aiResponse: string | null = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': apiKey,
            },
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
