'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageSquare, X, Send, Sparkles, Volume2, VolumeX, HelpCircle, Box } from 'lucide-react';
import dynamic from 'next/dynamic';
import NuraliAvatar from './NuraliAvatar';

const Nurali3DViewer = dynamic(() => import('./Nurali3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-8 text-amber-300">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs">3D Модель жүктелуде...</span>
    </div>
  ),
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function NuraliMascot() {
  const pathname = usePathname();
  const t = useTranslations('nurali');

  // 3D Parallax Tilt state (tracking mouse across the viewport)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isCheering, setIsCheering] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  // Bubble states
  const [bubbleText, setBubbleText] = useState('');
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);

  // Chat modal states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('welcome'),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show3DModel, setShow3DModel] = useState(false);

  const mascotRef = useRef<HTMLDivElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Tilt calculation based on mouse cursor position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mascotRef.current) return;
      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Realistic 3D angle range
      const rotateY = Math.max(-20, Math.min(20, dx / 35));
      const rotateX = Math.max(-12, Math.min(12, -dy / 45));

      setTilt({ rotateX, rotateY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Text-To-Speech (SpeechSynthesis) function
  const speakText = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      const kkVoice = voices.find((v) => v.lang.toLowerCase().includes('kk'));
      const ruVoice = voices.find((v) => v.lang.toLowerCase().includes('ru'));
      if (kkVoice) utterance.voice = kkVoice;
      else if (ruVoice) utterance.voice = ruVoice;
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Contextual tips depending on active page
  useEffect(() => {
    let tip = '';
    if (pathname === '/learn') {
      tip = t('tip_learn');
    } else if (pathname === '/tuner') {
      tip = t('tip_tuner');
    } else if (pathname === '/karaoke') {
      tip = t('tip_karaoke');
    } else if (pathname === '/record') {
      tip = t('tip_record');
    } else {
      tip = t('tip_default');
    }

    setBubbleText(tip);
    setIsBubbleVisible(true);

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
    }, 8000);

    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, [pathname, t]);

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
    setTimeout(() => setIsCheering(false), 900);

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
      const answer = data.text || t('err_conn');

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      speakText(answer);
    } catch (err) {
      console.error('Chat error:', err);
      const fallback = t('err_conn');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallback,
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTalking(false);
    }
  };

  const quickChips = [
    t('chip_tuning'),
    t('chip_aday'),
    t('chip_teris'),
    t('chip_strokes'),
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
          <div className="pointer-events-auto max-w-[240px] sm:max-w-[280px] mb-2 p-3 rounded-2xl bg-[#1C110A]/95 border-2 border-[#D4AF37] shadow-[0_12px_32px_rgba(0,0,0,0.9)] backdrop-blur-md transition-all duration-300 animate-fadeIn">
            <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-amber-500/20 pb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles size={11} />
                <span>{t('title')}</span>
              </span>
              <button
                onClick={() => setIsBubbleVisible(false)}
                className="text-stone-400 hover:text-white transition-colors"
                aria-label="Close bubble"
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
              <span>{t('ask_advice')}</span>
              <span>💬</span>
            </button>
          </div>
        )}

        {/* 3D Standing Pixar Character Mascot */}
        <div
          className="pointer-events-auto relative cursor-pointer group"
          onClick={() => setIsChatOpen((prev) => !prev)}
          onMouseEnter={() => {
            setIsHovered(true);
            if (!isBubbleVisible && !isChatOpen) {
              setIsBubbleVisible(true);
            }
          }}
          onMouseLeave={() => setIsHovered(false)}
          title={t('subtitle')}
          style={{ perspective: '800px' }}
        >
          {/* 3D Tilt Card (Rotates towards mouse cursor) */}
          <div
            className="relative transition-transform duration-150 ease-out flex flex-col items-center"
            style={{
              transform: `rotateY(${tilt.rotateY}deg) rotateX(${tilt.rotateX}deg) ${
                isCheering ? 'scale(1.1) translateY(-8px)' : isHovered ? 'scale(1.05)' : 'scale(1)'
              }`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Smooth Floating Breathing Container */}
            <div className="relative animate-float flex flex-col items-center">
              {/* Pedestal Neon Glow */}
              <div className="absolute -bottom-2 w-28 h-6 bg-gradient-to-r from-emerald-500/40 via-amber-400/60 to-cyan-500/40 rounded-full blur-md opacity-80 animate-pulse pointer-events-none" />

              {/* 3D Character Full Body Image */}
              <div className="relative w-24 sm:w-28 md:w-32 drop-shadow-[0_16px_32px_rgba(0,0,0,0.85)] filter hover:brightness-105 transition-all">
                <img
                  src="/images/nurali-char.png"
                  alt="Нұрәлі - Домбыра ИИ Тәлімгері"
                  className="w-full h-auto object-contain pointer-events-none select-none"
                  draggable={false}
                />
              </div>

              {/* Status Pill Badge below pedestal */}
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#180E08]/90 border border-amber-500/50 shadow-lg backdrop-blur-sm flex items-center gap-1.5 text-[10px] font-bold text-amber-300 group-hover:border-amber-400 group-hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{t('title')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full AI Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg h-[560px] max-h-[90vh] rounded-3xl bg-[#1A1009] border-2 border-[#D4AF37] shadow-[0_24px_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-[#24170E] border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-emerald-600 p-0.5 shadow-lg shrink-0">
                  <div className="w-full h-full rounded-full bg-[#120904] overflow-hidden flex items-center justify-center">
                    <NuraliAvatar isTalking={isTalking} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">
                      {t('title')}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                      {t('mentor_badge')}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/70">
                    {t('subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 3D Model toggle button */}
                <button
                  onClick={() => setShow3DModel(!show3DModel)}
                  className={`px-2.5 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
                    show3DModel
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                  }`}
                  title={show3DModel ? 'Чатқа оралу' : 'Нұрәліні қарау'}
                >
                  <Box size={14} />
                  <span>{show3DModel ? 'Чат' : 'Нұрәлі 2.5D'}</span>
                </button>

                {/* Voice toggle button */}
                <button
                  onClick={() => {
                    const next = !isVoiceEnabled;
                    setIsVoiceEnabled(next);
                    if (next) speakText('Сәлем!');
                    else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                    isVoiceEnabled
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200'
                  }`}
                  title={isVoiceEnabled ? 'Голос включен' : 'Включить озвучку'}
                >
                  {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                {/* Close modal */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                  aria-label={t('close')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {show3DModel ? (
              <div className="flex-1 relative flex flex-col items-center justify-center bg-[#0F0804] overflow-hidden">
                <Nurali3DViewer autoRotate={true} enableControls={true} className="w-full h-full" />
                <div className="absolute bottom-3 inset-x-4 px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/30 backdrop-blur-md text-[11px] text-amber-200 text-center pointer-events-none shadow-lg">
                  ✦ Тышқанды қозғалтыңыз — Нұрәлі көзімен бақылайды ✦
                </div>
              </div>
            ) : (
              <>
                {/* Chat Messages List */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex items-end gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {m.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-[#120904] border border-[#D4AF37]/60 overflow-hidden shrink-0 shadow-sm">
                          <NuraliAvatar />
                        </div>
                      )}
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
                    <div className="flex items-end gap-2.5 justify-start">
                      <div className="w-7 h-7 rounded-full bg-[#120904] border border-[#D4AF37]/60 overflow-hidden shrink-0 shadow-sm animate-pulse">
                        <NuraliAvatar isTalking={true} />
                      </div>
                      <div className="p-3 rounded-2xl bg-[#281A12] border border-[#482E1E] text-amber-300 flex items-center gap-2">
                        <Sparkles size={14} className="animate-spin" />
                        <span className="text-xs">{t('thinking')}</span>
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
                    placeholder={t('ask_placeholder')}
                    className="flex-1 h-10 px-3.5 bg-[#25170E] border border-[#482E1E] rounded-xl text-xs text-[#FFF8E7] placeholder:text-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold flex items-center justify-center transition-all disabled:opacity-40 shadow"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
