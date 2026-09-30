'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { ChevronDown, Globe } from 'lucide-react';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'kk', name: 'Қазақ тілі', flag: '🇰🇿' },
];

export default function LanguageSwitcher() {
  const activeLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (newLocale: string) => {
    // 1-year persistent cookie with SameSite=Lax
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setIsOpen(false);
    window.location.reload();
  };

  const currentLang = languages.find((l) => l.code === activeLocale) || languages[0];

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-[#442c20] shadow-sm px-3 py-1.5 bg-[#251912] text-xs font-semibold text-[#F4EFE6] hover:bg-[#36241a] focus:outline-none transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Globe className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
          <span>{currentLang.name}</span>
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-stone-400" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-xl shadow-2xl bg-[#20140e] border border-[#4a3022] divide-y divide-[#332117] focus:outline-none overflow-hidden animate-fadeIn z-50">
          <div className="py-1" role="menu">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`group flex items-center px-3 py-2 text-xs w-full transition-colors ${
                  activeLocale === lang.code
                    ? 'bg-amber-600/30 text-amber-300 font-bold'
                    : 'text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => changeLanguage(lang.code)}
              >
                <span className="mr-2 text-sm">{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}