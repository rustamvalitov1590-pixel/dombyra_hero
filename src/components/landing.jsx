"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Footer from './footer';
import { SONGS } from '@/data/songs';
import {
  Music,
  BookOpen,
  SlidersHorizontal,
  Trophy,
  Mic,
  Upload,
  PlayCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function Landing() {
  const t = useTranslations('landing');

  // Preview first 4 popular songs
  const featuredSongs = SONGS.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-[#160E0A] text-[#F4EFE6] selection:bg-amber-500 selection:text-stone-950">
      <main className="flex-1 w-full flex flex-col items-center">
        {/* ═══════════════════ HERO SECTION ═══════════════════ */}
        <section className="relative w-full px-4 sm:px-6 py-10 sm:py-16 text-center overflow-hidden border-b border-[#3b271d]">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />

          <div className="max-w-3xl mx-auto flex flex-col items-center relative z-10">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide shadow-lg">
              <Sparkles size={14} className="text-amber-400" />
              <span>DombraHero — Интерактивная платформа</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight sm:leading-tight mb-4">
              {t('headline')}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-stone-300 max-w-2xl leading-relaxed mb-8">
              {t('small_description')}
            </p>

            {/* Primary Action Buttons Grid */}
            <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/learn"
                className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(212,175,55,0.35)] transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <BookOpen size={18} />
                <span>{t('get_started_button')}</span>
              </Link>

              <Link
                href="/tuner"
                className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-[#241710] hover:bg-[#322016] border border-amber-900/50 hover:border-amber-500/50 text-[#F4EFE6] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <SlidersHorizontal size={18} className="text-emerald-400" />
                <span>{t('open_tuner')}</span>
              </Link>
            </div>

            {/* Quick Micro Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-400" />
                20 ладов и 2 строя (Оң / Теріс)
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-emerald-400" />
                Онлайн-анализ через микрофон
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                ИИ-наставник Нурали
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════ 4 CORE PILLARS ═══════════════════ */}
        <section className="w-full max-w-4xl px-4 sm:px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t('how_it_work')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Всё необходимое для обучения, практики и совершенствования мастерства
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Trainer */}
            <Link
              href="/learn"
              className="p-5 rounded-3xl bg-gradient-to-br from-[#241710] to-[#1A110B] border border-amber-900/40 hover:border-amber-500/60 shadow-xl transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Интерактив
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Тренажёр кюев с грифом
                </h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  Пошаговый разбор кюев нота за нотой с синхронной 20-ладовой домброй, указанием направления ударов (қағыс: ↑/↓) и дуг легато.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-amber-300 group-hover:translate-x-1 transition-transform">
                <span>Перейти в тренажёр</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </Link>

            {/* 2. Tuner */}
            <Link
              href="/tuner"
              className="p-5 rounded-3xl bg-gradient-to-br from-[#241710] to-[#1A110B] border border-emerald-900/40 hover:border-emerald-500/60 shadow-xl transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                    <SlidersHorizontal size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Live Микрофон
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Точный тюнер домбры
                </h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  Определение высоты тона через микрофон в реальном времени. Поддержка Оң бұрау (G3/D3) и Теріс бұрау (G3/C3) с подсказками колков.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-emerald-300 group-hover:translate-x-1 transition-transform">
                <span>Настроить инструмент</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </Link>

            {/* 3. Karaoke */}
            <Link
              href="/karaoke"
              className="p-5 rounded-3xl bg-gradient-to-br from-[#241710] to-[#1A110B] border border-rose-900/40 hover:border-rose-500/60 shadow-xl transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform">
                    <Trophy size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                    Геймификация
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                  Караоке игра на домбре
                </h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  Играйте на реальной домбре перед микрофоном. Платформа проверяет правильность нот, считает комбо и процент точности.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-rose-300 group-hover:translate-x-1 transition-transform">
                <span>Сыграть в караоке</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </Link>

            {/* 4. AI Transcription & Assistant */}
            <Link
              href="/record"
              className="p-5 rounded-3xl bg-gradient-to-br from-[#241710] to-[#1A110B] border border-purple-900/40 hover:border-purple-500/60 shadow-xl transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                    <Mic size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                    Нейросеть
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  ИИ-распознавание табулатур
                </h3>
                <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
                  Запишите исполнение мелодии или загрузите трек, и нейросеть автоматически транскрибирует аудио в лады на грифе.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-bold text-purple-300 group-hover:translate-x-1 transition-transform">
                <span>Записать с ИИ</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </Link>
          </div>
        </section>

        {/* ═══════════════════ NURALI AI ASSISTANT SHOWCASE ═══════════════════ */}
        <section className="w-full max-w-4xl px-4 sm:px-6 py-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#2B1B12] via-[#20140D] to-[#160E0A] border-2 border-amber-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-emerald-600 p-1 shadow-xl shrink-0">
                <div className="w-full h-full rounded-full bg-[#1A1009] flex items-center justify-center text-amber-300 font-black text-xl">
                  Н
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">
                    Познакомьтесь с Нурали
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    ИИ-наставник
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 mt-1 leading-relaxed max-w-lg">
                  Персональный ментор на базе Google Gemini прямо на сайте. Следит за вашей игрой, подсказывает штрихи қағыс и отвечает на любые вопросы о кюях Курмангазы, Дины и Таттимбета.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-300 font-bold hidden sm:inline">
                Нажмите на иконку справа внизу 👉
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════ FEATURED SONGS PREVIEW ═══════════════════ */}
        <section className="w-full max-w-4xl px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Music size={20} className="text-amber-400" />
              <span>Популярные кюи в каталоге</span>
            </h2>
            <Link
              href="/main"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Весь каталог ({SONGS.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {featuredSongs.map((song) => (
              <Link
                key={song.id}
                href="/learn"
                className="p-3.5 rounded-2xl bg-[#1E1410] hover:bg-[#281B15] border border-[#3A271C] hover:border-amber-500/50 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {song.title}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                    {song.author || 'Халық күйі'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-stone-400">
                  <span>{song.sections.length} части</span>
                  <span className="text-amber-400 font-medium">Разобрать</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════ REVIEWS ═══════════════════ */}
        <section className="w-full max-w-4xl px-4 sm:px-6 py-6 pb-12">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-white">
              {t('reviews')}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {t('r1')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#1E1410] border border-[#3A271C] text-xs text-stone-300 leading-relaxed italic relative">
              <span className="text-amber-500 text-lg font-serif">“</span>
              {t('r2')}
              <span className="text-amber-500 text-lg font-serif">”</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#1E1410] border border-[#3A271C] text-xs text-stone-300 leading-relaxed italic relative">
              <span className="text-amber-500 text-lg font-serif">“</span>
              {t('r3')}
              <span className="text-amber-500 text-lg font-serif">”</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}