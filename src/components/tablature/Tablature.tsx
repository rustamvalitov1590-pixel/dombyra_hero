'use client';

import React, { useRef, useEffect } from 'react';
import { Song, SongSection, SongStep } from '@/data/songs';

interface TablatureProps {
  song: Song;
  currentSectionIndex: number;
  currentStepIndex: number;
  isPlaying?: boolean;
  onStepClick?: (sectionIndex: number, stepIndex: number) => void;
  className?: string;
  theme?: 'dark' | 'light';
}

export const Tablature: React.FC<TablatureProps> = ({
  song,
  currentSectionIndex,
  currentStepIndex,
  isPlaying = false,
  onStepClick,
  className = '',
  theme = 'dark',
}) => {
  const activeCardRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active card into view when playing
  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentSectionIndex, currentStepIndex]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`w-full flex flex-col font-sans select-none ${
        isDark
          ? 'bg-[#1a120d]/90 text-[#F4EFE6] border border-[#3b271d]'
          : 'bg-white text-slate-800 border border-slate-200'
      } rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md ${className}`}
    >
      {/* Legend header - matching user screenshot */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium opacity-75 border-b pb-3 mb-5 border-current/10">
        <div className="flex items-center gap-1.5">
          <span className="font-bold">Н</span>
          <span>— нижняя струна (G3, 196 Гц)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold">В</span>
          <span>— верхняя струна ({song.tuning_key === 'teris' ? 'C3, 130.81 Гц' : 'D3, 146.83 Гц'})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold">↓↑</span>
          <span>— удар</span>
        </div>
      </div>

      {/* Sections list */}
      <div className="flex flex-col gap-8 overflow-x-auto pb-4 scrollbar-hide">
        {song.sections.map((section, secIdx) => {
          const isCurrentSection = secIdx === currentSectionIndex;

          return (
            <div key={secIdx} className="flex flex-col gap-3 min-w-max">
              {/* Section title & repeat count pill badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-wider uppercase opacity-90">
                  {section.name}
                </span>
                {(section.repeatCount || 1) > 1 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isDark
                        ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}
                  >
                    ×{section.repeatCount}
                  </span>
                )}
              </div>

              {/* Tab Grid Row: Left labels column + Note columns */}
              <div className="relative flex items-center gap-2">
                {/* Fixed row labels: H, B, ↓↑ */}
                <div className="flex flex-col items-center justify-between h-[100px] py-1 text-sm font-bold opacity-60 w-6 shrink-0 border-r border-current/10 pr-2">
                  <div className="h-7 flex items-center justify-center">Н</div>
                  <div className="h-7 flex items-center justify-center">В</div>
                  <div className="h-6 flex items-center justify-center text-xs">↓↑</div>
                </div>

                {/* Scrollable Note cards with Ligatures */}
                <div className="relative flex items-center gap-1 sm:gap-1.5 py-2">
                  {section.steps.map((step, stepIdx) => {
                    const isActive = isCurrentSection && stepIdx === currentStepIndex;
                    const nextStep = section.steps[stepIdx + 1];

                    // Check if legato connects to next note
                    const hasLegatoBottom = !!(step.legatoBottom || (step.legato && step.bottom !== null && nextStep?.bottom !== null));
                    const hasLegatoTop = !!(step.legatoTop || (step.legato && step.top !== null && nextStep?.top !== null));

                    // Stroke arrow symbol
                    const strokeSymbol =
                      step.stroke === 'down' ? '↓' : step.stroke === 'up' ? '↑' : '';

                    return (
                      <React.Fragment key={stepIdx}>
                        {/* Note Pill Card */}
                        <div
                          ref={isActive ? activeCardRef : null}
                          onClick={() => onStepClick?.(secIdx, stepIdx)}
                          className={`relative group flex flex-col items-center justify-between w-[38px] sm:w-[44px] h-[102px] py-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-b from-[#E6C894] via-[#C49138] to-[#996A1E] text-[#1A0F07] font-black shadow-md shadow-amber-950/40 scale-105 z-10 ring-2 ring-[#FFF8E7]'
                              : isDark
                              ? 'bg-[#2B1B12]/90 hover:bg-[#382418] text-[#F4EFE6] border border-[#52331C]/60 hover:border-[#C89D66]/50'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-900 border border-stone-200 hover:border-amber-400'
                          }`}
                        >
                          {/* Bottom string fret (Н) */}
                          <div className={`h-7 flex items-center justify-center text-sm sm:text-base font-bold ${isActive ? 'text-[#1A0F07]' : 'text-[#F3E9D2]'}`}>
                            {step.bottom !== null && step.bottom !== undefined ? step.bottom : ''}
                          </div>

                          {/* Top string fret (В) */}
                          <div className={`h-7 flex items-center justify-center text-sm sm:text-base font-bold ${isActive ? 'text-[#1A0F07]' : 'text-[#D4A373]'}`}>
                            {step.top !== null && step.top !== undefined ? step.top : ''}
                          </div>

                          {/* Stroke direction arrow (↓ / ↑) */}
                          <div
                            className={`h-5 flex items-center justify-center text-xs sm:text-sm font-extrabold ${
                              isActive ? 'text-[#1A0F07]' : 'text-[#C89D66]'
                            }`}
                          >
                            {strokeSymbol}
                          </div>

                          {/* Syllable lyric tooltip if present */}
                          {step.lyric && (
                            <div className="absolute -bottom-6 text-[10px] whitespace-nowrap text-amber-300 font-medium">
                              {step.lyric}
                            </div>
                          )}
                        </div>

                        {/* Legato ligature curve connecting to next card */}
                        {(hasLegatoBottom || hasLegatoTop) && nextStep && (
                          <div className="relative w-2 sm:w-2.5 h-[102px] shrink-0 pointer-events-none -mx-1 z-20">
                            <svg
                              className="w-full h-full overflow-visible"
                              viewBox="0 0 10 102"
                              fill="none"
                            >
                              {hasLegatoBottom && (
                                <path
                                  d="M -1 20 Q 5 28 11 20"
                                  stroke={isActive ? '#1A0F07' : '#A67C4E'}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                              )}
                              {hasLegatoTop && (
                                <path
                                  d="M -1 52 Q 5 60 11 52"
                                  stroke={isActive ? '#1A0F07' : '#8C5E1E'}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                              )}
                            </svg>
                          </div>
                        )}

                        {/* Measure bar line if step is end of measure */}
                        {step.barEnd && (
                          <div
                            className={`h-[96px] w-[2px] mx-1 sm:mx-1.5 rounded-full ${
                              isDark ? 'bg-[#5c3e2e]' : 'bg-slate-300'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tablature;
