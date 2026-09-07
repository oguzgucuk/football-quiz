"use client";

import React from "react";
import {
  Trophy,
  Play,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HomeStageProps {
  onGoToPlay: () => void;
}

export function HomeStage({ onGoToPlay }: HomeStageProps) {
  const { user } = useAuth();

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-white select-none font-sans p-6 sm:p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Işık Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,197,94,0.1)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8 my-auto py-4">
        {/* 1. Üst Tanıtım Kartı */}
        <div className="relative rounded-3xl bg-[#0c1612]/90 backdrop-blur-xl border border-white/10 p-8 sm:p-10 shadow-[0_0_40px_rgba(34,197,94,0.15)] text-center overflow-hidden">
          <div className="absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
            <Clock className="size-3.5 text-emerald-400" />
            <span>1. Sezon Hazırlanıyor • Çok Yakında</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-3">
            Liderlik Panosu & Sezon Sıralaması
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed mb-8">
            Küresel sıralama, haftalık lig mücadeleleri ve sezon ödül havuzu çok yakında açılıyor. 
            Şu an yaptığınız maçlar ve kazandığınız ELO puanları güvenle kaydedilmektedir.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onGoToPlay}
              className="h-13 px-8 rounded-xl bg-gradient-to-b from-[#168841] to-[#126d34] hover:from-[#15803d] hover:to-[#0f5c2b] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-400/50"
            >
              <Play className="size-4 fill-white" />
              <span>HEMEN MAÇA BAŞLA</span>
              <ChevronRight className="size-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2. Kullanıcının Kendi Gerçek Verisi (Varsa) */}
        {user && (
          <div className="rounded-2xl bg-black/40 border border-white/10 p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="size-12 rounded-xl bg-gradient-to-tr from-[#168841] to-[#126d34] flex items-center justify-center font-black text-white text-lg shadow-xs shrink-0">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base">{user.username}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    {user.rankTier || "Bronze"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sezon açıldığında mevcut ELO derecenizle sıralamada yerinizi alacaksınız.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">Mevcut ELO</span>
                <span className="text-base font-black text-emerald-400 font-mono">{user.eloRating || 1000}</span>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">Galibiyet</span>
                <span className="text-base font-black text-white font-mono">{user.matchesWon || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Yakında Gelecek Özellikler Önizlemesi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#0c1612]/70 border border-white/10 p-5 backdrop-blur-md">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <Trophy className="size-5" />
            </div>
            <h3 className="text-sm font-black text-white mb-1">Küresel Liderlik Tablosu</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dünyanın dört bir yanından oyuncularla yarışın; haftalık ve sezonluk zirveye adınızı yazdırın.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0c1612]/70 border border-white/10 p-5 backdrop-blur-md">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <TrendingUp className="size-5" />
            </div>
            <h3 className="text-sm font-black text-white mb-1">Haftalık Lig Sistemi</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Her hafta lig kademelerinde (Bronz, Gümüş, Altın, Elmas, Şampiyon) yükselme heyecanı.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0c1612]/70 border border-white/10 p-5 backdrop-blur-md">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <Award className="size-5" />
            </div>
            <h3 className="text-sm font-black text-white mb-1">Sezon Rozetleri & Ödüller</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sezon sonu derecenize özel unvanlar, profil rozetleri ve vitrin kupaları kazanın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
