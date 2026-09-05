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
      className={`relative flex flex-col items-center justify-between p-7 lg:p-8 rounded-[28px] cursor-pointer overflow-hidden border-2 transition duration-200 ease-out ${
        isSelected
          ? "bg-[#0c1612]/85 backdrop-blur-xl border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-100 opacity-100 z-10"
          : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs scale-[0.92] opacity-75 z-0"
      }`}
    >
      {/* Üst Vurgu Çizgisi */}
      <div
        className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-opacity duration-200 pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-500/30">
          Yeni Mod
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
              ? "bg-amber-950/40 text-amber-400 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              : "bg-white/5 text-zinc-400 border-white/10"
          }`}
        >
          <Globe
            className="size-12 relative z-10 drop-shadow-xs"
            strokeWidth={isSelected ? 2.25 : 1.75}
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-amber-400 mb-1">
          1v1 Düello
        </p>
        <h3 className="text-2xl font-black tracking-tight text-white">
          Millet-Takım
        </h3>
      </div>

      <div className="w-full space-y-2 mt-1">
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
              className={`w-full h-[46px] flex items-center justify-between px-3.5 rounded-xl border text-left transition-colors duration-200 cursor-pointer ${
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
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold leading-tight truncate">
                    {sub.name}
                  </span>
                  <span
                    className={`text-[10px] leading-tight truncate ${
                      isSubActive ? "text-emerald-100" : "text-zinc-400"
                    }`}
                  >
                    {sub.subtitle}
                  </span>
                </div>
              </div>

              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 border ${
                  isSubActive
                    ? "bg-black/20 text-white border-white/20"
                    : "bg-white/5 text-zinc-400 border-white/10"
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
