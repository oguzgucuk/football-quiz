"use client";

import React from "react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import { Sparkles, Gem, Trophy, Award } from "lucide-react";

export type RatingBadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

interface RatingBadgeProps {
  rating: number | null | undefined;
  size?: RatingBadgeSize;
  showIcon?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<RatingBadgeSize, string> = {
  xs: "size-6 text-[10px] rounded-md",
  sm: "size-8 text-xs rounded-lg",
  md: "size-11 text-base rounded-xl",
  lg: "size-14 text-2xl rounded-2xl",
  xl: "size-18 text-3xl rounded-2xl",
};

export function RatingBadge({
  rating,
  size = "md",
  showIcon = false,
  className = "",
}: RatingBadgeProps) {
  const tier = getRatingTier(rating);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center font-mono font-black tracking-tighter ${sizeClass} ${tier.badgeClass} ${className}`}
    >
      {rating ?? "?"}

      {showIcon && tier.tier === "diamond" && (
        <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-sm animate-pulse">
          <Gem className="size-2.5" />
        </span>
      )}
    </div>
  );
}
