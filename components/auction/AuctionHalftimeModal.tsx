"use client";

/**
 * Devre Arası (Half-Time) Taktik ve Oyuncu Değişikliği Modalı.
 * 45. dakikada 10 saniye süreyle açılır.
 * Kullanıcıların yedek kulübesinden oyuncu sokmasını ve taktiğini revize etmesini sağlar.
 */

import React, { useState } from "react";
import { AuctionPlayerCard, TeamLineup, TeamTactics } from "@/lib/auction/auctionTypes";
import { Timer, ArrowLeftRight, Sliders, CheckCircle2, Shield, Flame, Activity } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

interface AuctionHalftimeModalProps {
  secondsLeft: number;
  myLineup?: TeamLineup;
  mySquad: AuctionPlayerCard[];
  onSubstitute?: (outPlayerId: string, inPlayerId: string) => void;
  onUpdateTactics?: (tactics: Partial<TeamTactics>) => void;
}

export function AuctionHalftimeModal({
  secondsLeft,
  myLineup,
  mySquad,
  onSubstitute,
  onUpdateTactics,
}: AuctionHalftimeModalProps) {
  const [selectedOutPlayerId, setSelectedOutPlayerId] = useState<string | null>(null);

  const starters = myLineup?.slots.filter((s) => s.placedPlayer) || [];
  const starterIds = new Set(starters.map((s) => s.placedPlayer!.id));
  const benchPlayers = mySquad.filter((p) => !starterIds.has(p.id));
  const tactics = myLineup?.tactics;

  const handleSubSelect = (benchPlayerId: string) => {
    if (selectedOutPlayerId && onSubstitute) {
      onSubstitute(selectedOutPlayerId, benchPlayerId);
      setSelectedOutPlayerId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none">
      <div className="flex flex-col w-full max-w-2xl rounded-3xl bg-[#0e1812] border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden">
        {/* Üst Bar: Sayaç ve Başlık */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Timer className="size-4 animate-spin text-amber-400" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                Devre Arası Molası
                <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                  45. Dakika
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">Takımına taktik ver veya kulübeden taze güç sok</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50">
            <span className="font-mono text-xs font-black text-amber-300 tabular-nums">
              {secondsLeft}s
            </span>
          </div>
        </div>

        {/* 10s Geri Sayım İlerleme Çubuğu */}
        <div className="w-full bg-white/5 h-1.5 overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-1000 ease-linear shadow-[0_0_10px_#f59e0b]"
            style={{ width: `${(Math.max(0, secondsLeft) / 10) * 100}%` }}
          />
        </div>

        {/* İçerik: İki Kolon (Sol: Oyuncu Değişikliği, Sağ: Hızlı Taktikler) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* KOLON 1: OYUNCU DEĞİŞİKLİĞİ */}
          <div className="flex flex-col gap-2 rounded-2xl bg-black/40 border border-white/10 p-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-white/10">
              <ArrowLeftRight className="size-3.5" />
              Yedek Kulübesi & Değişiklik
            </span>

            {/* Adım 1: Çıkacak Oyuncuyu Seç */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400">
                1. Çıkacak Oyuncuyu Seç ({selectedOutPlayerId ? "Seçildi" : "Sahadakine Tıkla"}):
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {starters.map((s) => {
                  const p = s.placedPlayer!;
                  const isSelected = selectedOutPlayerId === p.id;
                  const tier = getRatingTier(s.effectiveRating);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedOutPlayerId(isSelected ? null : p.id)}
                      className={`flex items-center justify-between p-1.5 px-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-950/80 border-amber-400 text-amber-200 ring-1 ring-amber-400"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[9px] font-mono font-bold text-zinc-400">{s.targetPosition}</span>
                        <span className="text-[10px] font-bold truncate max-w-[80px]">{p.fullName.split(" ").slice(-1)[0]}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-black ${tier?.badgeClass || "text-white"}`}>
                        {s.effectiveRating}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adım 2: Girecek Yedek Oyuncuyu Seç */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] font-bold text-zinc-400">
                2. Girecek Yedeği Seç ({benchPlayers.length} Oyuncu):
              </span>
              {benchPlayers.length === 0 ? (
                <span className="text-[11px] text-zinc-500 py-3 text-center">Yedek kulübesinde oyuncu yok</span>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {benchPlayers.map((bp) => {
                    const tier = getRatingTier(bp.overallPrime);
                    return (
                      <button
                        key={bp.id}
                        type="button"
                        disabled={!selectedOutPlayerId}
                        onClick={() => handleSubSelect(bp.id)}
                        className={`flex items-center justify-between p-1.5 px-2 rounded-xl text-left border transition-all ${
                          selectedOutPlayerId
                            ? "bg-emerald-950/60 border-emerald-500/50 hover:bg-emerald-900/80 text-emerald-200 cursor-pointer shadow-xs"
                            : "bg-white/5 border-white/5 opacity-50 cursor-not-allowed text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[9px] font-mono font-bold text-zinc-400">
                            {bp.positions[0] || "YDK"}
                          </span>
                          <span className="text-[10px] font-bold truncate max-w-[80px]">
                            {bp.fullName.split(" ").slice(-1)[0]}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-black ${tier?.badgeClass || "text-white"}`}>
                          {bp.overallPrime}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* KOLON 2: HIZLI TAKTİK HAMLESİ */}
          <div className="flex flex-col gap-2.5 rounded-2xl bg-black/40 border border-white/10 p-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5 pb-1 border-b border-white/10">
              <Sliders className="size-3.5" />
              2. Yarı Taktiksel Hamlesi
            </span>

            {/* Tempo */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                <Activity className="size-3 text-cyan-400" />
                Maç Temposu:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(["slow", "balanced", "fast"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUpdateTactics?.({ tempo: t })}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      tactics?.tempo === t
                        ? "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-xs"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300"
                    }`}
                  >
                    {t === "slow" ? "Yavaş" : t === "fast" ? "Hızlı" : "Dengeli"}
                  </button>
                ))}
              </div>
            </div>

            {/* Oyun Kurma */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                <Flame className="size-3 text-amber-400" />
                Oyun Kurma:
              </span>
              <div className="grid grid-cols-2 gap-1">
                {([
                  { key: "short_pass", label: "Kısa Pas" },
                  { key: "long_ball", label: "Uzun Top" },
                  { key: "balanced", label: "Dengeli" },
                ] as const).map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => onUpdateTactics?.({ buildUp: b.key })}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center truncate ${
                      tactics?.buildUp === b.key
                        ? "bg-amber-950 border-amber-400 text-amber-200 shadow-xs"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pres */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                <Shield className="size-3 text-emerald-400" />
                Savunma Presi:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { key: "park_bus", label: "Otobüsü Çek" },
                  { key: "balanced", label: "Dengeli" },
                  { key: "high_press", label: "Önde Pres" },
                ] as const).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onUpdateTactics?.({ pressing: p.key })}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center truncate ${
                      tactics?.pressing === p.key
                        ? "bg-emerald-950 border-emerald-400 text-emerald-200 shadow-xs"
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
