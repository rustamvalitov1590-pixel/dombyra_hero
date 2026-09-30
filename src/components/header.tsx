'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './language';

export default function Header() {
  const t = useTranslations('navbar');
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#1a110b]/90 backdrop-blur-md sticky top-0 z-40 border-b border-[#3b271d]">
      <Link href="/main" className="flex items-center gap-2 group">
        <img src="/dombyraLOGO.png" alt="DombraHero" className="h-7 w-auto transition-transform group-hover:scale-105" />
        <span className="text-base font-black tracking-tight text-[#F4EFE6]">
          Dombra<span className="text-amber-400">Hero</span>
        </span>
      </Link>

      {/* Desktop quick nav links */}
      <nav className="hidden md:flex items-center gap-1 bg-[#120a06] p-1 rounded-xl border border-[#382419]">
        <Link
          href="/main"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isActive('/main')
              ? 'bg-amber-500/20 text-amber-300 font-bold'
              : 'text-stone-300 hover:text-white hover:bg-white/5'
          }`}
        >
          {t('main')}
        </Link>
        <Link
          href="/learn"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isActive('/learn')
              ? 'bg-amber-500/20 text-amber-300 font-bold'
              : 'text-stone-300 hover:text-white hover:bg-white/5'
          }`}
        >
          {t('learn')}
        </Link>
        <Link
          href="/tuner"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isActive('/tuner')
              ? 'bg-amber-500/20 text-amber-300 font-bold'
              : 'text-stone-300 hover:text-white hover:bg-white/5'
          }`}
        >
          {t('tuner')}
        </Link>
        <Link
          href="/karaoke"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isActive('/karaoke')
              ? 'bg-amber-500/20 text-amber-300 font-bold'
              : 'text-stone-300 hover:text-white hover:bg-white/5'
          }`}
        >
          {t('karaoke')}
        </Link>
        <Link
          href="/record"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isActive('/record')
              ? 'bg-amber-500/20 text-amber-300 font-bold'
              : 'text-amber-300 hover:bg-amber-500/10'
          }`}
        >
          {t('record_ai')}
        </Link>
        <a
          href="/guide.html"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/15 border border-amber-500/30 transition-colors flex items-center gap-1"
          title="Интерактивная видеоинструкция и показ для жюри"
        >
          <span>🎬 Инструкция</span>
        </a>
      </nav>

      <LanguageSwitcher />
    </header>
  );
}
