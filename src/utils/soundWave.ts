'use client';

type WaveListener = (freq: number, intensity: number, x?: number | null, y?: number | null) => void;

class SoundWaveDispatcher {
  private listeners: Set<WaveListener> = new Set();

  public subscribe(listener: WaveListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public trigger(freq: number = 293, intensity: number = 1.0, x: number | null = null, y: number | null = null) {
    this.listeners.forEach((fn) => {
      try {
        fn(freq, intensity, x, y);
      } catch (err) {
        console.warn('Wave trigger error:', err);
      }
    });
  }
}

export const soundWave = new SoundWaveDispatcher();
