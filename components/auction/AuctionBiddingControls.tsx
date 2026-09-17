"use client";

/**
 * Müzayede Teklif ve Pas Kontrol Butonları.
 * Hızlı teklif (+1M $, +2M $, +3M $), özel miktar girişi ve pas geçme aksiyonlarını yönetir.
 * Yeni oyuncuya geçildiğinde 1 saniyelik teklif tamponu (cooldown) uygulayarak
 * son saniye tekliflerinin sonraki oyuncuya aktarılmasını ve mükerrer tıklamaları engeller.
 */

import React, { useState } from "react";
import { Gavel, ShieldAlert, Hourglass } from "lucide-react";

interface AuctionBiddingControlsProps {
  currentBid: number;
  isSpectator: boolean;
  isGkBlocked: boolean;
  isSquadFull: boolean;
  hasPassed: boolean;
  isMyHighestBid: boolean;
  isCooldownActive: boolean;
  onQuickAdd: (delta: number) => void;
  onCustomSubmit: (amount: number) => void;
  onPass: () => void;
}

export function AuctionBiddingControls({
  currentBid,
  isSpectator,
  isGkBlocked,
  isSquadFull,
  hasPassed,
  isMyHighestBid,
  isCooldownActive,
  onQuickAdd,
  onCustomSubmit,
  onPass,
}: AuctionBiddingControlsProps) {
  const [customBid, setCustomBid] = useState<string>("");

  if (isSpectator) {
    return (
      <div className="rounded-2xl border border-sky-400/30 bg-sky-950/30 p-4 text-center text-sm font-bold text-sky-200">
        👁 Seyirci modundasınız; teklif veremezsiniz.
      </div>
    );
  }

  const isBiddingDisabled =
    isSquadFull || hasPassed || isMyHighestBid || isGkBlocked || isCooldownActive;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customBid, 10);
    if (!isNaN(num) && num > currentBid && !isBiddingDisabled) {
      onCustomSubmit(num);
      setCustomBid("");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 1 Saniyelik Geçiş Tamponu Bilgisi */}
      {isCooldownActive && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
          <Hourglass className="w-3.5 h-3.5 animate-spin" />
          <span>Yeni oyuncu vitrinde • Teklifler 1 sn içinde açılıyor</span>
        </div>
      )}

      {/* Kaleci Limiti Uyarısı */}
      {isGkBlocked && !isCooldownActive && (
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold text-xs shadow-md">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Maksimum 2 Kaleci: Kadronuzda zaten 2 kaleci bulunuyor.</span>
        </div>
      )}

      {/* Hızlı Teklif ve Özel Teklif Butonları */}
      <div className="grid grid-cols-4 gap-2.5">
        {[1, 2, 3].map((delta) => (
          <button
            key={delta}
            type="button"
            disabled={isBiddingDisabled}
            onClick={() => onQuickAdd(delta)}
            className="py-3.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-white font-mono font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            +{delta}M $
          </button>
        ))}

        <input
          type="number"
          min={currentBid + 1}
          placeholder="... M $"
          disabled={isBiddingDisabled}
          value={customBid}
          onChange={(e) => setCustomBid(e.target.value)}
          className="w-full text-center rounded-xl bg-black/40 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500 disabled:opacity-40"
        />
      </div>

      {/* Teklif Ver & Pas Geç Butonları */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          disabled={isBiddingDisabled || !customBid}
          onClick={handleSubmit}
          className="py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-98"
        >
          <Gavel className="w-4 h-4" />
          Teklif Ver
        </button>

        <button
          type="button"
          disabled={isSquadFull || hasPassed || isMyHighestBid || isCooldownActive}
          onClick={onPass}
          className="py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 font-black text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        >
          Pas Geç
        </button>
      </div>
    </div>
  );
}
