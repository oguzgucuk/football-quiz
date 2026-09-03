"use client";

import React from "react";
import {
  Trophy,
  Award,
  Swords,
  ShieldCheck,
  TrendingUp,
  Percent,
  Flame,
  Calendar,
  User,
  Star,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileStageProps {
  onGoToPlay?: () => void;
}

export function ProfileStage({ onGoToPlay }: ProfileStageProps) {
  const { user, isLoading } = useAuth();

  const totalMatches = (user?.matchesWon || 0) + (user?.matchesLost || 0);
  const winRate =
    totalMatches > 0
      ? Math.round(((user?.matchesWon || 0) / totalMatches) * 100)
      : 0;

  if (isLoading && !user) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center bg-[#f4f7f5] text-[#141b16] select-none font-sans p-8 lg:p-12 h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl border-2 border-[#15803d] border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-[#6b7770]">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  const achievements = [
    {
      id: "a1",
      title: "Scout Çırağı",
      desc: "İlk 5 ortak oyuncu maçını tamamla",
      progress: "5/5",
      isUnlocked: true,
      icon: Star,
    },
    {
      id: "a2",
      title: "Süper Lig Hafızası",
      desc: "Süper Lig takımlarından 20 ortak oyuncu bil",
      progress: "14/20",
      isUnlocked: false,
      icon: Trophy,
    },
    {
      id: "a3",
      title: "Işık Hızı (Flash)",
      desc: "Bir turda 3 saniyenin altında doğru cevap ver",
      progress: "1/1",
      isUnlocked: true,
      icon: Zap,
    },
    {
      id: "a4",
      title: "Elmas Scout",
      desc: "Dereceli modda 1500 ELO puanına ulaş",
      progress: `${user?.eloRating || 1000}/1500`,
      isUnlocked: (user?.eloRating || 1000) >= 1500,
      icon: Award,
    },
  ];

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-[#f4f7f5] text-[#141b16] select-none font-sans p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(21,128,61,0.07)_0%,rgba(244,247,245,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Üst Profil Kartı */}
        <div className="relative rounded-[28px] bg-white border border-[#e2e8e4] p-8 shadow-xs overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#15803d] to-[#0f5c2b] text-white font-black text-3xl shadow-md">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : "SE"}
              </div>
              <span className="absolute -bottom-1 -right-1 size-6 rounded-full border-4 border-white bg-[#15803d] flex items-center justify-center" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#141b16]">
                  {user?.username || "Misafir Oyuncu"}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#15803d]/10 text-[#15803d] px-2.5 py-0.5 rounded-full border border-[#15803d]/20">
                  {user?.rankTier || "Elmas II"}
                </span>
              </div>
              <p className="text-xs text-[#6b7770] font-medium mt-1">
                Oyuncu Etiketi: #{user?.id ? user.id.substring(0, 6) : "TR2026"} • 2026 Sezonu
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-bold text-[#15803d] bg-[#e8f3ed] px-3 py-1 rounded-xl border border-[#cbe4d4]">
                  🏆 {user?.eloRating || 1000} ELO Derecesi
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial text-center p-3 px-5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e4]">
              <span className="text-[10px] font-extrabold uppercase text-[#6b7770] block">
                Galibiyet
              </span>
              <span className="font-mono font-black text-xl text-[#15803d]">
                {user?.matchesWon || 0}
              </span>
            </div>
            <div className="flex-1 md:flex-initial text-center p-3 px-5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e4]">
              <span className="text-[10px] font-extrabold uppercase text-[#6b7770] block">
                Mağlubiyet
              </span>
              <span className="font-mono font-black text-xl text-rose-600">
                {user?.matchesLost || 0}
              </span>
            </div>
          </div>
        </div>

        {/* 2. 4'lü İstatistik Metrikleri */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-[#e2e8e4] shadow-2xs">
            <div className="flex items-center gap-2 text-[#6b7770] mb-2">
              <Swords className="size-4 text-[#15803d]" />
              <span className="text-xs font-bold uppercase tracking-wider">Toplam Maç</span>
            </div>
            <p className="font-mono font-black text-2xl text-[#141b16]">{totalMatches}</p>
            <span className="text-[11px] text-[#6b7770] mt-1 block">Tüm sezon boyunca</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e8e4] shadow-2xs">
            <div className="flex items-center gap-2 text-[#6b7770] mb-2">
              <Percent className="size-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Kazanma Oranı</span>
            </div>
            <p className="font-mono font-black text-2xl text-[#15803d]">{winRate}%</p>
            <span className="text-[11px] text-[#6b7770] mt-1 block">{user?.matchesWon || 0}G - {user?.matchesLost || 0}M</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e8e4] shadow-2xs">
            <div className="flex items-center gap-2 text-[#6b7770] mb-2">
              <Flame className="size-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Galibiyet Serisi</span>
            </div>
            <p className="font-mono font-black text-2xl text-amber-600">3 Maç</p>
            <span className="text-[11px] text-[#6b7770] mt-1 block">Mevcut seri</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e2e8e4] shadow-2xs">
            <div className="flex items-center gap-2 text-[#6b7770] mb-2">
              <Trophy className="size-4 text-cyan-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Lig Sıralaması</span>
            </div>
            <p className="font-mono font-black text-2xl text-[#141b16]">#142</p>
            <span className="text-[11px] text-[#6b7770] mt-1 block">Türkiye sıralaması</span>
          </div>
        </div>

        {/* 3. Başarımlar & Rozetler */}
        <div className="rounded-[24px] bg-white border border-[#e2e8e4] p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-[#15803d]" />
              <h3 className="text-base font-black text-[#141b16]">Kazanılan Başarımlar</h3>
            </div>
            <span className="text-xs text-[#6b7770] font-bold">2 / 4 Tamamlandı</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                  ach.isUnlocked
                    ? "bg-[#fbfdfb] border-[#cbe4d4]"
                    : "bg-[#f8faf8] border-[#e2e8e4] opacity-70"
                }`}
              >
                <div
                  className={`flex size-11 items-center justify-center rounded-2xl shrink-0 ${
                    ach.isUnlocked
                      ? "bg-[#15803d] text-white shadow-xs"
                      : "bg-[#e2e8e4] text-[#8a968f]"
                  }`}
                >
                  <ach.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-[#141b16]">{ach.title}</h4>
                    <span className="font-mono text-xs font-bold text-[#15803d]">
                      {ach.progress}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7770] mt-0.5">{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
