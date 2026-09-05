"use client";

import React from "react";
import { Swords, HelpCircle, Trophy, Zap, Users } from "lucide-react";

export type SubModeType = "ranked" | "casual" | "custom";

export const SUB_MODES = [
  {
    id: "ranked" as const,
    name: "Dereceli",
    subtitle: "1v1 Rekabetçi",
    icon: Trophy,
    badge: "ELO",
  },
  {
    id: "casual" as const,
    name: "Hızlı Maç",
    subtitle: "Sonsuz Antrenman",
    icon: Zap,
    badge: "Serbest",
  },
  {
    id: "custom" as const,
    name: "Özel Oyun",
    subtitle: "Arkadaşla Lobi",
    icon: Users,
    badge: "Lobi",
  },
];

interface PlayCommonPlayerCardProps {
  isSelected: boolean;
  onSelect: () => void;
  selectedSubMode: SubModeType;
  onSelectSubMode: (subMode: SubModeType) => void;
  onOpenGuide: () => void;
}

export function PlayCommonPlayerCard({
  isSelected,
  onSelect,
  selectedSubMode,
  onSelectSubMode,
  onOpenGuide,
}: PlayCommonPlayerCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-between p-7 lg:p-8 rounded-[28px] cursor-pointer overflow-hidden border-2 transition duration-200 ease-out ${
        isSelected
          ? "bg-[#0c1612]/85 backdrop-blur-xl border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-100 opacity-100 z-10"
          : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs scale-[0.92] opacity-75 z-0"
      }`}
    >
      {/* Üst Vurgu Çizgisi */}
      <div
        className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-200 pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/30">
          Hazır
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenGuide();
          }}
          title="Nasıl Oynanır?"
          className="flex size-7 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer"
        >
          <HelpCircle className="size-4" />
        </button>
      </div>

      <div className="relative flex items-center justify-center size-28 mb-5">
        <div
          className={`relative flex size-24 items-center justify-center rounded-2xl border transition-colors duration-200 ${
            isSelected
              ? "bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              : "bg-white/5 text-zinc-400 border-white/10"
          }`}
        >
          <Swords
            className="size-12 relative z-10 drop-shadow-xs"
            strokeWidth={isSelected ? 2.25 : 1.75}
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-emerald-400 mb-1">
          Farklı Takım
        </p>
        <h3 className="text-2xl font-black tracking-tight text-white">
          Ortak Oyuncu
        </h3>
      </div>

      <div className="w-full space-y-2 mt-1">
        {SUB_MODES.map((sub) => {
          const isSubActive = isSelected && selectedSubMode === sub.id;
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
                  : "bg-white/5 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-white/10 font-bold"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <sub.icon
                  className={`size-4 ${isSubActive ? "text-white" : "text-zinc-400"}`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {sub.name}
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  isSubActive
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-zinc-300 border border-white/10"
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
