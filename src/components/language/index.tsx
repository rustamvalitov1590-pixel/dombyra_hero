'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';

const languages = [
  { code: 'kk', name: 'Қазақ тілі', flag: '🇰🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState('ru');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const localeCookie = document.cookie.split('; ').find((row) => row.startsWith('locale='));
    if (localeCookie) {
      setLocale(localeCookie.split('=')[1]);
    }
  }, []);

  const changeLanguage = (newLocale: string) => {
    document.cookie = `locale=${newLocale}; path=/`;
    setLocale(newLocale);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-[#442c20] shadow-sm px-3 py-1.5 bg-[#251912] text-xs font-semibold text-[#F4EFE6] hover:bg-[#36241a] focus:outline-none transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Globe className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
          <span>{languages.find((lang) => lang.code === locale)?.name || 'Язык'}</span>
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-stone-400" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-xl shadow-2xl bg-[#20140e] border border-[#4a3022] divide-y divide-[#332117] focus:outline-none overflow-hidden animate-fadeIn">
          <div className="py-1" role="menu">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`group flex items-center px-3 py-2 text-xs w-full transition-colors ${
                  locale === lang.code
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