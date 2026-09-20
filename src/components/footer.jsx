import React from "react";
import Link from "next/link";
import { Sparkles, Music, BookOpen, SlidersHorizontal, Trophy } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full mt-auto bg-[#140b07] border-t border-[#3b271d] py-8 px-4 md:px-8 text-[#E8DBCF]/80">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <Link href="/main" className="flex items-center gap-2 group">
            <img
              src="/dombyraLOGO.png"
              alt="DombraHero"
              className="h-6 w-auto transition-transform group-hover:scale-105"
            />
            <span className="text-sm font-black tracking-tight text-[#F4EFE6]">
              Dombra<span className="text-amber-400">Hero</span>
            </span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              AI Powered
            </span>
          </Link>
          <p className="text-xs text-stone-400 max-w-sm">
            Интерактивная платформа изучения домбры: синхронный гриф, точный тюнер, караоке и ИИ-наставник Нурали.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
          <Link
            href="/learn"
            className="text-stone-300 hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            <BookOpen size={13} />
            <span>Тренажёр</span>
          </Link>
          <Link
            href="/tuner"
            className="text-stone-300 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            <SlidersHorizontal size={13} />
            <span>Тюнер</span>
          </Link>
          <Link
            href="/karaoke"
            className="text-stone-300 hover:text-rose-300 transition-colors flex items-center gap-1"
          >
            <Trophy size={13} />
            <span>Караоке</span>
          </Link>
          <Link
            href="/about"
            className="text-stone-300 hover:text-amber-300 transition-colors"
          >
            О проекте
          </Link>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500 text-center sm:text-left">
        <p>&copy; {new Date().getFullYear()} DombraHero. Қазақстанның музыкалық мұрасы.</p>
        <p className="flex items-center gap-1 text-amber-500/80">
          <Sparkles size={12} />
          <span>Сделано с любовью к казахской домбре</span>
        </p>
      </div>
    </footer>
  );
}