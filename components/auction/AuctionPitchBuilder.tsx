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
import { AuctionPitchSlot } from "./AuctionPitchSlot";
import { AuctionSquadList } from "./AuctionSquadList";
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

  // Sürükle-Bırak Durumu
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedFromSlotIndex, setDraggedFromSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  // Yerleştirilen oyuncuların ID kümesi
  const placedPlayerIds = useMemo(
    () => new Set(slots.map((s) => s.placedPlayer?.id).filter((id): id is string => Boolean(id))),
    [slots]
  );

  // Canlı hat güçleri ve takım reytingi
  const lineup = useMemo(
    () => calculateLineupPowers(userId, formation, slots),
    [userId, formation, slots]
  );

  const handleFormationChange = (f: FormationName) => {
    setFormation(f);
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

  const handlePlayerDropOnSlot = (
    playerId: string,
    targetSlotIndex: number,
    sourceSlotIndex: number | null
  ) => {
    const player = squad.find((p) => p.id === playerId);
    if (!player) return;

    const targetSlot = slots[targetSlotIndex];
    if (!targetSlot) return;

    const nextSlots = [...slots];
    const targetRating = calculateSlotRating(player, targetSlot.targetPosition);

    if (sourceSlotIndex !== null && sourceSlotIndex !== targetSlotIndex) {
      const sourceSlot = slots[sourceSlotIndex];
      const existingInTarget = targetSlot.placedPlayer;

      if (existingInTarget) {
        const sourceRating = calculateSlotRating(existingInTarget, sourceSlot.targetPosition);
        nextSlots[sourceSlotIndex] = {
          ...sourceSlot,
          placedPlayer: existingInTarget,
          effectiveRating: sourceRating.effectiveRating,
          penalty: sourceRating.penalty,
        };
      } else {
        nextSlots[sourceSlotIndex] = {
          ...sourceSlot,
          placedPlayer: null,
          effectiveRating: 0,
          penalty: 0,
        };
      }
    } else {
      for (let i = 0; i < nextSlots.length; i++) {
        if (i !== targetSlotIndex && nextSlots[i].placedPlayer?.id === playerId) {
          nextSlots[i] = { ...nextSlots[i], placedPlayer: null, effectiveRating: 0, penalty: 0 };
        }
      }
    }

    nextSlots[targetSlotIndex] = {
      ...targetSlot,
      placedPlayer: player,
      effectiveRating: targetRating.effectiveRating,
      penalty: targetRating.penalty,
    };

    setSlots(nextSlots);
    setSelectedPlayer(null);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (selectedPlayer) {
      handlePlayerDropOnSlot(selectedPlayer.id, slotIndex, null);
    } else if (slots[slotIndex].placedPlayer) {
      const nextSlots = [...slots];
      nextSlots[slotIndex] = { ...slots[slotIndex], placedPlayer: null, effectiveRating: 0, penalty: 0 };
      setSlots(nextSlots);
    }
  };

  const resetDragState = () => {
    setDraggedPlayerId(null);
    setDraggedFromSlotIndex(null);
    setDragOverSlotIndex(null);
  };

  const handleSlotDragStart = (e: React.DragEvent, slot: SquadSlot, index: number) => {
    if (!slot.placedPlayer) return;
    e.dataTransfer.setData("text/plain", slot.placedPlayer.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedPlayerId(slot.placedPlayer.id);
    setDraggedFromSlotIndex(index);
  };

  const handleSlotDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverSlotIndex(null);
    const pId = e.dataTransfer.getData("text/plain") || draggedPlayerId;
    if (pId) {
      handlePlayerDropOnSlot(pId, index, draggedFromSlotIndex);
    }
    resetDragState();
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
          <AuctionSquadList
            squad={squad}
            placedPlayerIds={placedPlayerIds}
            selectedPlayer={selectedPlayer}
            draggedPlayerId={draggedPlayerId}
            onSelectPlayer={setSelectedPlayer}
            onDragStart={(e, player) => {
              e.dataTransfer.setData("text/plain", player.id);
              e.dataTransfer.effectAllowed = "move";
              setDraggedPlayerId(player.id);
              setDraggedFromSlotIndex(null);
            }}
            onDragEnd={() => {
              setDraggedPlayerId(null);
              setDraggedFromSlotIndex(null);
              setDragOverSlotIndex(null);
            }}
          />

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
            {slots.map((slot, index) => (
              <AuctionPitchSlot
                key={slot.slotId}
                slot={slot}
                def={FORMATION_CONFIGS[formation][index]}
                index={index}
                isDragOver={dragOverSlotIndex === index}
                isAnyDragging={Boolean(draggedPlayerId)}
                onClick={() => handleSlotClick(index)}
                onDragStart={(e) => handleSlotDragStart(e, slot, index)}
                onDragEnd={resetDragState}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverSlotIndex !== index) setDragOverSlotIndex(index);
                }}
                onDragLeave={() => {
                  if (dragOverSlotIndex === index) setDragOverSlotIndex(null);
                }}
                onDrop={(e) => handleSlotDrop(e, index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
