"use client";

import React from "react";
import { Globe, HelpCircle, Zap, Users } from "lucide-react";

export type NationTeamSubMode = "casual" | "custom";

export const NATION_TEAM_SUB_MODES = [
  {
    id: "casual" as const,
    name: "Hızlı Maç",
    subtitle: "Serbest Karşılaşma",
    icon: Zap,
  },
  {
    id: "custom" as const,
    name: "Özel Oyun",
    subtitle: "Arkadaşla Lobi",
    icon: Users,
  },
];

interface PlayGridModeCardProps {
  isSelected: boolean;
  onSelect: () => void;
  selectedSubMode: NationTeamSubMode;
  onSelectSubMode: (subMode: NationTeamSubMode) => void;
  onOpenGuide: () => void;
}

export function PlayGridModeCard({
  isSelected,
  onSelect,
  selectedSubMode,
  onSelectSubMode,
  onOpenGuide,
}: PlayGridModeCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-between p-6 lg:p-7 rounded-[28px] cursor-pointer overflow-hidden border-2 transition-all duration-300 ease-out h-[470px] w-full ${
        isSelected
          ? "bg-[#0c1612]/95 backdrop-blur-xl border-emerald-500 shadow-[0_0_40px_rgba(34,197,94,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-emerald-500/50 scale-[1.04] z-20"
          : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs opacity-75 hover:opacity-95 scale-[0.96] hover:scale-[0.98] z-10"
      }`}
    >
      {/* Üst Vurgu Çizgisi */}
      <div
        className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-200 pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-xs">
          1v1
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

      <div className="relative flex items-center justify-center size-24 mb-3">
        <div
          className={`relative flex size-20 items-center justify-center rounded-2xl border transition-colors duration-200 ${
            isSelected
              ? "bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              : "bg-white/5 text-zinc-400 border-white/10"
          }`}
        >
          <Globe
            className="size-10 relative z-10 drop-shadow-xs"
            strokeWidth={isSelected ? 2.25 : 1.75}
          />
        </div>
      </div>

      <div className="text-center mb-4 h-[52px] flex flex-col justify-center items-center">
        <span className="text-xs font-black tracking-[0.16em] uppercase text-emerald-400 mb-0.5">
          Ortak Oyuncu
        </span>
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Millet ve Takım
        </h3>
      </div>

      <div className="w-full space-y-2 mt-auto h-[154px] flex flex-col justify-end">
        {/* 1. Slot: Dereceli Düello (Yakında) */}
        <div className="w-full h-[44px] flex items-center justify-between px-3.5 rounded-xl border border-white/5 bg-black/20 text-zinc-500 select-none cursor-not-allowed">
          <div className="flex items-center gap-2.5">
            <span className="size-4 flex items-center justify-center text-zinc-600 font-black text-xs">🏆</span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Dereceli Düello
            </span>
          </div>
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/5 text-zinc-500 border border-white/5">
            Yakında
          </span>
        </div>

        {/* 2. & 3. Slot: Hızlı Maç ve Özel Oyun */}
        {NATION_TEAM_SUB_MODES.map((sub) => {
          const isSubActive = isSelected && selectedSubMode === sub.id;
          return (
            <button
              key={sub.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                onSelectSubMode(sub.id);
              }}
              className={`w-full h-[44px] flex items-center px-3.5 rounded-xl border text-left transition-colors duration-200 cursor-pointer ${
                isSubActive
                  ? "bg-[#15803d] text-white border-emerald-400/60 shadow-md shadow-emerald-900/40 font-bold"
                  : "bg-white/5 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-white/10 font-bold"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <sub.icon
                  className={`size-4 shrink-0 ${
                    isSubActive ? "text-white" : "text-zinc-400"
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {sub.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
