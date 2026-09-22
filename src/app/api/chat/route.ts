import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const { messages } = await req.json();

    // Format messages for Gemini API
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = {
      parts: [{ text: "Ты — Нурали, дружелюбный ИИ-учитель казахской музыки. Ты эксперт по игре на домбре, знаешь всё о кюях, Курмангазы и Дине Нурпеисовой. Отвечай весело, используй музыкальные термины и эмодзи. Если спрашивают не про музыку, мягко возвращай тему к домбре." }]
    };

    // Using streamGenerateContent but with standard POST (it returns a stream of JSON chunks or just wait for full if we parse it differently. 
    // Wait, streamGenerateContent returns JSON chunks. Let's use generateContent for simplicity first if we don't want to parse SSE.
    // Since I'm doing raw fetch, stream parsing on frontend can be tricky. Let's stick to standard generateContent for now to ensure it works flawlessly.
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: formattedMessages,
          systemInstruction: systemInstruction
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API Error:', error);
      return NextResponse.json({ error: 'Failed to generate response' }, { status: response.status });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Произошла ошибка при получении ответа.";

    return NextResponse.json({ text: aiResponse });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
