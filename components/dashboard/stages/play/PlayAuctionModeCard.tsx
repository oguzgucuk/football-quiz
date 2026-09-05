"use client";

import React from "react";
import { Gavel, HelpCircle, Lock } from "lucide-react";

interface PlayAuctionModeCardProps {
  isSelected: boolean;
  onSelect: () => void;
  onOpenGuide: () => void;
}

export function PlayAuctionModeCard({
  isSelected,
  onSelect,
  onOpenGuide,
}: PlayAuctionModeCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-between p-7 lg:p-8 rounded-[28px] cursor-pointer overflow-hidden border-2 transition duration-200 ease-out ${
        isSelected
          ? "bg-[#0c1612]/85 backdrop-blur-xl border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-100 opacity-100 z-10"
          : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs scale-[0.92] opacity-75 z-0"
      }`}
    >
      <div
        className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-200 pointer-events-none ${
          isSelected ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          1. Sezon
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
          <Gavel
            className="size-12 relative z-10"
            strokeWidth={isSelected ? 2.25 : 1.75}
          />
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-zinc-400 mb-1">
          Canlı Transfer
        </p>
        <h3 className="text-2xl font-black tracking-tight text-white">
          Müzayede
        </h3>
      </div>

      <div className="w-full py-8 flex flex-col items-center justify-center text-center rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xs">
        <div className="flex size-8 items-center justify-center rounded-full bg-white/10 border border-white/15 shadow-2xs mb-2">
          <Lock className="size-4 text-zinc-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider text-white">
          Geliştirme Aşamasında
        </span>
        <span className="text-[11px] text-zinc-400 font-medium mt-0.5">4-8 Kişilik Canlı Pazar</span>
      </div>
    </div>
  );
}
