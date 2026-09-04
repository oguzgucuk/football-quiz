"use client";

import React from "react";
import {
  Play,
  Flame,
  Trophy,
  Sparkles,
  TrendingUp,
  Calendar,
  Swords,
  ChevronRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HomeStageProps {
  onGoToPlay: () => void;
}

export function HomeStage({ onGoToPlay }: HomeStageProps) {
  const { user } = useAuth();

  const recentMatches = [
    {
      id: "m1",
      mode: "Ortak Oyuncu",
      result: "win",
      score: "4 - 2",
      opponent: "Arda_Guler10",
      time: "12 dk önce",
      eloChange: "+24",
    },
    {
      id: "m2",
      mode: "Ortak Oyuncu",
      result: "loss",
      score: "2 - 3",
      opponent: "ScoutMaster",
      time: "45 dk önce",
      eloChange: "-18",
    },
    {
      id: "m3",
      mode: "Ortak Oyuncu",
      result: "win",
      score: "5 - 1",
      opponent: "Bot_AI_99",
      time: "2 saat önce",
      eloChange: "+15",
    },
  ];

  const leaderboardPreview = [
    { rank: 1, name: "BarcaLegend_9", elo: 1840, tier: "Şampiyon" },
    { rank: 2, name: "KadıköyBoğası", elo: 1795, tier: "Usta" },
    { rank: 3, name: "Milanisti_Kaka", elo: 1720, tier: "Elmas I" },
  ];

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-white select-none font-sans p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Geçiş */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,197,94,0.1)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Üst Karşılama ve Hızlı Başlama Banner'ı */}
        <div className="relative rounded-[28px] bg-[#0c1612]/85 backdrop-blur-xl border border-white/10 p-8 sm:p-10 shadow-[0_0_35px_rgba(34,197,94,0.15)] overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
              <Flame className="size-3.5 fill-emerald-400" />
              <span>1. Sezon: Scout Arena Canlı</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Hoş geldin, <span className="text-emerald-400">{user?.username || "Futbol Aşığı"}</span>!
            </h1>
            <p className="text-sm text-zinc-400 font-medium mt-2 leading-relaxed">
              2.800+ kulüp ve 10.000+ futbolcu veritabanında bilginizi test edin. Rakiplerinizle 1v1 eşleşin, ELO kazanın ve lig basamaklarını tırmanın.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              onClick={onGoToPlay}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-b from-[#168841] to-[#126d34] border border-emerald-400/40 text-white font-black text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:shadow-emerald-500/50 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              <Play className="size-4 fill-white" />
              <span>HEMEN OYNA</span>
              <ChevronRight className="size-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* 2. İkili Kolon Grid: Günün Mücadelesi & Sezon İstatistikleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Günün Özel Mücadelesi */}
          <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-7 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Günün Mücadelesi</h3>
                    <p className="text-[11px] text-zinc-400">Her 24 saatte bir yenilenir</p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  +250 Altın Ödül
                </span>
              </div>

              <div className="my-4 p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 font-black text-xs text-white">
                    RM
                  </div>
                  <span className="font-extrabold text-sm text-white">Real Madrid</span>
                </div>
                <span className="font-black text-xs text-emerald-400 px-2 py-1 bg-emerald-950/60 rounded-lg border border-emerald-500/30">
                  VS
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-white">Inter Milan</span>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 font-black text-xs text-white">
                    INT
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                Her iki takımda da oynamış en az 3 farklı futbolcuyu bil, günlük bonus altınını cüzdanına ekle!
              </p>
            </div>

            <button
              onClick={onGoToPlay}
              className="mt-5 w-full py-3 rounded-xl border border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase tracking-wider hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all cursor-pointer text-center"
            >
              Mücadeleye Katıl
            </button>
          </div>

          {/* Haftalık ELO Liderlik Tablosu Önizleme */}
          <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-7 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Trophy className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Haftalık Liderlik</h3>
                    <p className="text-[11px] text-zinc-400">En Yüksek ELO Puanları</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer">
                  Tümünü Gör
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {leaderboardPreview.map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/35 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-6 items-center justify-center rounded-full font-black text-xs ${
                          item.rank === 1
                            ? "bg-amber-400 text-black"
                            : item.rank === 2
                            ? "bg-slate-300 text-black"
                            : "bg-amber-700 text-white"
                        }`}
                      >
                        {item.rank}
                      </span>
                      <span className="font-extrabold text-xs text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                        {item.tier}
                      </span>
                      <span className="font-mono font-black text-xs text-emerald-400">
                        {item.elo} ELO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span>Senin Sıran: <strong className="text-white">#142</strong></span>
              <span className="font-mono font-bold text-emerald-400">{user?.eloRating || 1000} ELO</span>
            </div>
          </div>
        </div>

        {/* 3. Son Maçlar Listesi */}
        <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-7 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-emerald-400" />
              <h3 className="text-base font-black text-white">Son Maç Geçmişin</h3>
            </div>
            <span className="text-xs text-zinc-400">Son 3 Karşılaşma</span>
          </div>

          <div className="space-y-3">
            {recentMatches.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-black/35 border border-white/10 hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`flex size-8 items-center justify-center rounded-xl font-black text-xs ${
                      m.result === "win"
                        ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-950/70 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {m.result === "win" ? "G" : "M"}
                  </span>
                  <div>
                    <p className="font-extrabold text-sm text-white">
                      vs {m.opponent}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {m.mode} • {m.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-black text-sm text-white">
                    {m.score}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                      m.result === "win"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-950/60 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {m.eloChange} ELO
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
