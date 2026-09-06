"use client";

import React from "react";
import { Shield, Sparkles, Trophy } from "lucide-react";

export interface PlayerCardData {
  id: string;
  fullName: string;
  birthDate: string | null;
  nationality: string | null;
  position: string | null;
  overallPrime: number | null;
  positions: string[];
  teams: {
    id: string;
    name: string;
    logoUrl: string | null;
  }[];
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 && age < 120 ? age : null;
}

function getRatingTier(rating: number | null) {
  if (!rating) {
    return {
      cardBorder: "border-white/10 hover:border-white/20",
      ratingBg: "bg-zinc-800 text-zinc-300",
      tierName: "STANDART",
      glow: "",
    };
  }
  if (rating >= 90) {
    return {
      cardBorder: "border-amber-400/50 hover:border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]",
      ratingBg: "bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 text-black shadow-md",
      tierName: "EFSANE",
      glow: "from-amber-500/10 via-amber-950/20 to-transparent",
    };
  }
  if (rating >= 80) {
    return {
      cardBorder: "border-yellow-500/35 hover:border-yellow-400/60 shadow-[0_0_10px_rgba(234,179,8,0.1)]",
      ratingBg: "bg-gradient-to-br from-yellow-300 to-amber-500 text-black font-black",
      tierName: "ALTIN",
      glow: "from-yellow-500/5 via-yellow-950/15 to-transparent",
    };
  }
  if (rating >= 75) {
    return {
      cardBorder: "border-slate-400/30 hover:border-slate-300/50",
      ratingBg: "bg-gradient-to-br from-slate-200 to-slate-400 text-zinc-950 font-black",
      tierName: "GÜMÜŞ",
      glow: "from-slate-500/5 via-slate-900/15 to-transparent",
    };
  }
  return {
    cardBorder: "border-amber-900/40 hover:border-amber-800/60",
    ratingBg: "bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-black",
    tierName: "BRONZ",
    glow: "from-amber-900/5 to-transparent",
  };
}

function getPosBadgeColor(pos: string) {
  const p = pos.toUpperCase();
  if (["ST", "CF", "LW", "RW"].includes(p)) return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  if (["CAM", "CM", "CDM", "LM", "RM"].includes(p)) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (["CB", "LB", "RB", "LWB", "RWB"].includes(p)) return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  if (p === "GK") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  return "bg-zinc-800 text-zinc-300 border-white/10";
}

export function PlayerCard({ player }: { player: PlayerCardData }) {
  const tier = getRatingTier(player.overallPrime);
  const age = calculateAge(player.birthDate);
  const displayPositions = player.positions.length > 0 ? player.positions : (player.position ? [player.position] : []);

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border ${tier.cardBorder} bg-gradient-to-b ${tier.glow || "from-white/5"} to-black/80 backdrop-blur-md p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      {/* Üst Kısım: Reyting Rozeti + Tier + Ülke */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl font-black text-lg tracking-tighter ${tier.ratingBg}`}
          >
            {player.overallPrime ?? "?"}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/50 flex items-center gap-1">
              {player.overallPrime && player.overallPrime >= 90 && <Sparkles className="size-2.5 text-amber-400" />}
              {tier.tierName}
            </span>
            <span className="text-xs font-semibold text-zinc-400 line-clamp-1">
              {player.nationality || "Bilinmiyor"}
            </span>
          </div>
        </div>

        {/* Yaş Rozeti */}
        {age && (
          <div className="rounded-lg bg-white/5 px-2 py-1 text-[11px] font-mono font-bold text-zinc-300 border border-white/10 shrink-0">
            {age} Yaş
          </div>
        )}
      </div>

      {/* Orta Kısım: Oyuncu İsmi & Mevkiler */}
      <div className="my-3">
        <h3
          className="text-base font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1"
          title={player.fullName}
        >
          {player.fullName}
        </h3>

        {/* Mevki Rozetleri */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {displayPositions.slice(0, 4).map((pos) => (
            <span
              key={pos}
              className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold font-mono ${getPosBadgeColor(pos)}`}
            >
              {pos}
            </span>
          ))}
          {displayPositions.length > 4 && (
            <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold font-mono text-zinc-400">
              +{displayPositions.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Alt Kısım: Kulüp Geçmişi Logoları */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {player.teams.length > 0 ? (
            player.teams.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="relative size-6 shrink-0 rounded-md bg-white/5 border border-white/10 p-0.5 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform"
                title={t.name}
              >
                {t.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={t.logoUrl} alt={t.name} className="size-full object-contain" />
                ) : (
                  <span className="text-[9px] font-black text-zinc-400 uppercase">
                    {t.name.slice(0, 2)}
                  </span>
                )}
              </div>
            ))
          ) : (
            <span className="text-[11px] text-zinc-500 italic">Kulüp kaydı yok</span>
          )}
        </div>

        {player.birthDate && (
          <span className="text-[10px] font-mono text-zinc-500">
            {player.birthDate.slice(0, 4)}
          </span>
        )}
      </div>
    </div>
  );
}
