'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SONGS, Song, SongStep, SongSection } from '@/data/songs';
import Tablature from '@/components/tablature/Tablature';
import InteractiveNeck from '@/components/fretboard/InteractiveNeck';
import dombyraAudio from '@/utils/dombyraAudio';
import { Play, Pause, RotateCcw, Repeat, ChevronRight, Music, Volume2, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function LearnPage() {
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
                Тренажёр домбры
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI Интерактив
                </span>
              </h1>
              <p className="text-xs text-[#E8DBCF]/70">
                Разучивайте кюи нота за нотой с синхронным грифом и табулатурой
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tuner"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors"
            >
              Тюнер
            </Link>
            <Link
              href="/karaoke"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors"
            >
              Караоке
            </Link>
          </div>
        </div>

        {/* Song Selector Carousel / Dropdown */}
        <div className="w-full bg-[#1E1410] border border-[#3d291e] rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-amber-300/80 font-semibold uppercase tracking-wider">
            <span>Каталог кюев и песен ({SONGS.length})</span>
            <span>
              Строй:{' '}
              <strong className="text-amber-300">
                {song.tuning_key === 'teris' ? 'Теріс бұрау (G3/C3)' : 'Оң бұрау (G3/D3)'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SONGS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleSongChange(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex flex-col items-start ${
                  idx === selectedSongIndex
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg ring-2 ring-amber-400'
                    : 'bg-[#291b14] hover:bg-[#38251b] text-stone-300 border border-[#442c20]'
                }`}
              >
                <span>{s.title}</span>
                <span className="text-[10px] font-normal opacity-70">{s.author || 'Халық күйі'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fixed Floating Playback Controls Pinned to Bottom */}
        <div className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-4xl z-50 bg-[#160c26]/95 backdrop-blur-2xl border-2 border-amber-500/40 rounded-2xl p-2.5 sm:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_24px_rgba(124,58,237,0.4)] flex flex-wrap items-center justify-between gap-3">
          {/* Main Play / Pause & Rewind Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleTogglePlay}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                isPlaying
                  ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-amber-600/50'
                  : 'bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white shadow-indigo-600/50 ring-2 ring-indigo-400'
              }`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              <span>{isPlaying ? 'Тоқтату / Стоп' : 'Ойнату / Играть'}</span>
            </button>

            <button
              onClick={handleReset}
              title="Басына / С начала"
              className="px-3 py-2 rounded-xl bg-[#2a1d17] hover:bg-[#38271f] border border-[#493123] text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Басына</span>
            </button>

            <button
              onClick={() => setLoopSection((prev) => !prev)}
              title="Зациклить часть"
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                loopSection
                  ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                  : 'bg-[#2a1d17] border-[#493123] text-stone-300 hover:bg-[#38271f]'
              }`}
            >
              <Repeat size={14} />
              <span className="hidden sm:inline">Қайталау</span>
            </button>
          </div>

          {/* Center Position & Step Counter Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs font-mono text-amber-300 font-bold">
            {currentSection.name || `ЧАСТЬ ${currentSectionIndex + 1}`} · ҚАДАМ: {currentStepIndex + 1} / {currentSection.steps.length}
          </div>

          {/* Speed Presets */}
          <div className="flex items-center gap-1 bg-[#140b07] p-1 rounded-xl border border-[#3b261b]">
            {[0.4, 0.6, 0.8, 1.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaySpeed(spd)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  playSpeed === spd
                    ? 'bg-amber-500 text-stone-950 shadow-md ring-1 ring-amber-400'
                    : 'text-stone-300 hover:bg-white/10'
                }`}
              >
                {spd}×
              </button>
            ))}
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
              Табулатура: {song.title}
            </h2>
            <span className="text-xs text-stone-400">
              Часть {currentSectionIndex + 1} из {song.sections.length} · Нота {currentStepIndex + 1}/
              {currentSection.steps.length}
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
