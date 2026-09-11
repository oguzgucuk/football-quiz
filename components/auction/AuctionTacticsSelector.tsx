"use client";

import React from "react";
import { TeamTactics } from "@/lib/auction/auctionTypes";
import { Gauge, FastForward, ShieldAlert, Compass } from "lucide-react";

interface AuctionTacticsSelectorProps {
  tactics: TeamTactics;
  onChange: (tactics: TeamTactics) => void;
  disabled?: boolean;
}

export function AuctionTacticsSelector({
  tactics,
  onChange,
  disabled = false,
}: AuctionTacticsSelectorProps) {
  const update = <K extends keyof TeamTactics>(key: K, value: TeamTactics[K]) => {
    if (disabled) return;
    onChange({ ...tactics, [key]: value });
  };

  return (
    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
          Taktik Ayarları
        </span>
        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
          4 Boyutlu Motor
        </span>
      </div>

      {/* 1. TEMPO */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
          <Gauge className="w-3.5 h-3.5 text-sky-400" />
          <span>Tempo (Pozisyon Sayısı)</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: "slow" as const, label: "Yavaş", sub: "~9 Poz." },
            { id: "balanced" as const, label: "Dengeli", sub: "~16 Poz." },
            { id: "fast" as const, label: "Hızlı", sub: "~24 Poz." },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => update("tempo", item.id)}
              className={`py-1.5 px-1 rounded-xl text-center transition-all border ${
                tactics.tempo === item.id
                  ? "bg-sky-500 border-sky-400 text-black font-black shadow-md"
                  : disabled
                  ? "bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 cursor-pointer"
              }`}
            >
              <div className="text-[11px] leading-tight">{item.label}</div>
              <div className={`text-[9px] font-mono ${tactics.tempo === item.id ? "text-sky-950 font-bold" : "text-zinc-500"}`}>{item.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. OYUN KURMA (PAS TARZI) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
          <span>Oyun Kurma (Pas)</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: "short_pass" as const, label: "Kısa Pas", sub: "Atk+ / Def-" },
            { id: "balanced" as const, label: "Dengeli", sub: "%100 Güç" },
            { id: "long_ball" as const, label: "Uzun Top", sub: "Orta Saha ✕" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => update("buildUp", item.id)}
              className={`py-1.5 px-1 rounded-xl text-center transition-all border ${
                tactics.buildUp === item.id
                  ? "bg-amber-500 border-amber-400 text-black font-black shadow-md"
                  : disabled
                  ? "bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 cursor-pointer"
              }`}
            >
              <div className="text-[11px] leading-tight">{item.label}</div>
              <div className={`text-[9px] font-mono ${tactics.buildUp === item.id ? "text-amber-950 font-bold" : "text-zinc-500"}`}>{item.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. PRES SEVİYESİ */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pres & Hat Seviyesi</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: "park_bus" as const, label: "Defansif", sub: "Otobüs" },
            { id: "balanced" as const, label: "Dengeli", sub: "Standart" },
            { id: "high_press" as const, label: "Önde Pres", sub: "Baskı" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => update("pressing", item.id)}
              className={`py-1.5 px-1 rounded-xl text-center transition-all border ${
                tactics.pressing === item.id
                  ? "bg-emerald-500 border-emerald-400 text-black font-black shadow-md"
                  : disabled
                  ? "bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 cursor-pointer"
              }`}
            >
              <div className="text-[11px] leading-tight">{item.label}</div>
              <div className={`text-[9px] font-mono ${tactics.pressing === item.id ? "text-emerald-950 font-bold" : "text-zinc-500"}`}>{item.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. HÜCUM YÖNÜ */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
          <Compass className="w-3.5 h-3.5 text-purple-400" />
          <span>Hücum Yönü</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: "left" as const, label: "Sol" },
            { id: "center" as const, label: "Merkez" },
            { id: "right" as const, label: "Sağ" },
            { id: "balanced" as const, label: "Dengeli" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => update("attackDirection", item.id)}
              className={`py-1.5 px-1 rounded-xl text-center transition-all border ${
                tactics.attackDirection === item.id
                  ? "bg-purple-500 border-purple-400 text-white font-black shadow-md"
                  : disabled
                  ? "bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed"
                  : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 cursor-pointer"
              }`}
            >
              <div className="text-[11px] font-bold leading-tight">{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
