'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Music, Sparkles, BookOpen, SlidersHorizontal, Trophy, ArrowRight } from 'lucide-react';
import Footer from '@/components/footer';
import NuraliAvatar from '@/components/nurali/NuraliAvatar';

const About = () => {
  const t = useTranslations('about');

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] flex flex-col items-center">
      <div className="w-full max-w-3xl px-4 sm:px-6 py-8 flex flex-col gap-6 flex-1">
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Sparkles size={14} />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-lg leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Mission Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#241710] to-[#1a110b] border border-[#3d291e] shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Music size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t('mission_title')}</h2>
              <p className="text-xs text-amber-300/80">{t('mission_sub')}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {t('description')}
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#1E1410] border border-[#3b271d] flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <BookOpen size={16} />
            </div>
            <h3 className="font-bold text-xs text-white">{t('pillar1_title')}</h3>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {t('pillar1_desc')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1E1410] border border-[#3b271d] flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <SlidersHorizontal size={16} />
            </div>
            <h3 className="font-bold text-xs text-white">{t('pillar2_title')}</h3>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {t('pillar2_desc')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1E1410] border border-[#3b271d] flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <Trophy size={16} />
            </div>
            <h3 className="font-bold text-xs text-white">{t('pillar3_title')}</h3>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {t('pillar3_desc')}
            </p>
          </div>
        </div>

        {/* Nurali Mentor Feature Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#2B1B12] via-[#20140d] to-[#160E0A] border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-emerald-600 p-0.5 shrink-0 shadow-md overflow-hidden">
              <div className="w-full h-full rounded-full bg-[#1A1009] overflow-hidden flex items-center justify-center">
                <NuraliAvatar />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {t('nurali_title')}
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  {t('nurali_status')}
                </span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                {t('nurali_desc')}
              </p>
            </div>
          </div>
          <Link
            href="/learn"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow"
          >
            <span>{t('start_btn')}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;