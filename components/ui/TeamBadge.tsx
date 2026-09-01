"use client";

import React, { useState } from "react";
import { getTeamInitials, generateFallbackBadgeSvg } from "@/lib/ui/generateFallbackBadge";
import { Team } from "@/types/game";

interface TeamBadgeProps {
  team?: Team | null;
  name?: string;
  teamName?: string;
  teamId?: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showFallbackOnLoading?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 sm:w-20 sm:h-20 text-base sm:text-xl",
  "2xl": "w-24 h-24 sm:w-28 sm:h-28 text-xl sm:text-2xl",
};

export function TeamBadge({
  team,
  name,
  teamName: aliasTeamName,
  logoUrl,
  size = "md",
  className = "",
}: TeamBadgeProps) {
  const teamName = team?.name || aliasTeamName || name || "Kulüp";
  let finalLogoUrl = team?.logoUrl ?? logoUrl;
  if (finalLogoUrl) {
    // Tarayıcının eski yanlış logoları önbellekte tutmasını önlemek için cache-buster
    finalLogoUrl += finalLogoUrl.includes("?") ? "&v=2" : "?v=2";
  }
  
  const [imgError, setImgError] = useState(false);

  // Logo varsa ve hata vermediyse görseli render et
  if (finalLogoUrl && !imgError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden bg-zinc-900/60 p-1.5 border border-zinc-700/50 shadow-md shrink-0 transition-transform duration-200 ${SIZE_CLASSES[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={finalLogoUrl}
          alt={`${teamName} Logo`}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain drop-shadow-md"
        />
      </div>
    );
  }

  // Logo yoksa veya yüklenirken hata verdiyse: Saf Client-Side SVG Fallback Rozeti
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
    generateFallbackBadgeSvg(teamName)
  )}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl overflow-hidden p-0.5 shadow-md shrink-0 transition-transform duration-200 ${SIZE_CLASSES[size]} ${className}`}
      title={teamName}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={svgDataUrl}
        alt={`${teamName} Rozet`}
        className="w-full h-full object-contain"
        aria-hidden="true"
      />
    </div>
  );
}
