"use client";

/**
 * Müzayede Lobisi Ayar Kartları.
 * - Başlangıç Bütçesi Kaydırıcısı ($20M - $100M)
 * - Baştan ve Sondan Çekilebilen Çift Uçlu (Dual-Thumb) Reyting Aralığı Kaydırıcısı (67 - 99 OVR)
 */

import React from "react";
import { AuctionLobbySettings } from "@/lib/auction/auctionTypes";
import { Coins, Sparkles } from "lucide-react";

interface AuctionLobbySettingsCardsProps {
  settings: AuctionLobbySettings;
  isHost: boolean;
  onUpdateSettings: (settings: Partial<AuctionLobbySettings>) => void;
}

export function AuctionLobbySettingsCards({
  settings,
  isHost,
  onUpdateSettings,
}: AuctionLobbySettingsCardsProps) {
  const minPercent = Math.min(100, Math.max(0, ((settings.ratingMin - 67) / 29) * 100));
  const maxPercent = Math.min(100, Math.max(0, ((settings.ratingMax - 67) / 29) * 100));
  const rangeWidth = Math.max(0, maxPercent - minPercent);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* 1. Başlangıç Bütçesi Kartı */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            Başlangıç Bütçesi
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-400 font-mono font-black text-sm">
            ${settings.startingBudget}M
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            disabled={!isHost}
            value={settings.startingBudget}
            onChange={(e) => onUpdateSettings({ startingBudget: Number(e.target.value) })}
            className={`w-full accent-emerald-500 ${isHost ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
          />
          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono">
            <span>Min: $20M</span>
            {isHost && (
              <div className="flex gap-1.5 font-sans">
                {[20, 30, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => onUpdateSettings({ startingBudget: amt })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      settings.startingBudget === amt
                        ? "bg-amber-500/30 border-amber-500 text-amber-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            )}
            <span>Maks: $100M</span>
          </div>
        </div>
      </div>

      {/* 2. Reyting Aralığı Kartı (Tek Çubukta İki Uçtan Sürüklenebilir Dual-Thumb Slider) */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Oyuncu Reyting Aralığı
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 font-mono font-black text-sm shadow-sm shadow-emerald-950">
            {settings.ratingMin} - {settings.ratingMax} OVR
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Çift Uçlu (Dual-Thumb) Kaydırıcı Çubuğu */}
          <div className="relative w-full h-8 flex items-center">
            {/* Arka plan rayı */}
            <div className="absolute w-full h-2 rounded-full bg-zinc-800/90 border border-white/10" />

            {/* Seçilen aralığı vurgulayan yeşil çizgi */}
            <div
              className="absolute h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
              style={{
                left: `${minPercent}%`,
                width: `${rangeWidth}%`,
              }}
            />

            {/* Minimum Değer Thumb'ı */}
            <input
              type="range"
              min="67"
              max="96"
              step="1"
              disabled={!isHost}
              value={settings.ratingMin}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), settings.ratingMax - 2);
                onUpdateSettings({ ratingMin: val });
              }}
              className={`absolute w-full h-2 appearance-none bg-transparent pointer-events-none ${
                settings.ratingMin > 85 ? "z-30" : "z-20"
              } [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:cursor-grab`}
            />

            {/* Maksimum Değer Thumb'ı */}
            <input
              type="range"
              min="67"
              max="96"
              step="1"
              disabled={!isHost}
              value={settings.ratingMax}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), settings.ratingMin + 2);
                onUpdateSettings({ ratingMax: val });
              }}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-grab"
            />
          </div>

          {/* Alt Bilgi ve Hızlı Seçim Butonları */}
          <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono">
            <span>Min: {settings.ratingMin}</span>
            {isHost && (
              <div className="flex gap-1.5 font-sans">
                {[
                  { label: "Tümü", min: 67, max: 96 },
                  { label: "70-85", min: 70, max: 85 },
                  { label: "80-96", min: 80, max: 96 },
                  { label: "Elit", min: 85, max: 96 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onUpdateSettings({ ratingMin: preset.min, ratingMax: preset.max })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      settings.ratingMin === preset.min && settings.ratingMax === preset.max
                        ? "bg-emerald-500/30 border-emerald-500 text-emerald-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            <span>Maks: {settings.ratingMax}</span>
          </div>

          <span className="text-[10px] text-zinc-500 italic">
            * En yüksek prime futbolcu 96 OVR&apos;dir (Ronaldo, Messi). Yetersiz dar aralıklarda havuz otomatik olarak en iyi yıldızlarla güvenceye alınır.
          </span>
        </div>
      </div>
    </div>
  );
}
