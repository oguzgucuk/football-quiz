"use client";

import React from "react";
import { Check, X, Clock } from "lucide-react";
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
    <div className="p-3 border-b border-amber-500/30 bg-amber-950/20 backdrop-blur-xs">
      <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3 text-amber-400" />
          Bekleyen İstekler
        </span>
        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
          {pendingRequests.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {pendingRequests.slice(0, 5).map((req) => (
          <div
            key={req.friendshipId}
            className="flex items-center justify-between gap-2 p-2 bg-black/40 rounded-xl border border-amber-500/25 shadow-xs"
          >
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{req.senderUsername}</div>
              <div className="text-[10px] text-zinc-400 font-mono">{req.senderEloRating} ELO</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onAccept(req.friendshipId)}
                className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900 transition-colors cursor-pointer"
                title="Kabul Et"
                aria-label="Kabul Et"
              >
                <Check className="size-3.5" />
              </button>
              <button
                onClick={() => onReject(req.senderId)}
                className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-500/30 text-rose-400 hover:bg-rose-900 transition-colors cursor-pointer"
                title="Reddet"
                aria-label="Reddet"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
