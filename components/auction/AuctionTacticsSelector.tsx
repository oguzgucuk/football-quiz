"use client";

import React from "react";
import { TeamTactics } from "@/lib/auction/auctionTypes";
import { Compass, FastForward, Gauge, ShieldAlert, Target, Zap } from "lucide-react";

interface AuctionTacticsSelectorProps {
  tactics: TeamTactics;
  onChange: (tactics: TeamTactics) => void;
  disabled?: boolean;
}

type Option<T extends string> = { id: T; label: string; sub?: string };

function OptionRow<T extends string>({
  options,
  value,
  disabled,
  activeClass,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  disabled: boolean;
  activeClass: string;
  onChange: (value: T) => void;
}) {
  return (
    <div className={`grid gap-1 ${options.length === 5 ? "grid-cols-5" : options.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
      {options.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            title={item.sub ? `${item.label}: ${item.sub}` : item.label}
            onClick={() => onChange(item.id)}
            className={`min-h-8 rounded-lg border px-1 py-1.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              active
                ? `${activeClass} font-black shadow-md`
                : disabled
                  ? "cursor-not-allowed border-white/5 bg-white/5 text-zinc-600"
                  : "cursor-pointer border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <div className="text-[11px] leading-tight">{item.label}</div>
          </button>
        );
      })}
    </div>
  );
}

export function AuctionTacticsSelector({ tactics, onChange, disabled = false }: AuctionTacticsSelectorProps) {
  const update = <K extends keyof TeamTactics>(key: K, value: TeamTactics[K]) => {
    if (!disabled) onChange({ ...tactics, [key]: value });
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-black/50 p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-zinc-300">Taktik Ayarları</span>
        <span className="text-[10px] font-medium text-emerald-400">Maç planın</span>
      </div>

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400"><Gauge className="size-3.5 text-sky-400" />Tempo</div>
        <OptionRow
          options={[
            { id: "slow", label: "Yavaş", sub: "Güvenli" },
            { id: "balanced", label: "Dengeli", sub: "Kontrol ve hız dengesi" },
            { id: "fast", label: "Hızlı", sub: "Riskli" },
          ]}
          value={tactics.tempo}
          disabled={disabled}
          activeClass="border-sky-400 bg-sky-500 text-black"
          onChange={(value) => update("tempo", value)}
        />
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400"><FastForward className="size-3.5 text-amber-400" />Oyun Kurma</div>
        <OptionRow
          options={[
            { id: "short_pass", label: "Kısa Pas", sub: "Kontrol" },
            { id: "balanced", label: "Dengeli", sub: "Standart" },
            { id: "long_ball", label: "Direkt", sub: "Presi Aş" },
          ]}
          value={tactics.buildUp}
          disabled={disabled}
          activeClass="border-amber-400 bg-amber-500 text-black"
          onChange={(value) => update("buildUp", value)}
        />
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400"><Zap className="size-3.5 text-orange-400" />Top Kazanınca</div>
        <OptionRow
          options={[
            { id: "retain", label: "Topu Tut", sub: "Yerleş" },
            { id: "balanced", label: "Dengeli", sub: "Duruma Göre" },
            { id: "counter", label: "Kontra", sub: "Hızlı Çık" },
          ]}
          value={tactics.transition || "balanced"}
          disabled={disabled}
          activeClass="border-orange-400 bg-orange-500 text-black"
          onChange={(value) => update("transition", value)}
        />
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400"><Target className="size-3.5 text-rose-400" />Pozisyon Tercihi</div>
        <OptionRow
          options={[
            { id: "patient", label: "Sabırlı", sub: "Net Şut" },
            { id: "balanced", label: "Dengeli", sub: "Standart" },
            { id: "early_cross", label: "Erken Orta", sub: "Kanat" },
            { id: "shoot_on_sight", label: "Görünce Vur", sub: "Uzak Şut" },
          ]}
          value={tactics.chanceCreation || "balanced"}
          disabled={disabled}
          activeClass="border-rose-400 bg-rose-500 text-black"
          onChange={(value) => update("chanceCreation", value)}
        />
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400"><ShieldAlert className="size-3.5 text-emerald-400" />Savunma Yaklaşımı</div>
        <OptionRow
          options={[
            { id: "park_bus", label: "Alçak Blok", sub: "Alan Kapat" },
            { id: "balanced", label: "Orta Blok", sub: "Standart" },
            { id: "high_press", label: "Önde Pres", sub: "Riskli Baskı" },
          ]}
          value={tactics.pressing}
          disabled={disabled}
          activeClass="border-emerald-400 bg-emerald-500 text-black"
          onChange={(value) => update("pressing", value)}
        />
      </section>

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400"><Compass className="size-3.5 text-purple-400" />Hücum Yönü</div>
        <OptionRow
          options={[
            { id: "left", label: "Sol" },
            { id: "center", label: "Merkez" },
            { id: "right", label: "Sağ" },
            { id: "wings", label: "Kanatlar" },
            { id: "balanced", label: "Dengeli" },
          ]}
          value={tactics.attackDirection}
          disabled={disabled}
          activeClass="border-purple-400 bg-purple-500 text-white"
          onChange={(value) => update("attackDirection", value)}
        />
      </section>
    </div>
  );
}
