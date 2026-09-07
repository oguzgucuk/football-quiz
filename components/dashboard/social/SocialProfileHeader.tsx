"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Flame, Trophy, X } from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SocialProfileHeaderProps {
  user: AuthenticatedUser | null;
  onClose: () => void;
}

export function SocialProfileHeader({ user, onClose }: SocialProfileHeaderProps) {
  const totalMatches = (user?.matchesWon ?? 0) + (user?.matchesLost ?? 0) + (user?.matchesDraw ?? 0);
  const winRate = totalMatches > 0
    ? Math.round(((user?.matchesWon ?? 0) / totalMatches) * 100)
    : 0;

  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : "OY";

  return (
    <div className="p-4 border-b border-white/10 bg-gradient-to-b from-emerald-950/40 via-emerald-950/10 to-transparent">
      {/* Üst Başlık & Kapatma Butonu */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          Sosyal & Arkadaşlar
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Sidebar'ı Kapat"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="size-12 rounded-2xl border border-emerald-500/30 shadow-md">
            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-[#168841] to-[#126d34] text-white font-black text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-emerald-500 border-2 border-[#0c1612] rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white truncate">
              {user?.username ?? "Yükleniyor..."}
            </h3>
            <Link
              href="/?tab=profile"
              onClick={onClose}
              className="text-zinc-400 hover:text-emerald-400 transition-colors p-1"
              title="Profil Sayfasına Git"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
              <ShieldCheck className="size-3" />
              {user?.rankTier ?? "bronze"}
            </span>
            <span className="text-[11px] font-mono font-bold text-zinc-300">
              {user?.eloRating ?? 1000} ELO
            </span>
          </div>
        </div>
      </div>

      {/* İstatistik Çubukları */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
        <div className="bg-black/30 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
          <Flame className="size-4 text-orange-400 fill-orange-400/20 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider truncate">
              Seri
            </div>
            <div className="text-xs font-black text-white font-mono">
              {user?.currentStreak ?? 0} Galibiyet
            </div>
          </div>
        </div>
        <div className="bg-black/30 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 flex items-center gap-2">
          <Trophy className="size-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider truncate">
              Kazanma
            </div>
            <div className="text-xs font-black text-white font-mono">
              %{winRate} ({totalMatches}M)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
