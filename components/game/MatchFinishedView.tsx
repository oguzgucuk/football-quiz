"use client";

/**
 * Maç sonuçlandığında (5 tur tamamlandığında veya hükmen bitişte)
 * nihai skorları ve sonucu gösteren ekran bileşeni.
 */

import React from "react";
import Link from "next/link";
import { Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RoomState } from "@/lib/realtime/roomState";
import { StadiumBackground } from "@/components/ui/StadiumBackground";

interface MatchFinishedViewProps {
  roomState: RoomState;
  currentUserId: string;
  username: string;
}

export function MatchFinishedView({ roomState, currentUserId, username }: MatchFinishedViewProps) {
  const p1Score = roomState.player1?.score ?? 0;
  const p2Score = roomState.player2?.score ?? 0;
  const isWinner = p1Score > p2Score;
  const isDraw = p1Score === p2Score;
  const isForfeit = Boolean(roomState.forfeitInfo);
  const isForfeitWinner = roomState.forfeitInfo?.winnerUserId === currentUserId;

  const resultTitle = isForfeit
    ? isForfeitWinner
      ? "Hükmen Kazandın! 🏆"
      : "Hükmen Mağlup!"
    : isDraw
    ? "Maç Berabere Bitti!"
    : isWinner
    ? "Tebrikler, Kazandın! 🎉"
    : "Maçı Kaybettin!";

  const resultDescription = isForfeit
    ? isForfeitWinner
      ? "Rakip bağlantıyı kesti ve 10 saniye içinde dönmediği için maç sonuçlandı."
      : "Bağlantı koptuğu ve 10 saniye içinde dönülmediği için maç sonuçlandı."
    : "5 tur sonunda nihai skor tablosu";

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] text-zinc-100 items-center justify-center p-4 relative overflow-hidden">
      <StadiumBackground variant="dark" />
      <Card variant="glass" className="max-w-md w-full text-center p-8 flex flex-col items-center relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-500/10">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          {resultTitle}
        </h2>
        <p className="text-zinc-400 text-sm mb-6">
          {resultDescription}
        </p>

        <div className="flex items-center justify-center gap-6 my-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 w-full">
          <div className="text-center">
            <span className="text-xs text-zinc-500 font-bold block">{username}</span>
            <span className="text-3xl font-black text-emerald-400">{p1Score}</span>
          </div>
          <span className="text-xl font-bold text-zinc-600">-</span>
          <div className="text-center">
            <span className="text-xs text-zinc-500 font-bold block">Rakip</span>
            <span className="text-3xl font-black text-cyan-400">{p2Score}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full mt-6">
          <Link href="/" className="w-full">
            <Button size="lg" className="w-full">
              <RotateCcw className="w-4 h-4" />
              Yeniden Oyna
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
