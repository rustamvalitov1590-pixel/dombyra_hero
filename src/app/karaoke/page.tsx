'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SONGS, Song, SongStep, getFretFrequency } from '@/data/songs';
import Tablature from '@/components/tablature/Tablature';
import dombyraAudio from '@/utils/dombyraAudio';
import { soundWave } from '@/utils/soundWave';
import { Mic, MicOff, Trophy, Flame, Play, Square, RotateCcw, Award, Volume2, VolumeX, Activity } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

type StepEvaluation = 'perfect' | 'good' | 'miss' | 'pending';

// Sensitive time-domain autocorrelation pitch detector optimized for acoustic dombyra
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Relaxed noise threshold (0.007) to capture delicate acoustic string harmonics
  if (rms < 0.007) return -1;

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

// Convert frequency to closest note name for live visual feedback
function freqToNoteName(freq: number): string {
  if (freq < 60 || freq > 800) return '';
  const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const note = noteStrings[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

export default function KaraokePage() {
  const t = useTranslations('karaoke');
  const [selectedSongIndex, setSelectedSongIndex] = useState<number>(6); // Default to 'Еркем-ай'
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tempoSpeed, setTempoSpeed] = useState<number>(0.55);
  const [guideAudio, setGuideAudio] = useState<boolean>(true); // Audio accompaniment toggle

  // Live microphone feedback
  const [isMicReady, setIsMicReady] = useState<boolean>(false);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [livePitch, setLivePitch] = useState<number | null>(null);

  // Game state
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

  // Stable refs to prevent React state closure/re-render loops
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const detectedPitchesInStepRef = useRef<number[]>([]);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pitchCheckTimerRef = useRef<number | null>(null);

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentSectionIdxRef = useRef<number>(currentSectionIndex);
  currentSectionIdxRef.current = currentSectionIndex;

  const currentStepIdxRef = useRef<number>(currentStepIndex);
  currentStepIdxRef.current = currentStepIndex;

  const currentStepRef = useRef<SongStep | undefined>(currentStep);
  currentStepRef.current = currentStep;

  const songRef = useRef<Song>(song);
  songRef.current = song;

  const guideAudioRef = useRef<boolean>(guideAudio);
  guideAudioRef.current = guideAudio;

  // Setup Microphone & AudioContext with guaranteed resume
  const enableMic = async (): Promise<boolean> => {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      if (mediaStreamRef.current && mediaStreamRef.current.active) {
        setIsMicReady(true);
        return true;
      }

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
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsMicReady(true);
      return true;
    } catch (e) {
      console.warn('Microphone error:', e);
      alert(t('mic_permission_alert'));
      return false;
    }
  };

  const stopMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsMicReady(false);
    setLiveVolume(0);
    setLivePitch(null);
  };

  // Continuous listener to display live volume and pitch
  useEffect(() => {
    let animId: number;

    const monitorMic = () => {
      if (analyserRef.current && audioCtxRef.current) {
        const buffer = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buffer);

        // RMS for volume meter
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        const rms = Math.sqrt(sum / buffer.length);
        setLiveVolume(Math.min(100, Math.round(rms * 900)));

        const freq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);
        if (freq > 65 && freq < 650) {
          setLivePitch(Math.round(freq));
          if (isPlayingRef.current) {
            detectedPitchesInStepRef.current.push(freq);
          }
        }
      }
      animId = requestAnimationFrame(monitorMic);
    };

    if (isMicReady) {
      animId = requestAnimationFrame(monitorMic);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isMicReady]);

  // Clean pitch evaluation across harmonics and subharmonics
  const evaluateActiveStep = useCallback(() => {
    const step = currentStepRef.current;
    if (!step) return;

    const currentSong = songRef.current;
    const tuning = (currentSong.tuning_key === 'teris' ? 'teris' : 'standard') as 'standard' | 'teris';
    const targets: number[] = [];

    if (step.bottom !== null) {
      targets.push(getFretFrequency('bottom', step.bottom, tuning));
    }
    if (step.top !== null) {
      targets.push(getFretFrequency('top', step.top, tuning));
    }

    const detected = detectedPitchesInStepRef.current;
    let evalResult: StepEvaluation = 'miss';

    if (targets.length === 0) {
      evalResult = 'perfect'; // Pause / rest step
    } else if (detected.length > 0) {
      // Find minimum cents difference across fundamental, octave, and subharmonic
      let bestCents = Infinity;

      for (const targetFreq of targets) {
        for (const freq of detected) {
          const diffs = [
            Math.abs(1200 * Math.log2(freq / targetFreq)),
            Math.abs(1200 * Math.log2(freq / (targetFreq * 2))),
            Math.abs(1200 * Math.log2(freq / (targetFreq / 2))),
            Math.abs(1200 * Math.log2(freq / (targetFreq * 3))),
          ];
          const minDiff = Math.min(...diffs);
          if (minDiff < bestCents) {
            bestCents = minDiff;
          }
        }
      }

      if (bestCents <= 55) {
        evalResult = 'perfect';
      } else if (bestCents <= 110) {
        evalResult = 'good';
      } else {
        evalResult = 'miss';
      }
    }

    // Trigger visual soundwave
    if (evalResult === 'perfect' || evalResult === 'good') {
      const topFreq = targets[0] || 293;
      soundWave.trigger(topFreq, evalResult === 'perfect' ? 1.0 : 0.6);
    }

    // Update scores
    const key = `${currentSectionIdxRef.current}-${currentStepIdxRef.current}`;
    setEvaluations((prev) => ({ ...prev, [key]: evalResult }));

    if (evalResult === 'perfect') {
      setScore((s) => s + 100);
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

    // Clear buffer for next note
    detectedPitchesInStepRef.current = [];
  }, []);

  // Main game progression loop
  useEffect(() => {
    if (!isPlaying) {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      return;
    }

    // Play backing guide audio if enabled
    if (currentStep && guideAudioRef.current) {
      const tuning = (song.tuning_key === 'teris' ? 'teris' : 'standard') as 'standard' | 'teris';
      dombyraAudio.playStep(currentStep.bottom, currentStep.top, currentStep.stroke || 'down', tuning);
    }

    detectedPitchesInStepRef.current = [];

    const baseBeatMs = 500;
    const beats = currentStep?.beats || 2;
    const durationMs = Math.max(220, (baseBeatMs * (beats / 2)) / tempoSpeed);

    stepTimerRef.current = setTimeout(() => {
      evaluateActiveStep();

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
    };
  }, [isPlaying, currentSectionIndex, currentStepIndex, tempoSpeed, currentStep, currentSection.steps.length, song.sections.length, song.tuning_key, evaluateActiveStep]);

  const handleStartGame = async () => {
    const ready = await enableMic();
    if (!ready) return;

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
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
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  };

  const totalNotes = results.perfect + results.good + results.miss;
  const accuracy = totalNotes > 0 ? Math.round(((results.perfect * 100 + results.good * 60) / (totalNotes * 100)) * 100) : 100;

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] px-3 sm:px-6 py-4 pb-36 sm:pb-40 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {/* Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 sm:mt-0">
              <Trophy size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {t('title')}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap inline-block">
                  {t('live_mic')}
                </span>
              </div>
              <p className="text-xs text-[#E8DBCF]/70 mt-0.5">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              href="/tuner"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors whitespace-nowrap"
            >
              {t('btn_tuner')}
            </Link>
            <Link
              href="/learn"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2a1d17] hover:bg-[#38261e] border border-amber-900/40 text-amber-200 transition-colors whitespace-nowrap"
            >
              {t('btn_trainer')}
            </Link>
          </div>
        </div>

        {/* Live Microphone Status & Level Monitor Bar */}
        <div className="bg-[#1C120B]/95 border border-[#4d3322] rounded-2xl p-3 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap">
            <button
              onClick={isMicReady ? stopMic : enableMic}
              className={`p-2 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                isMicReady
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              {isMicReady ? <Mic size={15} /> : <MicOff size={15} />}
              <span>{isMicReady ? 'Микрофон активен' : 'Включить микрофон'}</span>
            </button>

            {/* Live Volume Meter */}
            <div className="flex items-center gap-1.5">
              <Activity size={14} className={liveVolume > 5 ? 'text-emerald-400 animate-pulse' : 'text-stone-500'} />
              <div className="w-16 sm:w-28 h-2.5 bg-[#2A180E] rounded-full overflow-hidden border border-[#593922]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                  style={{ width: `${liveVolume}%` }}
                />
              </div>
            </div>
          </div>

          {/* Live Detected Frequency Indicator & Guide Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#28170D] border border-amber-500/30 text-amber-300 truncate">
              {livePitch ? (
                <span>
                  Слышит: <strong>{livePitch} Гц</strong> ({freqToNoteName(livePitch)})
                </span>
              ) : (
                <span className="text-stone-400">Слушаю домбру...</span>
              )}
            </div>

            {/* Guide audio toggle */}
            <button
              onClick={() => setGuideAudio((prev) => !prev)}
              title="Звук подсказки"
              className={`p-1.5 px-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ${
                guideAudio
                  ? 'bg-amber-600/30 border-amber-500/50 text-amber-300'
                  : 'bg-[#29170E] border-[#442818] text-stone-400'
              }`}
            >
              {guideAudio ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{guideAudio ? 'Подсказка' : 'Соло'}</span>
            </button>
          </div>
        </div>

        {/* Live Scoreboard Header */}
        <div className="bg-[#1E1410] border border-[#3b271d] rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 flex-1">
            {/* Score */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#160E0A]/60 p-2 sm:p-0 rounded-xl sm:bg-transparent">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black shrink-0">
                ★
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 truncate">{t('score')}</div>
                <div className="text-lg sm:text-2xl font-black text-amber-300 truncate">{score}</div>
              </div>
            </div>

            {/* Accuracy */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#160E0A]/60 p-2 sm:p-0 rounded-xl sm:bg-transparent">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs sm:text-sm shrink-0">
                %
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 truncate">{t('accuracy')}</div>
                <div className="text-lg sm:text-2xl font-black text-emerald-300 truncate">{accuracy}%</div>
              </div>
            </div>

            {/* Combo */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#160E0A]/60 p-2 sm:p-0 rounded-xl sm:bg-transparent">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black shrink-0">
                <Flame size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 truncate">{t('combo')}</div>
                <div className="text-lg sm:text-2xl font-black text-rose-300 truncate">{combo}×</div>
              </div>
            </div>
          </div>

          {/* Start / Stop Karaoke Button */}
          <div className="flex items-center sm:self-center">
            {!isPlaying ? (
              <button
                onClick={handleStartGame}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400 active:scale-95 transition-all"
              >
                <Play size={16} />
                <span>{t('btn_start')}</span>
              </button>
            ) : (
              <button
                onClick={handleStopGame}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 active:scale-95 transition-all"
              >
                <Square size={15} />
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
