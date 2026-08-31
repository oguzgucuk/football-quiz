"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MatchedData, MatchmakingStatus } from "@/hooks/useMatchmaking";
import { Bot, X, CheckCircle2, Swords, Radio } from "lucide-react";

interface MatchmakingModalProps {
  isOpen: boolean;
  status: MatchmakingStatus;
  waitingSeconds: number;
  matchedData: MatchedData | null;
  onCancel: () => void;
  onRequestBot: () => void;
}

export function MatchmakingModal({
  isOpen,
  status,
  waitingSeconds,
  matchedData,
  onCancel,
  onRequestBot,
}: MatchmakingModalProps) {
  const router = useRouter();

  // Eşleşme bulunduğunda 1.5 sn sonra otomatik odaya yönlendir
  useEffect(() => {
    if (status === "matched" && matchedData) {
      const timer = setTimeout(() => {
        router.push(`/play/${matchedData.matchId}`);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [status, matchedData, router]);

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <Card variant="glass" className="max-w-md w-full p-8 text-center relative overflow-hidden shadow-2xl border-zinc-700/80">
        {/* Kapat Butonu */}
        {status !== "matched" && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* 1. AŞAMA: EŞLEŞME BULUNDU */}
        {status === "matched" && matchedData ? (
          <div className="flex flex-col items-center animate-fadeIn py-4">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-5 shadow-lg shadow-emerald-500/20 animate-bounce">
              <Swords className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Eşleşme Tamamlandı!
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {matchedData.opponent.username}
            </h2>
            <span className="text-xs text-zinc-400 mt-1">
              {matchedData.opponent.eloRating || 1000} ELO • {matchedData.isBot ? "Yapay Zeka" : "Canlı Oyuncu"}
            </span>

            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Odaya aktarılıyorsunuz...</span>
            </div>
          </div>
        ) : (
          /* 2. AŞAMA: RAKİP ARANIYOR (RADAR ANIMASYONU) */
          <div className="flex flex-col items-center py-2">
            {/* Radar Efekti */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: "2.5s" }} />
              <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Canlı Havuz Taranıyor
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Rakip Aranıyor...
            </h2>

            {/* Süre Sayacı */}
            <div className="text-3xl font-black text-white font-mono my-4 tracking-wider">
              {formatSeconds(waitingSeconds)}
            </div>

            <p className="text-xs text-zinc-400 max-w-xs mb-6">
              Benzer seviyedeki aktif oyuncular taranıyor. İkinci bir oyuncu katıldığında maç anında başlayacak.
            </p>

            {/* Butonlar */}
            <div className="w-full flex flex-col gap-3">
              {waitingSeconds >= 4 && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={onRequestBot}
                  className="w-full border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 animate-fadeIn"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Bot Rakiple Hemen Oyna
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={onCancel}
                className="w-full text-xs text-zinc-400 hover:text-white border-zinc-800"
              >
                Aramayı İptal Et
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
