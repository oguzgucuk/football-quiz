"use client";

/**
 * Müzayede Canlı Teklif Ekranı — Katılımcı / Rakip Kadro Kartı.
 * Kullanıcı adını ferah tutar; 'En Yüksek Teklif' veya 'Sıra Onda' rozetlerinin
 * kullanıcı adını daraltıp ezmesini engeller.
 */

import React from "react";
import { AuctionParticipant } from "@/lib/auction/auctionTypes";
import { AuctionParticipantSquad } from "./AuctionParticipantSquad";
import { Check, X, Crown, Sparkles } from "lucide-react";

interface AuctionBiddingOpponentCardProps {
  participant: AuctionParticipant;
  currentUserId: string;
  currentBid: number;
  currentBidderId?: string;
  isPassed: boolean;
}

export function AuctionBiddingOpponentCard({
  participant,
  currentUserId,
  currentBid,
  currentBidderId,
  isPassed,
}: AuctionBiddingOpponentCardProps) {
  const isSelf = participant.userId === currentUserId;
  const holdsHighest = currentBidderId === participant.userId;
  const isAwaitingBid = !holdsHighest && !isPassed && participant.squad.length < 11;

  return (
    <div
      className={`flex flex-col p-4 rounded-2xl border transition-all duration-200 ${
        holdsHighest
          ? "bg-gradient-to-br from-amber-500/25 via-amber-950/40 to-black/60 border-2 border-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/40"
          : isAwaitingBid
          ? "bg-emerald-950/40 border-emerald-500/60 shadow-md ring-1 ring-emerald-400/30"
          : isPassed
          ? "bg-black/30 border-white/5 opacity-75"
          : "bg-white/5 border-white/10 hover:border-white/20"
      }`}
    >
      {/* 1. SATIR: Avatar, Kullanıcı Adı, Bütçe ve Sayaç */}
      <div className="flex items-center justify-between gap-3">
        {/* Sol Taraf: Kullanıcı Bilgisi (Asla Ezilmez) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15 font-black text-sm text-white shadow-inner">
            {participant.username ? participant.username.charAt(0).toUpperCase() : "?"}
            {participant.isHost && (
              <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-black text-sm sm:text-base text-white truncate">
              {participant.username}
            </span>
            {isSelf && (
              <span className="text-[10px] text-emerald-400 font-mono font-black bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40 shrink-0">
                (Sen)
              </span>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Bütçe, Kadro Sayısı ve Durum İkonu */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 rounded-lg shadow-sm">
            ${participant.budget}M
          </span>

          <span className="text-xs font-mono font-bold text-zinc-300 bg-black/40 border border-white/10 px-2 py-1 rounded-lg">
            {participant.squad.length}/11
          </span>

          <div
            className={`flex size-7 items-center justify-center rounded-lg border ${
              holdsHighest
                ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                : isPassed
                ? "bg-red-950/60 text-red-400 border-red-500/40"
                : "bg-black/40 text-emerald-400 border-white/10"
            }`}
          >
            {holdsHighest ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : isPassed ? (
              <X className="w-4 h-4 stroke-[3]" />
            ) : (
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* 2. SATIR: Durum Rozeti (Lider Teklif / Sıra / Pas) */}
      {(holdsHighest || isAwaitingBid || isPassed) && (
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          {holdsHighest && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-black font-mono font-black text-xs shadow-[0_0_16px_rgba(251,191,36,0.6)] animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>LİDER TEKLİF: {currentBid}M $</span>
            </div>
          )}

          {isAwaitingBid && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 animate-pulse">
              <span>⚡ Sıra Onda — Teklif Bekleniyor</span>
            </div>
          )}

          {isPassed && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/40 border border-red-500/30 text-[11px] font-medium text-red-300">
              <span>Pas Geçti</span>
            </div>
          )}
        </div>
      )}

      {/* 3. SATIR: Katılımcının Kadrosundaki Futbolcular (Kompakt) */}
      <AuctionParticipantSquad squad={participant.squad} variant="compact" />
    </div>
  );
}
