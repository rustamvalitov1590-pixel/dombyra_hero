"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { SONGS } from '@/data/songs';
import { BookOpen, SlidersHorizontal, Trophy, Music, Sparkles, Search, ArrowRight, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

const MainPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = useTranslations('main');

  const filteredSongs = SONGS.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.author && s.author.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 bg-[#160E0A] text-[#F4EFE6] min-h-screen flex flex-col gap-6">
      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-[#1E1410] border border-[#3d291e] rounded-xl text-sm text-[#F4EFE6] placeholder:text-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-inner"
        />
      </div>

      {/* 3 Core Hero Cards: Learn, Tuner, Karaoke */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Learn */}
        <Link
          href="/learn"
          className="group p-4 rounded-2xl bg-gradient-to-br from-[#241710] to-[#1a110b] border border-amber-900/40 hover:border-amber-500/60 transition-all duration-200 shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
              <BookOpen size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {t('tabs_badge')}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
              {t('trainer_title')}
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              {t('trainer_desc')}
            </p>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-amber-300 group-hover:translate-x-1 transition-transform">
            <span>{t('trainer_action')}</span>
            <ArrowRight size={14} className="ml-1" />
          </div>
        </Link>

        {/* 2. Tuner */}
        <Link
          href="/tuner"
          className="group p-4 rounded-2xl bg-gradient-to-br from-[#241710] to-[#1a110b] border border-emerald-900/40 hover:border-emerald-500/60 transition-all duration-200 shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
              <SlidersHorizontal size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {t('mic_badge')}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
              {t('tuner_title')}
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              {t('tuner_desc')}
            </p>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-300 group-hover:translate-x-1 transition-transform">
            <span>{t('tuner_action')}</span>
            <ArrowRight size={14} className="ml-1" />
          </div>
        </Link>

        {/* 3. Karaoke */}
        <Link
          href="/karaoke"
          className="group p-4 rounded-2xl bg-gradient-to-br from-[#241710] to-[#1a110b] border border-rose-900/40 hover:border-rose-500/60 transition-all duration-200 shadow-lg hover:shadow-rose-500/10 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform">
              <Trophy size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
              {t('game_badge')}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base text-white group-hover:text-rose-300 transition-colors">
              {t('karaoke_title')}
            </h3>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              {t('karaoke_desc')}
            </p>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-rose-300 group-hover:translate-x-1 transition-transform">
            <span>{t('karaoke_action')}</span>
            <ArrowRight size={14} className="ml-1" />
          </div>
        </Link>
      </div>

      {/* Songs Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Music size={20} className="text-amber-400" />
          <span>{t('catalog_title')}</span>
          <span className="text-xs text-stone-400 font-normal">({filteredSongs.length})</span>
        </h2>
        <Link
          href="/learn"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          <span>{t('to_trainer')}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Grid of Song Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredSongs.map((song) => (
          <Link
            key={song.id}
            href="/learn"
            className="p-3.5 rounded-xl bg-[#1E1410] hover:bg-[#281b15] border border-[#3a271c] hover:border-amber-500/50 transition-all flex flex-col justify-between group shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                  {song.title}
                </h4>
                <span className="text-xs text-stone-400 mt-0.5">
                  {song.author || t('default_author')}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#2c1e17] group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center text-amber-400 transition-colors shrink-0">
                <Play size={14} className="ml-0.5" />
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-stone-400">
              <span>{song.sections.length} {t('sections_count')}</span>
              <span className="text-amber-300/80">
                {song.tuning_key === 'teris' ? t('tuning_teris') : t('tuning_standard')}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* AI Assistant Promo / Suggestion */}
      <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-[#241710] to-[#2c1d14] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">
              {t('promo_title')}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {t('promo_desc')}
            </p>
          </div>
        </div>
        <Link
          href="/record"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs whitespace-nowrap shadow-lg shadow-amber-500/20 transition-colors"
        >
          {t('promo_btn')}
        </Link>
      </div>
    </div>
  );
};

export default MainPage;