"use client";

import React from "react";
import { LogOut, Trophy } from "lucide-react";

interface ProfileUser {
  id?: string;
  username?: string;
  rankTier?: string;
  eloRating?: number;
  matchesWon?: number;
  matchesLost?: number;
}

interface ProfileHeaderCardProps {
  user: ProfileUser | null;
  onOpenLogoutModal: () => void;
}

export function ProfileHeaderCard({ user, onOpenLogoutModal }: ProfileHeaderCardProps) {
  return (
    <div className="relative rounded-[28px] bg-[#0c1612]/85 backdrop-blur-xl border border-white/10 p-8 shadow-[0_0_35px_rgba(34,197,94,0.15)] overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#168841] to-[#126d34] text-white font-black text-3xl shadow-lg border border-emerald-400/30">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : "SE"}
          </div>
          <span className="absolute -bottom-1 -right-1 size-6 rounded-full border-4 border-[#0c1612] bg-emerald-500 flex items-center justify-center" />
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {user?.username || "Oyuncu"}
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/70 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {user?.rankTier || "bronze"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Oyuncu ID: #{user?.id ? user.id.substring(0, 8) : "TR2026"} • 2026 Sezonu
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/40 shadow-xs flex items-center gap-1.5">
              <Trophy className="size-3.5 text-emerald-400" />
              <span>{user?.eloRating || 1000} ELO Derecesi</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="flex gap-3">
          <div className="flex-1 sm:flex-initial text-center p-3 px-5 rounded-2xl bg-black/35 border border-white/10">
            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">
              Galibiyet
            </span>
            <span className="font-mono font-black text-xl text-emerald-400">
              {user?.matchesWon || 0}
            </span>
          </div>
          <div className="flex-1 sm:flex-initial text-center p-3 px-5 rounded-2xl bg-black/35 border border-white/10">
            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">
              Mağlubiyet
            </span>
            <span className="font-mono font-black text-xl text-rose-400">
              {user?.matchesLost || 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLogoutModal}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 hover:border-rose-400/50 font-extrabold text-xs transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          title="Hesaptan Çıkış Yap"
        >
          <LogOut className="size-4" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
}
