"use client";

import React from "react";
import { Swords, Percent, Flame, Trophy } from "lucide-react";

interface ProfileMetricsGridProps {
  totalMatches: number;
  winRate: number;
  matchesWon: number;
  matchesLost: number;
  matchesDraw?: number;
  currentStreak: number;
  bestStreak: number;
}

export function ProfileMetricsGrid({
  totalMatches,
  winRate,
  matchesWon,
  matchesLost,
  matchesDraw = 0,
  currentStreak,
  bestStreak,
}: ProfileMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Swords className="size-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Toplam Maç</span>
        </div>
        <p className="font-mono font-black text-2xl text-white">{totalMatches}</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">Tüm sezon boyunca</span>
      </div>

      <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Percent className="size-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Kazanma Oranı</span>
        </div>
        <p className="font-mono font-black text-2xl text-emerald-400">{winRate}%</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">
          {matchesWon}G - {matchesLost}M{matchesDraw > 0 ? ` - ${matchesDraw}B` : ""}
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Flame className="size-4 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Galibiyet Serisi</span>
        </div>
        <p className="font-mono font-black text-2xl text-orange-400">{currentStreak} Maç</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">En iyi: {bestStreak} maç</span>
      </div>

      <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Trophy className="size-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider">En İyi Seri</span>
        </div>
        <p className="font-mono font-black text-2xl text-white">{bestStreak} Maç</p>
        <span className="text-[11px] text-zinc-400 mt-1 block">Tüm zamanların rekoru</span>
      </div>
    </div>
  );
}
