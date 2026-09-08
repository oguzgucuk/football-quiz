"use client";

/**
 * Müzayede Taktik Ekranı Oyuncularım Paneli.
 * - Kadrodaki oyuncuların listesi
 * - Sürükle ve bırak veya tıklayarak seçme
 * - Oynayabildiği pozisyonları inceleme (Info butonu)
 * - Sahadan yedeğe sürükleme bırakma hedefi
 */

import React, { useState } from "react";
import { AuctionPlayerCard } from "@/lib/auction/auctionTypes";
import { Move, Info, CheckCircle2 } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

interface AuctionSquadListProps {
  squad: AuctionPlayerCard[];
  placedPlayerIds: Set<string>;
  selectedPlayer: AuctionPlayerCard | null;
  draggedPlayerId: string | null;
  onSelectPlayer: (player: AuctionPlayerCard | null) => void;
  onInspectPlayer: (player: AuctionPlayerCard) => void;
  onDragStart: (e: React.DragEvent, player: AuctionPlayerCard) => void;
  onDragEnd: () => void;
  onDropOnBench?: (playerId: string) => void;
}

export function AuctionSquadList({
  squad,
  placedPlayerIds,
  selectedPlayer,
  draggedPlayerId,
  onSelectPlayer,
  onInspectPlayer,
  onDragStart,
  onDragEnd,
  onDropOnBench,
}: AuctionSquadListProps) {
  const [isBenchDragOver, setIsBenchDragOver] = useState(false);
  const unplacedCount = squad.length - placedPlayerIds.size;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isBenchDragOver) setIsBenchDragOver(true);
      }}
      onDragLeave={() => setIsBenchDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsBenchDragOver(false);
        const pId = e.dataTransfer.getData("text/plain") || draggedPlayerId;
        if (pId && onDropOnBench) {
          onDropOnBench(pId);
        }
      }}
      className={`p-4 rounded-2xl bg-black/50 border backdrop-blur-xl flex flex-col gap-2 max-h-[440px] overflow-y-auto transition-all ${
        isBenchDragOver
          ? "border-amber-400/80 bg-amber-950/20 ring-2 ring-amber-400/30"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
          Oyuncularım ({unplacedCount} Boşta)
        </span>
        <span className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
          <Move className="w-3 h-3" /> Sürükle / Tıkla
        </span>
      </div>

      {squad.map((player) => {
        const isPlaced = placedPlayerIds.has(player.id);
        const isSelected = selectedPlayer?.id === player.id;
        const isDraggingThis = draggedPlayerId === player.id;

        return (
          <div
            key={player.id}
            draggable={!isPlaced}
            onDragStart={(e) => onDragStart(e, player)}
            onDragEnd={onDragEnd}
            onClick={() => {
              if (isPlaced) {
                onInspectPlayer(player);
              } else {
                onSelectPlayer(isSelected ? null : player);
              }
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              isPlaced
                ? "opacity-50 bg-black/40 border-white/5 hover:border-white/20 cursor-pointer"
                : isDraggingThis
                ? "opacity-40 scale-95 border-emerald-500 shadow-md cursor-grabbing"
                : isSelected
                ? "bg-emerald-950/70 border-emerald-500 shadow-md cursor-pointer"
                : "bg-white/5 border-white/10 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {(() => {
                const playerTier = getRatingTier(player.overallPrime);
                return (
                  <span className={`font-mono font-black text-xs px-1.5 py-0.5 rounded ${playerTier.badgeSubtle}`}>
                    {player.overallPrime}
                  </span>
                );
              })()}
              <span className="text-xs font-bold text-white truncate">
                {player.fullName}
              </span>
              {isPlaced && (
                <span className="text-[9px] font-bold text-emerald-400/80 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Sahada
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400">
                {player.positions.join("/")}
              </span>
              <button
                type="button"
                title="Oynayabildiği Pozisyonları Gör"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectPlayer(player);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
