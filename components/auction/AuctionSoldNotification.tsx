"use client";

/**
 * Müzayede Oyuncu Satıldı Bildirimi.
 * Bir futbolcu satıldığında tüm oyuncuların ekranının en üstünde
 * kimin hangi oyuncuyu kaç paraya aldığını gösteren Hallmark tarzı bildirim banner'ı.
 */

import React, { useState, useEffect, useRef } from "react";
import { AuctionSoldEvent } from "@/lib/auction/auctionTypes";
import { Gavel, CheckCircle2, ArrowRight } from "lucide-react";

interface AuctionSoldNotificationProps {
  soldEvent?: AuctionSoldEvent | null;
}

export function AuctionSoldNotification({ soldEvent }: AuctionSoldNotificationProps) {
  const [activeNotice, setActiveNotice] = useState<AuctionSoldEvent | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!soldEvent || !soldEvent.timestamp) return;
    // Aynı olayın mükerrer tetiklenmesini engelle
    if (lastTimestampRef.current === soldEvent.timestamp) return;

    lastTimestampRef.current = soldEvent.timestamp;
    setActiveNotice(soldEvent);

    // Bildirim 3.5 saniye ekranda kalır
    const timer = setTimeout(() => {
      setActiveNotice(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [soldEvent?.timestamp]);

  if (!activeNotice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-3 w-full max-w-xl animate-slideDown select-none"
    >
      <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-black/90 border-2 border-amber-500/50 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(245,158,11,0.25)] backdrop-blur-2xl text-white">
        {/* Sol Vurgulu Tokmak İkonu */}
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-inner">
          <Gavel className="w-5 h-5 animate-bounce" />
        </div>

        {/* Bilgi Metni */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Transfer Tamamlandı!
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Müzayede Satışı
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm font-bold text-white">
            <span className="text-emerald-300 font-black">
              {activeNotice.playerName}
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
              {activeNotice.overall} OVR
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-amber-300 font-black bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
              {activeNotice.buyerUsername}
            </span>
            <span className="text-zinc-400 text-xs">kazandı</span>
            <span className="ml-auto font-mono text-amber-400 font-black text-sm bg-black/50 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
              ${activeNotice.amount}M
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
