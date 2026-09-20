import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "../components/bottom-nav";
import LanguageSwitcher from "../components/language";
import NuraliMascot from "../components/nurali/NuraliMascot";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "DombraHero — Онлайн-тренажёр, тюнер и караоке домбры",
  description: "Обучение игре на домбре с синхронным грифом и табулатурой, точный тюнер через микрофон и караоке с распознаванием нот.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-[#0e0805] text-[#F4EFE6] flex justify-center min-h-screen selection:bg-amber-500 selection:text-stone-950`}>
        <NextIntlClientProvider messages={messages}>
          <div className="w-full max-w-5xl bg-[#160E0A] min-h-[100dvh] shadow-2xl relative overflow-x-hidden flex flex-col pb-20 scrollbar-hide border-x border-[#2c1d14]">
            {/* Top Navigation Header Bar */}
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
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Главная
                </Link>
                <Link
                  href="/learn"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Тренажёр
                </Link>
                <Link
                  href="/tuner"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Тюнер
                </Link>
                <Link
                  href="/karaoke"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Караоке
                </Link>
                <Link
                  href="/record"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  ИИ Запись
                </Link>
              </nav>

              <LanguageSwitcher />
            </header>

            {/* Page Content */}
            <main className="flex-1 w-full">
              {children}
            </main>

            {/* Interactive Nurali Mascot & AI Chat */}
            <NuraliMascot />

            {/* Bottom Navigation for Mobile */}
            <BottomNav />
            <Analytics />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
