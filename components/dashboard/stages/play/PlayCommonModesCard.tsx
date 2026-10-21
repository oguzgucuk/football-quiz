"use client";

import React from "react";
import { Swords, Globe, Users, HelpCircle } from "lucide-react";

export type CommonSubModeType = "team_vs_team" | "country_vs_team" | "custom";

export const COMMON_SUB_MODES = [
  {
    id: "team_vs_team" as const,
    name: "Takım - Takım",
    subtitle: "İki Kulübün Ortak Oyuncusu",
    icon: Swords,
  },
  {
    id: "country_vs_team" as const,
    name: "Millet - Takım",
    subtitle: "Ülke ve Kulüp Eşleşmesi",
    icon: Globe,
  },
  {
    id: "custom" as const,
    name: "Özel Oyun",
    subtitle: "Arkadaşınla Lobi / Koda Katıl",
    icon: Users,
  },
];

interface PlayCommonModesCardProps {
  isSelected: boolean;
  onSelect: () => void;
  selectedSubMode: CommonSubModeType;
  onSelectSubMode: (subMode: CommonSubModeType) => void;
  onOpenGuide: () => void;
}

export function PlayCommonModesCard({
  isSelected,
  onSelect,
  selectedSubMode,
  onSelectSubMode,
  onOpenGuide,
}: PlayCommonModesCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-between p-6 lg:p-7 rounded-[28px] cursor-pointer overflow-hidden border-2 transition-[border-color,background-color,box-shadow,opacity] duration-200 ease-out h-[480px] w-full ${
        isSelected
          ? "bg-[#0c1612]/95 backdrop-blur-xl border-emerald-500 shadow-[0_4px_30px_rgba(0,0,0,0.8)] ring-1 ring-emerald-500/40 z-20"
          : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs opacity-80 hover:opacity-100 z-10"
      }`}
    >
      {/* Üst Zarif Kenarlık Vurgusu */}
      <div
        className={`absolute top-0 inset-x-8 h-[1px] bg-emerald-400/50 transition-opacity duration-200 pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Kart Üst Bilgi Barı */}
      <div className="w-full flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-xs">
          1v1 Düello
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenGuide();
          }}
          title="Nasıl Oynanır?"
          className="flex size-7 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-emerald-600 hover:text-white transition-colors shadow-2xs cursor-pointer"
        >
          <HelpCircle className="size-4" />
        </button>
      </div>

      {/* İkon Alanı */}
      <div className="relative flex items-center justify-center size-24 mb-3">
        <div
          className={`relative flex size-20 items-center justify-center rounded-2xl border transition-colors duration-200 ${
            isSelected
              ? "bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              : "bg-white/5 text-zinc-400 border-white/10"
          }`}
        >
          <Swords
            className="size-10 relative z-10 drop-shadow-xs"
            strokeWidth={isSelected ? 2.25 : 1.75}
          />
        </div>
      </div>

      {/* Başlık */}
      <div className="text-center mb-4 h-[52px] flex flex-col justify-center items-center">
        <span className="text-xs font-black tracking-[0.16em] uppercase text-emerald-400 mb-0.5">
          Ortak Oyuncu
        </span>
        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Ortak Oyuncu Modları
        </h3>
      </div>

      {/* 3 Alt Seçenek */}
      <div className="w-full space-y-2 mt-auto h-[154px] flex flex-col justify-end">
        {COMMON_SUB_MODES.map((sub) => {
          const isSubActive = isSelected && selectedSubMode === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
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
                  className={`size-4 shrink-0 ${isSubActive ? "text-white" : "text-zinc-400"}`}
                />
                <span className="text-xs font-bold uppercase tracking-wider truncate">
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
