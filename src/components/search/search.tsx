'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SONGS, Song } from '@/data/songs';
import Footer from '../footer';
import { Search as SearchIcon, Music, ArrowRight, Play, BookOpen } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState<string>('');
  const t = useTranslations('search');

  const filteredSongs = SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      (s.author && s.author.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] flex flex-col">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            {t('headline')}
          </h1>
          <p className="text-xs text-stone-400">
            {t('sub')}
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full max-w-xl mx-auto">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="search"
            placeholder={t('placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-[#1E1410] border border-[#3d291e] rounded-2xl text-sm text-[#F4EFE6] placeholder:text-stone-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
          />
        </div>

        {/* Search Results List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-stone-400 font-semibold px-1">
            <span>{t('found')} {filteredSongs.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredSongs.map((song) => (
              <Link
                key={song.id}
                href="/learn"
                className="p-4 rounded-2xl bg-[#1E1410] hover:bg-[#281B15] border border-[#3A271C] hover:border-amber-500/50 transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                    <Music size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                      {song.title}
                    </h3>
                    <p className="text-xs text-stone-400">
                      {song.author || t('default_author')} · {song.sections.length} {t('parts_count')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>{t('learn_btn')}</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}

            {filteredSongs.length === 0 && (
              <div className="col-span-full p-8 rounded-2xl bg-[#1E1410] border border-[#3A271C] text-center text-xs text-stone-400">
                {t('not_found')}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}