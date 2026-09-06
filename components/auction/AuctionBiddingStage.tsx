"use client";

/**
 * Müzayede Canlı Teklif Ekranı.
 * Kullanıcının çizdiği 2. taslağa tam sadık kalınarak:
 * - Sol taraf: Futbolcu vitrin kartı, "Mevcut Teklif [ X $ ]", [+1$] [+2$] [+3$] [...$] ve "Teklif Ver"
 * - Sağ taraf: Oyuncular listesi ([Oyuncu 1 ✓], [Oyuncu 2], [Oyuncu 3 ✓]), bütçe ve kadro sayaçları
 */

import React, { useState } from "react";
import { AuctionRoomState } from "@/lib/auction/auctionTypes";
import { Timer, Check, X, ShieldAlert, Gavel } from "lucide-react";

interface AuctionBiddingStageProps {
  state: AuctionRoomState;
  currentUserId: string;
  errorMessage: string | null;
  onPlaceBid: (amount: number) => void;
  onPass: () => void;
}

export function AuctionBiddingStage({
  state,
  currentUserId,
  errorMessage,
  onPlaceBid,
  onPass,
}: AuctionBiddingStageProps) {
  const card = state.currentCard;
  const currentBid = state.currentHighestBid?.amount || 0;
  const currentBidderId = state.currentHighestBid?.bidderUserId;
  const myParticipant = state.participants[currentUserId];

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
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5 p-4 sm:p-6 select-none animate-fadeIn">
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
            00:0{state.secondsLeft}
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
        {/* SOL BÖLGE (Çizimdeki Sol Vitrin) */}
        <div className="lg:col-span-7 flex flex-col gap-4 p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-2xl shadow-2xl">
          {/* Futbolcu Kartı */}
          {card ? (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-black/60 to-zinc-900/60 border border-emerald-500/40 shadow-lg">
              <div className="flex size-18 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-mono font-black text-3xl shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                {card.overallPrime}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xl font-black text-white truncate tracking-tight">
                  {card.fullName}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {card.positions.map((pos) => (
                    <span
                      key={pos}
                      className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-xs font-bold text-emerald-400 font-mono"
                    >
                      {pos}
                    </span>
                  ))}
                  {card.nationality && (
                    <span className="text-xs text-zinc-400 font-medium ml-1">
                      • {card.nationality}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 font-bold text-sm">
              Kart Yükleniyor...
            </div>
          )}

          {/* MEVCUT TEKLİF (Çizimdeki Mevcut Teklif [ 10 $ ] Kutusu) */}
          <div className="flex flex-col items-center justify-center py-4 px-6 rounded-2xl bg-black/60 border border-white/10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-1">
              Mevcut Teklif
            </span>
            <div className="flex items-center gap-2 px-8 py-2 rounded-xl bg-amber-950/40 border-2 border-amber-500/50 text-amber-400 font-mono font-black text-3xl shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              {currentBid} $
            </div>
            <span className="text-[11px] text-zinc-400 font-medium mt-1.5">
              {state.currentHighestBid
                ? `En son teklif: ${state.currentHighestBid.bidderUsername}`
                : "Teklif bekleniyor..."}
            </span>
          </div>

          {/* TEKLİF BUTONLARI (+1$, +2$, +3$, [...$] ve Teklif Ver) */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                disabled={isSquadFull || hasPassed}
                onClick={() => handleQuickAdd(1)}
                className="py-3 rounded-xl bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-white font-mono font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +1 $
              </button>

              <button
                type="button"
                disabled={isSquadFull || hasPassed}
                onClick={() => handleQuickAdd(2)}
                className="py-3 rounded-xl bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-white font-mono font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +2 $
              </button>

              <button
                type="button"
                disabled={isSquadFull || hasPassed}
                onClick={() => handleQuickAdd(3)}
                className="py-3 rounded-xl bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-white font-mono font-black text-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +3 $
              </button>

              <input
                type="number"
                min={currentBid + 1}
                placeholder="... $"
                disabled={isSquadFull || hasPassed}
                value={customBid}
                onChange={(e) => setCustomBid(e.target.value)}
                className="w-full text-center rounded-xl bg-black/40 border border-white/15 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isSquadFull || hasPassed || !customBid}
                onClick={handleCustomSubmit}
                className="py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Gavel className="w-4 h-4" />
                Teklif Ver
              </button>

              <button
                type="button"
                disabled={isSquadFull || hasPassed || isMyHighestBid}
                onClick={onPass}
                className="py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-300 font-black text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Pas Geç
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ BÖLGE (Çizimdeki Oyuncular Listesi) */}
        <div className="lg:col-span-5 flex flex-col gap-3 p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-2xl shadow-2xl">
          <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-1">
            Lobi Oyuncuları & Durum
          </span>

          <div className="flex flex-col gap-2.5">
            {Object.values(state.participants).map((p) => {
              const isTurn = state.currentTurnUserId === p.userId;
              const holdsHighest = currentBidderId === p.userId;
              const didPass = state.passedUserIds.includes(p.userId);

              return (
                <div
                  key={p.userId}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    holdsHighest
                      ? "bg-amber-950/40 border-amber-500/60 shadow-md shadow-amber-950/40"
                      : isTurn
                      ? "bg-emerald-950/30 border-emerald-500/40"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-bold text-sm text-white truncate">
                      {p.username}
                      {p.userId === currentUserId && (
                        <span className="text-[10px] text-emerald-400 font-mono ml-1">(Sen)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ${p.budget}M
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {p.squad.length}/11
                    </span>

                    {/* Çizimdeki Kontrol İkonu (✓ / Pas) */}
                    <div className="flex size-6 items-center justify-center rounded-lg bg-black/30 border border-white/10">
                      {holdsHighest ? (
                        <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                      ) : didPass ? (
                        <X className="w-3.5 h-3.5 text-zinc-500 stroke-[2.5]" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-zinc-400 mt-2">
            💡 Sırası gelen oyuncu vitrindeki futbolcuya zorunlu 1$ teklif verir. Kimse artırmazsa oyuncu onda kalır!
          </div>
        </div>
      </div>
    </div>
  );
}
