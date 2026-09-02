"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, Coins, Gem } from "lucide-react";

type NavTab = "home" | "profile" | "play" | "store" | "settings";

export function TopBar() {
  const [activeTab, setActiveTab] = useState<NavTab>("play");

  const navItems = [
    { id: "home" as const, label: "ANASAYFA" },
    { id: "profile" as const, label: "PROFİL" },
    { id: "play" as const, label: "OYNA", isSpecial: true },
    { id: "store" as const, label: "MAĞAZA" },
    { id: "settings" as const, label: "AYARLAR" },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e2e8e4] bg-white px-6 z-30 select-none shadow-xs relative">
      {/* Sol: Logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#15803d] text-white shadow-sm font-black text-base">
            A
          </div>
          <span className="text-xl font-black tracking-widest text-[#141b16]">
            ALİMBALL
          </span>
        </Link>
      </div>

      {/* Orta: Tam Merkeze Hizalanmış Navigasyon Sekmeleri */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            if (item.isSpecial) {
              const isSelected = activeTab === "play";
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative group mx-2 flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#15803d] text-white font-black text-xs tracking-widest uppercase shadow-md shadow-[#15803d]/30 hover:brightness-110 active:scale-95 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Play className="size-3.5 fill-white" />
                  <span className="relative">{item.label}</span>
                </button>
              );
            }

            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wider transition-all uppercase ${
                  isSelected
                    ? "bg-[#f0f4f2] text-[#141b16] font-black"
                    : "text-[#6b7770] hover:bg-[#f5f8f6] hover:text-[#141b16]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sağ: Oyun Parası (Coins & Gems) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#e2e8e4] bg-[#f8faf8] shadow-2xs hover:border-[#cbd5ce] transition-colors cursor-pointer" title="Altın Bakiyesi">
          <div className="flex size-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Coins className="size-3 fill-amber-500 text-amber-600" />
          </div>
          <span className="text-xs font-black font-mono text-[#141b16] tracking-tight">12.450</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#e2e8e4] bg-[#f8faf8] shadow-2xs hover:border-[#15803d]/40 transition-colors cursor-pointer" title="Zümrüt / ELO">
          <div className="flex size-5 items-center justify-center rounded-full bg-[#15803d]/10 text-[#15803d]">
            <Gem className="size-3 fill-[#15803d]/20 text-[#15803d]" />
          </div>
          <span className="text-xs font-black font-mono text-[#15803d] tracking-tight">340</span>
        </div>
      </div>
    </header>
  );
}
