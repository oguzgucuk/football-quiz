"use client";

import React from "react";
import { Users, ChevronLeft } from "lucide-react";

interface SocialToggleTabProps {
  isOpen: boolean;
  onToggle: () => void;
  onlineCount?: number;
  hasPendingRequests?: boolean;
}

export function SocialToggleTab({
  isOpen,
  onToggle,
  onlineCount = 0,
  hasPendingRequests = false,
}: SocialToggleTabProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onToggle}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 py-3 pl-3 pr-2 rounded-l-2xl bg-[#0a120e]/85 backdrop-blur-md border border-r-0 border-white/15 shadow-2xl hover:border-emerald-500/50 hover:bg-[#0c1813] transition-all group cursor-pointer active:scale-95"
      title="Sosyal Paneli Aç (Arkadaşlar)"
      aria-label="Sosyal Paneli Aç"
    >
      <ChevronLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 group-hover:-translate-x-0.5 transition-all" />
      <div className="relative">
        <Users className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
        {hasPendingRequests ? (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        ) : onlineCount > 0 ? (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
        ) : null}
      </div>
      {onlineCount > 0 && (
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
          {onlineCount}
        </span>
      )}
    </button>
  );
}
