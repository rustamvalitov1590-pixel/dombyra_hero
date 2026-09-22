'use client';

// Time-domain autocorrelation pitch detector for dombyra
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Silence / noise floor threshold
  if (rms < 0.015) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
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
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < trimmed.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

/**
 * Transcribes recorded or uploaded audio into Dombyra fret steps:
 * Output: { "0": [fretNumber, durationInSeconds], "1": [fretNumber, durationInSeconds], ... }
 */
export async function transcribeAudioBlob(blob: Blob): Promise<Record<string, [number, number]>> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close();
  }

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Frame size 4096 samples (~92ms at 44.1kHz), hop size 2048 (~46ms)
  const frameSize = 4096;
  const hopSize = 2048;
  const hopDuration = hopSize / sampleRate;

  const rawDetections: { fret: number; time: number }[] = [];

  for (let offset = 0; offset + frameSize <= channelData.length; offset += hopSize) {
    const frame = channelData.subarray(offset, offset + frameSize);
    const freq = autoCorrelate(frame, sampleRate);

    // Dombyra musical range: 80 Hz to 1200 Hz
    if (freq >= 80 && freq <= 1200) {
      // Normalize to fundamental Dombyra octave (open bottom string G3 = 196 Hz)
      let normFreq = freq;
      while (normFreq > 380) normFreq /= 2;
      while (normFreq < 190 && normFreq > 50) normFreq *= 2;

      // Calculate fret on bottom string (G3 = 196 Hz)
      const rawFret = Math.round(12 * Math.log2(normFreq / 196.00));
      const fret = Math.max(0, Math.min(19, rawFret));

      rawDetections.push({
        fret,
        time: offset / sampleRate,
      });
    }
  }

  // If no clear musical frequencies detected, check if there was any sound at all
  if (rawDetections.length === 0) {
    throw new Error('Не удалось распознать ноты. Попробуйте сыграть громче и ближе к микрофону.');
  }

  // Group consecutive frames of the same fret into distinct notes
  const notes: [number, number][] = [];
  let currentFret = rawDetections[0].fret;
  let currentDuration = hopDuration;

  for (let i = 1; i < rawDetections.length; i++) {
    const d = rawDetections[i];
    if (d.fret === currentFret) {
      currentDuration += hopDuration;
    } else {
      // Filter out short transitional glitch noise (< 100ms)
      if (currentDuration >= 0.1) {
        notes.push([currentFret, Math.round(currentDuration * 10) / 10 || 0.3]);
      }
      currentFret = d.fret;
      currentDuration = hopDuration;
    }
  }

  // Push final note
  if (currentDuration >= 0.1) {
    notes.push([currentFret, Math.round(currentDuration * 10) / 10 || 0.3]);
  }

  if (notes.length === 0) {
    throw new Error('Запись слишком короткая или неразборчивая. Сыграйте несколько отчетливых нот.');
  }

  // Convert array to Record<string, [number, number]> matching Fretboard format
  const midiData: Record<string, [number, number]> = {};
  notes.forEach((note, idx) => {
    midiData[idx.toString()] = note;
  });

  return midiData;
}
