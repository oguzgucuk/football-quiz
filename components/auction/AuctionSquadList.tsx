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
import { Move, Info } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import { groupSquadByPositions, POSITION_CATEGORY_CONFIG } from "@/lib/auction/playerCategoryClassifier";

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
  disabled?: boolean;
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
  disabled = false,
}: AuctionSquadListProps) {
  const [isBenchDragOver, setIsBenchDragOver] = useState(false);
  const unplacedCount = squad.length - placedPlayerIds.size;
  const grouped = groupSquadByPositions(squad);

  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isBenchDragOver) setIsBenchDragOver(true);
      }}
      onDragLeave={() => setIsBenchDragOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setIsBenchDragOver(false);
        const pId = e.dataTransfer.getData("text/plain") || draggedPlayerId;
        if (pId && onDropOnBench) {
          onDropOnBench(pId);
        }
      }}
      className={`p-3.5 rounded-2xl bg-black/50 border backdrop-blur-xl flex flex-col gap-3 max-h-[600px] xl:max-h-[640px] overflow-y-auto custom-scrollbar transition-all ${
        isBenchDragOver
          ? "border-amber-400/80 bg-amber-950/20 ring-2 ring-amber-400/30"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
          Oyuncularım ({unplacedCount} Boşta)
        </span>
        {disabled ? (
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded">
            🔒 Kadro Kilitli
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
            <Move className="w-3 h-3" /> Sürükle / Tıkla
          </span>
        )}
      </div>

      {(["gk", "def", "mid", "fwd"] as const).map((catKey) => {
        const cfg = POSITION_CATEGORY_CONFIG[catKey];
        const categoryPlayers = grouped[catKey];

        if (categoryPlayers.length === 0) return null;

        return (
          <div key={catKey} className="flex flex-col gap-1.5">
            {/* Kategori Başlığı */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <span className={`px-1.5 py-0.2 rounded border text-[9px] ${cfg.accentBadge}`}>
                  {cfg.label}
                </span>
                <span>{cfg.fullLabel}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-zinc-400">
                {categoryPlayers.length}
              </span>
            </div>

            {/* Oyuncu Kartları */}
            {categoryPlayers.map((player) => {
              const isPlaced = placedPlayerIds.has(player.id);
              const isSelected = selectedPlayer?.id === player.id;
              const isDraggingThis = draggedPlayerId === player.id;
              const playerTier = getRatingTier(player.overallPrime);
              const primary = player.primaryPosition || player.positions[0] || "CM";
              const posList =
                player.positions && player.positions.length > 0
                  ? player.positions
                  : [primary];

              return (
                <div
                  key={player.id}
                  draggable={!disabled && !isPlaced}
                  onDragStart={(e) => onDragStart(e, player)}
                  onDragEnd={onDragEnd}
                  onClick={() => {
                    if (disabled || isPlaced) {
                      onInspectPlayer(player);
                    } else {
                      onSelectPlayer(isSelected ? null : player);
                    }
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    disabled
                      ? isPlaced
                        ? "opacity-60 bg-black/40 border-white/5 cursor-pointer"
                        : "bg-white/5 border-white/10 cursor-pointer"
                      : isPlaced
                      ? "opacity-50 bg-black/40 border-white/5 hover:border-white/20 cursor-pointer"
                      : isDraggingThis
                      ? "opacity-40 scale-95 border-emerald-500 shadow-md cursor-grabbing"
                      : isSelected
                      ? "bg-emerald-950/70 border-emerald-500 shadow-md cursor-pointer"
                      : "bg-white/5 border-white/10 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`font-mono font-black text-xs px-1.5 py-0.5 rounded shrink-0 ${playerTier.badgeSubtle}`}
                    >
                      {player.overallPrime}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {player.fullName}
                    </span>
                    {isPlaced && (
                      <span className="text-[9px] font-bold text-emerald-400/80 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                        Sahada
                      </span>
                    )}
                  </div>

                  {/* Ayrıntılı Mevkiler ve Detay Butonu */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span
                      className="text-[10px] font-mono font-bold text-zinc-300 bg-white/10 border border-white/15 px-1.5 py-0.5 rounded cursor-default max-w-[90px] truncate"
                      title={`Oynayabildiği Mevkiler: ${posList.join(", ")}`}
                    >
                      {posList.join(" / ")}
                    </span>

                    <button
                      type="button"
                      title="Oynayabildiği Pozisyonları Gör"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectPlayer(player);
                      }}
                      className="p-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-300 transition-colors cursor-pointer border border-white/10"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
