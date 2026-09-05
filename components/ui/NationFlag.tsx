"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";

export type FlagSize = "xs" | "sm" | "md" | "lg" | "xl";

interface NationFlagProps {
  flagCode?: string | null;
  name?: string | null;
  size?: FlagSize;
  className?: string;
}

const SIZE_CONFIGS: Record<
  FlagSize,
  {
    containerClass: string;
    cdnWidth: number;
    cdnWidth2x: number;
    fallbackTextClass: string;
    globeSize: string;
  }
> = {
  xs: {
    containerClass: "w-5 h-3.5 rounded-xs",
    cdnWidth: 40,
    cdnWidth2x: 80,
    fallbackTextClass: "text-[9px]",
    globeSize: "size-2.5",
  },
  sm: {
    containerClass: "w-7 h-5 rounded-xs",
    cdnWidth: 80,
    cdnWidth2x: 160,
    fallbackTextClass: "text-[10px]",
    globeSize: "size-3.5",
  },
  md: {
    containerClass: "w-10 h-7 rounded-md",
    cdnWidth: 80,
    cdnWidth2x: 160,
    fallbackTextClass: "text-xs",
    globeSize: "size-4",
  },
  lg: {
    containerClass: "w-14 h-9.5 rounded-lg",
    cdnWidth: 160,
    cdnWidth2x: 320,
    fallbackTextClass: "text-sm",
    globeSize: "size-5",
  },
  xl: {
    containerClass: "w-20 h-13.5 rounded-xl",
    cdnWidth: 160,
    cdnWidth2x: 320,
    fallbackTextClass: "text-base",
    globeSize: "size-7",
  },
};

/**
 * FlagCDN üzerinden yüksek çözünürlüklü, retina uyumlu ve
 * cam efektli modern ülke bayrağı bileşeni.
 */
export function NationFlag({
  flagCode,
  name = "Ülke",
  size = "md",
  className = "",
}: NationFlagProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedCode = (flagCode || "").trim().toLowerCase();
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;

  if (!normalizedCode || hasError) {
    return (
      <div
        title={name || "Bilinmeyen Ülke"}
        className={`inline-flex items-center justify-center bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-mono font-black shrink-0 select-none shadow-xs ${config.containerClass} ${className}`}
      >
        {normalizedCode ? (
          <span className={`uppercase ${config.fallbackTextClass}`}>
            {normalizedCode.slice(0, 2)}
          </span>
        ) : (
          <Globe className={`${config.globeSize} text-emerald-400/80`} />
        )}
      </div>
    );
  }

  const src = `https://flagcdn.com/w${config.cdnWidth}/${normalizedCode}.png`;
  const srcSet = `https://flagcdn.com/w${config.cdnWidth}/${normalizedCode}.png 1x, https://flagcdn.com/w${config.cdnWidth2x}/${normalizedCode}.png 2x`;

  return (
    <div
      title={name || undefined}
      className={`relative inline-flex items-center justify-center overflow-hidden border border-white/20 bg-black/40 shrink-0 shadow-md transition-transform ${config.containerClass} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={srcSet}
        alt={name ? `${name} Bayrağı` : "Ülke Bayrağı"}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover select-none pointer-events-none"
      />
    </div>
  );
}
