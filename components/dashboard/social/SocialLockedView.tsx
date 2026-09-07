"use client";

import React from "react";
import { Lock, LogIn, UserPlus, X } from "lucide-react";

interface SocialLockedViewProps {
  onClose: () => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function SocialLockedView({ onClose, onOpenAuthModal }: SocialLockedViewProps) {
  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center backdrop-blur-2xl bg-[#0c1612]/95 h-full">
      {/* Üst Kapatma Butonu */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Kapat"
        aria-label="Kapat"
      >
        <X className="size-5" />
      </button>

      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
        <Lock className="size-6 text-emerald-400" />
      </div>

      <h3 className="text-base font-black text-white tracking-tight mb-2">
        Sosyal Panel Kilitli
      </h3>

      <p className="text-xs text-zinc-400 leading-relaxed mb-6 max-w-[220px]">
        Arkadaş eklemek, durumlarını görmek ve 1v1 maçlara davet etmek için oturum açın.
      </p>

      <div className="w-full space-y-2.5 max-w-xs">
        <button
          onClick={() => {
            onClose();
            onOpenAuthModal?.("login");
          }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-950/50 border border-emerald-400/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <LogIn className="size-3.5" />
          <span>Giriş Yap</span>
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenAuthModal?.("register");
          }}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <UserPlus className="size-3.5 text-emerald-400" />
          <span>Hesap Oluştur</span>
        </button>
      </div>
    </div>
  );
}
