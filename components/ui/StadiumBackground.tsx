"use client";

/**
 * Uygulama genelinde kullanılan, çevreye yayıldıkça yumuşakça saydamlaşan
 * optimize stadyum arka plan bileşeni.
 * Light (Pano, Oyna, Profil, Mağaza) ve Dark (1v1 Maç Odası) modlarını destekler.
 */

import React from "react";

interface StadiumBackgroundProps {
  variant?: "light" | "dark";
  opacity?: number;
}

export function StadiumBackground({ variant = "light", opacity }: StadiumBackgroundProps) {
  const isDark = variant === "dark";
  const defaultOpacity = isDark ? 0.3 : 0.5;
  const activeOpacity = opacity !== undefined ? opacity : defaultOpacity;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <div
        className="w-full h-full bg-center bg-cover bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: "url('/stadium-bg.webp')",
          opacity: activeOpacity,
          filter: isDark
            ? "saturate(0.85) contrast(1.1) brightness(0.7)"
            : "saturate(0.82) contrast(0.95)",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 50%, black 35%, rgba(0,0,0,0.65) 70%, transparent 96%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 50%, black 35%, rgba(0,0,0,0.65) 70%, transparent 96%)",
        }}
      />
    </div>
  );
}
