"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Trophy, Play, LogOut, ShieldCheck, UserCheck, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#090a0f] text-zinc-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full text-center p-8">
          <div className="w-16 h-16 rounded-3xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Giriş Yapmadınız</h2>
          <p className="text-zinc-400 text-xs mb-6">
            Profilinizi ve ELO istatistiklerinizi görüntülemek için lütfen giriş yapın.
          </p>
          <Link href="/login" className="w-full">
            <Button size="lg" className="w-full">
              Giriş Yap / Misafir Girişi
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  const totalMatches = (user.matchesWon || 0) + (user.matchesLost || 0);
  const winRate = totalMatches > 0 ? Math.round(((user.matchesWon || 0) / totalMatches) * 100) : 0;

  const getRankBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "diamond":
        return "text-cyan-400 border-cyan-500/40 bg-cyan-500/10 shadow-cyan-500/20";
      case "platinum":
        return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/20";
      case "gold":
        return "text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-amber-500/20";
      case "silver":
        return "text-slate-300 border-slate-400/40 bg-slate-500/10 shadow-slate-500/20";
      default:
        return "text-amber-600 border-amber-700/40 bg-amber-700/10 shadow-amber-700/20";
    }
  };

  const getRankName = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "diamond":
        return "Elmas Ligi";
      case "platinum":
        return "Platin Ligi";
      case "gold":
        return "Altın Ligi";
      case "silver":
        return "Gümüş Ligi";
      default:
        return "Bronz Ligi";
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Arka Plan Parlamaları */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full flex flex-col gap-6 relative z-10">
        {/* Üst Navigasyon */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfaya Dön
          </Link>

          <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10">
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Çıkış Yap
          </Button>
        </div>

        {/* Profil Kartı */}
        <Card variant="glass" className="p-8 flex flex-col items-center text-center">
          {/* Avatar / Rank Rozeti */}
          <div
            className={`w-24 h-24 rounded-3xl border-2 flex items-center justify-center mb-4 shadow-xl ${getRankBadgeColor(
              user.rankTier
            )}`}
          >
            <Trophy className="w-12 h-12" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {user.username}
            {user.isGuest ? (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-semibold border border-zinc-700">
                Misafir
              </span>
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </h1>
          <span className="text-xs text-zinc-400 mt-1">{user.email || "Misafir Oturumu"}</span>

          {/* ELO ve Rank Kartı */}
          <div className="w-full grid grid-cols-2 gap-3 mt-6">
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">
                ELO Puanı
              </span>
              <span className="text-3xl font-black text-emerald-400">{user.eloRating}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-xs text-zinc-500 font-bold block uppercase tracking-wider">
                Lig Kademesi
              </span>
              <span className="text-lg font-extrabold text-white mt-1 block">
                {getRankName(user.rankTier)}
              </span>
            </div>
          </div>

          {/* Maç İstatistikleri */}
          <div className="w-full grid grid-cols-3 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-[11px] text-zinc-500 font-semibold block">Toplam Maç</span>
              <span className="text-xl font-bold text-zinc-200">{totalMatches}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-[11px] text-zinc-500 font-semibold block">Galibiyet</span>
              <span className="text-xl font-bold text-emerald-400">{user.matchesWon || 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
              <span className="text-[11px] text-zinc-500 font-semibold block">Kazanma Oranı</span>
              <span className="text-xl font-bold text-cyan-400">%{winRate}</span>
            </div>
          </div>

          {/* Oyuna Başla Butonu */}
          <div className="w-full mt-6">
            <Link href="/play/oda-1" className="w-full block">
              <Button size="lg" className="w-full">
                <Play className="w-4 h-4 mr-1" />
                1v1 Maça Başla
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
