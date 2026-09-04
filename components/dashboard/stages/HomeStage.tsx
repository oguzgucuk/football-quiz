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
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-[#141b16] select-none font-sans p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Geçiş */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(21,128,61,0.07)_0%,rgba(244,247,245,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Üst Karşılama ve Hızlı Başlama Banner'ı */}
        <div className="relative rounded-[28px] bg-gradient-to-br from-white via-white to-[#f1f7f3] border border-[#d9e7dd] p-8 sm:p-10 shadow-[0_10px_30px_rgba(21,128,61,0.06)] overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#15803d]/10 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#15803d]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#15803d]/10 border border-[#15803d]/25 text-[#15803d] text-xs font-black uppercase tracking-wider mb-3">
              <Flame className="size-3.5 fill-[#15803d]" />
              <span>1. Sezon: Scout Arena Canlı</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#141b16] leading-tight">
              Hoş geldin, <span className="text-[#15803d]">{user?.username || "Futbol Aşığı"}</span>!
            </h1>
            <p className="text-sm text-[#525f56] font-medium mt-2 leading-relaxed">
              2.800+ kulüp ve 10.000+ futbolcu veritabanında bilginizi test edin. Rakiplerinizle 1v1 eşleşin, ELO kazanın ve lig basamaklarını tırmanın.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              onClick={onGoToPlay}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-b from-[#168841] to-[#126d34] text-white font-black text-sm tracking-widest uppercase shadow-lg shadow-[#15803d]/30 hover:shadow-xl hover:scale-102 active:scale-98 transition-all cursor-pointer"
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
          <div className="rounded-[24px] bg-white border border-[#e2e8e4] p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Star className="size-4 fill-amber-500 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#141b16]">Günün Mücadelesi</h3>
                    <p className="text-[11px] text-[#6b7770]">Her 24 saatte bir yenilenir</p>
                  </div>
                </div>
                <span className="text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  +250 Altın Ödül
                </span>
              </div>

              <div className="my-4 p-4 rounded-2xl bg-[#f8faf8] border border-[#e2e8e4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white border border-[#e2e8e4] font-black text-xs text-[#141b16]">
                    RM
                  </div>
                  <span className="font-extrabold text-sm text-[#141b16]">Real Madrid</span>
                </div>
                <span className="font-black text-xs text-[#15803d] px-2 py-1 bg-white rounded-lg border border-[#e2e8e4]">
                  VS
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-[#141b16]">Inter Milan</span>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white border border-[#e2e8e4] font-black text-xs text-[#141b16]">
                    INT
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#525f56] font-medium leading-relaxed">
                Her iki takımda da oynamış en az 3 farklı futbolcuyu bil, günlük bonus altınını cüzdanına ekle!
              </p>
            </div>

            <button
              onClick={onGoToPlay}
              className="mt-5 w-full py-3 rounded-xl border border-[#15803d] text-[#15803d] font-bold text-xs uppercase tracking-wider hover:bg-[#15803d] hover:text-white transition-all cursor-pointer text-center"
            >
              Mücadeleye Katıl
            </button>
          </div>

          {/* Haftalık ELO Liderlik Tablosu Önizleme */}
          <div className="rounded-[24px] bg-white border border-[#e2e8e4] p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-[#15803d]">
                    <Trophy className="size-4 text-[#15803d]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#141b16]">Haftalık Liderlik</h3>
                    <p className="text-[11px] text-[#6b7770]">En Yüksek ELO Puanları</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#15803d] hover:underline cursor-pointer">
                  Tümünü Gör
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {leaderboardPreview.map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf8] border border-[#e2e8e4]"
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
                      <span className="font-extrabold text-xs text-[#141b16]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#6b7770] bg-white px-2 py-0.5 rounded-md border border-[#e2e8e4]">
                        {item.tier}
                      </span>
                      <span className="font-mono font-black text-xs text-[#15803d]">
                        {item.elo} ELO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e2e8e4] flex items-center justify-between text-xs text-[#6b7770]">
              <span>Senin Sıran: <strong className="text-[#141b16]">#142</strong></span>
              <span className="font-mono font-bold text-[#15803d]">{user?.eloRating || 1000} ELO</span>
            </div>
          </div>
        </div>

        {/* 3. Son Maçlar Listesi */}
        <div className="rounded-[24px] bg-white border border-[#e2e8e4] p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Swords className="size-4 text-[#15803d]" />
              <h3 className="text-base font-black text-[#141b16]">Son Maç Geçmişin</h3>
            </div>
            <span className="text-xs text-[#6b7770]">Son 3 Karşılaşma</span>
          </div>

          <div className="space-y-3">
            {recentMatches.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#fbfdfb] border border-[#e2e8e4] hover:border-[#bfe0cc] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`flex size-8 items-center justify-center rounded-xl font-black text-xs ${
                      m.result === "win"
                        ? "bg-emerald-100 text-[#15803d]"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {m.result === "win" ? "G" : "M"}
                  </span>
                  <div>
                    <p className="font-extrabold text-sm text-[#141b16]">
                      vs {m.opponent}
                    </p>
                    <p className="text-[11px] text-[#6b7770] font-medium">
                      {m.mode} • {m.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-black text-sm text-[#141b16]">
                    {m.score}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                      m.result === "win"
                        ? "bg-emerald-50 text-[#15803d] border border-emerald-200"
                        : "bg-rose-50 text-rose-600 border border-rose-200"
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
