'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './fretboard.module.css';
import * as Tone from 'tone';
import { useTranslations } from 'next-intl';
import { soundWave } from '@/utils/soundWave';
import { Play, Pause, RotateCcw, SlidersHorizontal, Music, Zap, Sparkles } from 'lucide-react';

interface FretboardProps {
  data?: Record<string, [number, number] | any> | null;
}

const Fretboard: React.FC<FretboardProps> = ({ data }) => {
  const length = data ? Object.entries(data).length : 0;
  const numberOfFrets = 19;
  const fretMarkPositions = [2, 5, 7, 10, 12, 14];
  const orderedNotes = [
    'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'Db5', 'D5', 'Eb5', 'E5',
    'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6', 'Db6', 'D6'
  ];

  const t = useTranslations('fretboard');

  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [curTab, setCurTab] = useState<number>(0);
  const [octave, setOctave] = useState<number>(0);
  const [instrument, setInstrument] = useState<string>('dombyra');
  const [digitalNotes, setDigitalNotes] = useState<number[]>([]);

  const curTabRef = useRef<number>(curTab);
  curTabRef.current = curTab;

  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const playSpeedRef = useRef<number>(playSpeed);
  playSpeedRef.current = playSpeed;

  const octaveRef = useRef<number>(octave);
  octaveRef.current = octave;

  const instrumentRef = useRef<string>(instrument);
  instrumentRef.current = instrument;

  const [synth, setSynth] = useState<Tone.Synth | null>(null);
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);

  useEffect(() => {
    if (data) {
      setDigitalNotes(Object.values(data).map((item) => item[0]));
    } else {
      setDigitalNotes([]);
    }
  }, [data]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newSynth = new Tone.Synth().toDestination();
      setSynth(newSynth);

      const newSampler = new Tone.Sampler({
        urls: {
          G4: 'G4.mp3',
          Ab4: 'Ab4.mp3',
          A4: 'A4.mp3',
          Bb4: 'Bb4.mp3',
          B4: 'B4.mp3',
          C5: 'C5.mp3',
          Db5: 'Db5.mp3',
          D5: 'Db5.mp3',
          Eb5: 'Eb5.mp3',
          E5: 'E5.mp3',
          F5: 'F5.mp3',
          Gb5: 'Gb5.mp3',
          G5: 'G5.mp3',
          Ab5: 'Ab5.mp3',
          A5: 'A5.mp3',
          Bb5: 'Bb5.mp3',
          B5: 'B5.mp3',
          C6: 'C6.mp3',
          Db6: 'Db6.mp3',
          D6: 'Db6.mp3',
        },
        baseUrl: '/notes/',
      }).toDestination();
      setSampler(newSampler);
    }
  }, []);

  const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const showTabs = async (tabs: { [key: string]: [number, number] } = {}) => {
    await Tone.start();
    const tabKeys = Object.keys(tabs);
    const totalCount = tabKeys.length;

    for (let i = curTabRef.current; i < totalCount; i++) {
      if (!isPlayingRef.current) {
        setCurTab(i);
        break;
      }

      const tab = tabs[i][0];
      const targetNoteIdx = Math.max(0, Math.min(orderedNotes.length - 1, tab + Number(octaveRef.current)));
      const note = orderedNotes[targetNoteIdx];

      const string = document.querySelector('[string_number="2"]');
      const fret = string?.querySelector(`div[data-note="${note}"]`) as HTMLElement;
      if (fret) {
        fret.style.setProperty('--noteDotOpacity', '1');
      }

      setCurTab(i);

      // Play Sound
      try {
        const noteFreq = Tone.Frequency(note).toFrequency();
        soundWave.trigger(noteFreq, 0.9);

        if (instrumentRef.current === 'dombyra' && sampler) {
          Tone.loaded().then(() => {
            sampler.triggerAttackRelease(note, '4n');
          });
        } else if (synth) {
          synth.triggerAttackRelease(note, '8n');
        }
      } catch (err) {
        console.warn('Tone play error:', err);
      }

      const noteDuration = (tabs[i][1] * 1000) / playSpeedRef.current;
      await timer(Math.max(120, noteDuration));

      if (fret) {
        fret.style.setProperty('--noteDotOpacity', '0');
      }

      await timer(20);

      if (i === totalCount - 1) {
        setCurTab(0);
        setIsPlaying(false);
        break;
      }
    }
  };

  const handleButtonClick = async () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (data) {
        showTabs(data);
      }
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurTab(0);
    // Remove all highlights
    document.querySelectorAll(`.${styles.noteFret}`).forEach((el) => {
      (el as HTMLElement).style.setProperty('--noteDotOpacity', '0');
    });
  };

  // Build fretboard DOM
  useEffect(() => {
    const fretboard = document.querySelector(`.${styles.fretboard}`);
    if (fretboard && fretboard.children.length === 0) {
      // String 1 (Top / Open)
      const string1 = document.createElement('div');
      string1.classList.add(styles.string);
      string1.setAttribute('string_number', '1');
      fretboard.appendChild(string1);

      for (let fret = 0; fret <= numberOfFrets; fret++) {
        const noteFret = document.createElement('div');
        noteFret.classList.add(styles.noteFret);
        string1.appendChild(noteFret);

        const noteName = orderedNotes[fret] || 'G4';
        noteFret.setAttribute('data-note', noteName);

        if (fretMarkPositions.includes(fret)) {
          noteFret.classList.add(styles.fretmark);
        }
      }

      // String 2 (Bottom)
      const string2 = document.createElement('div');
      string2.classList.add(styles.string);
      string2.setAttribute('string_number', '2');
      fretboard.appendChild(string2);

      for (let fret = 0; fret <= numberOfFrets; fret++) {
        const noteFret = document.createElement('div');
        noteFret.classList.add(styles.noteFret);
        string2.appendChild(noteFret);

        const noteName = orderedNotes[fret] || 'G4';
        noteFret.setAttribute('data-note', noteName);
      }
    }
  }, []);

  const progressPercent = length > 0 ? Math.round(((curTab + 1) / length) * 100) : 0;

  return (
    <div className="w-full flex flex-col gap-5 pt-4 text-[#F4EFE6]">
      {/* Top Custom Controls Toolbar matching app dark style */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#1C120B]/95 border border-[#4d3322] shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Octave Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2A180E] border border-[#6B4423]/70 shadow-inner">
            <SlidersHorizontal size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-stone-300">Октава:</span>
            <select
              id="octave"
              value={octave}
              onChange={(e) => setOctave(Number(e.target.value))}
              className="bg-transparent text-amber-200 text-xs font-bold outline-none cursor-pointer"
            >
              <option value={12} className="bg-[#1C120B] text-[#F4EFE6]">
                {t('octave_plus')} (+1)
              </option>
              <option value={0} className="bg-[#1C120B] text-[#F4EFE6]">
                {t('octave_standard')} (0)
              </option>
              <option value={-12} className="bg-[#1C120B] text-[#F4EFE6]">
                {t('octave_minus')} (-1)
              </option>
            </select>
          </div>

          {/* Instrument / Timbre Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2A180E] border border-[#6B4423]/70 shadow-inner">
            <Music size={14} className="text-amber-400" />
            <select
              id="instrument"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="bg-transparent text-amber-200 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="dombyra" className="bg-[#1C120B] text-[#F4EFE6]">
                {t('dombyra')} (Акустика)
              </option>
              <option value="synth" className="bg-[#1C120B] text-[#F4EFE6]">
                {t('synth')}
              </option>
            </select>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2A180E] border border-[#6B4423]/70 shadow-inner">
          <Zap size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-stone-300">Скорость:</span>
          <select
            id="speed"
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            className="bg-transparent text-amber-200 text-xs font-bold outline-none cursor-pointer"
          >
            <option value={0.5} className="bg-[#1C120B] text-[#F4EFE6]">0.5×</option>
            <option value={0.75} className="bg-[#1C120B] text-[#F4EFE6]">0.75×</option>
            <option value={1} className="bg-[#1C120B] text-[#F4EFE6]">1.0×</option>
            <option value={1.5} className="bg-[#1C120B] text-[#F4EFE6]">1.5×</option>
            <option value={2} className="bg-[#1C120B] text-[#F4EFE6]">2.0×</option>
          </select>
        </div>
      </div>

      {/* Styled Responsive Dombyra Fretboard */}
      <div className={styles.fretboardWrapper}>
        <div className={styles.fretboard}></div>
      </div>

      {/* Progress & Playback Controls Bar */}
      <div className="w-full flex flex-col items-center gap-4 py-2">
        {/* Sleek Gradient Progress Bar */}
        <div className="w-full max-w-2xl flex flex-col gap-1.5">
          <div className="w-full bg-[#20140D] h-2.5 rounded-full overflow-hidden border border-[#52331C] shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-stone-400 px-1">
            <span>Нота {curTab + 1} / {length || 1}</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleButtonClick}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#996515] text-[#1A0F07] font-black text-sm shadow-[0_6px_20px_rgba(184,134,11,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5 fill-current" />}
            <span>{isPlaying ? 'Пауза' : 'Воспроизвести'}</span>
          </button>

          <button
            onClick={handleRestart}
            title="Заново"
            className="p-2.5 rounded-2xl bg-[#28180E] hover:bg-[#382315] text-[#E2C499] hover:text-white border border-[#6B4423]/70 font-bold transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      {/* Digital Notes Card (Fixed to match Screenshot 2 in dark luxury style) */}
      <div className="w-full flex flex-col gap-3">
        <h2 className="text-xl font-black text-white flex items-center gap-2 px-1">
          <Sparkles className="text-amber-400" size={20} />
          <span>{t('digital_notes')}</span>
        </h2>

        <div className="w-full bg-[#1C120B]/95 border-2 border-[#8C5E1E]/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col gap-5">
          {/* Notes badges */}
          <div className="flex flex-wrap items-center gap-2">
            {digitalNotes.length > 0 ? (
              digitalNotes.map((item, index) => (
                <div
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs shadow-md transition-all ${
                    index === curTab && isPlaying
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-black scale-105 border-white ring-2 ring-amber-300'
                      : 'bg-[#2A180E] border-amber-500/40 text-amber-200'
                  }`}
                >
                  <span className="font-mono font-black text-sm">{item}</span>
                  <span className={index === curTab && isPlaying ? 'text-stone-900' : 'text-[#C89D66]'}>
                    ({orderedNotes[item] || 'G4'})
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-stone-400">Нет распознанных нот</span>
            )}
          </div>

          {/* Instructions note */}
          <p className="text-sm sm:text-base text-[#E2C499]/90 leading-relaxed font-medium border-t border-[#4d3322] pt-4">
            {t('instructions')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Fretboard;