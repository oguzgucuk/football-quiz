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
import { CheckCircle2, Timer, RotateCcw } from "lucide-react";

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
  onUnconfirmLineup?: () => void;
}

export function AuctionPitchBuilder({
  userId,
  squad,
  secondsLeft,
  confirmedUserIds = [],
  totalParticipantCount = 1,
  onConfirmLineup,
  onUnconfirmLineup,
}: AuctionPitchBuilderProps) {
  const [formation, setFormation] = useState<FormationName>("4-2-3-1");
  const [slots, setSlots] = useState<SquadSlot[]>(() => createInitialSlotsForFormation("4-2-3-1"));
  const [selectedPlayer, setSelectedPlayer] = useState<AuctionPlayerCard | null>(null);

  // Kullanıcı hazırda mı? (Kadro kilitli)
  const isConfirmed = confirmedUserIds.includes(userId);

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
    if (isConfirmed) return;
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
    if (isConfirmed) return;
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
    if (isConfirmed) return;
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

    if (isConfirmed) {
      if (slot.placedPlayer) {
        setInspectingPlayer(slot.placedPlayer);
        setInspectingSlot(slot);
      }
      return;
    }

    if (selectedPlayer) {
      handlePlayerDropOnSlot(selectedPlayer.id, slotIndex, null);
    } else if (slot.placedPlayer) {
      // Oyuncunun üstüne tıklanınca oynayabildiği pozisyonları gösteren modal açılır!
      setInspectingPlayer(slot.placedPlayer);
      setInspectingSlot(slot);
    }
  };

  const handleRemovePlayerFromPitch = (playerId: string) => {
    if (isConfirmed) return;
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
    if (isConfirmed) return;
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
    if (isConfirmed || !slot.placedPlayer) return;
    e.dataTransfer.setData("text/plain", slot.placedPlayer.id);
    e.dataTransfer.setData("application/source-slot", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedPlayerId(slot.placedPlayer.id);
    setDraggedFromSlotIndex(index);
  };

  const handleSlotDrop = (e: React.DragEvent, index: number) => {
    if (isConfirmed) return;
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
    <div className="w-full flex flex-col gap-3.5 select-none animate-fadeIn">
      {/* Üst Bilgi Barı */}
      <div className="relative flex items-center justify-between p-2.5 px-5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl min-h-[52px]">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/40">
            Taktik Tahtası
          </span>
        </div>

        {/* Kalan Süre Ortada ve Belirgin */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1 rounded-xl bg-black/60 border border-white/15 shadow-md">
          <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
          <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 tabular-nums">
            {secondsLeft}s
          </span>
        </div>

        {/* Sağ: Onaylayan Kişi Sayacı */}
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-300">
          <span className="text-emerald-400 font-extrabold">{confirmedUserIds.length}</span>
          <span className="text-zinc-500">/</span>
          <span className="text-white font-extrabold">{Math.max(1, totalParticipantCount)}</span>
          <span className="text-zinc-400 font-sans font-medium hidden sm:inline">Onaylandı</span>
        </div>
      </div>

      {/* ANA ÜÇLÜ IZGARA: SOL (KADRO) - ORTA (SAHA) - SAĞ (DİZİLİŞ & ONAY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* 1. SOL KOLON: OYUNCULARIM (KADRO) */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3">
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
              if (isConfirmed) return;
              e.dataTransfer.setData("text/plain", player.id);
              e.dataTransfer.effectAllowed = "move";
              setDraggedPlayerId(player.id);
              setDraggedFromSlotIndex(null);
            }}
            onDragEnd={resetDragState}
            onDropOnBench={handleRemovePlayerFromPitch}
            disabled={isConfirmed}
          />
        </div>

        {/* 2. ORTA KOLON: FUTBOL SAHASI */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center">
          <div className="relative aspect-[3/4] sm:aspect-[7/9] max-h-[600px] xl:max-h-[640px] w-full rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-[#0d2a1a] shadow-2xl p-4 flex flex-col justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(16,185,129,0.15)_0%,rgba(6,40,24,0.9)_100%)] pointer-events-none" />
            <div className="absolute inset-4 border border-white/20 pointer-events-none rounded-xl" />
            <div className="absolute top-1/2 inset-x-4 h-[1px] bg-white/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full border border-white/20 pointer-events-none" />

            {/* Takım Reytingi (Sahanın Sağ Üstünde - Sade & Düzgün) */}
            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/75 border border-white/15 backdrop-blur-md shadow-md">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">GEN</span>
              <span className="text-base font-mono font-black text-white tabular-nums">{lineup.teamOvr}</span>
            </div>

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
                    if (isConfirmed) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverSlotIndex !== index) setDragOverSlotIndex(index);
                  }}
                  onDragLeave={() => {
                    if (dragOverSlotIndex === index) setDragOverSlotIndex(null);
                  }}
                  onDrop={(e) => handleSlotDrop(e, index)}
                  disabled={isConfirmed}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. SAĞ KOLON: DİZİLİŞ SEÇİMİ & KADRO ONAYI */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-3.5">
          {/* Diziliş Seçimi (Doğrudan açık ve temiz ızgara) */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Diziliş Seçimi
              </span>
              <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {formation}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {FORMATIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  disabled={isConfirmed}
                  onClick={() => handleFormationChange(f)}
                  className={`py-2 px-2.5 rounded-xl font-mono text-xs font-bold transition-all border text-center ${
                    formation === f
                      ? "bg-emerald-500 border-emerald-400 text-black shadow-md font-black"
                      : isConfirmed
                      ? "bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20 hover:text-white cursor-pointer active:scale-95"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Kadro Onay & Kilit Paneli */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
              Kadro Onayı
            </span>

            {isConfirmed ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kadronuz kilitlendi ve hazır! Diğer oyuncular bekleniyor...</span>
                </div>

                {onUnconfirmLineup && (
                  <button
                    type="button"
                    onClick={onUnconfirmLineup}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/15 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hazırı İptal Et (Düzenle)</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmLineup(lineup)}
                disabled={!lineup.isConfirmed}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
                  lineup.isConfirmed
                    ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white cursor-pointer active:scale-98 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {lineup.isConfirmed ? "Kadroyu Onayla ➔" : "11 Oyuncuyu Sahaya Yerleştir"}
                </span>
              </button>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/5">
              <span>Hazır Oyuncular:</span>
              <span className="font-bold text-white">
                <span className="text-emerald-400">{confirmedUserIds.length}</span> / {Math.max(1, totalParticipantCount)}
              </span>
            </div>
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
        onRemoveFromPitch={isConfirmed ? () => {} : handleRemovePlayerFromPitch}
        onPlaceOnPitch={isConfirmed ? () => {} : handlePlacePlayerFromModal}
      />
    </div>
  );
}
