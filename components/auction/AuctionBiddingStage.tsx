"use client";

/**
 * Müzayede Canlı Teklif Ekranı.
 * - Sol: Kadrom (MySquadDrawer)
 * - Orta: Vitrin (AuctionShowcaseCard) + Teklif Alanı veya 2 Sn Satış Kutlaması (AuctionSoldCelebrationCard)
 * - Sağ: Rakip kadrolar (AuctionBiddingOpponentCard)
 */

import React, { useState, useEffect } from "react";
import { AuctionRoomState } from "@/lib/auction/auctionTypes";
import { Timer, ShieldAlert, Gem, Crown } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import { isGoalkeeper } from "@/lib/auction/auctionRoomEngine";
import { MySquadDrawer } from "./MySquadDrawer";
import { AuctionBiddingOpponentCard } from "./AuctionBiddingOpponentCard";
import { AuctionSalesHistoryDropdown } from "./AuctionSalesHistoryDropdown";
import { AuctionBiddingControls } from "./AuctionBiddingControls";
import { AuctionSoldCelebrationCard } from "./AuctionSoldCelebrationCard";
import { AuctionShowcaseCard } from "./AuctionShowcaseCard";

interface AuctionBiddingStageProps {
  state: AuctionRoomState;
  currentUserId: string;
  errorMessage: string | null;
  onPlaceBid: (amount: number, cardIndex?: number, cardId?: string) => void;
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

  const remainingPool = state.pool.slice(state.currentCardIndex);
  const remainingDiamondCount = remainingPool.filter(
    (p) => getRatingTier(p.overallPrime).tier === "diamond"
  ).length;

