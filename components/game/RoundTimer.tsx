"use client";

import React, { useEffect, useState, useRef } from "react";
import { Timer } from "lucide-react";

interface RoundTimerProps {
  durationSeconds: number;
  onTimeExpired?: () => void;
  isPaused?: boolean;
}

export function RoundTimer({
  durationSeconds,
  onTimeExpired,
  isPaused = false,
}: RoundTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const onExpiredRef = useRef(onTimeExpired);

  useEffect(() => {
    onExpiredRef.current = onTimeExpired;
  }, [onTimeExpired]);

  useEffect(() => {
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (isPaused) return;

    if (timeLeft <= 0) {
      onExpiredRef.current?.();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPaused, timeLeft]);

  const isLowTime = timeLeft <= 3 && timeLeft > 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 ${
        isLowTime
          ? "bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse ring-2 ring-rose-500/30"
          : "bg-zinc-900/80 border-zinc-800 text-zinc-200"
      }`}
    >
      <Timer className={`w-4 h-4 ${isLowTime ? "text-rose-400" : "text-emerald-400"}`} />
      <span className="font-mono font-bold text-lg">{timeLeft}s</span>
    </div>
  );
}
