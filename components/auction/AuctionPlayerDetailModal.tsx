"use client";

/**
 * Müzayede Oyuncu Detayı ve Oynayabildiği Pozisyonlar Modalı.
 * - Doğal mevkiler (0 ceza, tam güç)
 * - Yakın mevkiler (-5 ceza)
 * - Sahadan çıkarma ve sahaya yerleştirme kontrolleri
 */

import React from "react";
import { AuctionPlayerCard, SquadSlot } from "@/lib/auction/auctionTypes";
import { getPlayerPositionBreakdown } from "@/lib/auction/positionSuitability";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import { X, UserMinus, UserPlus, CheckCircle2, AlertTriangle, ShieldAlert, Gem } from "lucide-react";

interface AuctionPlayerDetailModalProps {
  player: AuctionPlayerCard | null;
  currentSlot?: SquadSlot | null;
  onClose: () => void;
  onRemoveFromPitch?: (playerId: string) => void;
  onPlaceOnPitch?: (player: AuctionPlayerCard) => void;
  isPlacedOnPitch?: boolean;
}

export function AuctionPlayerDetailModal({
  player,
  currentSlot,
  onClose,
  onRemoveFromPitch,
  onPlaceOnPitch,
  isPlacedOnPitch = false,
}: AuctionPlayerDetailModalProps) {
  if (!player) return null;

  const breakdown = getPlayerPositionBreakdown(player);
  const tier = getRatingTier(player.overallPrime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-[#0e1319] border border-white/15 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 text-white overflow-hidden"
      >
        {/* Tier'a Göre Ambiyans Arka Plan */}
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 ${tier.ambientBlur}`} />

        {/* Üst Kısım: Reyting, İsim, Kapat Butonu */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            {/* Reyting Rozeti - Tier renginde */}
            <div className={`relative flex size-14 shrink-0 items-center justify-center rounded-2xl ${tier.badgeClass} font-mono text-2xl font-black`}>
              {player.overallPrime}
              {tier.tier === "diamond" && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-cyan-300 text-slate-950 shadow-md">
                  <Gem className="size-2.5" />
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white leading-tight truncate">
                  {player.fullName}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${tier.pillClass}`}>
                  {tier.tierName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                {player.nationality && <span>{player.nationality}</span>}
                {player.nationality && <span>•</span>}
                <span className={`font-mono font-bold ${tier.accentText}`}>
                  {player.positions.join(" / ")}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sahadaki Durumu */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Kadro Durumu:</span>
          {isPlacedOnPitch && currentSlot ? (
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Sahada: <strong className="font-mono text-white">{currentSlot.targetPosition}</strong>
              <span className="font-mono text-[11px] text-zinc-400">
                ({currentSlot.effectiveRating} Reyting
                {currentSlot.penalty > 0 && ` / -${currentSlot.penalty}`})
              </span>
            </span>
          ) : (
            <span className="text-amber-300 font-semibold">🪑 Yedek Kulübesinde (Boşta)</span>
          )}
        </div>

        {/* Oynayabildiği Mevkiler Başlığı */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            Oynayabildiği Pozisyonlar
          </span>

          {/* 1. Doğal Mevkiler (0 Ceza) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Doğal Mevkiler (0 Ceza)
              </span>
              <span className="font-mono text-[10px] text-emerald-400/80 font-bold">
                %100 Güç • {player.overallPrime} Reyting
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {breakdown.natural.map((item) => (
                <span
                  key={item.position}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-black text-xs shadow-sm"
                >
                  {item.position}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Yakın / Alternatif Mevkiler (-5 Reyting) */}
          {!breakdown.isGoalkeeper && breakdown.nearby.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Yakın Mevkiler (-5 Ceza)
                </span>
                <span className="font-mono text-[10px] text-amber-400 font-bold">
                  {Math.max(40, player.overallPrime - 5)} Reyting
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {breakdown.nearby.map((item) => (
                  <span
                    key={item.position}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs"
                  >
                    {item.position}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Ceza Kuralı Hatırlatması */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-[11px] text-zinc-400">
            <ShieldAlert className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>
              Farklı bölgeye (ör. forvet defansa) geçerse <strong>-20 ceza</strong> alır. Kaleci dışındakiler kaleye geçerse <strong>40 reytinge</strong> düşer.
            </span>
          </div>
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="flex items-center gap-2 mt-1 pt-3 border-t border-white/10">
          {isPlacedOnPitch ? (
            <button
              onClick={() => {
                onRemoveFromPitch?.(player.id);
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <UserMinus className="w-4 h-4" />
              Sahadan Çıkar (Yedeğe Al)
            </button>
          ) : (
            <button
              onClick={() => {
                onPlaceOnPitch?.(player);
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950 cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              Sahaya Yerleştir
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