  const sales =
    state.salesHistory && state.salesHistory.length > 0
      ? [...state.salesHistory].reverse()
      : state.lastSoldEvent
      ? [state.lastSoldEvent]
      : [];

  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);
  const currentCardIndex = state.currentCardIndex;

  useEffect(() => {
    setIsCooldownActive(true);
    const remainingMs = state.bidCooldownUntil
      ? Math.max(0, state.bidCooldownUntil - Date.now())
      : 1000;
    const delay = Math.min(1500, Math.max(800, remainingMs || 1000));

    const timer = setTimeout(() => {
      setIsCooldownActive(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentCardIndex, state.bidCooldownUntil]);

  const isMyHighestBid = currentBidderId === currentUserId;
  const hasPassed = state.passedUserIds.includes(currentUserId);
  const isSquadFull = (myParticipant?.squad.length || 0) >= 14;
  const isGkBlocked = isGoalkeeper(card) && ((myParticipant?.squad.filter(isGoalkeeper).length || 0) >= 2);

  const handleQuickAdd = (delta: number) => {
    onPlaceBid(currentBid + delta, state.currentCardIndex, card?.id);
  };

  const handleCustomSubmit = (amount: number) => {
    onPlaceBid(amount, state.currentCardIndex, card?.id);
  };

  return (
    <div className="relative w-full flex flex-col gap-5 select-none animate-fadeIn">
      {/* Üst Bilgi Çubuğu */}
      <div className="relative z-30 flex items-center justify-between p-3 px-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md gap-4 min-h-[58px]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 shrink-0">
            Açık Artırma Turu: {state.currentCardIndex + 1} / {state.pool.length}
          </span>
          {remainingDiamondCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 text-xs sm:text-sm font-black shadow-[0_0_15px_rgba(56,189,248,0.25)] shrink-0 animate-pulse">
              <Gem className="w-4 h-4 text-cyan-300" />
              <span>{remainingDiamondCount} Elmas Havuzda</span>
            </span>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 rounded-xl bg-black/60 border border-white/15 shadow-md">
          <Timer className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-2xl font-mono font-black text-amber-400 tabular-nums">
            {String(Math.floor(state.secondsLeft / 60)).padStart(2, "0")}:{String(state.secondsLeft % 60).padStart(2, "0")}
          </span>
        </div>

        <div className="relative z-40 flex items-center justify-end flex-1 min-w-0">
          <AuctionSalesHistoryDropdown sales={sales} />
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold animate-shake">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ANA PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {!isSpectator && (
          <MySquadDrawer participant={myParticipant} isMyHighestBid={isMyHighestBid} />
        )}

        {/* ORTA BÖLGE (2 Sn Satış Kutlaması veya Vitrin & Teklifler) */}
        <div className={`${isSpectator ? "lg:col-span-7" : "lg:col-span-5"} flex flex-col gap-4 p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-2xl shadow-2xl`}>
          {state.isSoldCelebration && state.lastSoldEvent ? (
            <AuctionSoldCelebrationCard
              soldEvent={state.lastSoldEvent}
              secondsLeft={state.secondsLeft}
            />
          ) : (
            <>
              <AuctionShowcaseCard card={card} />

              {/* MEVCUT TEKLİF */}
              <div className="flex flex-col items-center justify-center py-5 px-6 rounded-3xl bg-black/60 border border-white/10 shadow-inner">
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1.5">Mevcut Teklif</span>
                <div className="flex items-center gap-2 px-10 py-3 rounded-2xl bg-gradient-to-b from-yellow-950/50 via-yellow-900/30 to-black/80 border-2 border-yellow-400/80 text-yellow-300 font-mono font-black text-4xl sm:text-5xl shadow-[0_0_35px_rgba(250,204,21,0.35)]">
                  {currentBid}M $
                </div>
                <div className="mt-3 flex items-center justify-center text-center">
                  {isMyHighestBid ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-yellow-400/20 border border-yellow-400/70 text-yellow-300 font-black text-sm sm:text-base shadow-xs">
                      <Crown className="size-4 fill-yellow-400 text-yellow-400 shrink-0" />
                      <span>En Yüksek Teklif Sende! Karşı tarafın hamlesi bekleniyor...</span>
                    </div>
                  ) : state.currentHighestBid ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/10 border border-white/15 text-zinc-200 font-bold text-sm sm:text-base flex-wrap justify-center">
                      <span className="text-zinc-400 font-medium">Lider Teklif Sahibi:</span>
                      <span className="text-white font-black">{state.currentHighestBid.bidderUsername}</span>
                      <span className="font-mono text-yellow-400 font-black">({currentBid}M $)</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-zinc-500 tracking-wide">Henüz teklif verilmedi</span>
                  )}
                </div>
              </div>

              <AuctionBiddingControls
                currentBid={currentBid}
                isSpectator={isSpectator}
                isGkBlocked={isGkBlocked}
                isSquadFull={isSquadFull}
                hasPassed={hasPassed}
                isMyHighestBid={isMyHighestBid}
                isCooldownActive={isCooldownActive}
                onQuickAdd={handleQuickAdd}
                onCustomSubmit={handleCustomSubmit}
                onPass={onPass}
              />
            </>
          )}
        </div>

        {/* SAĞ BÖLGE (Rakip Kadrolar) */}
        <div className={`${isSpectator ? "lg:col-span-5" : "lg:col-span-4"} flex flex-col gap-3 p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-2xl shadow-2xl`}>
          <div className="flex items-center justify-between mb-1 pb-2 border-b border-white/10">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Rakip Kadrolar</span>
            <span className="text-xs text-zinc-500 font-mono font-bold">Hedef: 14 Oyuncu</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.values(state.participants)
              .filter((p) => Boolean(p.userId && p.userId.trim()))
              .filter((p) => isSpectator || p.userId !== currentUserId)
              .map((p) => (
                <AuctionBiddingOpponentCard
                  key={p.userId}
                  participant={p}
                  currentUserId={currentUserId}
                  currentBid={currentBid}
                  currentBidderId={currentBidderId}
                  isPassed={state.passedUserIds.includes(p.userId)}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
