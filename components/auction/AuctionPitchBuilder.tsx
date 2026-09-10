"use client";

/**
 * Müzayede Saha Dizilişi ve Taktik Tahtası.
 * - Sol: Sadeleştirilmiş diziliş seçimi ve "OYUNCULARIM" paneli
 * - Sağ: Futbol sahası, 11 slot, sürükle-bırak pozisyon yer değiştirme (SWAP)
 * - Oyuncu üstüne tıklayınca oynayabildiği mevkileri gösteren detay modalı
 */

import React, { useState, useMemo, useRef } from "react";
import {
  AuctionPlayerCard,
  FormationName,
  PitchPosition,
  SquadSlot,
  TeamLineup,
} from "@/lib/auction/auctionTypes";
import { FORMATION_CONFIGS, createInitialSlotsForFormation } from "@/lib/auction/formationTemplates";
import { calculateSlotRating, calculateLineupPowers } from "@/lib/auction/positionSuitability";
import { AuctionPitchSlot } from "./AuctionPitchSlot";
import { AuctionSquadList } from "./AuctionSquadList";
import { AuctionPlayerDetailModal } from "./AuctionPlayerDetailModal";
import { CheckCircle2 } from "lucide-react";

const FORMATIONS: FormationName[] = [
  "3-5-2", "3-4-2-1", "3-4-3", "4-4-2(1)", "4-4-2(2)",
  "4-2-3-1", "5-3-2", "5-2-3", "5-4-1(1)", "5-4-1(2)",
];

const CHANGEABLE_POSITION_GROUPS: PitchPosition[][] = [
  ["ST", "CF"],
  ["CM", "CDM", "CAM"],
  ["RB", "RWB"],
  ["LB", "LWB"],
];

function getChangeablePositions(position: PitchPosition) {
  return CHANGEABLE_POSITION_GROUPS.find((group) => group.includes(position)) ?? [];
}

interface AuctionPitchBuilderProps {
  userId: string;
  squad: AuctionPlayerCard[];
  secondsLeft: number;
  confirmedUserIds?: string[];
  totalParticipantCount?: number;
  onConfirmLineup: (lineup: TeamLineup) => void;
}

