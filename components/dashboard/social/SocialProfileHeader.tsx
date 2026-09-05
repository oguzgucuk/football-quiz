"use client";

import React from "react";
import Link from "next/link";
import { User, ChevronRight, ShieldCheck, Flame, Trophy, X } from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/session";

interface SocialProfileHeaderProps {
  user: AuthenticatedUser | null;
  onClose: () => void;
}

export function SocialProfileHeader({ user, onClose }: SocialProfileHeaderProps) {
  const totalMatches = (user?.matchesWon ?? 0) + (user?.matchesLost ?? 0) + (user?.matchesDraw ?? 0);
  const winRate = totalMatches > 0
    ? Math.round(((user?.matchesWon ?? 0) / totalMatches) * 100)
    : 0;

  return (
    <div className="p-4 border-b border-white/10 bg-gradient-to-b from-emerald-950/40 to-transparent">
      {/* Üst Başlık & Kapatma Butonu */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
          Sosyal & Arkadaşlar
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Sidebar'ı Kapat"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#168841] to-[#126d34] p-0.5 shadow-sm">
            <div className="w-full h-full bg-[#0a120e] rounded-[14px] flex items-center justify-center text-emerald-400 font-bold">
              <User className="w-6 h-6" />
            </div>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a120e] rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white truncate">
              {user?.username ?? "Yükleniyor..."}
            </h3>
            <Link
              href="/profile"
              onClick={onClose}
              className="text-zinc-400 hover:text-emerald-400 transition-colors p-1"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 capitalize">
              <ShieldCheck className="w-3 h-3" />
              {user?.rankTier ?? "bronze"}
            </span>
            <span className="text-[11px] font-mono font-bold text-zinc-400">
              {user?.eloRating ?? 1000} ELO
            </span>
          </div>
        </div>
      </div>

      {/* İstatistik Çubukları */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
        <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 shadow-2xs flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Seri</div>
            <div className="text-xs font-black text-white font-mono">
              {user?.currentStreak ?? 0} Galibiyet
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 shadow-2xs flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Kazanma</div>
            <div className="text-xs font-black text-white font-mono">
              %{winRate} ({totalMatches}M)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
