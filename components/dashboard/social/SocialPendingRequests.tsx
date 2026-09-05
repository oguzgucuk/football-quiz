"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { PendingRequest } from "@/hooks/useFriends";

interface SocialPendingRequestsProps {
  pendingRequests: PendingRequest[];
  onAccept: (friendshipId: string) => void;
  onReject: (senderId: string) => void;
}

export function SocialPendingRequests({
  pendingRequests,
  onAccept,
  onReject,
}: SocialPendingRequestsProps) {
  if (pendingRequests.length === 0) return null;

  return (
    <div className="p-3 border-b border-amber-500/30 bg-amber-950/30 backdrop-blur-xs">
      <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        {pendingRequests.length} Bekleyen İstek
      </div>
      <div className="space-y-1.5">
        {pendingRequests.slice(0, 5).map((req) => (
          <div
            key={req.friendshipId}
            className="flex items-center justify-between gap-2 p-2 bg-black/40 rounded-xl border border-amber-500/30 shadow-2xs"
          >
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{req.senderUsername}</div>
              <div className="text-[10px] text-zinc-400 font-mono">{req.senderEloRating} ELO</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onAccept(req.friendshipId)}
                className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 transition-colors cursor-pointer"
                title="Kabul Et"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onReject(req.senderId)}
                className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 transition-colors cursor-pointer"
                title="Reddet"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
