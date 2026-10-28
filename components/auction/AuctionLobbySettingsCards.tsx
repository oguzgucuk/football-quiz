"use client";

/**
 * Müzayede Lobisi Ayar Kartları.
 * - Başlangıç Bütçesi Kaydırıcısı ($20M - $100M)
 * - Baştan ve Sondan Çekilebilen Çift Uçlu (Dual-Thumb) Reyting Aralığı Kaydırıcısı (67 - 96 OVR)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AuctionLobbySettings } from "@/lib/auction/auctionTypes";
import { Coins, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AuctionLobbySettingsCardsProps {
  settings: AuctionLobbySettings;
  isHost: boolean;
  onUpdateSettings: (settings: Partial<AuctionLobbySettings>) => void;
}

const RATING_PRESETS = [
  { label: "Tümü", min: 67, max: 96 },
  { label: "70-85", min: 70, max: 85 },
  { label: "80-96", min: 80, max: 96 },
  { label: "Elit", min: 85, max: 96 },
];

const BUDGET_PRESETS = [20, 30, 50, 100];

export function AuctionLobbySettingsCards({
  settings,
  isHost,
  onUpdateSettings,
}: AuctionLobbySettingsCardsProps) {
  const currentBudget = settings?.startingBudget ?? 30;
  const currentMin = Math.max(67, Math.min(settings?.ratingMin ?? 70, 94));
  const currentMax = Math.max(currentMin + 2, Math.min(settings?.ratingMax ?? 96, 96));

  const [prevBudget, setPrevBudget] = useState(currentBudget);
  const [localBudget, setLocalBudget] = useState<number>(currentBudget);

  if (currentBudget !== prevBudget) {
    setPrevBudget(currentBudget);
    setLocalBudget(currentBudget);
  }

  const [prevRating, setPrevRating] = useState<[number, number]>([currentMin, currentMax]);
  const [localRating, setLocalRating] = useState<[number, number]>([currentMin, currentMax]);

  if (currentMin !== prevRating[0] || currentMax !== prevRating[1]) {
    setPrevRating([currentMin, currentMax]);
    setLocalRating([currentMin, currentMax]);
  }

  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Partial<AuctionLobbySettings> | null>(null);

  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  const emitThrottledSettings = useCallback(
    (newSettings: Partial<AuctionLobbySettings>) => {
      pendingUpdateRef.current = { ...pendingUpdateRef.current, ...newSettings };
      if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(() => {
          throttleTimerRef.current = null;
          if (pendingUpdateRef.current) {
            onUpdateSettings(pendingUpdateRef.current);
            pendingUpdateRef.current = null;
          }
        }, 80);
      }
    },
    [onUpdateSettings]
  );

  const emitImmediateSettings = useCallback(
    (newSettings: Partial<AuctionLobbySettings>) => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      const combined = { ...pendingUpdateRef.current, ...newSettings };
      pendingUpdateRef.current = null;
      onUpdateSettings(combined);
    },
    [onUpdateSettings]
  );

  const handleBudgetChange = (val: number[]) => {
    setLocalBudget(val[0]);
    emitThrottledSettings({ startingBudget: val[0] });
  };

  const handleBudgetCommit = (val: number[]) => {
    setLocalBudget(val[0]);
    emitImmediateSettings({ startingBudget: val[0] });
  };

  const handleRatingChange = (val: number[]) => {
    const minVal = Math.min(val[0], val[1] - 2);
    const maxVal = Math.max(val[1], minVal + 2);
    setLocalRating([minVal, maxVal]);
    emitThrottledSettings({ ratingMin: minVal, ratingMax: maxVal });
  };

  const handleRatingCommit = (val: number[]) => {
    const minVal = Math.min(val[0], val[1] - 2);
    const maxVal = Math.max(val[1], minVal + 2);
    setLocalRating([minVal, maxVal]);
    emitImmediateSettings({ ratingMin: minVal, ratingMax: maxVal });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* 1. Başlangıç Bütçesi Kartı */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            Başlangıç Bütçesi
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-400 font-mono font-black text-sm">
            ${localBudget}M
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Slider
            min={20}
            max={100}
            step={5}
            disabled={!isHost}
            value={[localBudget]}
            onValueChange={handleBudgetChange}
            onValueCommit={handleBudgetCommit}
            rangeClassName="bg-gradient-to-r from-amber-600 to-amber-400"
            thumbClassName="border-amber-400 bg-zinc-950 focus-visible:ring-amber-400 shadow-amber-500/30"
            className={`w-full ${isHost ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
          />
          <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono">
            <span>Min: $20M</span>
            {isHost && (
              <div className="flex gap-1.5 font-sans">
                {BUDGET_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setLocalBudget(amt);
                      emitImmediateSettings({ startingBudget: amt });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      localBudget === amt
                        ? "bg-amber-500/30 border-amber-500 text-amber-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ${amt}M
                  </button>
                ))}
              </div>
            )}
            <span>Maks: $100M</span>
          </div>
        </div>
      </div>

      {/* 2. Reyting Aralığı Kartı (Dual-Thumb Slider) */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Oyuncu Reyting Aralığı
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 font-mono font-black text-sm shadow-sm shadow-emerald-950">
            {localRating[0]} - {localRating[1]} OVR
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <Slider
            min={67}
            max={96}
            step={1}
            minStepsBetweenThumbs={2}
            disabled={!isHost}
            value={[localRating[0], localRating[1]]}
            onValueChange={handleRatingChange}
            onValueCommit={handleRatingCommit}
            rangeClassName="bg-gradient-to-r from-emerald-600 to-emerald-400"
            thumbClassName="border-emerald-400 bg-zinc-950 focus-visible:ring-emerald-400 shadow-emerald-500/30"
            className={`w-full ${isHost ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
          />

          <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono">
            <span>Min: {localRating[0]}</span>
            {isHost && (
              <div className="flex gap-1.5 font-sans">
                {RATING_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLocalRating([preset.min, preset.max]);
                      emitImmediateSettings({ ratingMin: preset.min, ratingMax: preset.max });
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      localRating[0] === preset.min && localRating[1] === preset.max
                        ? "bg-emerald-500/30 border-emerald-500 text-emerald-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
            <span>Maks: {localRating[1]}</span>
          </div>

          <span className="text-[10px] text-zinc-500">
            * En yüksek prime futbolcu 96 OVR&apos;dir (Ronaldo, Messi). Dar aralıklarda havuz otomatik dengelenir.
          </span>
        </div>
      </div>
    </div>
  );
}
