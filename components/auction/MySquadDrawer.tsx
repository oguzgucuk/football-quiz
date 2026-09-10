"use client";

import React from "react";
import { AuctionParticipant } from "@/lib/auction/auctionTypes";
import { AuctionParticipantSquad } from "./AuctionParticipantSquad";

interface MySquadDrawerProps {
  participant?: AuctionParticipant;
  isMyHighestBid?: boolean;
}

export function MySquadDrawer({ participant, isMyHighestBid = false }: MySquadDrawerProps) {
  if (!participant) return null;

  const avgRating =
    participant.squad.length > 0
      ? Math.round(
          participant.squad.reduce((sum, p) => sum + p.overallPrime, 0) /
            participant.squad.length
        )
      : null;

  return (
    <aside className="lg:col-span-3 lg:sticky lg:top-4 z-10 flex flex-col">
      <div
        className={`rounded-3xl border-2 transition-all duration-300 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl ${
          isMyHighestBid
            ? "border-amber-400 bg-gradient-to-b from-amber-500/20 via-amber-950/35 to-black/80 shadow-[0_0_35px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/50"
            : "border-emerald-500/25 bg-black/60"
        }`}
      >
        {isMyHighestBid && (
          <div className="mb-3.5 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-400 text-black font-mono font-black text-xs shadow-[0_0_16px_rgba(251,191,36,0.7)] animate-pulse">
            <span>👑 EN YÜKSEK TEKLİF SENDE!</span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <p
                className={`text-sm font-black uppercase tracking-widest ${
                  isMyHighestBid ? "text-amber-300" : "text-emerald-400"
                }`}
              >
                KADROM
              </p>
              {avgRating && (
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 shadow-sm">
                  Ort. {avgRating}
                </span>
              )}
            </div>
            <p className="mt-1 text-base sm:text-lg font-black text-white">{participant.username}</p>
          </div>
          <div className="text-right font-mono">
            <p className="text-xl sm:text-2xl font-black text-amber-400">${participant.budget}M</p>
            <p className="text-xs sm:text-sm text-zinc-300 font-bold">{participant.squad.length}/11 Oyuncu</p>
          </div>
        </div>
        <AuctionParticipantSquad squad={participant.squad} variant="large" />
      </div>
    </aside>
  );
}
