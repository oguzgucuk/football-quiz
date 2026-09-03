"use client";

import React, { useEffect, useState, useRef } from "react";
import { Timer } from "lucide-react";

interface RoundTimerProps {
  durationSeconds: number;
  serverSecondsLeft?: number | null;
  onTimeExpired?: () => void;
  isPaused?: boolean;
}

export function RoundTimer({
  durationSeconds,
  serverSecondsLeft,
  onTimeExpired,
  isPaused = false,
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

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 ${isLowTime
          ? "bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse ring-2 ring-rose-500/30"
          : "bg-zinc-900/80 border-zinc-800 text-zinc-200"
        }`}
    >
      <Timer className={`w-4 h-4 ${isLowTime ? "text-rose-400" : "text-emerald-400"}`} />
      <span className="font-mono font-bold text-lg">{timeLeft}s</span>
    </div>
  );
}
