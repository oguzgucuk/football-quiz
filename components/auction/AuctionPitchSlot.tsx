"use client";

/**
 * Müzayede Saha Pozisyon Slotu Bileşeni.
 * - Sürükle ve bırak (Drag and Drop) hedef ve kaynak desteği
 * - Dinamik mevkii cezası ve efektif reyting gösterimi
 * - Tıklayarak oynayabildiği pozisyonları görme modalı açma
 * - Hızlı sahadan çıkarma (X) butonu
 */

import React, { useRef } from "react";
import { PitchPosition, SquadSlot } from "@/lib/auction/auctionTypes";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RefreshCw, X } from "lucide-react";

interface AuctionPitchSlotProps {
  slot: SquadSlot;
  def?: { xPercent: number; yPercent: number; label: string };
  index: number;
  isDragOver: boolean;
  isAnyDragging: boolean;
  onClick: () => void;
  onRemove?: () => void;
  changeablePositions: PitchPosition[];
  onPositionChange: (position: PitchPosition) => void;
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
  onRemove,
  changeablePositions,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: AuctionPitchSlotProps) {
  const p = slot.placedPlayer;
  const pTier = p ? getRatingTier(slot.effectiveRating) : null;
  const isDraggingRef = useRef(false);
  const alternativePositions = changeablePositions.filter((position) => position !== slot.targetPosition);

  const handleDragStartWrapper = (e: React.DragEvent) => {
    isDraggingRef.current = true;
    onDragStart(e);
  };

  const handleDragEndWrapper = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
    onDragEnd();
  };

  const handleClickWrapper = (e: React.MouseEvent) => {
    if (isDraggingRef.current) return;
    onClick();
  };

  return (
    <div
      onClick={handleClickWrapper}
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
        onDragStart={handleDragStartWrapper}
        onDragEnd={handleDragEndWrapper}
        className={`relative flex size-12 sm:size-14 items-center justify-center rounded-2xl border-2 transition-all duration-200 shadow-xl ${
          isDragOver
            ? "scale-115 ring-4 ring-cyan-400 border-cyan-300 bg-cyan-900/90 shadow-[0_0_25px_rgba(6,182,212,0.9)] z-30"
            : p && pTier
            ? slot.penalty > 0
              ? "bg-amber-950/90 border-amber-500 text-amber-200 group-hover:scale-105 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-amber-400/50"
              : `${pTier.cardBorder} ${pTier.badgeSubtle} group-hover:scale-105 cursor-grab active:cursor-grabbing hover:ring-2 shadow-lg`
            : isAnyDragging
            ? "bg-black/60 border-emerald-400/60 border-dashed text-emerald-300 animate-pulse scale-105"
            : "bg-black/50 border-white/30 text-zinc-400 hover:border-white/60 group-hover:scale-105"
        }`}
      >
        {/* Hızlı Sahadan Çıkar (X) Butonu */}
        {p && onRemove && (
          <button
            type="button"
            title="Kadro dışına çıkar"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}

        {alternativePositions.length > 0 && (
          <div className="absolute -bottom-2.5 -right-2.5 z-30">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Mevkiyi değiştir"
                  aria-label="Mevkiyi değiştir"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-6 items-center justify-center rounded-full border-2 border-[#0d2a1a] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_3px_10px_rgba(16,185,129,0.55)] transition-transform hover:scale-110 hover:from-emerald-300 hover:to-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <RefreshCw className="size-3.5" strokeWidth={2.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="w-auto min-w-32 rounded-xl border-emerald-400/35 p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <PopoverArrow className="fill-[#0e1319]" width={10} height={5} />
                <p className="mb-1.5 px-1 text-[9px] font-black uppercase tracking-widest text-emerald-300/80">
                  Mevki değiştir
                </p>
                <div className="flex flex-wrap gap-1">
                {alternativePositions.map((position) => (
                  <button
                    key={position}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPositionChange(position);
                    }}
                    className="rounded-md border border-emerald-400/30 bg-emerald-950/50 px-2 py-1.5 font-mono text-[10px] font-black text-emerald-100 transition-colors hover:border-emerald-300 hover:bg-emerald-500 hover:text-white"
                  >
                    {position}
                  </button>
                ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {p && pTier ? (
          <div className="flex flex-col items-center">
            <span
              className={`font-mono font-black text-sm sm:text-base leading-none ${
                slot.penalty > 0 ? "text-amber-200" : pTier.accentText
              }`}
            >
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
            ? "bg-black/85 border-white/15 text-white group-hover:border-emerald-400/60"
            : isDragOver
            ? "bg-emerald-950 border-emerald-400 text-emerald-300"
            : "bg-black/60 border-white/10 text-zinc-300"
        }`}
      >
        {p ? p.fullName.split(" ").slice(-1)[0] : slot.targetPosition}
      </span>
    </div>
  );
}
