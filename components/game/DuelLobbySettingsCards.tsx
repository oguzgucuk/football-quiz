"use client";

/**
 * 1v1 Özel Lobi Süre Ayar Kartları (DuelLobbySettingsCards).
 * 4 adet doğrudan tıklanabilir büyük saniye kutucuğu içerir:
 * - Takım / Millet Seçme Süresi: [5 SN] [10 SN] [15 SN] [20 SN]
 * - Oyuncu Bulma Süresi: [5 SN] [10 SN] [15 SN] [20 SN]
 * Yerel state (Optimistic UI) ile tıklandığı an mikrosaniyede seçilir ve sunucuya iletilir.
 */

import React, { useState, useEffect } from "react";
import { Clock, Search, Check, ShieldCheck } from "lucide-react";
import { DuelLobbySettings, ValidLobbyDuration, VALID_LOBBY_DURATIONS } from "@/lib/realtime/roomEngine";

interface DuelLobbySettingsCardsProps {
  settings: DuelLobbySettings;
  isHost: boolean;
  isCountryVsTeam?: boolean;
  onUpdateSettings: (settings: Partial<DuelLobbySettings>) => void;
}

export function DuelLobbySettingsCards({
  settings,
  isHost,
  isCountryVsTeam = false,
  onUpdateSettings,
}: DuelLobbySettingsCardsProps) {
  // Anında görsel tepki için yerel state
  const [selectedPick, setSelectedPick] = useState<number>(() => Number(settings?.pickDuration) || 15);
  const [selectedAnswer, setSelectedAnswer] = useState<number>(() => Number(settings?.answerDuration) || 15);

  // Dışarıdan (WebSocket ile gelen oda senkronizasyonu) state değiştiğinde eşitle
  useEffect(() => {
    if (settings?.pickDuration) {
      setSelectedPick(Number(settings.pickDuration));
    }
  }, [settings?.pickDuration]);

  useEffect(() => {
    if (settings?.answerDuration) {
      setSelectedAnswer(Number(settings.answerDuration));
    }
  }, [settings?.answerDuration]);

  const handleSelectPick = (sec: ValidLobbyDuration) => {
    if (!isHost) return;
    setSelectedPick(sec);
    onUpdateSettings({ pickDuration: sec });
  };

  const handleSelectAnswer = (sec: ValidLobbyDuration) => {
    if (!isHost) return;
    setSelectedAnswer(sec);
    onUpdateSettings({ answerDuration: sec });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* 1. Takım / Millet Seçme Süresi Kartı */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            {isCountryVsTeam ? "Seçim Süresi" : "Takım Seçme Süresi"}
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono font-black text-xs shadow-xs">
            {selectedPick} SANİYE
          </span>
        </div>

        {/* 4'lü Saniye Kutucukları */}
        <div className="grid grid-cols-4 gap-2.5">
          {VALID_LOBBY_DURATIONS.map((sec) => {
            const isSelected = selectedPick === sec;
            return (
              <button
                key={`pick-${sec}`}
                type="button"
                onClick={() => handleSelectPick(sec)}
                className={`relative flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border transition-all duration-150 select-none ${
                  !isHost ? "cursor-not-allowed opacity-70" : "cursor-pointer active:scale-95 hover:border-amber-400/50"
                } ${
                  isSelected
                    ? "bg-gradient-to-b from-amber-500/30 to-amber-600/40 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/60 scale-[1.02]"
                    : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 size-3.5 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <span className="text-xl font-black tracking-tight font-mono">{sec}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">sn</span>
              </button>
            );
          })}
        </div>

        <span className="text-[10px] text-zinc-500 italic">
          {isCountryVsTeam
            ? "* Kulüp veya millet belirleme süresi."
            : "* Takım belirleme süresi."}
        </span>
      </div>

      {/* 2. Oyuncu Bulma Süresi Kartı */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex flex-col justify-between gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            Oyuncu Bulma Süresi
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs shadow-xs shadow-emerald-950">
            {selectedAnswer} SANİYE
          </span>
        </div>

        {/* 4'lü Saniye Kutucukları */}
        <div className="grid grid-cols-4 gap-2.5">
          {VALID_LOBBY_DURATIONS.map((sec) => {
            const isSelected = selectedAnswer === sec;
            return (
              <button
                key={`ans-${sec}`}
                type="button"
                onClick={() => handleSelectAnswer(sec)}
                className={`relative flex flex-col items-center justify-center py-3.5 px-2 rounded-xl border transition-all duration-150 select-none ${
                  !isHost ? "cursor-not-allowed opacity-70" : "cursor-pointer active:scale-95 hover:border-emerald-400/50"
                } ${
                  isSelected
                    ? "bg-gradient-to-b from-emerald-500/30 to-emerald-600/40 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(34,197,94,0.35)] ring-1 ring-emerald-400/60 scale-[1.02]"
                    : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 size-3.5 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                <span className="text-xl font-black tracking-tight font-mono">{sec}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">sn</span>
              </button>
            );
          })}
        </div>

        <span className="text-[10px] text-zinc-500 italic flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
          Ortak futbolcuyu tahmin etme süresi.
        </span>
      </div>
    </div>
  );
}
