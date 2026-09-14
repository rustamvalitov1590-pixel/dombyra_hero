"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Footer from './footer';
import { Music, Mic, Search, Upload, PlayCircle, Sparkles } from 'lucide-react';

export default function Landing() {
  const t = useTranslations('landing');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 py-12 text-center bg-gradient-to-b from-blue-50/70 to-white overflow-hidden">
          <div className="max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              <Sparkles size={14} />
              <span>AI Dombyra Beta</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-snug mb-3">
              {t('headline')}
            </h1>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {t('small_description')}
            </p>

            <Link
              href="/main"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95"
            >
              <PlayCircle size={18} />
              <span>{t('get_started_button')}</span>
            </Link>

            <p className="mt-3 text-[11px] text-gray-400">
              {t('disclamer')}
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">
            {t('how_it_work')}
          </h2>

          <div className="space-y-3 max-w-md mx-auto">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  {t('hiw1')}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                    <Search size={12} /> {t('hiw2')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                    <Mic size={12} /> {t('hiw3')}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium">
                    <Upload size={12} /> {t('hiw5')}
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  {t('hiw6')}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('hiw7')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                  {t('hiw8')}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('hiw9')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="px-6 py-6 pb-12 bg-white">
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">
              {t('reviews')}
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4">
              {t('r1')}
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed italic">
                &ldquo;{t('r2')}&rdquo;
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed italic">
                &ldquo;{t('r3')}&rdquo;
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}