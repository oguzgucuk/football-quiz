"use client";

/**
 * Müzayede Saha Dizilişi ve Taktik Tahtası.
 * - Sol: "OYUNCULARIM" paneli (kadro havuzu)
 * - Orta: Dikey futbol sahası (aspect-[9/13]), hücum koridoru aydınlatması ve saydam yön okları
 * - Sağ: Diziliş seçimi, 4 boyutlu taktikler, rakip analizi ve kadro onayı/iptal butonu
 * - Önceki turun 11'i ve taktikleri korunarak hazır gelir (tekrar dizilmez)
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  AuctionPlayerCard,
  FormationName,
  PitchPosition,
  SquadSlot,
  TeamLineup,
  TeamTactics,
} from "@/lib/auction/auctionTypes";
import { FORMATION_CONFIGS, createInitialSlotsForFormation } from "@/lib/auction/formationTemplates";
import { calculateSlotRating, calculateLineupPowers } from "@/lib/auction/positionSuitability";
import { autoAssignSquadToFormation } from "@/lib/auction/autoSquadArranger";
import { AuctionPitchSlot } from "./AuctionPitchSlot";
import { AuctionSquadList } from "./AuctionSquadList";
import { AuctionPlayerDetailModal } from "./AuctionPlayerDetailModal";
import { AuctionTacticsSelector } from "./AuctionTacticsSelector";
import { CheckCircle2, Timer, RotateCcw, Search, Eye, X, Shield } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

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
  initialLineup?: TeamLineup;
  nextOpponent?: { username: string; lineup?: TeamLineup; squad?: AuctionPlayerCard[] };
  onConfirmLineup: (lineup: TeamLineup) => void;
  onUnconfirmLineup?: () => void;
}

export function AuctionPitchBuilder({
  userId,
  squad,
  secondsLeft,
  confirmedUserIds = [],
  totalParticipantCount = 1,
  initialLineup,
  nextOpponent,
  onConfirmLineup,
  onUnconfirmLineup,
}: AuctionPitchBuilderProps) {
  // Önceki 11 varsa doğrudan koru, yoksa 4-2-3-1 boş yuvalar
  const [formation, setFormation] = useState<FormationName>(
    () => initialLineup?.formation || "4-2-3-1"
  );
  const [slots, setSlots] = useState<SquadSlot[]>(() => {
    if (initialLineup?.slots && initialLineup.slots.length === 11) {
      return initialLineup.slots;
    }
    return createInitialSlotsForFormation("4-2-3-1");
  });
  const [tactics, setTactics] = useState<TeamTactics>(() => {
    return initialLineup?.tactics || {
      tempo: "balanced",
      buildUp: "balanced",
      pressing: "balanced",
      attackDirection: "balanced",
    };
  });

  const [selectedPlayer, setSelectedPlayer] = useState<AuctionPlayerCard | null>(null);

  // Optimistic iptal desteği
  const [isLocallyUnconfirmed, setIsLocallyUnconfirmed] = useState(false);
  const serverConfirmed = confirmedUserIds.includes(userId);
  const isConfirmed = serverConfirmed && !isLocallyUnconfirmed;

  useEffect(() => {
    if (!serverConfirmed) {
      setIsLocallyUnconfirmed(false);
    }
  }, [serverConfirmed]);

  // Süre bittiğinde (secondsLeft <= 1) eğer kullanıcı henüz onaylamadıysa:
  // Sahada yerleştirilmiş oyuncuları koruyarak kalan boş yuvaları akıllıca doldur ve otomatik onayla!
  const hasAutoConfirmedRef = useRef(false);
  useEffect(() => {
    if (secondsLeft > 5) {
      hasAutoConfirmedRef.current = false;
    }
    if (secondsLeft <= 1 && !isConfirmed && !hasAutoConfirmedRef.current) {
      hasAutoConfirmedRef.current = true;
      const finalSlots = autoAssignSquadToFormation(squad, formation, slots);
      const computedLineup = calculateLineupPowers(userId, formation, finalSlots);
      computedLineup.tactics = tactics;
      computedLineup.isConfirmed = true;
      onConfirmLineup(computedLineup);
    }
  }, [secondsLeft, isConfirmed, squad, formation, slots, tactics, userId, onConfirmLineup]);

  // Rakip Analizi Modalı
  const [showOpponentModal, setShowOpponentModal] = useState(false);

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

    const effectiveSourceIndex =
      sourceSlotIndex !== null && sourceSlotIndex !== undefined
        ? sourceSlotIndex
        : slots.findIndex((s) => s.placedPlayer?.id === playerId);

    if (effectiveSourceIndex !== -1 && effectiveSourceIndex !== targetSlotIndex) {
      // SWAP
      const sourceSlot = slots[effectiveSourceIndex];
      const existingInTarget = targetSlot.placedPlayer;

      nextSlots[targetSlotIndex] = {
        ...targetSlot,
        placedPlayer: player,
        effectiveRating: targetRating.effectiveRating,
        penalty: targetRating.penalty,
      };

      if (existingInTarget) {
        const sourceRating = calculateSlotRating(existingInTarget, sourceSlot.targetPosition);
        nextSlots[effectiveSourceIndex] = {
          ...sourceSlot,
          placedPlayer: existingInTarget,
          effectiveRating: sourceRating.effectiveRating,
          penalty: sourceRating.penalty,
        };
      } else {
        nextSlots[effectiveSourceIndex] = {
          ...sourceSlot,
          placedPlayer: null,
          effectiveRating: 0,
          penalty: 0,
        };
      }
    } else {
      // Kulübeden sahaya
      nextSlots[targetSlotIndex] = {
        ...targetSlot,
        placedPlayer: player,
        effectiveRating: targetRating.effectiveRating,
        penalty: targetRating.penalty,
      };
    }

    setSlots(nextSlots);
    setSelectedPlayer(null);
  };

  const handleSlotClick = (index: number) => {
    if (isConfirmed) return;
    const now = Date.now();
    if (now - lastDragTimeRef.current < 250) return;

    if (selectedPlayer) {
      handlePlayerDropOnSlot(selectedPlayer.id, index, null);
    } else {
      const slot = slots[index];
      if (slot?.placedPlayer) {
        setInspectingPlayer(slot.placedPlayer);
        setInspectingSlot(slot);
      }
    }
  };

  const handleSlotPositionChange = (slotIndex: number, nextPosition: PitchPosition) => {
    if (isConfirmed) return;
    const slot = slots[slotIndex];
    if (!slot) return;

    const nextSlots = [...slots];
    const updatedSlot: SquadSlot = {
      ...slot,
      targetPosition: nextPosition,
    };

    if (slot.placedPlayer) {
      const { effectiveRating, penalty } = calculateSlotRating(slot.placedPlayer, nextPosition);
      updatedSlot.effectiveRating = effectiveRating;
      updatedSlot.penalty = penalty;
    }

    nextSlots[slotIndex] = updatedSlot;
    setSlots(nextSlots);
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

  const handleUnconfirm = () => {
    setIsLocallyUnconfirmed(true);
    onUnconfirmLineup?.();
  };

  return (
    <div className="w-full flex flex-col gap-3.5 select-none animate-fadeIn">
      {/* Üst Bilgi Barı */}
      <div className="relative flex items-center justify-between p-2.5 px-5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl min-h-[52px]">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/40">
            Taktik Tahtası
          </span>

          {nextOpponent && (
            <button
              type="button"
              onClick={() => setShowOpponentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-400/40 text-indigo-300 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rakip Analizi (@{nextOpponent.username})</span>
            </button>
          )}
        </div>

        {/* Kalan Süre Ortada */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1 rounded-xl bg-black/60 border border-white/15 shadow-md">
          <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
          <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 tabular-nums">
            {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
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

      {/* ANA ÜÇLÜ IZGARA: SOL (KADRO) - ORTA (DİKEY SAHA) - SAĞ (DİZİLİŞ, TAKTİK & ONAY) */}
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

        {/* 2. ORTA KOLON: DİKEY FUTBOL SAHASI */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center">
          <div className="relative aspect-[9/13] w-full max-w-[440px] max-h-[640px] rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-[#0c2417] shadow-2xl p-4 flex flex-col justify-between select-none">
            {/* Saha Çim Gradyanı */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(16,185,129,0.18)_0%,rgba(5,32,20,0.95)_100%)] pointer-events-none" />

            {/* 3 Koridor Bölme Çizgileri ve Hücum Yönü Aydınlatması (Zemin - Oyuncuların Arkasında) */}
            <div className="absolute inset-4 pointer-events-none z-0 overflow-hidden rounded-xl border border-white/20">
              {/* Saha Çizgileri */}
              <div className="absolute top-1/2 inset-x-0 h-[1px] bg-white/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-20 rounded-full border border-white/20" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-14 border-b border-x border-white/20" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-14 border-t border-x border-white/20" />

              {/* Koridor Dikey Kesik Çizgileri */}
              <div className="absolute top-0 bottom-0 left-1/3 w-[1px] border-r border-dashed border-white/10" />
              <div className="absolute top-0 bottom-0 left-2/3 w-[1px] border-r border-dashed border-white/10" />

              {/* Sol Koridor Aydınlatması */}
              {tactics.attackDirection === "left" && (
                <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-t from-emerald-500/5 via-emerald-400/15 to-emerald-300/25 border-r border-emerald-400/40 flex flex-col items-center justify-around py-8 animate-pulse">
                  <span className="text-emerald-300/40 font-mono text-lg font-black">▲</span>
                  <span className="text-emerald-300/60 font-mono text-2xl font-black">▲</span>
                  <span className="text-emerald-300/80 font-mono text-3xl font-black">▲</span>
                </div>
              )}

              {/* Merkez Koridor Aydınlatması */}
              {tactics.attackDirection === "center" && (
                <div className="absolute top-0 bottom-0 left-1/3 w-1/3 bg-gradient-to-t from-emerald-500/5 via-emerald-400/15 to-emerald-300/25 border-x border-emerald-400/40 flex flex-col items-center justify-around py-8 animate-pulse">
                  <span className="text-emerald-300/40 font-mono text-lg font-black">▲</span>
                  <span className="text-emerald-300/60 font-mono text-2xl font-black">▲</span>
                  <span className="text-emerald-300/80 font-mono text-3xl font-black">▲</span>
                </div>
              )}

              {/* Sağ Koridor Aydınlatması */}
              {tactics.attackDirection === "right" && (
                <div className="absolute top-0 bottom-0 left-2/3 w-1/3 bg-gradient-to-t from-emerald-500/5 via-emerald-400/15 to-emerald-300/25 border-l border-emerald-400/40 flex flex-col items-center justify-around py-8 animate-pulse">
                  <span className="text-emerald-300/40 font-mono text-lg font-black">▲</span>
                  <span className="text-emerald-300/60 font-mono text-2xl font-black">▲</span>
                  <span className="text-emerald-300/80 font-mono text-3xl font-black">▲</span>
                </div>
              )}
            </div>

            {/* Takım Reytingi (Sahanın Sağ Üstünde) */}
            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/75 border border-white/15 backdrop-blur-md shadow-md">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">GEN</span>
              <span className="text-base font-mono font-black text-white tabular-nums">{lineup.teamOvr}</span>
            </div>

            {/* Sahadaki 11 Yuva (z-10 seviyesinde, okların üstünde) */}
            <div className="relative w-full h-full z-10">
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

        {/* 3. SAĞ KOLON: DİZİLİŞ, TAKTİKLER & KADRO ONAYI */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-3">
          {/* Diziliş Seçimi */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-2.5">
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

          {/* 4 Boyutlu Taktik Paneli */}
          <AuctionTacticsSelector
            tactics={tactics}
            onChange={setTactics}
            disabled={isConfirmed}
          />

          {/* Kadro Onay & İptal Paneli */}
          <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
              Kadro Onayı
            </span>

            {isConfirmed ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kadronuz kilitlendi ve hazır! Diğerleri bekleniyor...</span>
                </div>

                {onUnconfirmLineup && (
                  <button
                    type="button"
                    onClick={handleUnconfirm}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Onayı Kaldır (Kadroyu Düzenle)</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLocallyUnconfirmed(false);
                  onConfirmLineup({ ...lineup, tactics });
                }}
                disabled={!lineup.isConfirmed}
                className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
                  lineup.isConfirmed
                    ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white cursor-pointer active:scale-98 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {lineup.isConfirmed
                    ? "Kadroyu Onayla ve Kilitle"
                    : `${slots.filter((s) => s.placedPlayer).length}/11 Oyuncuyu Sahaya Yerleştir`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rakip Analizi Modalı */}
      {showOpponentModal && nextOpponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0f1713] p-5 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                <span className="font-black text-base text-white">
                  Rakip Analizi: @{nextOpponent.username}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOpponentModal(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {nextOpponent.lineup ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-xs text-zinc-400 font-bold uppercase">Son Diziliş</span>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {nextOpponent.lineup.formation}
                  </span>
                </div>

                {/* Rakibin 4 Taktiği */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/8 flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">Tempo</span>
                    <span className="font-black text-amber-300 capitalize">
                      {nextOpponent.lineup.tactics?.tempo === "fast"
                        ? "Hızlı"
                        : nextOpponent.lineup.tactics?.tempo === "slow"
                        ? "Yavaş"
                        : "Dengeli"}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/8 flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">Oyun Kurma</span>
                    <span className="font-black text-cyan-300 capitalize">
                      {nextOpponent.lineup.tactics?.buildUp === "short_pass"
                        ? "Kısa Pas"
                        : nextOpponent.lineup.tactics?.buildUp === "long_ball"
                        ? "Uzun Top"
                        : "Dengeli"}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/8 flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">Pres</span>
                    <span className="font-black text-rose-300 capitalize">
                      {nextOpponent.lineup.tactics?.pressing === "high_press"
                        ? "Önde Pres"
                        : nextOpponent.lineup.tactics?.pressing === "park_bus"
                        ? "Otobüsü Park Et"
                        : "Dengeli"}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/8 flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 font-bold">Hücum Yönü</span>
                    <span className="font-black text-emerald-300 capitalize">
                      {nextOpponent.lineup.tactics?.attackDirection === "left"
                        ? "Sol Kanat"
                        : nextOpponent.lineup.tactics?.attackDirection === "right"
                        ? "Sağ Kanat"
                        : nextOpponent.lineup.tactics?.attackDirection === "center"
                        ? "Merkez"
                        : "Dengeli"}
                    </span>
                  </div>
                </div>

                {/* Rakibin Sahaya Sürdüğü 11 Oyuncu */}
                <div className="flex flex-col gap-1 mt-1 max-h-52 overflow-y-auto pr-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                    Rakip İlk 11 ({nextOpponent.lineup.slots.filter((s) => s.placedPlayer).length} Oyuncu)
                  </span>
                  {nextOpponent.lineup.slots.map((slot) => {
                    if (!slot.placedPlayer) return null;
                    const tier = getRatingTier(slot.placedPlayer.overallPrime);
                    return (
                      <div
                        key={slot.slotId}
                        className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`size-6 rounded flex items-center justify-center font-mono text-[10px] font-black shrink-0 ${tier.badgeClass}`}>
                            {slot.placedPlayer.overallPrime}
                          </span>
                          <span className="font-bold text-white truncate">
                            {slot.placedPlayer.fullName}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                          {slot.targetPosition}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : nextOpponent.squad && nextOpponent.squad.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-xs text-zinc-400 font-bold uppercase">Durum</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    İlk 11 & Taktik Seçimi Bekleniyor
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-0.5">
                    Satın Alınan Kadro ({nextOpponent.squad.length} Oyuncu)
                  </span>
                  {nextOpponent.squad.map((player) => {
                    const tier = getRatingTier(player.overallPrime);
                    const posList =
                      player.positions && player.positions.length > 0
                        ? player.positions
                        : [player.primaryPosition || "CM"];
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-1.5 px-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`size-6 rounded flex items-center justify-center font-mono text-[10px] font-black shrink-0 ${tier.badgeClass}`}
                          >
                            {player.overallPrime}
                          </span>
                          <span className="font-bold text-white truncate">
                            {player.fullName}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                          {posList.slice(0, 3).join("/")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 text-xs font-bold">
                Rakibin henüz oyuncu verisi bulunmuyor.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Oyuncu Pozisyon İnceleme Modalı */}
      {inspectingPlayer && (
        <AuctionPlayerDetailModal
          player={inspectingPlayer}
          onClose={() => {
            setInspectingPlayer(null);
            setInspectingSlot(null);
          }}
        />
      )}
    </div>
  );
}
