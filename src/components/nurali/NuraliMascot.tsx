'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageSquare, X, Send, Sparkles, Volume2, HelpCircle } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function NuraliMascot() {
  const pathname = usePathname();
  const t = useTranslations('nurali');

  // Mascot and animation states
  const [pupilOffset, setPupilOffset] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isCheering, setIsCheering] = useState(false);

  // Bubble states
  const [bubbleText, setBubbleText] = useState('');
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);

  // Chat modal states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('welcome') || 'Сәлем! Я Нурали — твой ИИ-наставник по домбре. Задай мне любой вопрос о кюях, настройке или технике игры!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mascotRef = useRef<HTMLDivElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Eye tracking logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const dist = Math.min(3.2, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 40);

      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      setPupilOffset({
        lx: dx,
        ly: dy,
        rx: dx,
        ry: dy,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Periodic natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, Math.random() * 3000 + 4000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Contextual tips depending on active page
  useEffect(() => {
    let tip = '';
    if (pathname === '/learn') {
      tip = 'Совет: начните разучивание с комфортной скорости 0.6× и обращайте внимание на стрелки ударов (қағыс)!';
    } else if (pathname === '/tuner') {
      tip = 'Включите микрофон и защипните струну. Зелёный сектор по центру означает точный строй!';
    } else if (pathname === '/karaoke') {
      tip = 'Караоке слушает вашу живую домбру! Играйте точно в такт, чтобы набрать высокий комбо.';
    } else if (pathname === '/record') {
      tip = 'Запишите сыгранный на домбре фрагмент, и наш ИИ переведёт звук в цифровую табулатуру!';
    } else {
      tip = 'Сәлем! Я Нурали — твой ИИ-наставник в DombraHero. Нажми на меня, чтобы задать вопрос!';
    }

    setBubbleText(tip);
    setIsBubbleVisible(true);

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
    }, 7000);

    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, [pathname]);

  // Auto-scroll chat
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Send question to Gemini API
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);
    setIsTalking(true);
    setIsCheering(true);
    setTimeout(() => setIsCheering(false), 800);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const answer = data.text || 'К сожалению, не удалось получить ответ от ИИ. Попробуйте еще раз.';

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Произошла ошибка связи с сервером. Пожалуйста, проверьте подключение.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTalking(false);
    }
  };

  const quickChips = [
    t('chip_tuning') || 'Как настроить домбру?',
    t('chip_aday') || 'Расскажи про кюй «Адай»',
    t('chip_teris') || 'Что такое теріс бұрау?',
    t('chip_strokes') || 'Какие бывают қағысы (удары)?',
  ];

  return (
    <>
      {/* Floating Container: Bottom-Right pinned */}
      <div
        ref={mascotRef}
        className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 flex flex-col items-end pointer-events-none select-none"
      >
        {/* Comic Speech Bubble */}
        {isBubbleVisible && !isChatOpen && (
          <div className="pointer-events-auto max-w-[240px] sm:max-w-[280px] mb-2 p-3 rounded-2xl bg-[#22150D]/95 border-2 border-[#D4AF37] shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 animate-fadeIn">
            <div className="flex items-center justify-between gap-1 mb-1 border-b border-amber-500/20 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles size={11} />
                <span>{t('title') || 'Нурали ИИ'}</span>
              </span>
              <button
                onClick={() => setIsBubbleVisible(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-xs text-[#FFF8E7] leading-snug">{bubbleText}</p>
            <button
              onClick={() => {
                setIsBubbleVisible(false);
                setIsChatOpen(true);
              }}
              className="mt-2 text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 underline underline-offset-2"
            >
              <span>Спросить совет</span>
              <span>💬</span>
            </button>
          </div>
        )}

        {/* Mascot Avatar Button */}
        <div className="pointer-events-auto relative">
          {/* Ambient Golden Glow Aura */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-500/40 to-emerald-500/30 blur-md opacity-75 animate-pulse" />

          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            onMouseEnter={() => {
              if (!isBubbleVisible && !isChatOpen) {
                setIsBubbleVisible(true);
              }
            }}
            title="Нурали — твой ИИ-наставник по домбре"
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#382315] via-[#22130A] to-[#120904] border-2 border-[#D4AF37] p-1 shadow-[0_8px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group overflow-hidden ${
              isCheering ? 'scale-110 -translate-y-2' : ''
            }`}
          >
            {/* SVG Mascot Character Face */}
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="nuraliFaceGrad" cx="50%" cy="45%" r="50%">
                  <stop offset="0%" stopColor="#FFE0B2" />
                  <stop offset="70%" stopColor="#F5B971" />
                  <stop offset="100%" stopColor="#D48A37" />
                </radialGradient>
                <linearGradient id="nuraliCapGrad" x1="0" y1="0" x2="100" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#224229" />
                  <stop offset="50%" stopColor="#52B788" />
                  <stop offset="100%" stopColor="#162E1C" />
                </linearGradient>
                <linearGradient id="nuraliGoldCapTrim" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#FFEAA7" />
                  <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
              </defs>

              {/* Face Base */}
              <circle cx="50" cy="55" r="38" fill="url(#nuraliFaceGrad)" stroke="#B87333" strokeWidth="1.8" />

              {/* Cheeks Blush */}
              <ellipse cx="27" cy="64" rx="7" ry="4.5" fill="#E65100" opacity="0.22" />
              <ellipse cx="73" cy="64" rx="7" ry="4.5" fill="#E65100" opacity="0.22" />

              {/* Kazakh Tubeteika / Borik Cap */}
              <path d="M18 42 C20 18, 80 18, 82 42 Z" fill="url(#nuraliCapGrad)" stroke="#162E1C" strokeWidth="1.5" />
              {/* Gold Fur / Ornament Trim */}
              <path d="M14 42 Q 50 49 86 42 Q 50 38 14 42 Z" fill="url(#nuraliGoldCapTrim)" stroke="#8C6D1F" strokeWidth="1.2" />
              {/* Kazakh Horn Ornament on Cap (Қошқар мүйіз) */}
              <path
                d="M46 29 C44 23 39 24 41 27 C42 29 44 28 45 26 M54 29 C56 23 61 24 59 27 C58 29 56 28 55 26 M50 25 L50 33"
                stroke="#FFF8E7"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="50" cy="22" r="2.2" fill="#D4AF37" stroke="#FFEAA7" strokeWidth="0.8" />

              {/* Left Eye */}
              <g>
                <ellipse cx="36" cy="56" rx="8" ry="7" fill="#FFFFFF" stroke="#3E2723" strokeWidth="1.2" />
                {/* Pupil with interactive mouse tracking */}
                <g style={{ transform: `translate(${pupilOffset.lx}px, ${pupilOffset.ly}px)` }}>
                  <circle cx="36" cy="56" r="3.8" fill="#2E1C0C" />
                  <circle cx="34.5" cy="54.5" r="1.4" fill="#FFFFFF" />
                </g>
                {/* Eyelid for Blinking */}
                <ellipse
                  cx="36"
                  cy="56"
                  rx="8"
                  ry="7"
                  fill="url(#nuraliFaceGrad)"
                  opacity={isBlinking ? 1 : 0}
                  transition="opacity 0.1s"
                />
              </g>

              {/* Right Eye */}
              <g>
                <ellipse cx="64" cy="56" rx="8" ry="7" fill="#FFFFFF" stroke="#3E2723" strokeWidth="1.2" />
                {/* Pupil with interactive mouse tracking */}
                <g style={{ transform: `translate(${pupilOffset.rx}px, ${pupilOffset.ry}px)` }}>
                  <circle cx="64" cy="56" r="3.8" fill="#2E1C0C" />
                  <circle cx="62.5" cy="54.5" r="1.4" fill="#FFFFFF" />
                </g>
                {/* Eyelid for Blinking */}
                <ellipse
                  cx="64"
                  cy="56"
                  rx="8"
                  ry="7"
                  fill="url(#nuraliFaceGrad)"
                  opacity={isBlinking ? 1 : 0}
                  transition="opacity 0.1s"
                />
              </g>

              {/* Eyebrows */}
              <path d="M28 47 Q 36 43 42 46" stroke="#4E342E" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M72 47 Q 64 43 58 46" stroke="#4E342E" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Cute Nose */}
              <path d="M48 60 Q 50 63 52 60" stroke="#8D5B28" strokeWidth="1.6" strokeLinecap="round" fill="none" />

              {/* Animated Mouth (Smile / Talking) */}
              <path
                d={isTalking ? 'M42 69 Q 50 78 58 69' : 'M43 71 Q 50 76 57 71'}
                stroke="#4A1E0B"
                strokeWidth={isTalking ? '3' : '2.4'}
                strokeLinecap="round"
                fill={isTalking ? '#7F1D1D' : 'none'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Full AI Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg h-[540px] max-h-[88vh] rounded-3xl bg-[#1A1009] border-2 border-[#D4AF37] shadow-[0_20px_50px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-[#24170E] border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-emerald-600 p-0.5 shadow">
                  <div className="w-full h-full rounded-full bg-[#120904] flex items-center justify-center text-amber-300 font-bold text-sm">
                    Н
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">
                      {t('title') || 'Нурали ИИ'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                      Наставник
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/70">
                    {t('subtitle') || 'Твой умный гид по казахской домбре'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-gradient-to-tr from-amber-600 to-amber-700 text-white rounded-br-none shadow-md'
                        : 'bg-[#281A12] border border-[#482E1E] text-[#FFF8E7] rounded-bl-none shadow'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-[#281A12] border border-[#482E1E] text-amber-300 flex items-center gap-2">
                    <Sparkles size={14} className="animate-spin" />
                    <span className="text-xs">Нурали размышляет...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-[#140C07] border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {quickChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-[#26170E] hover:bg-amber-600/30 border border-amber-500/20 text-[11px] text-stone-300 hover:text-amber-200 whitespace-nowrap transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-[#1A1009] border-t border-amber-500/30 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('ask_placeholder') || 'Спросите Нурали о домбре или кюях...'}
                className="flex-1 h-10 px-3.5 bg-[#25170E] border border-[#482E1E] rounded-xl text-xs text-[#FFF8E7] placeholder:text-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold flex items-center justify-center transition-all disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
