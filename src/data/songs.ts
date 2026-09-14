import rawSongsData from './songs_raw.json';

export interface SongStep {
  bottom: number | null;        // Fret on bottom string (Н / G3, 196 Hz)
  top: number | null;           // Fret on top string (В / D3, 146.83 Hz)
  beats: number;                // Duration relative to beat
  stroke?: 'down' | 'up' | null;// Arrow stroke: 'down' (↓) or 'up' (↑)
  legato?: boolean;
  legatoTop?: boolean;          // Draw tie curve arc on top string
  legatoBottom?: boolean;       // Draw tie curve arc on bottom string
  barEnd?: boolean;             // Measure bar separator line
  lineBreak?: boolean;
  lyric?: string | null;        // Syllable/word lyric under the note
  voice2Note?: string | null;
  voice2Instrument?: string | null;
}

export interface SongSection {
  name: string;                 // e.g. "ЧАСТЬ 1" or "1"
  repeatCount?: number;         // e.g. 2 for "×2"
  repeat?: number;
  steps: SongStep[];
}

export interface Song {
  id: string;
  title: string;
  author?: string | null;
  slug: string;
  sort_order?: number;
  tuning_key?: 'standard' | 'teris' | string;
  is_premium?: boolean;
  title_i18n?: Record<string, string>;
  author_i18n?: Record<string, string>;
  sections: SongSection[];
}

// Clean and normalize songs
export const SONGS: Song[] = (rawSongsData as any[]).map((raw) => ({
  id: raw.id,
  title: raw.title?.trim() || 'Без названия',
  author: raw.author?.trim() || 'Халық күйі',
  slug: raw.slug,
  sort_order: raw.sort_order ?? 0,
  tuning_key: raw.tuning_key || 'standard',
  is_premium: raw.is_premium || false,
  title_i18n: raw.title_i18n || {},
  author_i18n: raw.author_i18n || {},
  sections: (raw.sections || []).map((sec: any, idx: number) => ({
    name: sec.name?.startsWith('ЧАСТЬ') ? sec.name : `ЧАСТЬ ${sec.name || idx + 1}`,
    repeatCount: sec.repeatCount ?? sec.repeat ?? 1,
    steps: sec.steps || [],
  })),
}));

export function getAllSongs(): Song[] {
  return SONGS;
}

export function getSongBySlug(slug: string): Song | undefined {
  return SONGS.find((s) => s.slug === slug) || SONGS[0];
}

// Dombyra acoustic note frequencies (12-EDO standard)
// Bottom string (Н): Open = G3 (196.00 Hz)
// Top string (В): Open in standard = D3 (146.83 Hz), in teris = C3 (130.81 Hz)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getFretFrequency(
  stringType: 'bottom' | 'top',
  fret: number,
  tuning: 'standard' | 'teris' = 'standard'
): number {
  const baseFreq = stringType === 'bottom' 
    ? 196.00 // G3
    : tuning === 'teris' 
      ? 130.81 // C3
      : 146.83; // D3

  return baseFreq * Math.pow(2, fret / 12);
}

export function getFretNoteName(
  stringType: 'bottom' | 'top',
  fret: number,
  tuning: 'standard' | 'teris' = 'standard'
): { note: string; octave: number; fullName: string } {
  // G3 is MIDI 55, D3 is MIDI 50, C3 is MIDI 48
  const baseMidi = stringType === 'bottom'
    ? 55 // G3
    : tuning === 'teris'
      ? 48 // C3
      : 50; // D3

  const midi = baseMidi + fret;
  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;

  return {
    note: noteName,
    octave,
    fullName: `${noteName}${octave}`,
  };
}
