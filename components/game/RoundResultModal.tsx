"use client";

import React from "react";
import { Trophy, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface RoundResultModalProps {
  roundNumber: number;
  winnerUsername?: string | null;
  correctAnswer?: string | null;
  isDraw?: boolean;
}

export function RoundResultModal({
  roundNumber,
  winnerUsername,
  correctAnswer,
  isDraw = false,
}: RoundResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center flex flex-col items-center">
        <Badge variant={isDraw ? "warning" : "brand"} className="mb-4">
          TUR {roundNumber} TAMAMLANDI
        </Badge>

        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight mb-2">
          {isDraw ? "Süre Doldu (Berabere)" : `${winnerUsername} Kazandı!`}
        </h3>

        {correctAnswer && (
          <div className="my-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 w-full">
            <span className="text-xs text-zinc-500 font-semibold block mb-1">
              DOĞRU CEVAP
            </span>
            <span className="text-lg font-bold text-emerald-400">
              {correctAnswer}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>Sonraki tur 3 saniye içinde başlıyor...</span>
        </div>
      </div>
    </div>
  );
}
