"use client";

import React from "react";
import { Flame } from "lucide-react";
import { DashboardTab } from "../types";

interface TopBarBrandProps {
  onTabChange: (tab: DashboardTab) => void;
}

export function TopBarBrand({ onTabChange }: TopBarBrandProps) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={() => onTabChange("home")}
        className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
      >
        <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-950/50 font-black text-base border border-emerald-400/30 group-hover:scale-105 group-hover:shadow-emerald-500/30 transition-all">
          <span className="tracking-tighter">A</span>
          <div className="absolute -top-1 -right-1 flex items-center justify-center size-3.5 rounded-full bg-amber-400 text-zinc-950">
            <Flame className="size-2.5 fill-current" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-black tracking-widest text-white leading-none group-hover:text-emerald-300 transition-colors">
            ALİMBALL
          </span>
          <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-400/90 leading-tight">
            SCOUT ARENA
          </span>
        </div>
      </button>
    </div>
  );
}
