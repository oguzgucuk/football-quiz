"use client";

import React from "react";
import { Pencil, Trophy, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  onEditProfile?: () => void;
}

export function ProfileHeaderCard({ user, onEditProfile }: ProfileHeaderCardProps) {
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : "OY";

  return (
    <div className="relative rounded-[28px] bg-[#0c1612]/85 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-[0_0_35px_rgba(34,197,94,0.12)] overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-center gap-5 sm:gap-6">
        <div className="relative">
          <Avatar className="size-20 sm:size-24 rounded-3xl border-2 border-emerald-400/40 shadow-xl">
            <AvatarFallback className="rounded-3xl bg-gradient-to-br from-[#168841] to-[#126d34] text-white font-black text-2xl sm:text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 size-6 rounded-full border-4 border-[#0c1612] bg-emerald-500 shadow-sm" />
        </div>

        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {user?.username || "Oyuncu"}
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-950/70 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="size-3" />
              {user?.rankTier || "bronze"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Oyuncu ID: #{user?.id ? user.id.substring(0, 8) : "TR2026"} • 2026 Sezonu
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-xs flex items-center gap-2">
              <Trophy className="size-3.5 text-emerald-400" />
              <span className="font-mono font-black">{user?.eloRating || 1000} ELO</span>
              <span className="text-zinc-400 font-normal text-[11px]">Derecesi</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="flex gap-3">
          <div className="flex-1 sm:flex-initial text-center p-3 px-5 rounded-2xl bg-black/40 border border-white/10 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block tracking-wider">
              Galibiyet
            </span>
            <span className="font-mono font-black text-xl text-emerald-400">
              {user?.matchesWon || 0}
            </span>
          </div>
          <div className="flex-1 sm:flex-initial text-center p-3 px-5 rounded-2xl bg-black/40 border border-white/10 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-zinc-400 block tracking-wider">
              Mağlubiyet
            </span>
            <span className="font-mono font-black text-xl text-rose-400">
              {user?.matchesLost || 0}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/60 hover:border-emerald-400 font-extrabold text-xs transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          title="Profili Düzenle"
        >
          <Pencil className="size-4" />
          <span>Profili Düzenle</span>
        </button>
      </div>
    </div>
  );
}
