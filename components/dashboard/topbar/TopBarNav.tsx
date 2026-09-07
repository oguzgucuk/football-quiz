"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Home, User, ShoppingBag, Settings } from "lucide-react";
import { DashboardTab } from "../types";

interface TopBarNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export function TopBarNav({ activeTab, onTabChange }: TopBarNavProps) {
  const navItems = [
    { id: "home" as const, label: "PANO", icon: Home },
    { id: "profile" as const, label: "PROFİL", icon: User },
    { id: "play" as const, label: "OYNA", isSpecial: true, icon: Play },
    { id: "store" as const, label: "MAĞAZA", icon: ShoppingBag },
    { id: "settings" as const, label: "AYARLAR", icon: Settings },
  ];

  return (
    <div className="flex items-center justify-center flex-1 min-w-0 mx-2 sm:mx-4">
      <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
        {navItems.map((item) => {
          const isSelected = activeTab === item.id;
          const isPlay = item.id === "play";

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs tracking-wider transition-colors uppercase cursor-pointer shrink-0 font-bold ${
                isSelected
                  ? "text-white"
                  : isPlay
                  ? "text-emerald-400/90 hover:text-emerald-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="topbar-active-pill"
                  className={`absolute inset-0 rounded-xl ${
                    isPlay
                      ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 border border-emerald-400/50 shadow-lg shadow-emerald-900/40"
                      : "bg-white/10 border border-emerald-500/40 shadow-xs shadow-emerald-500/10"
                  }`}
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <item.icon
                className={`size-3.5 relative z-10 transition-colors ${
                  isSelected
                    ? isPlay
                      ? "fill-white text-white"
                      : "text-emerald-400"
                    : isPlay
                    ? "fill-emerald-400/70 text-emerald-400/70"
                    : "text-zinc-400"
                }`}
              />
              <span className="hidden sm:inline relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
