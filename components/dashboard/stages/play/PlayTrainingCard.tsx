"use client";

import React from "react";
import { Dumbbell, Database, Timer, Layers, HelpCircle, Lock } from "lucide-react";

export type TrainingSubMode = "players" | "solo" | "tactics";

export const TRAINING_SUB_MODES = [
  {
    id: "players" as const,
    name: "Oyuncular",
    subtitle: "Veritabanı & Zirve Reytingler",
    icon: Database,
    badge: "Gözat",
    isAvailable: true,
  },
  {
    id: "solo" as const,
    name: "Solo Pratik",
    subtitle: "Zamana Karşı Hazırlık",
    icon: Timer,
    badge: "Yakında Gelecek",
    isAvailable: false,
  },
  {
    id: "tactics" as const,
    name: "Taktik & Draft",
    subtitle: "Kadro & Analiz Simülatörü",
    icon: Layers,
    badge: "Yakında Gelecek",
    isAvailable: false,
  },
];

interface PlayTrainingCardProps {
  isSelected: boolean;
  onSelect: () => void;
  selectedSubMode: TrainingSubMode;
  onSelectSubMode: (subMode: TrainingSubMode) => void;
  onOpenGuide: () => void;
}

export function PlayTrainingCard({
  isSelected,
  onSelect,
  selectedSubMode,
  onSelectSubMode,
  onOpenGuide,
}: PlayTrainingCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-between p-6 lg:p-7 rounded-[28px] cursor-pointer overflow-hidden border-2 transition duration-200 ease-out ${
        isSelected
          ? "bg-[#0c1612]/85 backdrop-blur-xl border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-100 opacity-100 z-10"
          : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs scale-[0.94] opacity-75 z-0"
      }`}
    >
      {/* Üst Vurgu Çizgisi */}
      <div
        className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-200 pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Kart Üst Bilgi Barı */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/30">
          Hazır
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenGuide();
          }}
          title="Antrenman Hakkında"
          className="flex size-7 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer"
        >
          <HelpCircle className="size-4" />
        </button>
      </div>

      {/* İkon Alanı */}
      <div className="relative flex items-center justify-center size-24 mb-4">
        <div
          className={`relative flex size-20 items-center justify-center rounded-2xl border transition-colors duration-200 ${
            isSelected
              ? "bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              : "bg-white/5 text-zinc-400 border-white/10"
          }`}
        >
          <Dumbbell
            className="size-10 relative z-10 drop-shadow-xs"
            strokeWidth={isSelected ? 2.25 : 1.75}
          />
        </div>
      </div>

      {/* Başlık */}
      <div className="text-center mb-5">
        <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-emerald-400 mb-1">
          Bireysel & Keşif
        </p>
        <h3 className="text-2xl font-black tracking-tight text-white">
          Antrenman
        </h3>
      </div>

      {/* 3 Alt Seçenek */}
      <div className="w-full space-y-2 mt-1">
        {TRAINING_SUB_MODES.map((sub) => {
          const isSubActive = isSelected && selectedSubMode === sub.id;

          if (!sub.isAvailable) {
            return (
              <div
                key={sub.id}
                className="w-full h-[46px] flex items-center justify-between px-3.5 rounded-xl border border-white/5 bg-black/20 text-zinc-500 select-none cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <sub.icon className="size-4 text-zinc-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {sub.name}
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/5 text-zinc-500 border border-white/5 flex items-center gap-1">
                  <Lock className="size-2.5" />
                  Yakında
                </span>
              </div>
            );
          }

          return (
            <button
              key={sub.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                onSelectSubMode(sub.id);
              }}
              className={`w-full h-[46px] flex items-center justify-between px-3.5 rounded-xl border text-left transition-colors duration-200 cursor-pointer ${
                isSubActive
                  ? "bg-[#15803d] text-white border-emerald-400/60 shadow-md shadow-emerald-900/40 font-bold"
                  : "bg-white/5 text-zinc-300 border-white/10 hover:border-emerald-500/40 hover:bg-white/10 font-bold"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <sub.icon
                  className={`size-4 ${isSubActive ? "text-white" : "text-emerald-400"}`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {sub.name}
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  isSubActive
                    ? "bg-white/20 text-white"
                    : "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {sub.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
