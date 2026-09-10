"use client";

/**
 * Müzayede Canlı Teklif Ekranı.
 * Kullanıcının çizdiği 2. taslağa tam sadık kalınarak:
 * - Sol taraf: Futbolcu vitrin kartı, "Mevcut Teklif [ X M $ ]", [+1M $] [+2M $] [+3M $] ve "Teklif Ver"
 * - Sağ taraf: Oyuncular listesi ([Oyuncu 1 ✓], [Oyuncu 2], [Oyuncu 3 ✓]), bütçe ve kadro sayaçları
 */

import React, { useState } from "react";
import { AuctionRoomState } from "@/lib/auction/auctionTypes";
import { Timer, ShieldAlert, Gavel, Gem } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import { AuctionSoldNotification } from "./AuctionSoldNotification";
import { MySquadDrawer } from "./MySquadDrawer";
import { AuctionBiddingOpponentCard } from "./AuctionBiddingOpponentCard";

interface AuctionBiddingStageProps {
  state: AuctionRoomState;
  currentUserId: string;
  errorMessage: string | null;
  onPlaceBid: (amount: number) => void;
  onPass: () => void;
  isSpectator?: boolean;
}

export function AuctionBiddingStage({
  state,
  currentUserId,
  errorMessage,
  onPlaceBid,
  onPass,
  isSpectator = false,
}: AuctionBiddingStageProps) {
  const card = state.currentCard;
  const currentBid = state.currentHighestBid?.amount || 0;
  const currentBidderId = state.currentHighestBid?.bidderUserId;
  const myParticipant = state.participants[currentUserId];

  // Havuzda kalan (henüz açık artırmaya çıkmamış) elmas oyuncu sayısı
  const remainingPool = state.pool.slice(state.currentCardIndex);
  const remainingDiamondCount = remainingPool.filter(
    (p) => getRatingTier(p.overallPrime).tier === "diamond"
  ).length;

  const [customBid, setCustomBid] = useState<string>("");
  const isMyHighestBid = currentBidderId === currentUserId;
  const hasPassed = state.passedUserIds.includes(currentUserId);
  const isSquadFull = (myParticipant?.squad.length || 0) >= 11;

  const handleQuickAdd = (delta: number) => {
    const target = currentBid + delta;
    onPlaceBid(target);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customBid, 10);
    if (!isNaN(num) && num > currentBid) {
      onPlaceBid(num);
      setCustomBid("");
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-5 select-none animate-fadeIn">
      {/* 2 Saniyelik Oyuncu Satıldı Bildirimi */}
      <AuctionSoldNotification soldEvent={state.lastSoldEvent} />

      {/* Üst Bilgi Çubuğu & Sayaç */}
      <div className="flex items-center justify-between p-3 px-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            Açık Artırma Turu: {state.currentCardIndex + 1} / {state.pool.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-xl font-mono font-black text-amber-400">
            {String(Math.floor(state.secondsLeft / 60)).padStart(2, "0")}:{String(state.secondsLeft % 60).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Hata Bildirimi */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold animate-shake">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ANA PANEL: SOL (VİTRİN & TEKLİFLER) VS SAĞ (OYUNCULAR LİSTESİ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {!isSpectator && <MySquadDrawer participant={myParticipant} />}
        {/* SOL BÖLGE (Çizimdeki Sol Vitrin) */}
        <div className={`${isSpectator ? "lg:col-span-7" : "lg:col-span-5"} flex flex-col gap-4 p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-2xl shadow-2xl`}>

          {/* Elmas Oyuncu Havuz Uyarısı */}
          {remainingDiamondCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_18px_rgba(56,189,248,0.2)] animate-pulse-slow">
              <Gem className="w-5 h-5 text-cyan-300 shrink-0" />
              <span className="text-sm font-black text-cyan-200 tracking-wide">
                {remainingDiamondCount} Elmas Oyuncu Havuzda !!
              </span>
            </div>
          )}

          {/* Futbolcu Kartı */}
          {card ? (() => {
            const cardTier = getRatingTier(card.overallPrime);
            return (
              <div
                className={`relative overflow-hidden flex items-center gap-5 p-5 sm:p-6 rounded-3xl bg-gradient-to-r ${cardTier.glowGradient} border-2 ${cardTier.cardBorder} shadow-2xl transition-all duration-300`}
              >
                {/* Ambiyans ışığı */}
                <div
                  className={`absolute -right-8 -top-8 size-44 rounded-full blur-3xl pointer-events-none opacity-40 ${cardTier.ambientBlur}`}
                />

                {/* Reyting Rozeti */}
                <div
                  className={`relative flex size-20 sm:size-22 shrink-0 items-center justify-center rounded-2xl ${cardTier.badgeClass} font-mono text-3xl sm:text-4xl font-black z-10 shadow-lg`}
                >
                  {card.overallPrime}
                  {cardTier.tier === "diamond" && (
                    <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-md">
                      <Gem className="size-3.5" />
                    </span>
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1 z-10">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {card.fullName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${cardTier.pillClass}`}
                    >
                      {cardTier.tierName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {card.positions.map((pos) => (
                      <span
                        key={pos}
                        className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white font-mono shadow-sm"
                      >
                        {pos}
                      </span>
                    ))}
                    {card.nationality && (
                      <span className="text-xs sm:text-sm text-zinc-300 font-medium">
                        • {card.nationality}
                      </span>
                    )}
                    {card.currentClub && (
                      <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                        • {card.currentClub}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="py-12 text-center text-zinc-500 font-bold text-sm">
              Kart Yükleniyor...
            </div>
          )}

          {/* MEVCUT TEKLİF */}
          <div className="flex flex-col items-center justify-center py-5 px-6 rounded-3xl bg-black/60 border border-white/10 shadow-inner">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5">
              Mevcut Teklif
            </span>
            <div className="flex items-center gap-2 px-10 py-3 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 text-amber-400 font-mono font-black text-4xl sm:text-5xl shadow-[0_0_30px_rgba(245,158,11,0.25)]">
              {currentBid}M $
            </div>
            <span className="text-xs text-zinc-400 font-medium mt-2">
              {isMyHighestBid
                ? "👑 En yüksek teklif sende! Karşı tarafın hamlesi bekleniyor..."
                : state.currentHighestBid
                ? `En son teklif: ${state.currentHighestBid.bidderUsername}`
                : "Teklif bekleniyor..."}
            </span>
          </div>

          {/* TEKLİF BUTONLARI (+1M $, +2M $, +3M $, [...M $] ve Teklif Ver) */}
          {isSpectator ? (
            <div className="rounded-2xl border border-sky-400/30 bg-sky-950/30 p-4 text-center text-sm font-bold text-sky-200">
              👁 Seyirci modundasınız; teklif veremezsiniz.
            </div>
          ) : <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2.5">
              <button
                type="button"
                disabled={isSquadFull || hasPassed || isMyHighestBid}
                onClick={() => handleQuickAdd(1)}
                className="py-3.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-white font-mono font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                +1M $
              </button>

              <button
                type="button"
                disabled={isSquadFull || hasPassed || isMyHighestBid}
                onClick={() => handleQuickAdd(2)}
                className="py-3.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-white font-mono font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                +2M $
              </button>

              <button
                type="button"
                disabled={isSquadFull || hasPassed || isMyHighestBid}
                onClick={() => handleQuickAdd(3)}
                className="py-3.5 rounded-xl bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-white font-mono font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                +3M $
              </button>

              <input
                type="number"
                min={currentBid + 1}
                placeholder="... M $"
                disabled={isSquadFull || hasPassed || isMyHighestBid}
                value={customBid}
                onChange={(e) => setCustomBid(e.target.value)}
                className="w-full text-center rounded-xl bg-black/40 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500 disabled:opacity-40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isSquadFull || hasPassed || isMyHighestBid || !customBid}
                onClick={handleCustomSubmit}
                className="py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-98"
              >
                <Gavel className="w-4 h-4" />
                Teklif Ver
              </button>

              <button
                type="button"
                disabled={isSquadFull || hasPassed || isMyHighestBid}
                onClick={onPass}
                className="py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 font-black text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
              >
                Pas Geç
              </button>
            </div>
          </div>}
        </div>

        {/* SAĞ BÖLGE (Çizimdeki Oyuncular Listesi & Kadroları) */}
        <div className={`${isSpectator ? "lg:col-span-5" : "lg:col-span-4"} flex flex-col gap-3 p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-2xl shadow-2xl max-h-[calc(100vh-210px)] min-h-[580px] overflow-y-auto pr-1`}>
          <div className="flex items-center justify-between mb-1 pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Rakip Kadrolar
            </span>
            <span className="text-xs text-zinc-500 font-mono font-bold">
              Hedef: 11 Oyuncu
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {Object.values(state.participants)
              .filter((p) => Boolean(p.userId && p.userId.trim()))
              .filter((p) => isSpectator || p.userId !== currentUserId)
              .sort((a, b) => Number(b.userId === currentBidderId) - Number(a.userId === currentBidderId))
              .map((p) => {
                const didPass = state.passedUserIds.includes(p.userId);
                return (
                  <AuctionBiddingOpponentCard
                    key={p.userId}
                    participant={p}
                    currentUserId={currentUserId}
                    currentBid={currentBid}
                    currentBidderId={currentBidderId}
                    isPassed={didPass}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
