'use client';

import React from 'react';
import { getFretNoteName } from '@/data/songs';
import dombyraAudio from '@/utils/dombyraAudio';

interface InteractiveNeckProps {
  activeBottomFret: number | null;
  activeTopFret: number | null;
  tuning?: 'standard' | 'teris';
  onFretClick?: (stringType: 'bottom' | 'top', fret: number) => void;
  className?: string;
  theme?: 'dark' | 'light';
}

export const InteractiveNeck: React.FC<InteractiveNeckProps> = ({
  activeBottomFret,
  activeTopFret,
  tuning = 'standard',
  onFretClick,
  className = '',
  theme = 'dark',
}) => {
  const totalFrets = 19;
  const fretMarkers = [2, 5, 7, 10, 12, 14, 17];
  const isDark = theme === 'dark';

  const handlePlayFret = (stringType: 'bottom' | 'top', fret: number) => {
    if (stringType === 'bottom') {
      dombyraAudio.playStep(fret, null, 'down', tuning);
    } else {
      dombyraAudio.playStep(null, fret, 'down', tuning);
    }
    onFretClick?.(stringType, fret);
  };

  return (
    <div
      className={`w-full flex flex-col rounded-2xl p-4 shadow-xl select-none ${
        isDark
          ? 'bg-[#18110c] border border-[#3b271d] text-[#F4EFE6]'
          : 'bg-white border border-slate-200 text-slate-800'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-xs font-bold uppercase tracking-wider opacity-70">
          Гриф домбры (20 ладов)
        </div>
        <div className="text-[11px] opacity-50">
          Нажмите на любой лад для проверки звука
        </div>
      </div>

      {/* Dombyra Fretboard Horizontal Container */}
      <div className="relative w-full overflow-x-auto pb-2 scrollbar-hide">
        <div className="relative min-w-[760px] h-[130px] flex flex-col justify-center px-4 rounded-xl bg-gradient-to-b from-[#2a1b13] via-[#332218] to-[#241710] border border-[#4d3324] shadow-inner">
          {/* Top String (В / D3) line */}
          <div className="absolute top-[38px] left-8 right-4 h-[2px] bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 shadow-[0_0_4px_rgba(255,255,255,0.7)] pointer-events-none" />

          {/* Bottom String (Н / G3) line - thicker nylon/gut string */}
          <div className="absolute top-[82px] left-8 right-4 h-[3.5px] bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 shadow-[0_0_6px_rgba(245,158,11,0.5)] pointer-events-none" />

          {/* Headstock / Nut (Шайтан тиек) */}
          <div className="absolute left-6 top-2 bottom-2 w-3 rounded-sm bg-gradient-to-r from-[#140b07] to-[#3a2014] border-r border-[#693f24] shadow-md flex items-center justify-center">
            <span className="text-[8px] font-bold text-amber-500 -rotate-90">ТИЕК</span>
          </div>

          {/* Frets Grid */}
          <div className="flex items-stretch pl-8 pr-2 h-full">
            {/* Open string column (0) */}
            <div className="w-12 h-full flex flex-col justify-between py-2 border-r-2 border-amber-600/40 relative">
              <span className="absolute top-1 left-1 text-[10px] font-bold text-amber-400/80">0</span>

              {/* Top string open button */}
              <button
                onClick={() => handlePlayFret('top', 0)}
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold transition-transform ${
                  activeTopFret === 0
                    ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400 scale-125 z-20'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                0
              </button>

              {/* Bottom string open button */}
              <button
                onClick={() => handlePlayFret('bottom', 0)}
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold transition-transform ${
                  activeBottomFret === 0
                    ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400 scale-125 z-20'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                0
              </button>
            </div>

            {/* Frets 1 to 19 */}
            {Array.from({ length: totalFrets }, (_, i) => i + 1).map((fret) => {
              const hasMarker = fretMarkers.includes(fret);
              const isTopActive = activeTopFret === fret;
              const isBottomActive = activeBottomFret === fret;

              const topNote = getFretNoteName('top', fret, tuning);
              const bottomNote = getFretNoteName('bottom', fret, tuning);

              return (
                <div
                  key={fret}
                  className={`relative flex-1 min-w-[34px] h-full flex flex-col justify-between py-2 border-r border-[#694833] ${
                    hasMarker ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  {/* Fret number at top */}
                  <span
                    className={`absolute top-1 left-1.5 text-[9px] font-medium ${
                      hasMarker ? 'text-amber-400 font-bold' : 'text-stone-400/60'
                    }`}
                  >
                    {fret}
                  </span>

                  {/* Traditional dot marker in center between strings */}
                  {hasMarker && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-300/40 shadow-sm pointer-events-none" />
                  )}

                  {/* Top String Fret Button */}
                  <button
                    onClick={() => handlePlayFret('top', fret)}
                    title={`Верхняя струна, лад ${fret}: ${topNote.fullName}`}
                    className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                      isTopActive
                        ? 'bg-gradient-to-tr from-[#C49138] to-[#E6C894] text-[#1A0F07] ring-2 ring-[#FFF8E7] shadow-md shadow-amber-950/50 scale-125 z-20'
                        : 'bg-stone-900/60 hover:bg-amber-500/30 text-stone-200 border border-stone-700/50'
                    }`}
                  >
                    {isTopActive ? fret : ''}
                  </button>

                  {/* Bottom String Fret Button */}
                  <button
                    onClick={() => handlePlayFret('bottom', fret)}
                    title={`Нижняя струна, лад ${fret}: ${bottomNote.fullName}`}
                    className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                      isBottomActive
                        ? 'bg-gradient-to-tr from-[#A66236] to-[#D4A373] text-[#1A0F07] ring-2 ring-[#FFF8E7] shadow-md shadow-amber-950/50 scale-125 z-20'
                        : 'bg-stone-900/60 hover:bg-amber-500/30 text-stone-200 border border-stone-700/50'
                    }`}
                  >
                    {isBottomActive ? fret : ''}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveNeck;
