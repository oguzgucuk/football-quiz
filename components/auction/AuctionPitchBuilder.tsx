"use client";

/**
 * Müzayede Saha Dizilişi ve Taktik Tahtası (Drawing 3).
 * - Sol Üst: Diziliş seçimi (4-3-3, 4-2-3-1, 5-4-1, 3-5-2, 4-4-2)
 * - Sol Alt: "OYUNCULARIM" (Forvet, Orta Saha, Defans kategorize listesi)
 * - Sağ: Futbol sahası, slot yerleşimi, canlı ceza puanı ve hat güçleri
 */

import React, { useState, useMemo } from "react";
import {
  AuctionPlayerCard,
  FormationName,
  SquadSlot,
  TeamLineup,
  PitchPosition,
} from "@/lib/auction/auctionTypes";
import { FORMATION_CONFIGS, createInitialSlotsForFormation } from "@/lib/auction/formationTemplates";
import { calculateSlotRating, calculateLineupPowers } from "@/lib/auction/positionSuitability";
import { Shield, Sparkles, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";

interface AuctionPitchBuilderProps {
  userId: string;
  squad: AuctionPlayerCard[];
  secondsLeft: number;
  onConfirmLineup: (lineup: TeamLineup) => void;
}

export function AuctionPitchBuilder({
  userId,
  squad,
  secondsLeft,
  onConfirmLineup,
}: AuctionPitchBuilderProps) {
  const [formation, setFormation] = useState<FormationName>("4-3-3");
  const [slots, setSlots] = useState<SquadSlot[]>(() => createInitialSlotsForFormation("4-3-3"));
  const [selectedPlayer, setSelectedPlayer] = useState<AuctionPlayerCard | null>(null);

  // Yerleştirilen oyuncuların ID kümesi
  const placedPlayerIds = useMemo(
    () => new Set(slots.map((s) => s.placedPlayer?.id).filter(Boolean)),
    [slots]
  );

  // Canlı hat güçleri ve takım reytingi
  const lineup = useMemo(
    () => calculateLineupPowers(userId, formation, slots),
    [userId, formation, slots]
  );

  const handleFormationChange = (f: FormationName) => {
    setFormation(f);
    // Mevcut yerleşen oyuncuları yeni dizilişin slotlarına koruyarak aktar
    const newSlots = createInitialSlotsForFormation(f);
    const existingPlayers = slots.map((s) => s.placedPlayer).filter(Boolean) as AuctionPlayerCard[];

    existingPlayers.forEach((p, idx) => {
      if (newSlots[idx]) {
        const { effectiveRating, penalty } = calculateSlotRating(p, newSlots[idx].targetPosition);
        newSlots[idx].placedPlayer = p;
        newSlots[idx].effectiveRating = effectiveRating;
        newSlots[idx].penalty = penalty;
      }
    });

    setSlots(newSlots);
  };

  const handleSlotClick = (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (selectedPlayer) {
      // Seçili oyuncuyu bu slota yerleştir
      const { effectiveRating, penalty } = calculateSlotRating(selectedPlayer, slot.targetPosition);
      const nextSlots = [...slots];
      nextSlots[slotIndex] = {
        ...slot,
        placedPlayer: selectedPlayer,
        effectiveRating,
        penalty,
      };
      setSlots(nextSlots);
      setSelectedPlayer(null);
    } else if (slot.placedPlayer) {
      // Slottan oyuncuyu kaldır
      const nextSlots = [...slots];
      nextSlots[slotIndex] = {
        ...slot,
        placedPlayer: null,
        effectiveRating: 0,
        penalty: 0,
      };
      setSlots(nextSlots);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 p-4 sm:p-6 select-none animate-fadeIn">
      {/* Üst Bilgi Barı */}
      <div className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            Taktik Tahtası
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            Kalan Süre: <strong className="text-amber-400 font-mono">{secondsLeft}s</strong>
          </span>
        </div>

        {/* Hat Güçleri Sayaçları */}
        <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300">
            FOR: <strong>{lineup.rawFwdPower}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
            ORT: <strong>{lineup.rawMidPower}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300">
            DEF: <strong>{lineup.rawDefPower}</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-black">
            GEN: {lineup.teamOvr}
          </span>
        </div>
      </div>

      {/* ANA İKİLİ IZGARA (Çizim 3: Sol Menüler vs Sağ Saha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SOL KOLON: DİZİLİŞLER & OYUNCULARIM */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. DİZİLİŞLER (Çizimdeki Üst Kutu) */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-2.5">
              Diziliş Seçimi
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["4-3-3", "4-2-3-1", "5-4-1", "3-5-2", "4-4-2"] as FormationName[]).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFormationChange(f)}
                  className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    formation === f
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* 2. OYUNCULARIM (Çizimdeki Alt Kutu) */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-2 max-h-[440px] overflow-y-auto">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1">
              Oyuncularım ({squad.length - placedPlayerIds.size} Boşta)
            </span>

            {squad.map((player) => {
              const isPlaced = placedPlayerIds.has(player.id);
              const isSelected = selectedPlayer?.id === player.id;

              return (
                <div
                  key={player.id}
                  onClick={() => !isPlaced && setSelectedPlayer(isSelected ? null : player)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isPlaced
                      ? "opacity-30 bg-black/30 border-white/5 cursor-not-allowed"
                      : isSelected
                      ? "bg-emerald-950/70 border-emerald-500 shadow-md cursor-pointer"
                      : "bg-white/5 border-white/10 hover:border-emerald-500/40 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-black text-xs text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                      {player.overallPrime}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {player.fullName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {player.positions.join("/")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Kadroyu Onayla Butonu */}
          <button
            onClick={() => onConfirmLineup(lineup)}
            disabled={!lineup.isConfirmed}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
              lineup.isConfirmed
                ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white cursor-pointer active:scale-98"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Kadroyu Onayla ➔
          </button>
        </div>

        {/* SAĞ KOLON: FUTBOL SAHASI (Çizimdeki Büyük Saha) */}
        <div className="lg:col-span-8 relative aspect-[7/9] sm:aspect-[4/5] max-h-[620px] w-full rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-[#0d2a1a] shadow-2xl p-4 flex flex-col justify-between">
          {/* Çim Dokusu & Saha Çizgileri */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(16,185,129,0.15)_0%,rgba(6,40,24,0.9)_100%)] pointer-events-none" />
          <div className="absolute inset-4 border border-white/20 pointer-events-none rounded-xl" />
          <div className="absolute top-1/2 inset-x-4 h-[1px] bg-white/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-28 rounded-full border border-white/20 pointer-events-none" />

          {/* Sahadaki 11 Yuva */}
          <div className="relative w-full h-full">
            {slots.map((slot, index) => {
              const def = FORMATION_CONFIGS[formation][index];
              const p = slot.placedPlayer;

              return (
                <div
                  key={slot.slotId}
                  onClick={() => handleSlotClick(index)}
                  style={{
                    left: `${def?.xPercent || 50}%`,
                    top: `${def?.yPercent || 50}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                >
                  {/* Oyuncu / Slot Dairesi */}
                  <div
                    className={`relative flex size-12 sm:size-14 items-center justify-center rounded-2xl border-2 transition-transform duration-200 group-hover:scale-105 shadow-xl ${
                      p
                        ? slot.penalty > 0
                          ? "bg-amber-950/90 border-amber-500 text-amber-200"
                          : "bg-emerald-950/90 border-emerald-400 text-emerald-200"
                        : "bg-black/50 border-white/30 text-zinc-400 hover:border-emerald-400/80"
                    }`}
                  >
                    {p ? (
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-black text-sm sm:text-base leading-none">
                          {slot.effectiveRating}
                        </span>
                        {slot.penalty > 0 && (
                          <span className="text-[9px] font-bold text-red-400 font-mono -mt-0.5">
                            -{slot.penalty}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono font-extrabold text-xs text-zinc-400">
                        {slot.targetPosition}
                      </span>
                    )}
                  </div>

                  {/* Oyuncu Adı Etiketi */}
                  <span className="mt-1 px-2 py-0.5 rounded-md bg-black/75 border border-white/10 text-[10px] sm:text-[11px] font-bold text-white max-w-[90px] truncate text-center shadow-md">
                    {p ? p.fullName.split(" ").slice(-1)[0] : def?.label || slot.targetPosition}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
