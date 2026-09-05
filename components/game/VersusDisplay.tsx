"use client";

import React from "react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { Team, Nation } from "@/types/game";
import { Globe } from "lucide-react";

interface VersusDisplayProps {
  team1: Team | null;
  team2: Team | null;
  nation?: Nation | null;
}

export function VersusDisplay({ team1, team2, nation }: VersusDisplayProps) {
  const isNationMode = Boolean(nation);

  return (
    <div className="w-full max-w-3xl mx-auto my-6 flex items-center justify-between gap-4 p-6 sm:p-8 rounded-[28px] bg-[#0c1612]/85 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Arka Plan Sıcak Radyal Vurgusu */}
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sol Taraf: Millet (Varsa) veya Takım 1 */}
      {isNationMode && nation ? (
        <div className="flex-1 flex flex-col items-center text-center animate-fadeIn">
          <div className="mb-3 size-14 sm:size-16 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500/40 flex items-center justify-center font-mono font-black text-emerald-300 text-lg shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            {nation.flagCode.toUpperCase()}
          </div>
          <h3 className="text-base sm:text-xl font-black text-white tracking-tight line-clamp-1">
            {nation.name}
          </h3>
          <span className="text-xs text-zinc-400 mt-0.5">
            Millet • {nation.englishName}
          </span>
        </div>
      ) : (
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
      )}

      {/* Ortadaki VS */}
      <div className="flex flex-col items-center justify-center px-4">
        <div className="size-11 sm:size-12 rounded-2xl bg-black/80 border border-emerald-500/40 flex items-center justify-center font-mono font-black text-xs sm:text-sm text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          VS
        </div>
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-2 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
          {isNationMode ? "Millet-Takım" : "Ortak Oyuncu"}
        </span>
      </div>

      {/* Sağ Taraf: Takım */}
      <div className="flex-1 flex flex-col items-center text-center animate-fadeIn">
        <div className="mb-3">
          <TeamBadge team={isNationMode ? team1 : team2} size="xl" />
        </div>
        <h3 className="text-base sm:text-xl font-black text-white tracking-tight line-clamp-1">
          {(isNationMode ? team1 : team2)?.name || "Takım"}
        </h3>
        <span className="text-xs text-zinc-400 mt-0.5">
          {(isNationMode ? team1 : team2)?.league || "Lig"} • {(isNationMode ? team1 : team2)?.country || "Ülke"}
        </span>
      </div>
    </div>
  );
}
