"use client";

/**
 * Maç sonu ekranında rakibin kazanma oranını (winrate),
 * galibiyet/mağlubiyet sayılarını ve toplam oyun geçmişini gösteren bileşen.
 */

import React, { useState, useEffect } from "react";
import { Trophy, TrendingUp, XCircle, Gamepad2, Loader2 } from "lucide-react";
import { isBotPlayer } from "@/lib/realtime/botSimulator";

interface OpponentStatsData {
  winRate: number;
  matchesWon: number;
  matchesLost: number;
  matchesDraw: number;
  totalMatches: number;
}

interface OpponentStatsCardProps {
  opponentUserId?: string;
  opponentUsername: string;
}

const DEFAULT_STATS: OpponentStatsData = {
  winRate: 0,
  matchesWon: 0,
  matchesLost: 0,
  matchesDraw: 0,
  totalMatches: 0,
};

export function OpponentStatsCard({
  opponentUserId,
  opponentUsername,
}: OpponentStatsCardProps) {
  const [stats, setStats] = useState<OpponentStatsData>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!opponentUserId) {
      setStats(DEFAULT_STATS);
      return;
    }

    if (isBotPlayer(opponentUserId)) {
      setStats({
        winRate: 54,
        matchesWon: 27,
        matchesLost: 23,
        matchesDraw: 2,
        totalMatches: 52,
      });
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/users/${opponentUserId}/stats`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.stats) {
          setStats({
            winRate: data.stats.winRate ?? 0,
            matchesWon: data.stats.matchesWon ?? 0,
            matchesLost: data.stats.matchesLost ?? 0,
            matchesDraw: data.stats.matchesDraw ?? 0,
            totalMatches: data.stats.totalMatches ?? 0,
          });
        } else {
          setStats(DEFAULT_STATS);
        }
      })
      .catch((err) => {
        console.error("[OpponentStatsCard] İstatistikler çekilemedi:", err);
        if (isMounted) setStats(DEFAULT_STATS);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [opponentUserId]);

  if (isLoading) {
    return (
      <div className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 my-2.5 flex items-center justify-center gap-2 text-zinc-400 text-xs py-4">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Rakip istatistikleri yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-2xl bg-black/45 border border-white/10 my-3 flex flex-col gap-2.5 backdrop-blur-md">
      {/* Üst Başlık & Kazanma Oranı Rozeti */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 truncate max-w-[170px]">
          <Gamepad2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{opponentUsername} Profili</span>
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full border bg-emerald-950/70 text-emerald-300 border-emerald-500/30">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>%{stats.winRate} Kazanma</span>
        </span>
      </div>

      {/* 3 Metrik Kutusu: Toplam Oyun, Galibiyet, Mağlubiyet */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="bg-white/5 rounded-xl p-2 border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider mb-0.5">
            Toplam Maç
          </span>
          <span className="text-base font-black text-white font-mono">
            {stats.totalMatches}
          </span>
        </div>

        <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-500/20 flex flex-col items-center justify-center">
          <span className="text-[10px] text-emerald-400 block uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
            <Trophy className="w-2.5 h-2.5" />
            Galibiyet
          </span>
          <span className="text-base font-black text-emerald-400 font-mono">
            {stats.matchesWon}
          </span>
        </div>

        <div className="bg-rose-950/40 rounded-xl p-2 border border-rose-500/20 flex flex-col items-center justify-center">
          <span className="text-[10px] text-rose-400 block uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" />
            Mağlubiyet
          </span>
          <span className="text-base font-black text-rose-400 font-mono">
            {stats.matchesLost}
          </span>
        </div>
      </div>
    </div>
  );
}
