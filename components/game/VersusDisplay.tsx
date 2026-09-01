"use client";

import React from "react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { Team } from "@/types/game";

interface VersusDisplayProps {
  team1: Team | null;
  team2: Team | null;
}

export function VersusDisplay({ team1, team2 }: VersusDisplayProps) {
  return (
    <div className="w-full max-w-3xl mx-auto my-6 flex items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      {/* Arka Plan Işık Efekti */}
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Takım 1 (Sol) */}
      <div className="flex-1 flex flex-col items-center text-center animate-fadeIn">
        <div className="mb-3">
          <TeamBadge team={team1} size="xl" />
        </div>
        <h3 className="text-base sm:text-xl font-black text-white tracking-tight line-clamp-1">
          {team1?.name || "Takım 1"}
        </h3>
        <span className="text-xs text-zinc-400 mt-0.5">
          {team1?.league || "Lig"} • {team1?.country || "Ülke"}
        </span>
      </div>

      {/* Ortadaki VS */}
      <div className="flex flex-col items-center justify-center px-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center font-black text-xs sm:text-sm text-zinc-300 shadow-inner">
          VS
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mt-2">
          Ortak Oyuncu
        </span>
      </div>

      {/* Takım 2 (Sağ) */}
      <div className="flex-1 flex flex-col items-center text-center animate-fadeIn">
        <div className="mb-3">
          <TeamBadge team={team2} size="xl" />
        </div>
        <h3 className="text-base sm:text-xl font-black text-white tracking-tight line-clamp-1">
          {team2?.name || "Takım 2"}
        </h3>
        <span className="text-xs text-zinc-400 mt-0.5">
          {team2?.league || "Lig"} • {team2?.country || "Ülke"}
        </span>
      </div>
    </div>
  );
}
