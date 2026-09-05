"use client";

import React from "react";
import { Swords, RotateCcw, Bot, Check, Minus, X, Zap, Trophy } from "lucide-react";

export interface RecentMatchItem {
  matchId: string;
  opponentId: string;
  opponentUsername: string;
  isBot: boolean;
  mode?: string;
  ranked?: boolean;
  playerScore: number;
  opponentScore: number;
  isWin: boolean;
  isDraw: boolean;
  eloChange: number;
  playedAt: string | Date;
}

function formatMatchDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

  if (diffMinutes < 3) return "Az önce";
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  if (diffHours < 24 && now.getDate() === d.getDate()) {
    return `Bugün ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ProfileMatchHistoryProps {
  matchHistory: RecentMatchItem[];
  isHistoryLoading: boolean;
  onGoToPlay?: () => void;
}

export function ProfileMatchHistory({
  matchHistory,
  isHistoryLoading,
  onGoToPlay,
}: ProfileMatchHistoryProps) {
  return (
    <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-lg text-white">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Swords className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Karşılaşma Geçmişi</h3>
            <p className="text-[11px] text-zinc-400 font-medium">
              Geçmiş rakipler, skorlar ve kazanılan/kaybedilen ELO puanları
            </p>
          </div>
        </div>
        {matchHistory.length > 0 && (
          <span className="text-xs font-mono font-bold bg-emerald-950/70 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30">
            Son {matchHistory.length} Maç
          </span>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
        {isHistoryLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
            <RotateCcw className="size-6 animate-spin text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-400">Maç geçmişi yükleniyor...</span>
          </div>
        ) : matchHistory.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/35">
            <Swords className="size-10 text-emerald-500/40 mb-3" />
            <p className="text-sm font-bold text-white">Henüz oynanmış bir maçın bulunmuyor</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Dereceli veya botlarla maç yaparak karşılaşma geçmişini ve ELO değişimlerini burada görebilirsin.
            </p>
            {onGoToPlay && (
              <button
                onClick={onGoToPlay}
                className="mt-4 px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Hemen Maça Başla
              </button>
            )}
          </div>
        ) : (
          matchHistory.map((match) => {
            const eloPositive = match.eloChange > 0;
            const eloNegative = match.eloChange < 0;

            return (
              <div
                key={match.matchId}
                className="p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/35 border-white/10 hover:border-emerald-500/40"
              >
                {/* Rakip Bilgisi */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        match.isBot
                          ? "bg-purple-950/70 text-purple-300 border border-purple-500/30"
                          : "bg-white/10 text-emerald-400 border border-white/10"
                      }`}
                    >
                      {match.isBot ? (
                        <Bot className="size-5" />
                      ) : (
                        match.opponentUsername.substring(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-white truncate">
                        {match.opponentUsername}
                      </span>
                      {match.isBot && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30">
                          BOT
                        </span>
                      )}
                      {match.mode === "casual" || match.ranked === false ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                          <Zap className="size-2.5" />
                          Hızlı Maç
                        </span>
                      ) : match.mode === "custom" ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30">
                          Özel Oyun
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                          <Trophy className="size-2.5" />
                          Dereceli
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
                      {formatMatchDate(match.playedAt)}
                    </span>
                  </div>
                </div>

                {/* Skor & Sonuç & ELO Değişimi */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                  <div className="flex items-center gap-1.5 font-mono font-black text-base text-white bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                    <span>{match.playerScore}</span>
                    <span className="text-zinc-500">-</span>
                    <span>{match.opponentScore}</span>
                  </div>

                  {match.isWin ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                      <Check className="size-3 stroke-[3]" />
                      <span>Galibiyet</span>
                    </span>
                  ) : match.isDraw ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-white/10 text-zinc-300 border border-white/10">
                      <Minus className="size-3 stroke-[3]" />
                      <span>Beraberlik</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-500/30">
                      <X className="size-3 stroke-[3]" />
                      <span>Mağlubiyet</span>
                    </span>
                  )}

                  <div className="min-w-[76px] text-right font-mono font-black text-sm">
                    {match.mode === "casual" || match.ranked === false ? (
                      <span className="inline-block text-zinc-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 text-[11px] font-bold">
                        Dostluk
                      </span>
                    ) : eloPositive ? (
                      <span className="inline-block text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-2xs">
                        +{match.eloChange} ELO
                      </span>
                    ) : eloNegative ? (
                      <span className="inline-block text-rose-400 bg-rose-950/70 px-2.5 py-1 rounded-xl border border-rose-500/30 shadow-2xs">
                        {match.eloChange} ELO
                      </span>
                    ) : (
                      <span className="inline-block text-zinc-400 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                        0 ELO
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
