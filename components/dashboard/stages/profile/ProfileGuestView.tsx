"use client";

import React from "react";
import { User, Lock, LogIn, UserPlus, Sparkles } from "lucide-react";

interface ProfileGuestViewProps {
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function ProfileGuestView({ onOpenAuthModal }: ProfileGuestViewProps) {
  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-white select-none font-sans p-6 sm:p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,197,94,0.1)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8">
        {/* Ana Ziyaretçi Kartı */}
        <div className="relative rounded-[32px] bg-[#0c1612]/85 backdrop-blur-xl border border-white/10 p-8 sm:p-10 shadow-[0_0_35px_rgba(34,197,94,0.15)] overflow-hidden text-center flex flex-col items-center">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          <div className="relative mb-5">
            <div className="flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shadow-lg">
              <User className="size-10 sm:size-12" />
            </div>
            <span className="absolute -bottom-1 -right-1 size-7 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md font-bold">
              <Lock className="size-3.5" />
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full mb-3">
            Hesap Bağlantısı Gerekli
          </span>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white max-w-md">
            Şu Anda Bir Hesapta Değilsiniz
          </h1>

          <p className="text-sm text-zinc-400 font-medium mt-2 max-w-lg leading-relaxed">
            Oynadığınız maçların geçmişini kaydetmek, net ELO puanı değişimlerinizi incelemek,
            galibiyet serilerinizi korumak ve arkadaşlarınızla yarışmak için oturum açmanız gerekmektedir.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-7 w-full max-w-xs">
            <button
              onClick={() => onOpenAuthModal?.("login")}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-b from-[#168841] to-[#126d34] border border-emerald-400/40 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="size-4" />
              <span>Giriş Yap</span>
            </button>

            <button
              onClick={() => onOpenAuthModal?.("register")}
              className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="size-4 text-emerald-400" />
              <span>Kayıt Ol</span>
            </button>
          </div>
        </div>

        {/* Kilitli İstatistikler ve Geçmiş Önizleme Teaser'ı */}
        <div className="relative rounded-[28px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div>
              <h3 className="text-base font-black text-white">
                Kayıtlı Oyuncu Özellikleri
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Hesabınızı açtığınızda profilinizde otomatik aktif olacak sistemler:
              </p>
            </div>
            <Sparkles className="size-5 text-emerald-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 filter blur-[0.3px]">
            <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-400 uppercase">ELO Derecesi</div>
              <div className="text-lg font-black text-emerald-400 mt-1 font-mono">1000 - 2400+ ELO</div>
              <div className="text-[11px] text-zinc-400 mt-1">Lojistik formülle dinamik derecelendirme</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-400 uppercase">Maç Geçmişi Arşivi</div>
              <div className="text-lg font-black text-white mt-1 font-mono">Son 30 Karşılaşma</div>
              <div className="text-[11px] text-zinc-400 mt-1">Skorlar, rakipler ve net puan değişimleri</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
              <div className="text-[11px] font-bold text-zinc-400 uppercase">İkili Rekabet (H2H)</div>
              <div className="text-lg font-black text-white mt-1 font-mono">Rakip Karnesi</div>
              <div className="text-[11px] text-zinc-400 mt-1">Her rakibe karşı toplam galibiyet/mağlubiyet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
