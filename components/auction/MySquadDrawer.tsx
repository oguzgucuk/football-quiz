"use client";

import React, { useState } from "react";
import { AuctionParticipant } from "@/lib/auction/auctionTypes";
import { AuctionParticipantSquad } from "./AuctionParticipantSquad";

export function MySquadDrawer({ participant }: { participant?: AuctionParticipant }) {
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
      <div className="rounded-3xl border border-emerald-500/25 bg-black/60 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-black uppercase tracking-widest text-emerald-400">KADROM</p>
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
