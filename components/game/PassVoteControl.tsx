"use client";

/**
 * Tur sırasında oyuncuların karşılıklı pas oylaması yapmasını sağlayan,
 * oy durumunu ve çağrıyı gösteren buton/bildirim bileşeni.
 */

import React from "react";
import { FastForward } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PassVoteControlProps {
  hasVotedPass: boolean;
  opponentWantsPass: boolean;
  passVotesCount: number;
  isSubmitting: boolean;
  onVotePass: () => void;
}

export function PassVoteControl({
  hasVotedPass,
  opponentWantsPass,
  passVotesCount,
  isSubmitting,
  onVotePass,
}: PassVoteControlProps) {
  return (
    <div className="flex items-center justify-center pt-1">
      {hasVotedPass ? (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse shadow-sm shadow-amber-500/10">
          <FastForward className="w-3.5 h-3.5" />
          <span>Pas İsteğin İletildi ({passVotesCount}/2) • Rakibin onayı bekleniyor...</span>
        </div>
      ) : opponentWantsPass ? (
        <Button
          size="sm"
          variant="primary"
          onClick={onVotePass}
          disabled={isSubmitting}
          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg shadow-amber-500/25 animate-bounce flex items-center gap-1.5"
        >
          <FastForward className="w-4 h-4" />
          Rakip Pas İstiyor! Turu Geçmek İçin Tıkla (1/2)
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={onVotePass}
          disabled={isSubmitting}
          className="text-xs text-zinc-300 hover:text-white border-white/10 bg-[#0c1612]/60 hover:bg-white/10 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-md"
        >
          <FastForward className="w-3.5 h-3.5 text-zinc-400" />
          <span>Pas Geç (İki taraf da onaylarsa tur atlanır)</span>
        </Button>
      )}
    </div>
  );
}
