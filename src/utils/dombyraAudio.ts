'use client';

import { getFretFrequency } from '@/data/songs';

class DombyraAudioEngine {
  private ctx: AudioContext | null = null;
  private sampleBuffers: Map<string, AudioBuffer> = new Map();
  private isMuted: boolean = false;

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Synthesize authentic plucked dombyra tone using Karplus-Strong / filtered harmonic decay
  public playPluckedString(frequency: number, delayMs: number = 0, duration: number = 1.2, volume: number = 0.8) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const startTime = ctx.currentTime + delayMs / 1000;

      // Master gain node for the pluck envelope
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      // Lowpass filter simulates the wooden soundboard and nylon/gut string dampening
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(frequency * 8, 4500), startTime);
      filter.frequency.exponentialRampToValueAtTime(frequency * 1.5, startTime + duration * 0.7);

      // Fundamental oscillator (triangle/sawtooth hybrid for rich dombyra string harmonics)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(frequency, startTime);

      // Secondary overtone oscillator for authentic dombyra "twang"
      const osc2 = ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(frequency * 2, startTime);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(volume * 0.45, startTime);
      osc2Gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.4);

      // Connect graph
      osc1.connect(gainNode);
      osc2.connect(osc2Gain);
      osc2Gain.connect(gainNode);
      gainNode.connect(filter);
      filter.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Play a step from a song tab with stroke direction sweep
  public playStep(
    bottomFret: number | null,
    topFret: number | null,
    stroke: 'down' | 'up' | null = 'down',
    tuning: 'standard' | 'teris' = 'standard'
  ) {
    const sweepMs = 18; // 18ms strumming delay between strings (қағыс)

    if (bottomFret !== null && topFret !== null) {
      const bottomFreq = getFretFrequency('bottom', bottomFret, tuning);
      const topFreq = getFretFrequency('top', topFret, tuning);

      if (stroke === 'down') {
        // Downstroke: Top string struck first, then bottom string
        this.playPluckedString(topFreq, 0, 1.2, 0.75);
        this.playPluckedString(bottomFreq, sweepMs, 1.4, 0.85);
      } else {
        // Upstroke: Bottom string struck first, then top string
        this.playPluckedString(bottomFreq, 0, 1.4, 0.85);
        this.playPluckedString(topFreq, sweepMs, 1.2, 0.75);
      }
    } else if (bottomFret !== null) {
      const freq = getFretFrequency('bottom', bottomFret, tuning);
      this.playPluckedString(freq, 0, 1.4, 0.85);
    } else if (topFret !== null) {
      const freq = getFretFrequency('top', topFret, tuning);
      this.playPluckedString(freq, 0, 1.2, 0.8);
    }
  }

  // Play reference pitch for tuner
  public playReferencePitch(frequency: number, duration: number = 2.0) {
    this.playPluckedString(frequency, 0, duration, 0.9);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }
}

export const dombyraAudio = new DombyraAudioEngine();
export default dombyraAudio;
