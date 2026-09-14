'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dombyraAudio from '@/utils/dombyraAudio';
import { Mic, MicOff, Volume2, Music, CheckCircle2, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface TuningTarget {
  name: string;
  note: string;
  stringName: string;
  frequency: number;
}

const STANDARD_TUNING: TuningTarget[] = [
  { name: 'Нижняя струна', note: 'G3', stringName: 'Н', frequency: 196.00 },
  { name: 'Верхняя струна', note: 'D3', stringName: 'В', frequency: 146.83 },
];

const TERIS_TUNING: TuningTarget[] = [
  { name: 'Нижняя струна', note: 'G3', stringName: 'Н', frequency: 196.00 },
  { name: 'Верхняя струна', note: 'C3', stringName: 'В', frequency: 130.81 },
];

// Time-domain autocorrelation pitch detector
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Noise gate threshold
  if (rms < 0.012) return -1;

  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buf.slice(r1, r2);
  const c = new Array(trimmed.length).fill(0);
  for (let i = 0; i < trimmed.length; i++) {
    for (let j = 0; j < trimmed.length - i; j++) {
      c[i] = c[i] + trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < trimmed.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  // Parabolic interpolation for sub-bin frequency accuracy
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export default function TunerPage() {
  const [tuningMode, setTuningMode] = useState<'standard' | 'teris'>('standard');
  const [selectedString, setSelectedString] = useState<'auto' | 'bottom' | 'top'>('auto');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [centsDiff, setCentsDiff] = useState<number>(0);
  const [activeTarget, setActiveTarget] = useState<TuningTarget>(STANDARD_TUNING[0]);
  const [micError, setMicError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const targets = tuningMode === 'standard' ? STANDARD_TUNING : TERIS_TUNING;

  // Find closest target string to detected frequency
  const getClosestTarget = useCallback(
    (freq: number): TuningTarget => {
      if (selectedString === 'bottom') return targets[0];
      if (selectedString === 'top') return targets[1];

      let closest = targets[0];
      let minDiff = Math.abs(freq - targets[0].frequency);

      for (const t of targets) {
        // Also check 2nd harmonic
        const diff1 = Math.abs(freq - t.frequency);
        const diff2 = Math.abs(freq - t.frequency * 2);
        if (diff1 < minDiff) {
          minDiff = diff1;
          closest = t;
        }
        if (diff2 < minDiff) {
          minDiff = diff2;
          closest = t;
        }
      }
      return closest;
    },
    [targets, selectedString]
  );

  const processPitch = useCallback(() => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const freq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

    if (freq > 70 && freq < 600) {
      setDetectedFreq(Math.round(freq * 10) / 10);
      const target = getClosestTarget(freq);
      setActiveTarget(target);

      // Calculate cents deviation: 1200 * log2(f / f0)
      const baseTargetFreq = freq > target.frequency * 1.5 ? target.frequency * 2 : target.frequency;
      const cents = Math.round(1200 * Math.log2(freq / baseTargetFreq));
      // Clamp between -50 and 50
      setCentsDiff(Math.max(-50, Math.min(50, cents)));
    }

    rafIdRef.current = requestAnimationFrame(processPitch);
  }, [getClosestTarget]);

  const startListening = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      rafIdRef.current = requestAnimationFrame(processPitch);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setMicError('Разрешите доступ к микрофону в браузере для настройки домбры.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    setIsListening(false);
    setDetectedFreq(null);
    setCentsDiff(0);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const needleRotation = (centsDiff / 50) * 45; // -45deg to +45deg
  const isInTune = Math.abs(centsDiff) <= 5 && detectedFreq !== null;
  const isFlat = centsDiff < -5 && detectedFreq !== null;
  const isSharp = centsDiff > 5 && detectedFreq !== null;

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] px-4 sm:px-6 py-6 pb-28 flex flex-col items-center">
      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Тюнер домбры
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Онлайн
              </span>
            </h1>
            <p className="text-xs text-[#E8DBCF]/70">
              Точная настройка инструмента через микрофон
            </p>
          </div>
          <Link
            href="/learn"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors"
          >
            Тренажёр
          </Link>
        </div>

        {/* Tuning Scheme Selector (Оң бұрау vs Теріс бұрау) */}
        <div className="bg-[#1E1410] border border-[#3b271d] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Выберите строй домбры
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setTuningMode('standard');
                setActiveTarget(STANDARD_TUNING[0]);
              }}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col ${
                tuningMode === 'standard'
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-700 text-white border-amber-400 shadow-lg ring-2 ring-amber-400/40'
                  : 'bg-[#281b14] border-[#442b1e] text-stone-300 hover:bg-[#34241a]'
              }`}
            >
              <span className="font-bold text-sm">Оң бұрау (Прямой)</span>
              <span className="text-xs opacity-80">Нижняя G3 (196 Гц) · Верхняя D3 (146.8 Гц)</span>
            </button>

            <button
              onClick={() => {
                setTuningMode('teris');
                setActiveTarget(TERIS_TUNING[0]);
              }}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col ${
                tuningMode === 'teris'
                  ? 'bg-gradient-to-tr from-amber-600 to-amber-700 text-white border-amber-400 shadow-lg ring-2 ring-amber-400/40'
                  : 'bg-[#281b14] border-[#442b1e] text-stone-300 hover:bg-[#34241a]'
              }`}
            >
              <span className="font-bold text-sm">Теріс бұрау (Обратный)</span>
              <span className="text-xs opacity-80">Нижняя G3 (196 Гц) · Верхняя C3 (130.8 Гц)</span>
            </button>
          </div>
        </div>

        {/* Target String Selection Tabs */}
        <div className="flex items-center justify-center gap-2 bg-[#1a110d] p-1.5 rounded-xl border border-[#38251a]">
          <button
            onClick={() => setSelectedString('auto')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedString === 'auto'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-300 hover:bg-white/5'
            }`}
          >
            Автоопределение
          </button>
          <button
            onClick={() => {
              setSelectedString('bottom');
              setActiveTarget(targets[0]);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedString === 'bottom'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-300 hover:bg-white/5'
            }`}
          >
            Нижняя струна ({targets[0].note})
          </button>
          <button
            onClick={() => {
              setSelectedString('top');
              setActiveTarget(targets[1]);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedString === 'top'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-300 hover:bg-white/5'
            }`}
          >
            Верхняя струна ({targets[1].note})
          </button>
        </div>

        {/* Tuner Gauge Panel */}
        <div className="bg-[#1E1410] border border-[#3b271d] rounded-3xl p-6 shadow-2xl flex flex-col items-center relative overflow-hidden">
          {/* Active Note Target Badge */}
          <div className="flex flex-col items-center mb-2">
            <span className="text-xs text-amber-400 uppercase tracking-widest font-bold">
              {activeTarget.name} ({activeTarget.stringName})
            </span>
            <div className="text-4xl sm:text-5xl font-black text-[#F4EFE6] tracking-tight mt-1 flex items-baseline gap-2">
              {activeTarget.note}
              <span className="text-xs font-normal text-stone-400">
                цель: {activeTarget.frequency} Гц
              </span>
            </div>
          </div>

          {/* Analog Gauge Graphic (SVG) */}
          <div className="relative w-[280px] h-[150px] my-2 flex items-center justify-center">
            <svg viewBox="0 0 280 150" className="w-full h-full overflow-visible">
              {/* Outer Gauge Arc */}
              <path
                d="M 20 140 A 120 120 0 0 1 260 140"
                fill="none"
                stroke="#3a251a"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Green Center Perfect Zone */}
              <path
                d="M 125 21 A 120 120 0 0 1 155 21"
                fill="none"
                stroke="#10b981"
                strokeWidth="16"
              />

              {/* Tick Marks */}
              {[-40, -20, 0, 20, 40].map((deg) => {
                const rad = ((deg - 90) * Math.PI) / 180;
                const x1 = 140 + 108 * Math.cos(rad);
                const y1 = 140 + 108 * Math.sin(rad);
                const x2 = 140 + 124 * Math.cos(rad);
                const y2 = 140 + 124 * Math.sin(rad);
                return (
                  <line
                    key={deg}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={deg === 0 ? '#10b981' : '#6b4c39'}
                    strokeWidth={deg === 0 ? '3' : '1.5'}
                  />
                );
              })}

              {/* Needle Indicator */}
              <g
                style={{
                  transform: `rotate(${needleRotation}deg)`,
                  transformOrigin: '140px 140px',
                  transition: 'transform 0.1s ease-out',
                }}
              >
                <polygon
                  points="137,140 143,140 140.8,20 139.2,20"
                  fill={isInTune ? '#10b981' : isFlat ? '#f59e0b' : '#ef4444'}
                  filter="drop-shadow(0 0 6px rgba(255,255,255,0.4))"
                />
                <circle cx="140" cy="140" r="10" fill="#261710" stroke="#f59e0b" strokeWidth="3" />
              </g>
            </svg>

            {/* Cents Labels */}
            <div className="absolute -bottom-2 w-full flex justify-between px-4 text-[11px] font-bold text-stone-500">
              <span>-50 центов</span>
              <span className="text-emerald-400">0</span>
              <span>+50 центов</span>
            </div>
          </div>

          {/* Real-time Frequency & Status Banner */}
          <div className="mt-6 w-full flex flex-col items-center">
            {detectedFreq ? (
              <div className="flex flex-col items-center gap-1.5 animate-fadeIn">
                <div className="text-sm font-semibold text-stone-300">
                  Текущий звук: <strong className="text-white text-base">{detectedFreq} Гц</strong>
                  <span className="text-xs text-stone-400 ml-2">
                    ({centsDiff > 0 ? `+${centsDiff}` : centsDiff} центов)
                  </span>
                </div>

                {/* Advice text */}
                {isInTune && (
                  <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30">
                    <CheckCircle2 size={16} />
                    <span>Струна настроена идеально!</span>
                  </div>
                )}
                {isFlat && (
                  <div className="px-4 py-2 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-bold flex items-center gap-2">
                    <ArrowUp size={16} />
                    <span>Низко. Крутите колок на себя (натяните струну)</span>
                  </div>
                )}
                {isSharp && (
                  <div className="px-4 py-2 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold flex items-center gap-2">
                    <ArrowDown size={16} />
                    <span>Высоко. Крутите колок от себя (ослабьте струну)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-stone-400 flex items-center gap-1.5">
                {isListening ? 'Защипните струну на домбре...' : 'Нажмите кнопку ниже для включения микрофона'}
              </div>
            )}
          </div>

          {/* Toggle Microphone Button */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all shadow-xl active:scale-95 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/40'
                  : 'bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-600/40 ring-2 ring-emerald-400'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={18} />
                  <span>Остановить микрофон</span>
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span>Включить микрофон</span>
                </>
              )}
            </button>
            {micError && (
              <span className="text-xs text-rose-400 text-center max-w-xs">{micError}</span>
            )}
          </div>
        </div>

        {/* Reference Tone Audio Buttons (На слух) */}
        <div className="bg-[#1E1410] border border-[#3b271d] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Volume2 size={16} />
            <span>Эталонный звук (настройка на слух)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {targets.map((tgt) => (
              <button
                key={tgt.name}
                onClick={() => dombyraAudio.playReferencePitch(tgt.frequency)}
                className="px-4 py-2.5 rounded-xl bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 text-xs font-bold flex items-center justify-between transition-colors shadow"
              >
                <span>{tgt.stringName}: {tgt.note} ({tgt.frequency} Гц)</span>
                <Volume2 size={14} className="opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* Helpful instructions FAQ */}
        <div className="bg-[#1E1410]/70 border border-[#3b271d]/60 rounded-2xl p-4 text-xs text-stone-300 flex flex-col gap-2">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <HelpCircle size={15} />
            <span>Как правильно настраивать домбру</span>
          </div>
          <p className="leading-relaxed text-stone-400">
            1. Включите микрофон и защипните нужную струну ногтем или медиатором.
            <br />
            2. Следите за стрелкой: если стрелка слева (желтая зона) — струна звучит слишком низко, аккуратно поверните колок на себя, чтобы натянуть.
            <br />
            3. Если стрелка справа (красная зона) — поверните колок от себя, чтобы опустить звук.
            <br />
            4. Когда стрелка окажется строго по центру в зелёной зоне — струна идеально настроена.
          </p>
        </div>
      </div>
    </div>
  );
}
