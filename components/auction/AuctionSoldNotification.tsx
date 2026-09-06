"use client";

/**
 * Müzayede Oyuncu Satıldı Bildirimi.
 * Bir futbolcu satıldığında tüm oyuncuların ekranında tam 2 saniye boyunca
 * kimin hangi oyuncuyu kaç paraya aldığını gösteren şık bildirim kartı.
 */

import React, { useState, useEffect } from "react";
import { AuctionSoldEvent } from "@/lib/auction/auctionTypes";
import { Gavel, CheckCircle2 } from "lucide-react";

interface AuctionSoldNotificationProps {
  soldEvent?: AuctionSoldEvent | null;
}

export function AuctionSoldNotification({ soldEvent }: AuctionSoldNotificationProps) {
  const [activeNotice, setActiveNotice] = useState<AuctionSoldEvent | null>(null);

  useEffect(() => {
    if (!soldEvent || !soldEvent.timestamp) return;

    // Sadece son 5 saniye içindeki olayları göster (eski senkronizasyonları filtrele)
    const ageMs = Date.now() - soldEvent.timestamp;
    if (ageMs > 5000 || ageMs < -5000) return;

    setActiveNotice(soldEvent);

    const timer = setTimeout(() => {
      setActiveNotice(null);
    }, 2000); // Kullanıcının istediği tam 2 saniyelik bildirim

    return () => clearTimeout(timer);
  }, [soldEvent?.timestamp, soldEvent?.playerName, soldEvent?.buyerUserId]);

  if (!activeNotice) return null;

  return (
    <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-lg animate-slideDown">
      <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-black/90 to-amber-950/95 border-2 border-amber-500/60 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.25)] backdrop-blur-2xl text-white">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-inner">
          <Gavel className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Oyuncu Satıldı!
            </span>
            <span className="text-[10px] font-mono text-zinc-400 font-medium">
              2s Bildirim
            </span>
          </div>

          <p className="text-sm font-black text-white mt-1 truncate">
            <span className="text-emerald-300 font-extrabold">{activeNotice.playerName}</span>
            <span className="text-zinc-400 font-mono text-xs ml-1 font-bold">({activeNotice.overall} OVR)</span>
            <span className="text-zinc-300 mx-1.5 font-normal">→</span>
            <span className="text-amber-300 font-extrabold underline decoration-amber-500/50">
              {activeNotice.buyerUsername}
            </span>
            <span className="text-zinc-300 font-normal"> kişisine </span>
            <span className="font-mono text-amber-400 font-black">${activeNotice.amount}M</span>
            <span className="text-zinc-300 font-normal"> ile satıldı!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
