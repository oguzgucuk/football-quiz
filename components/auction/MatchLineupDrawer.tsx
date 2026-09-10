"use client";

/**
 * Maç Diziliş Çekmecesi.
 * Simülasyon sırasında iki takımın 11 oyuncusunu formasyon grid'iyle gösterir.
 * Toggle butonuyla açılıp kapanır.
 */

import React, { useMemo, useState } from "react";
import { TeamLineup } from "@/lib/auction/auctionTypes";
import { ChevronDown, ChevronUp, LayoutList } from "lucide-react";

const POSITION_GROUPS = [
  { label: "FWD", positions: ["ST", "CF", "LW", "RW"] },
  { label: "MID", positions: ["CAM", "CM", "CDM", "LM", "RM"] },
  { label: "DEF", positions: ["CB", "LB", "RB", "LWB", "RWB"] },
  { label: "GK", positions: ["GK"] },
];

function ratingColor(rating: number): string {
  if (rating >= 88) return "text-amber-300 bg-amber-950/60 border-amber-500/40";
  if (rating >= 80) return "text-emerald-300 bg-emerald-950/50 border-emerald-500/30";
  if (rating >= 70) return "text-sky-300 bg-sky-950/50 border-sky-500/30";
  return "text-zinc-400 bg-zinc-900/50 border-zinc-600/30";
}

function TeamColumn({ name, lineup, isHighlighted }: { name: string; lineup?: TeamLineup; isHighlighted?: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <h3 className={`mb-2.5 truncate text-center text-xs font-black ${isHighlighted ? "text-emerald-300" : "text-white"}`}>
        {name}
        {lineup?.teamOvr ? (
          <span className="ml-1.5 font-mono text-[10px] text-zinc-400">OVR {lineup.teamOvr}</span>
        ) : null}
      </h3>
      <div className="space-y-1.5">
        {POSITION_GROUPS.map((group) => {
          const groupSlots = lineup?.slots.filter((slot) =>
            group.positions.includes(slot.targetPosition)
          ) ?? [];
          if (groupSlots.length === 0) return null;
          return (
            <div key={group.label} className="rounded-xl border border-white/8 bg-black/25 p-2">
              <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">{group.label}</p>
              <div className="space-y-1">
                {groupSlots.map((slot) => (
                  <div key={slot.slotId} className="flex items-center justify-between gap-1.5 text-[10px]">
                    <span className="truncate text-zinc-200 font-medium">
                      {slot.placedPlayer?.fullName || <span className="text-zinc-600 italic">Boş</span>}
                    </span>
                    <span className={`shrink-0 rounded border px-1 py-0.5 font-mono font-black text-[9px] ${ratingColor(slot.effectiveRating)}`}>
                      {slot.targetPosition} {slot.effectiveRating || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MatchLineupDrawerProps {
  homeName: string;
  homeLineup?: TeamLineup;
  awayName: string;
  awayLineup?: TeamLineup;
  /** Hangi userId'nin "kendi" takımı olduğunu belirtir — vurgulamak için */
  currentUserId?: string;
  homeUserId?: string;
}

export function MatchLineupDrawer({
  homeName,
  homeLineup,
  awayName,
  awayLineup,
  currentUserId,
  homeUserId,
}: MatchLineupDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canShow = useMemo(() => Boolean(homeLineup && awayLineup), [homeLineup, awayLineup]);
  if (!canShow) return null;

  const homeIsMe = currentUserId && homeUserId && currentUserId === homeUserId;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-white/10 hover:border-white/25 transition-all cursor-pointer"
        aria-expanded={isOpen}
        aria-label="Dizilişleri göster/gizle"
      >
        <LayoutList className="w-3.5 h-3.5 text-emerald-400" />
        📋 Dizilişler
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/70 p-3 shadow-xl backdrop-blur-xl animate-fadeIn">
          <TeamColumn name={homeName} lineup={homeLineup} isHighlighted={Boolean(homeIsMe)} />
          <TeamColumn name={awayName} lineup={awayLineup} isHighlighted={Boolean(!homeIsMe && currentUserId)} />
        </div>
      )}
    </div>
  );
}