export function AuctionPitchBuilder({
  userId,
  squad,
  secondsLeft,
  confirmedUserIds = [],
  totalParticipantCount = 1,
  onConfirmLineup,
}: AuctionPitchBuilderProps) {
  const [formation, setFormation] = useState<FormationName>("4-2-3-1");
  const [slots, setSlots] = useState<SquadSlot[]>(() => createInitialSlotsForFormation("4-2-3-1"));
  const [selectedPlayer, setSelectedPlayer] = useState<AuctionPlayerCard | null>(null);

  // Detay Modalı (Pozisyon İnceleme)
  const [inspectingPlayer, setInspectingPlayer] = useState<AuctionPlayerCard | null>(null);
  const [inspectingSlot, setInspectingSlot] = useState<SquadSlot | null>(null);

  // Sürükle-Bırak Durumu
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedFromSlotIndex, setDraggedFromSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const lastDragTimeRef = useRef<number>(0);

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

    // Kaynak slot indexi: ya parametreden, ya da oyuncunun sahadaki mevcut yuvasından tespit edilir
    const effectiveSourceIndex =
      sourceSlotIndex !== null && sourceSlotIndex !== undefined
        ? sourceSlotIndex
        : slots.findIndex((s) => s.placedPlayer?.id === playerId);

    if (effectiveSourceIndex !== -1 && effectiveSourceIndex !== targetSlotIndex) {
      // 1. Sahadaki iki slot arasında yer değiştirme (SWAP)
      const sourceSlot = slots[effectiveSourceIndex];
      const existingInTarget = targetSlot.placedPlayer;

      if (existingInTarget) {
        // Hedefteki oyuncu kaynağın slotuna geçer (Karşılıklı yer değişimi)
        const sourceRating = calculateSlotRating(existingInTarget, sourceSlot.targetPosition);
        nextSlots[effectiveSourceIndex] = {
          ...sourceSlot,
          placedPlayer: existingInTarget,
          effectiveRating: sourceRating.effectiveRating,
          penalty: sourceRating.penalty,
        };
      } else {
        // Kaynak slot boşalır
        nextSlots[effectiveSourceIndex] = {
          ...sourceSlot,
          placedPlayer: null,
          effectiveRating: 0,
          penalty: 0,
        };
      }
    } else if (effectiveSourceIndex === -1) {
      // 2. Yedekten sahaya yerleştirme
      for (let i = 0; i < nextSlots.length; i++) {
        if (i !== targetSlotIndex && nextSlots[i].placedPlayer?.id === playerId) {
          nextSlots[i] = { ...nextSlots[i], placedPlayer: null, effectiveRating: 0, penalty: 0 };
        }
      }
    }

    // Hedef slota oyuncuyu yerleştir
    nextSlots[targetSlotIndex] = {
      ...targetSlot,
      placedPlayer: player,
      effectiveRating: targetRating.effectiveRating,
      penalty: targetRating.penalty,
    };

    setSlots(nextSlots);
    setSelectedPlayer(null);
  };

  const handleSlotPositionChange = (slotIndex: number, targetPosition: PitchPosition) => {
    setSlots((currentSlots) => currentSlots.map((slot, index) => {
      if (index !== slotIndex) return slot;
      const rating = slot.placedPlayer
        ? calculateSlotRating(slot.placedPlayer, targetPosition)
        : { effectiveRating: 0, penalty: 0 };
      return { ...slot, targetPosition, ...rating };
    }));
  };

  const handleSlotClick = (slotIndex: number) => {
    // Sürükleme yeni bittiyse tıklama olayını engelle
    if (Date.now() - lastDragTimeRef.current < 250) return;

    const slot = slots[slotIndex];
    if (selectedPlayer) {
      handlePlayerDropOnSlot(selectedPlayer.id, slotIndex, null);
    } else if (slot.placedPlayer) {
      // Oyuncunun üstüne tıklanınca oynayabildiği pozisyonları gösteren modal açılır!
      setInspectingPlayer(slot.placedPlayer);
      setInspectingSlot(slot);
    }
  };

  const handleRemovePlayerFromPitch = (playerId: string) => {
    const nextSlots = slots.map((s) =>
      s.placedPlayer?.id === playerId
        ? { ...s, placedPlayer: null, effectiveRating: 0, penalty: 0 }
        : s
    );
    setSlots(nextSlots);
    if (inspectingPlayer?.id === playerId) {
      setInspectingPlayer(null);
      setInspectingSlot(null);
    }
  };

  const handlePlacePlayerFromModal = (player: AuctionPlayerCard) => {
    // İlk boş slota yerleştir veya seçili yap
    const emptySlotIndex = slots.findIndex((s) => s.placedPlayer === null);
    if (emptySlotIndex !== -1) {
      handlePlayerDropOnSlot(player.id, emptySlotIndex, null);
    } else {
      setSelectedPlayer(player);
    }
  };

  const resetDragState = () => {
    lastDragTimeRef.current = Date.now();
    setDraggedPlayerId(null);
    setDraggedFromSlotIndex(null);
    setDragOverSlotIndex(null);
  };

  const handleSlotDragStart = (e: React.DragEvent, slot: SquadSlot, index: number) => {
    if (!slot.placedPlayer) return;
    e.dataTransfer.setData("text/plain", slot.placedPlayer.id);
    e.dataTransfer.setData("application/source-slot", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedPlayerId(slot.placedPlayer.id);
    setDraggedFromSlotIndex(index);
  };

  const handleSlotDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverSlotIndex(null);
    const pId = e.dataTransfer.getData("text/plain") || draggedPlayerId;
    const sourceStr = e.dataTransfer.getData("application/source-slot");
    const parsedSource = sourceStr ? parseInt(sourceStr, 10) : draggedFromSlotIndex;
    if (pId) {
      handlePlayerDropOnSlot(pId, index, Number.isNaN(parsedSource) ? null : parsedSource);
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

        {/* Takım Reytingi */}
        <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
          <span className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-black">
            GEN: {lineup.teamOvr}
          </span>
        </div>
      </div>

      {/* ANA İKİLİ IZGARA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SOL KOLON: DİZİLİŞLER & OYUNCULARIM */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* 1. DİZİLİŞLER */}
          <div className="p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-2.5">
              Diziliş Seçimi
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {FORMATIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFormationChange(f)}
                  className={`rounded-lg px-1 py-2 text-[11px] font-mono font-bold transition-all ${formation === f ? "bg-emerald-600 text-white shadow-md" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* 2. OYUNCULARIM (Yedekler Paneli) */}
          <AuctionSquadList
            squad={squad}
            placedPlayerIds={placedPlayerIds}
            selectedPlayer={selectedPlayer}
            draggedPlayerId={draggedPlayerId}
            onSelectPlayer={setSelectedPlayer}
            onInspectPlayer={(p) => {
              setInspectingPlayer(p);
              setInspectingSlot(slots.find((s) => s.placedPlayer?.id === p.id) || null);
            }}
            onDragStart={(e, player) => {
              e.dataTransfer.setData("text/plain", player.id);
              e.dataTransfer.effectAllowed = "move";
              setDraggedPlayerId(player.id);
              setDraggedFromSlotIndex(null);
            }}
            onDragEnd={resetDragState}
            onDropOnBench={handleRemovePlayerFromPitch}
          />

          {/* Kadroyu Onayla Butonu */}
          <div className="flex flex-col gap-1.5 w-full">
            <button
              onClick={() => onConfirmLineup(lineup)}
              disabled={!lineup.isConfirmed || confirmedUserIds.includes(userId)}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
                confirmedUserIds.includes(userId)
                  ? "bg-zinc-800/90 text-emerald-400 border border-emerald-500/40 cursor-not-allowed shadow-none"
                  : lineup.isConfirmed
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white cursor-pointer active:scale-98"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${confirmedUserIds.includes(userId) ? "text-emerald-400" : ""}`}
              />
              {confirmedUserIds.includes(userId)
                ? "Kadronuz Onaylandı ✓"
                : lineup.isConfirmed
                ? "Kadroyu Onayla ➔"
                : "11 Oyuncuyu Sahaya Yerleştirin"}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-center font-mono text-[11px] font-bold text-zinc-400 py-1">
              <span className="text-emerald-400 font-extrabold">{confirmedUserIds.length}</span>
              <span>/</span>
              <span className="text-white font-extrabold">{Math.max(1, totalParticipantCount)}</span>
              <span className="text-zinc-400 font-sans font-medium">Kişi Onayladı</span>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: FUTBOL SAHASI */}
        <div className="lg:col-span-8 relative aspect-[7/9] sm:aspect-[4/5] max-h-[620px] w-full rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-[#0d2a1a] shadow-2xl p-4 flex flex-col justify-between">
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
                onRemove={
                  slot.placedPlayer
                    ? () => handleRemovePlayerFromPitch(slot.placedPlayer!.id)
                    : undefined
                }
                changeablePositions={getChangeablePositions(slot.targetPosition)}
                onPositionChange={(position) => handleSlotPositionChange(index, position)}
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

      {/* Oyuncu Pozisyonları & Detay Modalı */}
      <AuctionPlayerDetailModal
        player={inspectingPlayer}
        currentSlot={inspectingSlot}
        isPlacedOnPitch={Boolean(inspectingSlot?.placedPlayer)}
        onClose={() => {
          setInspectingPlayer(null);
          setInspectingSlot(null);
        }}
        onRemoveFromPitch={handleRemovePlayerFromPitch}
        onPlaceOnPitch={handlePlacePlayerFromModal}
      />
    </div>
  );
}
