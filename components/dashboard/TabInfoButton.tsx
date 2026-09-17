"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { DashboardTab } from "./types";
import { TAB_INFO_MAP } from "./tabInfoData";

interface TabInfoButtonProps {
  activeTab: DashboardTab;
  onClick: () => void;
}

export function TabInfoButton({ activeTab, onClick }: TabInfoButtonProps) {
  const currentInfo = TAB_INFO_MAP[activeTab];
  const tabLabel = currentInfo?.tabLabel || "Sekme";

  return (
    <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-30 pointer-events-auto">
      <button
        type="button"
        onClick={onClick}
        title={`${tabLabel} Sekmesi Hakkında Bilgi`}
        aria-label={`${tabLabel} sekmesi içeriği ve rehberi`}
        className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-emerald-950/80 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 backdrop-blur-xl shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_22px_rgba(34,197,94,0.4)] transition-all duration-200 cursor-pointer active:scale-95 select-none"
      >
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-emerald-400" />
        </span>

        <HelpCircle className="size-3.5 sm:size-4 text-emerald-400 group-hover:rotate-12 transition-transform duration-200" />

        <span className="hidden sm:inline font-black text-[11px] uppercase tracking-wider text-emerald-300 font-mono">
          {tabLabel} Nedir?
        </span>
      </button>
    </div>
  );
}
