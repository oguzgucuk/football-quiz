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
import { CheckCircle2, Timer, RotateCcw, Search, X, Shield } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

const FORMATIONS: FormationName[] = [
  "3-5-2", "3-4-2-1", "3-4-3", "4-4-2(1)", "4-4-2(2)",
  "4-5-1", "4-3-3", "4-2-4", "5-3-2", "5-2-3", "5-4-1(1)", "5-4-1(2)",
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
  nextOpponent?: {
    username: string;
    lineup?: TeamLineup;
    squad?: AuctionPlayerCard[];
    isFirstMatch?: boolean;
  };
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
  // Önceki 11 varsa doğrudan koru, yoksa 4-3-3 boş yuvalar
  const [formation, setFormation] = useState<FormationName>(
    () => initialLineup?.formation || "4-3-3"
  );
  const [slots, setSlots] = useState<SquadSlot[]>(() => {
    if (initialLineup?.slots && initialLineup.slots.length === 11) {
      return initialLineup.slots;
    }
    return createInitialSlotsForFormation("4-3-3");
  });
  const [tactics, setTactics] = useState<TeamTactics>(() => {
    return initialLineup?.tactics || {
      tempo: "balanced",
      buildUp: "balanced",
      pressing: "balanced",
      attackDirection: "balanced",
      transition: "balanced",
      chanceCreation: "balanced",
    };
  });

  const [selectedPlayer, setSelectedPlayer] = useState<AuctionPlayerCard | null>(null);

  // Optimistic iptal desteği
  const [isLocallyUnconfirmed, setIsLocallyUnconfirmed] = useState(false);
  const serverConfirmed = confirmedUserIds.includes(userId);
  const isConfirmed = serverConfirmed && (!isLocallyUnconfirmed || secondsLeft <= 1);

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

  // Sürükle-Bırak Durumu
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [draggedFromSlotIndex, setDraggedFromSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);
  const suppressSlotClickRef = useRef(false);
  const suppressSlotClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const existingPlayers = slots.map((s) => s.placedPlayer).filter(Boolean) as AuctionPlayerCard[];
    // Retain the selected players, placing them by suitability instead of old
    // slot indexes (which can put a fullback into midfield after a shape change).
    setSlots(autoAssignSquadToFormation(existingPlayers, f));
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
    if (suppressSlotClickRef.current) return;

    if (selectedPlayer) {
      handlePlayerDropOnSlot(selectedPlayer.id, index, null);
    } else {
      const slot = slots[index];
      if (slot?.placedPlayer) {
        setInspectingPlayer(slot.placedPlayer);
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
    }
  };

  const resetDragState = () => {
    suppressSlotClickRef.current = true;
    if (suppressSlotClickTimerRef.current) clearTimeout(suppressSlotClickTimerRef.current);
    suppressSlotClickTimerRef.current = setTimeout(() => {
      suppressSlotClickRef.current = false;
    }, 250);
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
    <div className="w-full flex flex-col gap-2.5 select-none animate-fadeIn">
      {/* Üst Bilgi Barı */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl min-h-[52px]">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
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
              <span>Rakip Kadrosu (@{nextOpponent.username})</span>
            </button>
          )}
        </div>

        {/* Kalan Süre Ortada */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-xl bg-black/60 border border-white/15 shadow-md">
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
          <div className="relative aspect-[9/13] w-full max-w-[440px] lg:max-w-[min(440px,calc((100dvh-180px)*9/13))] rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-[#0c2417] shadow-2xl p-4 flex flex-col justify-between select-none">
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
              {(tactics.attackDirection === "left" || tactics.attackDirection === "wings") && (
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
              {(tactics.attackDirection === "right" || tactics.attackDirection === "wings") && (
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
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-2">
          {/* Diziliş Seçimi */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/50 p-3">
            <label htmlFor="auction-formation" className="text-xs font-bold text-zinc-300">Diziliş</label>
            <button type="button" disabled={isConfirmed || slots.every((slot) => slot.placedPlayer)}
              onClick={() => setSlots(autoAssignSquadToFormation(squad, formation, slots))}
              className="min-h-9 rounded-lg border border-white/15 px-2 text-xs text-zinc-200 hover:bg-white/10 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-white">
              Boşları doldur
            </button>
            <select id="auction-formation" value={formation} disabled={isConfirmed}
              onChange={(event) => handleFormationChange(event.target.value as FormationName)}
              className="min-h-9 rounded-lg border border-emerald-500/40 bg-emerald-950 px-3 text-sm font-bold text-emerald-200 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-60">
              {FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Maç planı */}
          <AuctionTacticsSelector
            tactics={tactics}
            onChange={setTactics}
            disabled={isConfirmed}
          />

          {/* Kadro Onay & İptal Paneli */}
          <div className="p-3 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-2">

            {isConfirmed ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kadro kilitli · Diğer oyuncular bekleniyor</span>
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

      {/* Rakip Analizi Modalı (Sadece Oyuncular, Taktikler Gizli) */}
      {showOpponentModal && nextOpponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            {(() => {
              const players: AuctionPlayerCard[] =
                nextOpponent.squad && nextOpponent.squad.length > 0
                  ? nextOpponent.squad
                  : (nextOpponent.lineup?.slots
                      .map((s) => s.placedPlayer)
                      .filter(Boolean) as AuctionPlayerCard[]) || [];

              const avgGen =
                typeof nextOpponent.lineup?.teamOvr === "number" && nextOpponent.lineup.teamOvr > 0
                  ? nextOpponent.lineup.teamOvr
                  : players.length > 0
                  ? Math.round(players.reduce((sum, p) => sum + p.overallPrime, 0) / players.length)
                  : null;

              return (
                <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0f1713] p-5 shadow-2xl flex flex-col gap-4 text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <Search className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span className="font-black text-base text-white truncate max-w-[200px] sm:max-w-xs">
                        Rakip Kadrosu: @{nextOpponent.username}
                      </span>
                      {avgGen && (
                        <span className="flex items-center gap-1 font-mono text-xs font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-lg shadow-sm">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase">Ort. GEN</span>
                          <span>{avgGen}</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOpponentModal(false)}
                      className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-2 text-indigo-200 text-xs font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">Rakibin taktik ve dizilişi gizlidir. Yalnızca oyuncu havuzu gösterilir.</span>
                    </div>
                    {avgGen && (
                      <span className="shrink-0 font-mono font-black text-emerald-300 bg-black/50 border border-emerald-500/40 px-2 py-0.5 rounded-md text-[11px]">
                        GEN {avgGen}
                      </span>
                    )}
                  </div>

                  {players.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 text-xs font-semibold">
                      Henüz transfer edilen oyuncu bulunmuyor.
                    </div>
                  ) : (
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-0.5">
                    Kadro Havuzu ({players.length} Oyuncu)
                  </span>
                  {players.map((player) => {
                    const tier = getRatingTier(player.overallPrime);
                    const posList =
                      player.positions && player.positions.length > 0
                        ? player.positions
                        : [player.primaryPosition || "CM"];
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 px-3 rounded-xl bg-white/5 border border-white/8 text-xs hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`size-6.5 rounded-lg flex items-center justify-center font-mono text-[11px] font-black shrink-0 ${tier.badgeClass}`}
                          >
                            {player.overallPrime}
                          </span>
                          <span className="font-bold text-white truncate" title={player.fullName}>
                            {player.fullName}
                          </span>
                        </div>
                            <span
                              className="font-mono font-bold text-zinc-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded text-[10px] shrink-0 ml-2"
                              title={`Oynayabildiği Mevkiler: ${posList.join(", ")}`}
                            >
                              {posList.join(" / ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
        </div>
      )}

      {/* Oyuncu Pozisyon İnceleme Modalı */}
      {inspectingPlayer && (
        <AuctionPlayerDetailModal
          player={inspectingPlayer}
          onClose={() => {
            setInspectingPlayer(null);
          }}
        />
      )}
    </div>
  );
}
