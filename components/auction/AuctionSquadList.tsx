"use client";

/**
 * Müzayede Taktik Ekranı Oyuncularım Paneli.
 * - Kadrodaki oyuncuların listesi
 * - Sürükle ve bırak veya tıklayarak seçme
 */

import React from "react";
import { AuctionPlayerCard } from "@/lib/auction/auctionTypes";
import { Move } from "lucide-react";

interface AuctionSquadListProps {
  squad: AuctionPlayerCard[];
  placedPlayerIds: Set<string>;
  selectedPlayer: AuctionPlayerCard | null;
  draggedPlayerId: string | null;
  onSelectPlayer: (player: AuctionPlayerCard | null) => void;
  onDragStart: (e: React.DragEvent, player: AuctionPlayerCard) => void;
  onDragEnd: () => void;
}

export function AuctionSquadList({
  squad,
  placedPlayerIds,
  selectedPlayer,
  draggedPlayerId,
  onSelectPlayer,
  onDragStart,
  onDragEnd,
}: AuctionSquadListProps) {
  const unplacedCount = squad.length - placedPlayerIds.size;

  return (
    <div className="p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-2 max-h-[440px] overflow-y-auto">
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
            onClick={() => !isPlaced && onSelectPlayer(isSelected ? null : player)}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              isPlaced
                ? "opacity-30 bg-black/30 border-white/5 cursor-not-allowed"
                : isDraggingThis
                ? "opacity-40 scale-95 border-emerald-500 shadow-md cursor-grabbing"
                : isSelected
                ? "bg-emerald-950/70 border-emerald-500 shadow-md cursor-pointer"
                : "bg-white/5 border-white/10 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing"
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
  );
}
