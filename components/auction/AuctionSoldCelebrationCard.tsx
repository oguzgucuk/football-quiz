"use client";

/**
 * Müzayede Satış Kutlama Kartı (Hallmark Tasarım Standartları).
 * Bir oyuncu satıldığında teklif butonları ve vitrinin yerine 2 saniye boyunca
 * merkezde beliren, transferin kime kaç dolara gittiğini duyuran geçiş kartı.
 */

import React from "react";
import { AuctionSoldEvent } from "@/lib/auction/auctionTypes";
import { Gavel, CheckCircle2, ArrowRight, Sparkles, Clock } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

interface AuctionSoldCelebrationCardProps {
  soldEvent: AuctionSoldEvent;
  secondsLeft: number;
}

export function AuctionSoldCelebrationCard({
  soldEvent,
  secondsLeft,
}: AuctionSoldCelebrationCardProps) {
  const cardTier = getRatingTier(soldEvent.overall);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-950/40 via-black/80 to-black/90 border-2 border-amber-400/60 shadow-[0_0_40px_rgba(245,158,11,0.25)] backdrop-blur-2xl animate-scaleIn select-none min-h-[380px]"
    >
      {/* Ambiyans ışık efekti */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 size-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      {/* Üst Vurgu Rozeti */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-black uppercase tracking-widest shadow-md mb-4 animate-bounce">
        <Gavel className="w-4 h-4 text-amber-400" />
        <span>Transfer Gerçekleşti!</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
      </div>

      {/* Futbolcu Detayı */}
      <div className="flex items-center gap-3.5 mb-5 text-center">
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${cardTier.badgeClass} font-mono text-2xl font-black shadow-lg`}
        >
          {soldEvent.overall}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
            {soldEvent.playerName}
          </span>
          <span className="text-xs text-zinc-400 font-medium mt-1">
            Müzayede Satışı Tamamlandı
          </span>
        </div>
      </div>

      {/* Kazanan ve Satış Bedeli Kutusu */}
      <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md mb-5 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
              Yeni Sahibi
            </span>
            <span className="text-base font-black text-white truncate">
              {soldEvent.buyerUsername}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 pl-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400">
            Bonservis Bedeli
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-yellow-400">
            ${soldEvent.amount}M
          </span>
        </div>
      </div>

      {/* 2 Saniyelik Geçiş Bildirimi ve Geri Sayım */}
      <div className="w-full flex flex-col gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Sıradaki oyuncu açılıyor ({Math.max(1, secondsLeft)} sn)...</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${Math.min(100, (secondsLeft / 2) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
