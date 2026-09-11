"use client";

/**
 * Açık Arttırma Sırasındaki Sol "KADROM" Paneli.
 * Taktik aşamasındaki liste tasarımına sadık kalınarak:
 * - Oyuncuların reyting rozeti, tam adı ve oynayabildiği mevkileri ayrıntılı gösterir.
 * - 11 oyuncuya kadar dikeyde scrollbar'a düşmeden kompakt ve net yerleşir.
 * - (i) butonu ile oyuncunun detay modalını açar.
 */

import React, { useState } from "react";
import { AuctionParticipant, AuctionPlayerCard } from "@/lib/auction/auctionTypes";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import { Info, UserCheck, Shield } from "lucide-react";
import { AuctionPlayerDetailModal } from "./AuctionPlayerDetailModal";

interface MySquadDrawerProps {
  participant?: AuctionParticipant;
  isMyHighestBid?: boolean;
}

export function MySquadDrawer({ participant, isMyHighestBid = false }: MySquadDrawerProps) {
  const [inspectingPlayer, setInspectingPlayer] = useState<AuctionPlayerCard | null>(null);

  if (!participant) return null;

  const squad = participant.squad || [];
  const count = squad.length;
  const avgRating =
    count > 0
      ? Math.round(squad.reduce((sum, p) => sum + p.overallPrime, 0) / count)
      : null;

  return (
    <>
      <aside className="lg:col-span-3 lg:sticky lg:top-4 z-10 flex flex-col select-none">
        <div
          className={`rounded-3xl border-2 transition-all duration-300 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl flex flex-col ${
            isMyHighestBid
              ? "border-amber-400 bg-gradient-to-b from-amber-500/20 via-amber-950/35 to-black/80 shadow-[0_0_35px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/50"
              : "border-emerald-500/25 bg-black/60"
          }`}
        >
          {isMyHighestBid && (
            <div className="mb-2.5 flex items-center justify-center gap-1.5 py-1 px-3 rounded-xl bg-amber-400 text-black font-mono font-black text-xs shadow-[0_0_16px_rgba(251,191,36,0.7)] animate-pulse">
              <span>👑 EN YÜKSEK TEKLİF SENDE!</span>
            </div>
          )}

          {/* Başlık ve Bütçe Satırı */}
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <p
                  className={`text-xs sm:text-sm font-black uppercase tracking-widest ${
                    isMyHighestBid ? "text-amber-300" : "text-emerald-400"
                  }`}
                >
                  KADROM
                </p>
                {avgRating && (
                  <span className="text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 shadow-sm">
                    Ort. {avgRating}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm sm:text-base font-black text-white truncate max-w-[140px]">
                {participant.username}
              </p>
            </div>
            <div className="text-right font-mono">
              <p className="text-lg sm:text-xl font-black text-amber-400">${participant.budget}M</p>
              <p className="text-[11px] text-zinc-300 font-bold">{count}/11 Oyuncu</p>
            </div>
          </div>

          {/* Ayrıntılı Kadro Listesi (Taktik Ekranı Tarzında - Kompakt & Scrollsuz) */}
          <div className="flex flex-col gap-1.5 mt-3">
            {squad.map((player) => {
              const tier = getRatingTier(player.overallPrime);
              const posList =
                player.positions && player.positions.length > 0
                  ? player.positions
                  : [player.primaryPosition || "CM"];

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 transition-all gap-2"
                >
                  {/* Sol: Reyting Rozeti */}
                  <div
                    className={`size-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${tier.badgeClass} shadow-sm`}
                  >
                    {player.overallPrime}
                  </div>

                  {/* Orta: Tam İsim */}
                  <span className="font-bold text-xs text-white truncate flex-1 min-w-0" title={player.fullName}>
                    {player.fullName}
                  </span>

                  {/* Sağ: Mevki Etiketi ve Detay İkonu */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-zinc-300 bg-white/10 border border-white/15 px-1.5 py-0.5 rounded">
                      {posList.slice(0, 3).join("/")}
                      {posList.length > 3 ? "..." : ""}
                    </span>

                    <button
                      type="button"
                      onClick={() => setInspectingPlayer(player)}
                      className="size-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Mevkileri ve Detayları Gör"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Kalan Boş Yuvalar Göstergesi */}
            {count < 11 && (
              <div className="flex items-center justify-center p-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-zinc-500 text-[11px] font-medium gap-1.5">
                <UserCheck className="w-3.5 h-3.5 opacity-60" />
                <span>{11 - count} oyuncu daha transfer edilebilir</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Oyuncu Pozisyon İnceleme Modalı */}
      {inspectingPlayer && (
        <AuctionPlayerDetailModal
          player={inspectingPlayer}
          onClose={() => setInspectingPlayer(null)}
        />
      )}
    </>
  );
}
