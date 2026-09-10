"use client";

/**
 * Müzayede Lobi Oyuncusunun Kadrosunu Mevkilere Göre (KL, DEF, ORT, FOR)
 * Ayrılmış ve Boş Kalan Mevkileri Gösteren Bileşen.
 * Oyuncunun üstüne tıklayınca oynayabildiği pozisyonlar modalı açılır.
 */

import React from "react";
import { AuctionPlayerCard } from "@/lib/auction/auctionTypes";
import { AuctionPlayerMiniCard } from "./AuctionPlayerMiniCard";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

interface AuctionParticipantSquadProps {
  squad: AuctionPlayerCard[];
}

interface PositionGroup {
  key: string;
  label: string;
  fullLabel: string;
  players: AuctionPlayerCard[];
  accentBadge: string;
  emptyBadge: string;
  isGoalkeeper: boolean;
}

function formatPlayerDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

export function AuctionParticipantSquad({ squad }: AuctionParticipantSquadProps) {
  const gk: AuctionPlayerCard[] = [];
  const def: AuctionPlayerCard[] = [];
  const mid: AuctionPlayerCard[] = [];
  const fwd: AuctionPlayerCard[] = [];

  for (const player of squad) {
    const positions = (player.positions?.length > 0 ? player.positions : [player.primaryPosition || "CM"]).map(
      (p) => p.toUpperCase()
    );
    if (positions.includes("GK") || positions.some((p) => p === "KL" || p.includes("GOALKEEPER"))) {
      gk.push(player);
    } else if (positions.some((p) => ["CB", "LB", "RB", "LWB", "RWB", "DEF"].includes(p))) {
      def.push(player);
    } else if (positions.some((p) => ["CDM", "CM", "CAM", "LM", "RM", "MID"].includes(p))) {
      mid.push(player);
    } else {
      fwd.push(player);
    }
  }

  const groups: PositionGroup[] = [
    {
      key: "gk",
      label: "KL",
      fullLabel: "Kaleci",
      players: gk,
      accentBadge: "text-amber-300 bg-amber-950/60 border-amber-500/40",
      emptyBadge: "text-red-400 bg-red-950/40 border-red-500/40 border-dashed animate-pulse",
      isGoalkeeper: true,
    },
    {
      key: "def",
      label: "DEF",
      fullLabel: "Defans",
      players: def,
      accentBadge: "text-blue-300 bg-blue-950/60 border-blue-500/40",
      emptyBadge: "text-zinc-500 bg-zinc-900/50 border-zinc-700/50 border-dashed",
      isGoalkeeper: false,
    },
    {
      key: "mid",
      label: "ORT",
      fullLabel: "Orta Saha",
      players: mid,
      accentBadge: "text-emerald-300 bg-emerald-950/60 border-emerald-500/40",
      emptyBadge: "text-zinc-500 bg-zinc-900/50 border-zinc-700/50 border-dashed",
      isGoalkeeper: false,
    },
    {
      key: "fwd",
      label: "FOR",
      fullLabel: "Forvet",
      players: fwd,
      accentBadge: "text-rose-300 bg-rose-950/60 border-rose-500/40",
      emptyBadge: "text-zinc-500 bg-zinc-900/50 border-zinc-700/50 border-dashed",
      isGoalkeeper: false,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2 mt-3 pt-2.5 border-t border-white/10">
        {groups.map((grp) => (
          <div key={grp.key} className="flex items-center gap-2 text-xs min-w-0">
            <div className="flex items-center gap-1.5 w-14 shrink-0">
              <span className="font-mono font-black text-[11px] text-zinc-400">
                {grp.label}
              </span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-black ${
                  grp.players.length > 0
                    ? "bg-white/10 text-white"
                    : grp.isGoalkeeper
                    ? "bg-red-500/20 text-red-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {grp.players.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {grp.players.length > 0 ? (
                grp.players.map((player, idx) => (
                  <AuctionPlayerMiniCard key={`${player.id}_${idx}`} player={player}>
                    <button
                      type="button"
                      title={`${player.fullName} — Pozisyonları görmek için tıklayın`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${grp.accentBadge} cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm`}
                    >
                      {(() => {
                        const pTier = getRatingTier(player.overallPrime);
                        return (
                          <span className={`font-mono font-black ${pTier.accentText}`}>
                            {player.overallPrime}
                          </span>
                        );
                      })()}
                      <span className="truncate max-w-[180px] font-semibold text-zinc-100">
                        {formatPlayerDisplayName(player.fullName)}
                      </span>
                    </button>
                  </AuctionPlayerMiniCard>
                ))
              ) : (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono ${grp.emptyBadge}`}
                >
                  {grp.isGoalkeeper ? "⚠️ Kaleci Yok" : "Boş (0)"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
