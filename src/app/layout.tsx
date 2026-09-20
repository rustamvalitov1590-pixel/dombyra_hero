import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/header";
import BottomNav from "../components/bottom-nav";
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
            <Header />

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
