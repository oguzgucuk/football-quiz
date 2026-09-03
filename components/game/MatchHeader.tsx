"use client";

import React from "react";
import { User, Trophy, Shield } from "lucide-react";
import { RoomPlayer } from "@/lib/realtime/roomState";
import { Badge } from "@/components/ui/Badge";

interface MatchHeaderProps {
  currentRound: number;
  maxRounds: number;
  player1: RoomPlayer | null;
  player2: RoomPlayer | null;
  currentUserId?: string;
}

export function MatchHeader({
  currentRound,
  maxRounds,
  player1,
  player2,
  currentUserId,
}: MatchHeaderProps) {
  return (
    <header className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 py-3 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Oyuncu 1 (Sol) */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${player1?.userId === currentUserId
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-300"
              }`}
          >
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base text-zinc-100 line-clamp-1">
                {player1?.username || "Oyuncu 1"}
              </span>
              {player1?.userId === currentUserId && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  SEN
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-zinc-200">{player1?.score ?? 0}</span> puan
            </div>
          </div>
        </div>

        {/* Orta: Tur Bilgisi & Skor */}
        <div className="flex flex-col items-center">
          <Badge variant="brand" className="mb-1 text-[11px] font-bold">
            TUR {currentRound} / {maxRounds}
          </Badge>
          <div className="flex items-center gap-3 font-mono font-black text-xl sm:text-2xl text-white">
            <span className="text-emerald-400">{player1?.score ?? 0}</span>
            <span className="text-zinc-600">-</span>
            <span className="text-cyan-400">{player2?.score ?? 0}</span>
          </div>
        </div>

        {/* Oyuncu 2 (Sağ) */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="flex items-center justify-end gap-1.5">
              {player2?.userId === currentUserId && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                  SEN
                </span>
              )}
              <span className="font-bold text-sm sm:text-base text-zinc-100 line-clamp-1">
                {player2?.username || "Rakip Bekleniyor..."}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">{player2?.score ?? 0}</span> puan
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${player2?.userId === currentUserId
                ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-300"
              }`}
          >
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
