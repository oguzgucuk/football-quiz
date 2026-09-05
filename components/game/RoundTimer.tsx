"use client";

import React, { useEffect, useState, useRef } from "react";
import { Timer } from "lucide-react";

interface RoundTimerProps {
  durationSeconds: number;
  serverSecondsLeft?: number | null;
  onTimeExpired?: () => void;
  isPaused?: boolean;
  label?: string;
  variant?: "picking" | "answering";
}

export function RoundTimer({
  durationSeconds,
  serverSecondsLeft,
  onTimeExpired,
  isPaused = false,
  label,
  variant = "answering",
}: RoundTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const onExpiredRef = useRef(onTimeExpired);

  useEffect(() => {
    onExpiredRef.current = onTimeExpired;
  }, [onTimeExpired]);

  // Sunucudan gelen yetkili zaman damgası varsa onu kullan (Server-Side Timer)
  useEffect(() => {
    if (serverSecondsLeft !== undefined && serverSecondsLeft !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(serverSecondsLeft);
    }
  }, [serverSecondsLeft]);

  // Yeni tur başlangıcı için yerel süreyi güncelle
  useEffect(() => {
    if (serverSecondsLeft === undefined || serverSecondsLeft === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(durationSeconds);
    }
  }, [durationSeconds, serverSecondsLeft]);

  // Yerel fallback sayacı (Sunucu saniyeleri gelmediğinde devreye girer)
  useEffect(() => {
    if (isPaused) return;

    if (timeLeft <= 0) {
      onExpiredRef.current?.();
      return;
    }

    // Sunucudan aktif tick geliyorsa yerel timeout tetikleme
    if (serverSecondsLeft !== undefined && serverSecondsLeft !== null) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPaused, timeLeft, serverSecondsLeft]);

  const isLowTime = timeLeft <= 3 && timeLeft > 0;
  const isPicking = variant === "picking";

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 shadow-lg ${
        isLowTime
          ? "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/30 shadow-rose-900/30"
          : isPicking
          ? "bg-amber-950/70 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/20 shadow-amber-950/40"
          : "bg-[#0c1612]/90 border-white/15 text-zinc-100 ring-1 ring-emerald-500/20"
      }`}
    >
      <Timer
        className={`w-4 h-4 ${
          isLowTime ? "text-rose-400" : isPicking ? "text-amber-400" : "text-emerald-400"
        }`}
      />
      {label && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-r border-zinc-700/60 pr-2.5">
          {label}
        </span>
      )}
      <span className="font-mono font-black text-lg sm:text-xl tracking-tight">{timeLeft}s</span>
    </div>
  );
}
