"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, SlidersHorizontal, Trophy, Mic } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BottomNav = () => {
  const pathname = usePathname();
  const t = useTranslations('navbar');

  const isActive = (path) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-5xl mx-auto h-16 bg-[#1a110b]/95 backdrop-blur-lg border-t border-[#3b271d] shadow-[0_-8px_25px_rgba(0,0,0,0.5)] flex items-center justify-around px-2 z-50 rounded-t-2xl">
      {/* 1. Main Home */}
      <Link
        href="/main"
        className={`flex flex-col items-center justify-center w-14 h-full transition-all ${
          isActive('/main') ? 'text-amber-400 font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
        }`}
        prefetch={false}
      >
        <Home size={20} className={isActive('/main') ? 'stroke-[2.5]' : ''} />
        <span className="text-[10px] mt-1 tracking-tight">{t('main')}</span>
      </Link>

      {/* 2. Learn / Trainer */}
      <Link
        href="/learn"
        className={`flex flex-col items-center justify-center w-14 h-full transition-all ${
          isActive('/learn') ? 'text-amber-400 font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
        }`}
        prefetch={false}
      >
        <BookOpen size={20} className={isActive('/learn') ? 'stroke-[2.5]' : ''} />
        <span className="text-[10px] mt-1 tracking-tight">{t('learn')}</span>
      </Link>

      {/* 3. Center AI Record button */}
      <div className="relative -top-3">
        <Link
          href="/record"
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-full shadow-lg shadow-amber-500/40 text-stone-950 transform hover:scale-110 active:scale-95 transition-all ring-2 ring-amber-300"
          prefetch={false}
          title={t('record_ai')}
        >
          <Mic size={22} className="stroke-[2.5]" />
        </Link>
      </div>

      {/* 4. Tuner */}
      <Link
        href="/tuner"
        className={`flex flex-col items-center justify-center w-14 h-full transition-all ${
          isActive('/tuner') ? 'text-amber-400 font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
        }`}
        prefetch={false}
      >
        <SlidersHorizontal size={20} className={isActive('/tuner') ? 'stroke-[2.5]' : ''} />
        <span className="text-[10px] mt-1 tracking-tight">{t('tuner')}</span>
      </Link>

      {/* 5. Karaoke */}
      <Link
        href="/karaoke"
        className={`flex flex-col items-center justify-center w-14 h-full transition-all ${
          isActive('/karaoke') ? 'text-amber-400 font-bold scale-105' : 'text-stone-400 hover:text-stone-200'
        }`}
        prefetch={false}
      >
        <Trophy size={20} className={isActive('/karaoke') ? 'stroke-[2.5]' : ''} />
        <span className="text-[10px] mt-1 tracking-tight">{t('karaoke')}</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
