"use client";

import React from "react";
import Link from "next/link";
import { Play, Coins, Gem, Home, User, ShoppingBag, Settings } from "lucide-react";
import { DashboardTab } from "./types";
import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const { user } = useAuth();

  const navItems = [
    { id: "home" as const, label: "PANO", icon: Home },
    { id: "profile" as const, label: "PROFİL", icon: User },
    { id: "play" as const, label: "OYNA", isSpecial: true, icon: Play },
    { id: "store" as const, label: "MAĞAZA", icon: ShoppingBag },
    { id: "settings" as const, label: "AYARLAR", icon: Settings },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e2e8e4] bg-white px-6 z-30 select-none shadow-xs relative">
      {/* Sol: Logo */}
      <div className="flex items-center">
        <button
          onClick={() => onTabChange("home")}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#15803d] text-white shadow-sm font-black text-base group-hover:scale-105 transition-transform">
            A
          </div>
          <span className="text-xl font-black tracking-widest text-[#141b16]">
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
                      ? "bg-[#15803d] text-white shadow-lg shadow-[#15803d]/35 scale-105 ring-2 ring-[#15803d]/40"
                      : "bg-[#15803d]/90 text-white shadow-md shadow-[#15803d]/20 hover:bg-[#15803d] hover:scale-102"
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
                    ? "bg-[#e8f3ed] text-[#15803d] font-black border border-[#cbe4d4] shadow-xs"
                    : "text-[#6b7770] hover:bg-[#f5f8f6] hover:text-[#141b16] font-bold"
                }`}
              >
                <item.icon
                  className={`size-3.5 ${
                    isSelected ? "text-[#15803d]" : "text-[#8a968f]"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sağ: Oyun Parası (Coins & Gems) */}
      <div className="flex items-center gap-2">
        <div
          onClick={() => onTabChange("store")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#e2e8e4] bg-[#f8faf8] shadow-2xs hover:border-amber-300 hover:bg-amber-50/40 transition-all cursor-pointer"
          title="Altın Bakiyesi — Mağazada Kullan"
        >
          <div className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Coins className="size-3 fill-amber-500 text-amber-600" />
          </div>
          <span className="text-xs font-black font-mono text-[#141b16] tracking-tight">
            12.450
          </span>
        </div>

        <div
          onClick={() => onTabChange("profile")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#e2e8e4] bg-[#f8faf8] shadow-2xs hover:border-[#15803d]/40 hover:bg-emerald-50/40 transition-all cursor-pointer"
          title="Zümrüt / ELO Derecesi — Profilde İncele"
        >
          <div className="flex size-5 items-center justify-center rounded-full bg-[#15803d]/10 text-[#15803d]">
            <Gem className="size-3 fill-[#15803d]/20 text-[#15803d]" />
          </div>
          <span className="text-xs font-black font-mono text-[#15803d] tracking-tight">
            {user?.eloRating || 1000}
          </span>
        </div>
      </div>
    </header>
  );
}
