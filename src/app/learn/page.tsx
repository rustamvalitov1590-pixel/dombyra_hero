'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SONGS, Song, SongStep, SongSection } from '@/data/songs';
import Tablature from '@/components/tablature/Tablature';
import InteractiveNeck from '@/components/fretboard/InteractiveNeck';
import dombyraAudio from '@/utils/dombyraAudio';
import { Play, Pause, RotateCcw, Repeat, ChevronRight, Music, Volume2, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LearnPage() {
  const t = useTranslations('learn');
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(3); // Default to 'Адай' or 'Еркем-ай'
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(0.6); // Default comfortable learning speed
  const [loopSection, setLoopSection] = useState<boolean>(false);

  const song: Song = SONGS[selectedSongIndex] || SONGS[0];
  const currentSection: SongSection = song.sections[currentSectionIndex] || song.sections[0];
  const currentStep: SongStep | undefined = currentSection?.steps[currentStepIndex];

  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio for current note whenever section/step changes during playback
  const playCurrentNote = useCallback(() => {
    if (!currentStep) return;
    const tuning = (song.tuning_key === 'teris' ? 'teris' : 'standard') as 'standard' | 'teris';
    dombyraAudio.playStep(currentStep.bottom, currentStep.top, currentStep.stroke || 'down', tuning);
  }, [currentStep, song.tuning_key]);

  // Main playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }

    playCurrentNote();

    // Duration calculation: base beat duration (e.g. 500ms) scaled by speed and step.beats
    const baseBeatMs = 450;
    const beats = currentStep?.beats || 2;
    const stepDurationMs = Math.max(160, (baseBeatMs * (beats / 2)) / playSpeed);

    playTimerRef.current = setTimeout(() => {
      // Advance to next step
      if (currentStepIndex + 1 < currentSection.steps.length) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        // End of section reached
        if (loopSection) {
          setCurrentStepIndex(0);
        } else if (currentSectionIndex + 1 < song.sections.length) {
          setCurrentSectionIndex((prev) => prev + 1);
          setCurrentStepIndex(0);
        } else {
          // Reached end of entire song
          setIsPlaying(false);
          setCurrentSectionIndex(0);
          setCurrentStepIndex(0);
        }
      }
    }, stepDurationMs);

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentSectionIndex, currentStepIndex, playSpeed, loopSection, currentSection, song.sections.length, playCurrentNote]);

  // Spacebar keyboard shortcut for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          e.preventDefault();
          setIsPlaying((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentSectionIndex(0);
    setCurrentStepIndex(0);
  };

  const handleStepClick = (secIdx: number, stepIdx: number) => {
    setCurrentSectionIndex(secIdx);
    setCurrentStepIndex(stepIdx);
    const step = song.sections[secIdx]?.steps[stepIdx];
    if (step) {
      const tuning = (song.tuning_key === 'teris' ? 'teris' : 'standard') as 'standard' | 'teris';
      dombyraAudio.playStep(step.bottom, step.top, step.stroke || 'down', tuning);
    }
  };

  const handleSongChange = (idx: number) => {
    setIsPlaying(false);
    setSelectedSongIndex(idx);
    setCurrentSectionIndex(0);
    setCurrentStepIndex(0);
  };

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] px-3 sm:px-6 py-4 pb-28 flex flex-col items-center">
      {/* Page Title & Mode Navigation */}
      <div className="w-full max-w-4xl flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <BookOpen size={18} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                {t('title')}
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {t('badge')}
                </span>
              </h1>
              <p className="text-xs text-[#E8DBCF]/70">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tuner"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors"
            >
              {t('btn_tuner')}
            </Link>
            <Link
              href="/karaoke"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors"
            >
              {t('btn_karaoke')}
            </Link>
          </div>
        </div>

        {/* Kui Library Selector (Dropdown List matching game.html / Screenshot 2) */}
        <div className="w-full bg-[#1B1109]/95 border-2 border-[#8C5E1E]/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div>
              <h2 className="font-bold text-[#FFFDF7] text-base sm:text-lg flex items-center gap-2 sm:gap-2.5">
                <span>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="bookGoldLearn" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFDF5" />
                        <stop offset="50%" stopColor="#F5D061" />
                        <stop offset="100%" stopColor="#8C5E1E" />
                      </linearGradient>
                    </defs>
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" stroke="url(#bookGoldLearn)" strokeWidth="1.8" />
                    <path d="M7 6h9M7 10h9M10 14h6" stroke="url(#bookGoldLearn)" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="7" cy="14" r="1.5" fill="url(#bookGoldLearn)" />
                  </svg>
                </span>
                <span>{t('library_title')}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#E2C499]/80 mt-0.5 font-medium">
                {t('author_label')}: {song.author || t('default_author')} · {t('consists_of')} {song.sections.length} {t('parts_suffix')}
              </p>
            </div>

            {/* Tuning Badge */}
            <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-black bg-gradient-to-b from-[#382315] to-[#1A0F07] text-[#FFE5A3] border border-[#D4AF37]/60 shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,245,214,0.3)] flex items-center gap-1.5">
              <span className="text-[#52B788]">✦</span>
              <span>
                {song.tuning_key === 'teris' ? t('tuning_teris') : t('tuning_standard')}
              </span>
            </div>
          </div>

          {/* Styled Select Dropdown matching screenshot 2 */}
          <div className="relative">
            <select
              value={selectedSongIndex}
              onChange={(e) => handleSongChange(Number(e.target.value))}
              className="w-full bg-[#180E08]/95 border-2 border-[#D4AF37]/50 text-[#FFFDF7] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 pr-10 font-bold text-sm sm:text-base outline-none focus:border-[#D4AF37] focus:shadow-[0_0_15px_rgba(212,175,55,0.3)] appearance-none cursor-pointer transition-all hover:border-[#D4AF37]/80 shadow-inner"
            >
              {SONGS.map((s, idx) => (
                <option key={s.id} value={idx} className="bg-[#180E08] text-[#FFFDF7] py-2">
                  {idx + 1}. {s.title} ({s.author || t('default_author')})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#D4AF37]">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Fixed Floating Playback Controls Pinned to Viewport Bottom (matching Screenshot 1) */}
        <div className="fixed bottom-2.5 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-4xl z-50 bg-[#1B1109]/95 backdrop-blur-md border-2 border-[#8C6239]/80 rounded-2xl p-2 sm:p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.95),0_2px_8px_rgba(140,98,57,0.35)] flex flex-col md:flex-row items-center justify-between gap-2.5 transition-all">
          {/* Main Action Buttons & Counter */}
          <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 w-full md:w-auto flex-shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleTogglePlay}
                className="whitespace-nowrap px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#996515] text-[#1A0F07] font-black text-xs sm:text-sm shadow-[0_4px_14px_rgba(184,134,11,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5 fill-current" />}
                <span>{isPlaying ? t('stop') : t('play')}</span>
              </button>

              <button
                onClick={handleReset}
                title={t('restart')}
                className="whitespace-nowrap px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-[#2E1A0F] hover:bg-[#3D2314] text-[#E2C499] hover:text-[#FFF8E7] border border-[#6B4423]/60 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">{t('restart')}</span>
              </button>

              <button
                onClick={() => setLoopSection((prev) => !prev)}
                title={t('repeat_tooltip')}
                className={`whitespace-nowrap px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                  loopSection
                    ? 'bg-[#6B4223] text-[#FFF8E7] border-[#D4AF37] shadow-sm'
                    : 'bg-[#2E1A0F] hover:bg-[#3D2314] text-[#E2C499] hover:text-[#FFF8E7] border-[#6B4423]/60'
                }`}
              >
                <Repeat size={14} />
                <span className="hidden sm:inline">{t('repeat')}</span>
              </button>
            </div>

            {/* Center Position & Step Counter Badge: ЧАСТЬ 1 - ШАГ: 1 / 15 */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#26160C] border border-[#8C5E1E]/60 text-xs font-mono text-[#F5EBE0] font-bold whitespace-nowrap flex-shrink-0">
              {t('part').toUpperCase()} {currentSectionIndex + 1} - {t('step')} {currentStepIndex + 1} / {currentSection.steps.length}
            </div>
          </div>

          {/* Speed Presets & Tempo BPM */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto pt-1.5 md:pt-0 border-t border-[#8C6239]/30 md:border-t-0 flex-shrink-0">
            <div className="flex items-center justify-between flex-1 md:flex-initial gap-1 bg-[#160D07] p-1 rounded-xl border border-[#52331C]/60 flex-shrink-0">
              {[0.4, 0.6, 0.8, 1.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaySpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    playSpeed === spd
                      ? 'bg-[#B8860B]/30 text-[#FFF8E7] border border-[#D4AF37]/70 shadow-sm'
                      : 'text-[#C89D66] hover:text-white'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>

            <div className="text-xs text-[#E2C499] font-mono px-2.5 py-1.5 bg-[#140904] rounded-lg border border-[#6B4423]/50 flex-shrink-0 whitespace-nowrap">
              <span className="font-bold text-[#E2C499]">100 BPM</span>
            </div>
          </div>
        </div>

        {/* Synchronized Dombyra Neck (20 Frets) */}
        <InteractiveNeck
          activeBottomFret={currentStep?.bottom ?? null}
          activeTopFret={currentStep?.top ?? null}
          tuning={song.tuning_key === 'teris' ? 'teris' : 'standard'}
          theme="dark"
        />

        {/* Screenshot-matched Tablature Component */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300">
              {t('tablature_title')} {song.title}
            </h2>
            <span className="text-xs text-stone-400">
              {t('part')} {currentSectionIndex + 1} {t('of')} {song.sections.length} · {t('note')} {currentStepIndex + 1} / {currentSection.steps.length}
            </span>
          </div>

          <Tablature
            song={song}
            currentSectionIndex={currentSectionIndex}
            currentStepIndex={currentStepIndex}
            isPlaying={isPlaying}
            onStepClick={handleStepClick}
            theme="dark"
          />
        </div>
      </div>
    </div>
  );
}
