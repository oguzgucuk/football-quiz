"use client";

import React from "react";
import Link from "next/link";
import { Play, Coins, Gem, Home, User, ShoppingBag, Settings, LogIn, UserPlus } from "lucide-react";
import { DashboardTab } from "./types";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function TopBar({ activeTab, onTabChange, onOpenAuthModal }: TopBarProps) {
  const { user, isLoading } = useAuth();

  const navItems = [
    { id: "home" as const, label: "PANO", icon: Home },
    { id: "profile" as const, label: "PROFİL", icon: User },
    { id: "play" as const, label: "OYNA", isSpecial: true, icon: Play },
    { id: "store" as const, label: "MAĞAZA", icon: ShoppingBag },
    { id: "settings" as const, label: "AYARLAR", icon: Settings },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#0a120e]/75 backdrop-blur-md px-6 z-30 select-none shadow-lg relative">
      {/* Sol: Logo */}
      <div className="flex items-center">
        <button
          onClick={() => onTabChange("home")}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#15803d] text-white shadow-sm font-black text-base group-hover:scale-105 transition-transform">
            A
          </div>
          <span className="text-xl font-black tracking-widest text-white">
            ALİMBALL
          </span>
        </button>
      </div>

      {/* Orta: Tam Merkeze Hizalanmış Navigasyon Sekmeleri */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;

            if (item.isSpecial) {
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative group mx-2 flex items-center gap-2 px-7 py-2.5 rounded-xl font-black text-xs tracking-widest uppercase transition-all overflow-hidden cursor-pointer ${
                    isSelected
                      ? "bg-[#15803d] text-white shadow-lg shadow-[#15803d]/40 scale-105 ring-2 ring-[#15803d]/50"
                      : "bg-[#15803d]/90 text-white shadow-md shadow-[#15803d]/25 hover:bg-[#15803d] hover:scale-102"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Play className="size-3.5 fill-white" />
                  <span className="relative">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs tracking-wider transition-all uppercase cursor-pointer ${
                  isSelected
                    ? "bg-white/15 text-emerald-400 font-black border border-emerald-500/40 shadow-xs"
                    : "text-zinc-400 hover:bg-white/10 hover:text-white font-bold"
                }`}
              >
                <item.icon
                  className={`size-3.5 ${
                    isSelected ? "text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sağ: Oturum Butonları VEYA Oyun Parası (Coins & Gems) */}
      <div className="flex items-center gap-2" suppressHydrationWarning>
        {isLoading && !user ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-20 rounded-xl bg-white/10" />
            <div className="h-8 w-20 rounded-xl bg-white/10" />
          </div>
        ) : !user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuthModal?.("login")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/50 text-emerald-400 text-xs font-bold hover:bg-emerald-900/60 transition-all cursor-pointer shadow-2xs"
            >
              <LogIn className="size-3.5" />
              <span>Giriş Yap</span>
            </button>

            <button
              onClick={() => onOpenAuthModal?.("register")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <UserPlus className="size-3.5" />
              <span>Kayıt Ol</span>
            </button>
          </div>
        ) : (
          <>
            {/* Düz Coin Bakiyesi */}
            <div
              onClick={() => onTabChange("store")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 shadow-2xs hover:border-amber-400/50 hover:bg-amber-500/10 transition-all cursor-pointer group"
              title="Coin Bakiyesi — Mağazada Harca"
            >
              <div className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                <Coins className="size-3 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-xs font-black font-mono text-white tracking-tight">
                {(user.coins ?? 0).toLocaleString()}
              </span>
            </div>

            {/* AlimCoin (AC) Premium Bakiyesi */}
            <div
              onClick={() => onTabChange("store")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 shadow-2xs hover:border-emerald-400 hover:shadow-emerald-500/20 transition-all cursor-pointer group"
              title="AlimCoin (AC) — Gerçek Parayla Satın Al veya Harca"
            >
              <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-[9px] shadow-sm group-hover:scale-110 transition-transform">
                AC
              </div>
              <span className="text-xs font-black font-mono text-emerald-400 tracking-tight">
                {(user.alimCoins ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 rounded px-1 py-0.2">
                +
              </span>
            </div>

            {/* ELO Derecesi */}
            <div
              onClick={() => onTabChange("profile")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 shadow-2xs hover:border-emerald-500/40 hover:bg-emerald-950/30 transition-all cursor-pointer"
              title="ELO Derecesi — Profilde İncele"
            >
              <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Gem className="size-3 fill-emerald-400/20 text-emerald-400" />
              </div>
              <span className="text-xs font-black font-mono text-emerald-400 tracking-tight">
                {user.eloRating || 1000}
              </span>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
