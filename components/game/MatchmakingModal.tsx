"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MatchedData, MatchmakingStatus } from "@/hooks/useMatchmaking";
import { Bot, X, CheckCircle2, Swords, Radio, Timer, Sparkles } from "lucide-react";

interface MatchmakingModalProps {
  isOpen: boolean;
  status: MatchmakingStatus;
  waitingSeconds: number;
  matchedData: MatchedData | null;
  selectedDuration: number;
  onSelectDuration: (duration: number) => void;
  onCancel: () => void;
  onRequestBot: () => void;
}

const DURATION_OPTIONS = [
  { value: 5, label: "5 sn", desc: "Aşırı Hızlı", icon: "⚡" },
  { value: 10, label: "10 sn", desc: "Hızlı", icon: "⏱️" },
  { value: 15, label: "15 sn", desc: "Standart", icon: "🎯" },
  { value: 20, label: "20 sn", desc: "Düşünceli", icon: "🧠" },
];

export function MatchmakingModal({
  isOpen,
  status,
  waitingSeconds,
  matchedData,
  selectedDuration,
  onSelectDuration,
  onCancel,
  onRequestBot,
}: MatchmakingModalProps) {
  const router = useRouter();

  // Eşleşme bulunduğunda 1.4 sn sonra otomatik odaya yönlendir
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
      <Card variant="glass" className="max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl border-zinc-700/80">
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
        {status === "matched" && matchedData && (
          <div className="flex flex-col items-center py-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Eşleşme Tamamlandı!
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              Rakip Bulundu!
            </h3>

            <div className="my-4 px-6 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center font-bold text-white text-lg">
                {matchedData.opponent.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  {matchedData.opponent.username}
                  {matchedData.isBot && <span className="text-xs">🤖</span>}
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-1">
                  <span>ELO: {matchedData.opponent.eloRating || 1000}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-semibold">{matchedData.roundDuration || selectedDuration}s Modu</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-400 animate-pulse">
              Maç odasına aktarılıyorsunuz...
            </p>
          </div>
        )}

        {/* 2. AŞAMA: RAKİP ARANIYOR */}
        {status === "searching" && (
          <div className="flex flex-col items-center py-2">
            {/* Süre Seçim Butonları (5, 10, 15, 20 sn) */}
            <div className="w-full mb-6">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-cyan-400" />
                  Tur Süresi Seçimi:
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">
                  Seçilen: {selectedDuration}s
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {DURATION_OPTIONS.map((opt) => {
                  const isSelected = selectedDuration === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onSelectDuration(opt.value)}
                      className={`py-2 px-1.5 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 font-bold scale-[1.03]"
                          : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                      }`}
                    >
                      <span className="text-xs font-black">{opt.label}</span>
                      <span className="text-[9px] text-zinc-500">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radar Efekti */}
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-cyan-500/10 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Radio className="w-8 h-8 animate-spin" style={{ animationDuration: "8s" }} />
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-white tracking-tight">
              1v1 Rakip Aranıyor...
            </h3>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold my-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{selectedDuration} Saniye Modu • Ortak Süreyi Seçenler Eşleşir</span>
            </div>

            <div className="text-3xl font-mono font-black text-emerald-400 mb-1">
              {formatSeconds(waitingSeconds)}
            </div>

            <p className="text-xs text-zinc-500 mb-6">
              Hem takım hem futbolcu seçimi için <strong>{selectedDuration} saniye</strong> süreniz olacak.
            </p>

            {/* Bot Butonu */}
            <div className="w-full flex flex-col gap-2">
              <Button
                size="md"
                variant="secondary"
                className="w-full border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-200"
                onClick={onRequestBot}
              >
                <Bot className="w-4 h-4 mr-2 text-cyan-400" />
                Beklemeden Bot ile Başla ({selectedDuration}s)
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="w-full text-xs text-zinc-500 hover:text-zinc-300"
                onClick={onCancel}
              >
                İptal Et
              </Button>
            </div>
          </div>
        )}

        {/* 3. AŞAMA: HATA */}
        {status === "error" && (
          <div className="py-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <Swords className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Bağlantı Hatası</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Eşleştirme sunucusuna bağlanırken bir sorun oluştu. Lütfen tekrar deneyin.
            </p>
            <Button size="md" variant="primary" className="w-full" onClick={onCancel}>
              Kapat
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
