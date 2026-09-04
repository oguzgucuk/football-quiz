"use client";

/**
 * Uygulama genelinde kullanılan, tam ekran optimize stadyum arka plan bileşeni.
 * Light (Pano, Oyna, Profil, Mağaza) ve Dark (1v1 Maç Odası) modlarını destekler.
 * Top bar ve social barın arkasında da kesintisiz görünmesi için tam kaplama uygular.
 */

import React from "react";

interface StadiumBackgroundProps {
  variant?: "light" | "dark";
  opacity?: number;
}

export function StadiumBackground({ variant = "light", opacity }: StadiumBackgroundProps) {
  const isDark = variant === "dark";
  const defaultOpacity = isDark ? 0.45 : 0.82;
  const activeOpacity = opacity !== undefined ? opacity : defaultOpacity;

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <div
        className="w-full h-full bg-center bg-cover bg-no-repeat transition-opacity duration-700"
        style={{
          backgroundImage: "url('/stadium-bg.webp')",
          opacity: activeOpacity,
          filter: isDark
            ? "saturate(1.1) contrast(1.1) brightness(0.75)"
            : "saturate(1.08) contrast(1.04) brightness(0.98)",
        }}
      />
    </div>
  );
}
