"use client";

/**
 * Maç sonuçlandığında (5 tur tamamlandığında veya hükmen bitişte)
 * nihai skorları ve sonucu gösteren ekran bileşeni.
 */

import React from "react";
import Link from "next/link";
import { Trophy, LogOut, Zap, Swords, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RoomState } from "@/lib/realtime/roomState";
import { StadiumBackground } from "@/components/ui/StadiumBackground";
import { clearStoredSessionToken } from "@/hooks/useRoomSession";
import { MatchEloResult } from "@/hooks/useGameRoomSocket";

interface MatchFinishedViewProps {
  roomState: RoomState;
  currentUserId: string;
  username: string;
  matchEloResult?: MatchEloResult | null;
}

export function MatchFinishedView({
  roomState,
  currentUserId,
  username,
  matchEloResult,
}: MatchFinishedViewProps) {
  const isPlayer1 = roomState.player1?.userId === currentUserId;
  const myPlayer = isPlayer1 ? roomState.player1 : roomState.player2;
  const opponentPlayer = isPlayer1 ? roomState.player2 : roomState.player1;

  const myScore = myPlayer?.score ?? 0;
  const opponentScore = opponentPlayer?.score ?? 0;
  const opponentUsername = opponentPlayer?.username || "Rakip";

  const isWinner = myScore > opponentScore;
  const isDraw = myScore === opponentScore;
  const isForfeit = Boolean(roomState.forfeitInfo);
  const isForfeitWinner = roomState.forfeitInfo?.winnerUserId === currentUserId;
  const isCasual = Boolean(roomState.roomId?.includes("_casual_"));
  const isUserWinner = isForfeit ? isForfeitWinner : isWinner;

  const resultTitle = isForfeit
    ? isForfeitWinner
      ? "Hükmen Kazandın!"
      : "Hükmen Mağlup!"
    : isDraw
    ? "Maç Berabere Bitti!"
    : isWinner
    ? "Tebrikler, Kazandın!"
    : "Maçı Kaybettin!";

  const resultDescription = isForfeit
    ? isForfeitWinner
      ? "Rakip bağlantıyı kesti ve 10 saniye içinde dönmediği için maç sonuçlandı."
      : "Bağlantı koptuğu ve 10 saniye içinde dönülmediği için maç sonuçlandı."
    : isCasual
    ? "Hızlı Maç tamamlandı. Skorlar maç geçmişine kaydedildi."
    : isDraw
    ? "Büyük mücadele berabere sonuçlandı!"
    : isWinner
    ? "Harika bir performans sergileyerek galibiyete ulaştın!"
    : "Bu sefer olmadı, bir sonraki maçta telafi edebilirsin!";

  const userEloChange = matchEloResult
    ? isPlayer1
      ? matchEloResult.p1EloChange
      : matchEloResult.p2EloChange
    : null;
  const userNewElo = matchEloResult
    ? isPlayer1
      ? matchEloResult.p1NewElo
      : matchEloResult.p2NewElo
    : null;

  const handleFinishMatch = () => {
    if (roomState.roomId) {
      clearStoredSessionToken(roomState.roomId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1611] text-zinc-100 items-center justify-center p-4 relative overflow-hidden">
      <StadiumBackground variant="dark" />
      <Card variant="glass" className="max-w-md w-full text-center p-8 flex flex-col items-center relative z-10 border-white/15 bg-[#0c1612]/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)]">
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
            isUserWinner
              ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-amber-500/10"
              : isDraw
              ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-cyan-500/10"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-rose-500/10"
          }`}
        >
          {isUserWinner ? (
            <Trophy className="w-10 h-10" />
          ) : isDraw ? (
            <Swords className="w-10 h-10" />
          ) : (
            <ShieldAlert className="w-10 h-10" />
          )}
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          {resultTitle}
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          {resultDescription}
        </p>

        <div className="flex items-center justify-center gap-6 my-4 p-4 rounded-2xl bg-black/40 border border-white/10 w-full">
          <div className="text-center min-w-[90px]">
            <span className="text-xs text-zinc-400 font-bold block truncate max-w-[130px]">{username}</span>
            <span
              className={`text-3xl font-black ${
                myScore > opponentScore
                  ? "text-emerald-400"
                  : myScore < opponentScore
                  ? "text-rose-400"
                  : "text-amber-400"
              }`}
            >
              {myScore}
            </span>
          </div>
          <span className="text-xl font-bold text-zinc-600">-</span>
          <div className="text-center min-w-[90px]">
            <span className="text-xs text-zinc-400 font-bold block truncate max-w-[130px]">{opponentUsername}</span>
            <span
              className={`text-3xl font-black ${
                opponentScore > myScore
                  ? "text-emerald-400"
                  : opponentScore < myScore
                  ? "text-rose-400"
                  : "text-cyan-400"
              }`}
            >
              {opponentScore}
            </span>
          </div>
        </div>

        {isCasual ? (
          <div className="my-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-3.5 py-1.5 rounded-xl border bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-xs shadow-cyan-500/10">
              <Zap className="w-3.5 h-3.5" />
              <span>Hızlı Maç • ELO Değişimi Yok</span>
            </span>
          </div>
        ) : userEloChange !== null && (
          <div className="my-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-black px-3.5 py-1.5 rounded-xl border ${
                userEloChange > 0
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-xs shadow-emerald-500/10"
                  : userEloChange < 0
                  ? "bg-rose-950/80 text-rose-400 border-rose-500/40 shadow-xs shadow-rose-500/10"
                  : "bg-white/10 text-zinc-300 border-white/10"
              }`}
            >
              <span>{userEloChange > 0 ? `+${userEloChange}` : userEloChange} ELO</span>
              {userNewElo && (
                <span className="text-zinc-400 font-normal">
                  • Yeni Derece: {userNewElo}
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full mt-6">
          <Link href="/?tab=play" onClick={handleFinishMatch} className="w-full">
            <Button
              size="lg"
              className="w-full bg-gradient-to-b from-[#168841] to-[#126d34] hover:from-[#15803d] hover:to-[#0f5c2b] text-white font-extrabold shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Maçı Bitir
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
