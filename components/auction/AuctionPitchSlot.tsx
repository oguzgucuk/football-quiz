"use client";

/**
 * Müzayede Saha Pozisyon Slotu Bileşeni.
 * - Sürükle ve bırak (Drag and Drop) hedef ve kaynak desteği
 * - Dinamik mevkii cezası ve efektif reyting gösterimi
 * - Tıklayarak yerleştirme veya kaldırma
 */

import React from "react";
import { SquadSlot } from "@/lib/auction/auctionTypes";

interface AuctionPitchSlotProps {
  slot: SquadSlot;
  def?: { xPercent: number; yPercent: number; label: string };
  index: number;
  isDragOver: boolean;
  isAnyDragging: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export function AuctionPitchSlot({
  slot,
  def,
  index,
  isDragOver,
  isAnyDragging,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: AuctionPitchSlotProps) {
  const p = slot.placedPlayer;

  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        left: `${def?.xPercent || 50}%`,
        top: `${def?.yPercent || 50}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10 select-none"
    >
      {/* Slot Dairesi (Tutup Sürüklenebilir veya Üzerine Bırakılabilir) */}
      <div
        draggable={Boolean(p)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`relative flex size-12 sm:size-14 items-center justify-center rounded-2xl border-2 transition-all duration-200 shadow-xl ${
          isDragOver
            ? "scale-115 ring-4 ring-emerald-400 border-emerald-300 bg-emerald-900/90 shadow-[0_0_25px_rgba(16,185,129,0.9)] z-30"
            : p
            ? slot.penalty > 0
              ? "bg-amber-950/90 border-amber-500 text-amber-200 group-hover:scale-105 cursor-grab active:cursor-grabbing"
              : "bg-emerald-950/90 border-emerald-400 text-emerald-200 group-hover:scale-105 cursor-grab active:cursor-grabbing"
            : isAnyDragging
            ? "bg-black/60 border-emerald-400/60 border-dashed text-emerald-300 animate-pulse scale-105"
            : "bg-black/50 border-white/30 text-zinc-400 hover:border-emerald-400/80 group-hover:scale-105"
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
      <span
        className={`mt-1 px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-bold max-w-[90px] truncate text-center shadow-md transition-colors ${
          p
            ? "bg-black/85 border-white/15 text-white"
            : isDragOver
            ? "bg-emerald-950 border-emerald-400 text-emerald-300"
            : "bg-black/60 border-white/10 text-zinc-300"
        }`}
      >
        {p ? p.fullName.split(" ").slice(-1)[0] : def?.label || slot.targetPosition}
      </span>
    </div>
  );
}
