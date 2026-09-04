"use client";

/**
 * Rakibin bağlantısı koptuğunda tanınan tolerans süresini (grace period)
 * ve kalan saniyeyi gösteren uyarı bileşeni.
 */

import React from "react";
import { AlertTriangle } from "lucide-react";

interface DisconnectGraceAlertProps {
  secondsLeft: number;
}

export function DisconnectGraceAlert({ secondsLeft }: DisconnectGraceAlertProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-3 animate-pulse">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>Rakibin bağlantısı koptu! Yeniden bağlanması bekleniyor...</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30">
          <span>KALAN:</span>
          <span className="text-sm">{secondsLeft}s</span>
        </div>
      </div>
    </div>
  );
}
