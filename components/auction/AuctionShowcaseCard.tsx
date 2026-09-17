"use client";

/**
 * Müzayede Vitrin Kartı (Showcase Card).
 * Açık artırmada sıradaki futbolcunun reyting rozetini, mevkilerini,
 * uyruğunu ve kulüp bilgisini kademe rengiyle (Elmas/Altın/Gümüş) gösterir.
 */

import React from "react";
import { AuctionPlayerCard } from "@/lib/auction/auctionTypes";
import { Gem } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

interface AuctionShowcaseCardProps {
  card: AuctionPlayerCard | null;
}

export function AuctionShowcaseCard({ card }: AuctionShowcaseCardProps) {
  if (!card) {
    return (
      <div className="py-12 text-center text-zinc-500 font-bold text-sm">
        Kart Yükleniyor...
      </div>
    );
  }

  const cardTier = getRatingTier(card.overallPrime);

  return (
    <div
      className={`relative overflow-hidden flex items-center gap-5 p-5 sm:p-6 rounded-3xl bg-gradient-to-r ${cardTier.glowGradient} border-2 ${cardTier.cardBorder} shadow-2xl transition-all duration-300`}
    >
      <div
        className={`absolute -right-8 -top-8 size-44 rounded-full blur-3xl pointer-events-none opacity-40 ${cardTier.ambientBlur}`}
      />
      <div
        className={`relative flex size-20 sm:size-22 shrink-0 items-center justify-center rounded-2xl ${cardTier.badgeClass} font-mono text-3xl sm:text-4xl font-black z-10 shadow-lg`}
      >
        {card.overallPrime}
        {cardTier.tier === "diamond" && (
          <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-md">
            <Gem className="size-3.5" />
          </span>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1 z-10">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {card.fullName}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${cardTier.pillClass}`}
          >
            {cardTier.tierName}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {card.positions.map((pos) => (
            <span
              key={pos}
              className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white font-mono shadow-sm"
            >
              {pos}
            </span>
          ))}
          {card.nationality && (
            <span className="text-xs sm:text-sm text-zinc-300 font-medium">
              • {card.nationality}
            </span>
          )}
          {card.currentClub && (
            <span className="text-xs sm:text-sm text-zinc-400 font-medium">
              • {card.currentClub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
