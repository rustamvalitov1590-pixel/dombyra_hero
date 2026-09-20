'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SONGS, Song, SongStep, getFretFrequency } from '@/data/songs';
import Tablature from '@/components/tablature/Tablature';
import dombyraAudio from '@/utils/dombyraAudio';
import { Mic, MicOff, Trophy, Flame, Play, RotateCcw, Award, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type StepEvaluation = 'perfect' | 'good' | 'miss' | 'pending';

// Pitch detector function
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.015) return -1; // Silence threshold

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
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

export default function KaraokePage() {
  const t = useTranslations('karaoke');
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(6); // Default to 'Еркем-ай' (as in screenshot)
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tempoSpeed, setTempoSpeed] = useState<number>(0.5);

  // Microphone & Game state
  const [isMicReady, setIsMicReady] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [results, setResults] = useState<{ perfect: number; good: number; miss: number }>({
    perfect: 0,
    good: 0,
    miss: 0,
  });
  const [evaluations, setEvaluations] = useState<Record<string, StepEvaluation>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [latestFeedback, setLatestFeedback] = useState<'PERFECT' | 'GOOD' | 'MISS' | null>(null);

  const song: Song = SONGS[selectedSongIndex] || SONGS[0];
  const currentSection = song.sections[currentSectionIndex] || song.sections[0];
  const currentStep = currentSection?.steps[currentStepIndex];

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const detectedPitchesInStepRef = useRef<number[]>([]);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pitchCheckTimerRef = useRef<number | null>(null);

  // Setup Microphone
  const enableMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false },
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
      setIsMicReady(true);
    } catch (e) {
      console.warn('Microphone error:', e);
      alert(t('mic_permission_alert'));
    }
  };

  const stopMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) audioCtxRef.current.close();
    setIsMicReady(false);
  };

  // Poll pitch from microphone continuously during active note
  const checkCurrentPitch = useCallback(() => {
    if (!analyserRef.current || !audioCtxRef.current) return;
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);
    if (freq > 70 && freq < 600) {
      detectedPitchesInStepRef.current.push(freq);
    }
    pitchCheckTimerRef.current = requestAnimationFrame(checkCurrentPitch);
  }, []);

  // Evaluate note after step window closes
  const evaluateStep = useCallback(() => {
    if (!currentStep) return;

    // Calculate target frequencies for the step
    const tuning = (song.tuning_key === 'teris' ? 'teris' : 'standard') as 'standard' | 'teris';
    const targets: number[] = [];
    if (currentStep.bottom !== null) {
      targets.push(getFretFrequency('bottom', currentStep.bottom, tuning));
    }
    if (currentStep.top !== null) {
      targets.push(getFretFrequency('top', currentStep.top, tuning));
    }

    const detected = detectedPitchesInStepRef.current;
    let evalResult: StepEvaluation = 'miss';

    if (targets.length === 0) {
      evalResult = 'perfect'; // Rest/pause
    } else if (detected.length > 0) {
      // Check if any detected pitch matches one of the targets within tolerance
      for (const targetFreq of targets) {
        for (const freq of detected) {
          const cents = Math.abs(1200 * Math.log2(freq / targetFreq));
          const centsOctave = Math.abs(1200 * Math.log2(freq / (targetFreq * 2)));

          if (cents <= 35 || centsOctave <= 35) {
            evalResult = 'perfect';
            break;
          } else if (cents <= 75 || centsOctave <= 75) {
            if (evalResult !== 'perfect') evalResult = 'good';
          }
        }
        if (evalResult === 'perfect') break;
      }
    }

    // Update game scores
    const key = `${currentSectionIndex}-${currentStepIndex}`;
    setEvaluations((prev) => ({ ...prev, [key]: evalResult }));

    if (evalResult === 'perfect') {
      setScore((s) => s + 100 + combo * 10);
      setCombo((c) => {
        const next = c + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
      setResults((r) => ({ ...r, perfect: r.perfect + 1 }));
      setLatestFeedback('PERFECT');
    } else if (evalResult === 'good') {
      setScore((s) => s + 60);
      setCombo((c) => c + 1);
      setResults((r) => ({ ...r, good: r.good + 1 }));
      setLatestFeedback('GOOD');
    } else {
      setCombo(0);
      setResults((r) => ({ ...r, miss: r.miss + 1 }));
      setLatestFeedback('MISS');
    }

    // Reset detected pitches for next step
    detectedPitchesInStepRef.current = [];
  }, [currentStep, song.tuning_key, currentSectionIndex, currentStepIndex, combo]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (pitchCheckTimerRef.current) cancelAnimationFrame(pitchCheckTimerRef.current);
      return;
    }

    // Also play backing track audio lightly as reference guide
    if (currentStep) {
      const tuning = (song.tuning_key === 'teris' ? 'teris' : 'standard') as 'standard' | 'teris';
      dombyraAudio.playStep(currentStep.bottom, currentStep.top, currentStep.stroke || 'down', tuning);
    }

    detectedPitchesInStepRef.current = [];
    pitchCheckTimerRef.current = requestAnimationFrame(checkCurrentPitch);

    const baseBeatMs = 500;
    const beats = currentStep?.beats || 2;
    const durationMs = Math.max(200, (baseBeatMs * (beats / 2)) / tempoSpeed);

    stepTimerRef.current = setTimeout(() => {
      evaluateStep();

      if (currentStepIndex + 1 < currentSection.steps.length) {
        setCurrentStepIndex((prev) => prev + 1);
      } else if (currentSectionIndex + 1 < song.sections.length) {
        setCurrentSectionIndex((prev) => prev + 1);
        setCurrentStepIndex(0);
      } else {
        // Song finished!
        setIsPlaying(false);
        setIsFinished(true);
      }
    }, durationMs);

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (pitchCheckTimerRef.current) cancelAnimationFrame(pitchCheckTimerRef.current);
    };
  }, [isPlaying, currentSectionIndex, currentStepIndex, tempoSpeed, currentStep, currentSection, song.sections.length, checkCurrentPitch, evaluateStep]);

  const handleStartGame = async () => {
    if (!isMicReady) {
      await enableMic();
    }
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setResults({ perfect: 0, good: 0, miss: 0 });
    setEvaluations({});
    setIsFinished(false);
    setCurrentSectionIndex(0);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  const handleStopGame = () => {
    setIsPlaying(false);
  };

  const totalNotes = results.perfect + results.good + results.miss;
  const accuracy = totalNotes > 0 ? Math.round(((results.perfect * 100 + results.good * 60) / (totalNotes * 100)) * 100) : 100;

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] px-3 sm:px-6 py-4 pb-28 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Trophy size={18} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                {t('title')}
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {t('live_mic')}
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
              href="/learn"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors"
            >
              {t('btn_trainer')}
            </Link>
          </div>
        </div>

        {/* Live Scoreboard Header */}
        <div className="bg-[#1E1410] border border-[#3b271d] rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          {/* Score */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
              ★
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">{t('score')}</div>
              <div className="text-2xl font-black text-amber-300">{score}</div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              %
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">{t('accuracy')}</div>
              <div className="text-2xl font-black text-emerald-300">{accuracy}%</div>
            </div>
          </div>

          {/* Combo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black">
              <Flame size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400">{t('combo')}</div>
              <div className="text-2xl font-black text-rose-300">{combo}×</div>
            </div>
          </div>

          {/* Start / Stop Karaoke Button */}
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button
                onClick={handleStartGame}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400"
              >
                <Play size={16} />
                <span>{t('btn_start')}</span>
              </button>
            ) : (
              <button
                onClick={handleStopGame}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/40"
              >
                <span>{t('btn_stop')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Feedback Banner */}
        {isPlaying && latestFeedback && (
          <div className="w-full flex items-center justify-center -my-1">
            <span
              className={`text-sm font-black px-4 py-1 rounded-full uppercase tracking-widest animate-bounce ${
                latestFeedback === 'PERFECT'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : latestFeedback === 'GOOD'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {latestFeedback === 'PERFECT'
                ? t('hit_perfect')
                : latestFeedback === 'GOOD'
                ? t('hit_good')
                : t('hit_miss')}
            </span>
          </div>
        )}

        {/* Song Selector */}
        <div className="bg-[#1E1410] border border-[#3b271d] rounded-2xl p-3 shadow-lg flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {SONGS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setIsPlaying(false);
                setSelectedSongIndex(idx);
                setCurrentSectionIndex(0);
                setCurrentStepIndex(0);
                setEvaluations({});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                idx === selectedSongIndex
                  ? 'bg-amber-600 text-white shadow ring-2 ring-amber-400'
                  : 'bg-[#291b14] text-stone-300 hover:bg-[#34241b]'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Interactive Tablature with Note Cards */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-xs text-stone-400">
            <span>
              {t('kui')}{' '}
              <strong className="text-amber-300">{song.title}</strong> ({song.author})
            </span>
            <span>
              {song.tuning_key === 'teris' ? t('tuning_teris') : t('tuning_standard')}
            </span>
          </div>

          <Tablature
            song={song}
            currentSectionIndex={currentSectionIndex}
            currentStepIndex={currentStepIndex}
            isPlaying={isPlaying}
            theme="dark"
          />
        </div>

        {/* Game Completed Modal / Card */}
        {isFinished && (
          <div className="w-full bg-[#1E1410] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300">
              <Award size={36} />
            </div>
            <h3 className="text-2xl font-black text-white">{t('finished_title')}</h3>
            <p className="text-xs text-stone-300 text-center max-w-sm">
              {t('finished_desc')}
            </p>

            <div className="grid grid-cols-3 gap-4 w-full max-w-md my-2">
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex flex-col items-center">
                <span className="text-xl font-black text-emerald-300">{results.perfect}</span>
                <span className="text-[10px] text-emerald-400/80 font-bold uppercase">{t('stat_perfect')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/30 flex flex-col items-center">
                <span className="text-xl font-black text-amber-300">{results.good}</span>
                <span className="text-[10px] text-amber-400/80 font-bold uppercase">{t('stat_good')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex flex-col items-center">
                <span className="text-xl font-black text-rose-300">{results.miss}</span>
                <span className="text-[10px] text-rose-400/80 font-bold uppercase">{t('stat_miss')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStartGame}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <RotateCcw size={16} />
                <span>{t('btn_retry')}</span>
              </button>
              <Link
                href="/learn"
                className="px-6 py-2.5 rounded-xl bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 font-bold text-xs flex items-center gap-2"
              >
                <span>{t('btn_practice')}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
