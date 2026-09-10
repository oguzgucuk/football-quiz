"use client";

import React, { useState } from "react";
import { AuctionParticipant } from "@/lib/auction/auctionTypes";
import { AuctionParticipantSquad } from "./AuctionParticipantSquad";

export function MySquadDrawer({ participant }: { participant?: AuctionParticipant }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!participant) return null;

  return (
    <aside className="lg:col-span-3">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="mb-3 w-full rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-emerald-200 lg:hidden"
      >
        ☰ Kadrom ({participant.squad.length}/11)
      </button>
      <div className={`${isOpen ? "block" : "hidden"} lg:block rounded-3xl border border-emerald-500/25 bg-black/55 p-4 shadow-2xl backdrop-blur-2xl`}>
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Kadrom</p>
            <p className="mt-1 text-sm font-bold text-white">{participant.username}</p>
          </div>
          <div className="text-right font-mono">
            <p className="text-sm font-black text-amber-400">${participant.budget}M</p>
            <p className="text-[10px] text-zinc-500">{participant.squad.length}/11 oyuncu</p>
          </div>
        </div>
        <AuctionParticipantSquad squad={participant.squad} />
      </div>
    </aside>
  );
}
