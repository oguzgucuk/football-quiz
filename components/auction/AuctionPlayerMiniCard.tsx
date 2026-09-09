"use client";

/**
 * Müzayede Futbolcu Alımı Sırasında Satın Alınan Oyuncular İçin Mini Popover Bilgi Kartı.
 * - Futbolcunun hemen üstünde açılır (Popover, side="top").
 * - Arka planı kesinlikle bulanıklaştırmaz (modal/overlay yoktur).
 * - Sadece reyting, isim ve oynayabildiği ana mevkileri gösterir.
 * - Tüm çözünürlüklerle uyumludur (collisionPadding sayesinde ekran dışına taşmaz).
 */

import React from "react";
import { AuctionPlayerCard } from "@/lib/auction/auctionTypes";
import { Popover, PopoverTrigger, PopoverContent, PopoverArrow } from "@/components/ui/popover";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { cn } from "@/lib/ui/cn";

interface AuctionPlayerMiniCardProps {
  player: AuctionPlayerCard;
  children: React.ReactNode;
}

/**
 * Mevki kısaltmasına göre mevkii ailesine özel hafif renk vurgusu döner.
 */
function getPositionBadgeStyle(pos: string): string {
  const p = pos.toUpperCase();
  if (p === "GK" || p === "KL") {
    return "bg-amber-500/15 border-amber-500/40 text-amber-300";
  }
  if (["CB", "LB", "RB", "LWB", "RWB", "DEF"].includes(p)) {
    return "bg-blue-500/15 border-blue-500/40 text-blue-300";
  }
  if (["CDM", "CM", "CAM", "LM", "RM", "MID"].includes(p)) {
    return "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
  }
  return "bg-rose-500/15 border-rose-500/40 text-rose-300";
}

export function AuctionPlayerMiniCard({ player, children }: AuctionPlayerMiniCardProps) {
  const rawPositions =
    player.positions && player.positions.length > 0
      ? player.positions
      : player.primaryPosition
      ? [player.primaryPosition]
      : [];

  const mainPositions = Array.from(
    new Set(
      rawPositions
        .map((p) => p?.trim().toUpperCase())
        .filter((p): p is string => Boolean(p))
    )
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={6}
        collisionPadding={10}
        className="w-auto max-w-[260px] p-2 sm:p-2.5 rounded-xl border border-white/15 bg-[#0e1319]/98 shadow-[0_8px_30px_rgba(0,0,0,0.8)] text-white select-none z-50 pointer-events-auto"
      >
        <PopoverArrow className="fill-[#0e1319]" width={10} height={5} />

        <div className="flex items-center gap-2.5">
          {/* 1. Oyuncunun Reytingi */}
          <RatingBadge rating={player.overallPrime} size="sm" showIcon />

          {/* 2. Oyuncunun İsmi & 3. Oynayabildiği Ana Pozisyonları */}
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <span
              className="text-xs font-black text-white truncate tracking-tight leading-snug"
              title={player.fullName}
            >
              {player.fullName}
            </span>

            <div className="flex items-center gap-1 flex-wrap mt-0.5">
              {mainPositions.length > 0 ? (
                mainPositions.map((pos) => (
                  <span
                    key={pos}
                    className={cn(
                      "px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] leading-none tracking-wide shadow-2xs",
                      getPositionBadgeStyle(pos)
                    )}
                  >
                    {pos}
                  </span>
                ))
              ) : (
                <span className="px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] leading-none bg-zinc-800 text-zinc-400 border-zinc-700">
                  CM
                </span>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
