"use client";

import React, { useState } from "react";
import { AuctionParticipant } from "@/lib/auction/auctionTypes";
import { AuctionParticipantSquad } from "./AuctionParticipantSquad";

export function MySquadDrawer({ participant }: { participant?: AuctionParticipant }) {
  const [isOpen, setIsOpen] = useState(false);
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
      <div className="rounded-3xl border border-emerald-500/25 bg-black/55 p-5 shadow-2xl backdrop-blur-2xl max-h-[calc(100vh-210px)] min-h-[580px] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Kadrom</p>
              {avgRating && (
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  Ort. {avgRating}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-bold text-white">{participant.username}</p>
          </div>
          <div className="text-right font-mono">
            <p className="text-base font-black text-amber-400">${participant.budget}M</p>
            <p className="text-xs text-zinc-400 font-bold">{participant.squad.length}/11 Oyuncu</p>
          </div>
        </div>
        <AuctionParticipantSquad squad={participant.squad} />
      </div>
    </aside>
  );
}
