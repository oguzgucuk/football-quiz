"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MatchedData, MatchmakingStatus } from "@/hooks/useMatchmaking";
import { X, CheckCircle2, Radio, Timer, Sparkles, ChevronRight, AlertCircle } from "lucide-react";

interface MatchmakingModalProps {
  isOpen: boolean;
  status: MatchmakingStatus;
  waitingSeconds: number;
  matchedData: MatchedData | null;
  selectedDuration: number;
  onSelectDuration: (duration: number) => void;
  onStartSearching: (duration: number) => void;
  onCancel: () => void;
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
  onStartSearching,
  onCancel,
}: MatchmakingModalProps) {
  const router = useRouter();

  // Eşleşme bulunduğunda 1.4 sn sonra otomatik maç odasına yönlendir
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn select-none">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#e2e8e4] bg-white p-6 sm:p-7 shadow-2xl text-center">
        {/* Kapat Butonu */}
        {status !== "matched" && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-[#6b7770] hover:text-[#141b16] rounded-xl hover:bg-[#f0f4f2] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        )}

        {/* 1. AŞAMA: SÜRE SEÇİMİ (Arama Henüz Başlamadı) */}
        {status === "idle" && (
          <div className="flex flex-col items-center py-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#15803d] bg-[#15803d]/10 px-3 py-1 rounded-full mb-3">
              <Sparkles className="size-3" />
              1v1 Dereceli Maç
            </span>

            <h3 className="text-xl font-black tracking-tight text-[#141b16] mb-1">
              Tur Süresini Seçin
            </h3>

            <p className="text-xs text-[#6b7770] leading-relaxed mb-6 max-w-xs">
              Her soru için düşünme ve yazma sürenizi belirleyin. Yalnızca aynı süreyi seçen rakiplerle eşleşirsiniz.
            </p>

            {/* 4 Süre Kartı: 5, 10, 15, 20 sn */}
            <div className="grid grid-cols-2 gap-2.5 w-full mb-6">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = selectedDuration === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onSelectDuration(opt.value)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#e8f3ed] border-2 border-[#15803d] text-[#15803d] shadow-sm scale-[1.02]"
                        : "bg-[#f8faf8] border-2 border-[#e2e8e4] text-[#525f56] hover:border-[#cbd5ce] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-base">{opt.icon}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-[#15803d] text-white"
                            : "bg-[#f0f4f2] text-[#6b7770]"
                        }`}
                      >
                        {opt.value}s
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-black tracking-tight text-[#141b16]">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-[#6b7770] font-medium">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sıraya Gir Butonu */}
            <button
              onClick={() => onStartSearching(selectedDuration)}
              className="w-full h-12 rounded-xl bg-gradient-to-b from-[#168841] to-[#126d34] hover:from-[#15803d] hover:to-[#0f5c2b] text-white text-xs font-black uppercase tracking-widest shadow-md shadow-[#15803d]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sıraya Gir</span>
              <ChevronRight className="size-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* 2. AŞAMA: RAKİP ARANIYOR */}
        {status === "searching" && (
          <div className="flex flex-col items-center py-2 animate-fadeIn">
            {/* Radar Efekti */}
            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#15803d]/10 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-[#15803d]/15 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-[#e8f3ed] border border-[#bfe0cc] flex items-center justify-center text-[#15803d] shadow-sm">
                <Radio className="w-8 h-8 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
            </div>

            <h3 className="text-xl font-black text-[#141b16] tracking-tight mb-2">
              Rakip Aranıyor...
            </h3>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f3ed] border border-[#cbe4d4] text-[#15803d] text-xs font-bold mb-3">
              <Timer className="w-3.5 h-3.5" />
              <span>{selectedDuration} Saniye Modu • ELO Dengeli Eşleşme</span>
            </div>

            <div className="text-3xl font-mono font-black text-[#15803d] mb-2">
              {formatSeconds(waitingSeconds)}
            </div>

            <p className="text-xs text-[#6b7770] mb-6">
              Her iki taraf için soru başına <strong>{selectedDuration} saniye</strong> süre verilecektir.
            </p>

            {/* İptal Butonu */}
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl border border-[#e2e8e4] bg-[#f8faf8] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-xs font-bold text-[#6b7770] transition-colors cursor-pointer"
            >
              Aramayı İptal Et
            </button>
          </div>
        )}

        {/* 3. AŞAMA: EŞLEŞME BULUNDU */}
        {status === "matched" && matchedData && (
          <div className="flex flex-col items-center py-3 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-[#e8f3ed] border-2 border-[#15803d] flex items-center justify-center text-[#15803d] mb-4 shadow-md shadow-[#15803d]/15 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-[#15803d] bg-[#15803d]/10 px-2.5 py-0.5 rounded-full mb-1">
              Eşleşme Tamamlandı
            </span>
            <h3 className="text-2xl font-black text-[#141b16] tracking-tight mb-2">
              Rakip Bulundu!
            </h3>

            <div className="my-4 px-5 py-3 rounded-2xl bg-[#f8faf8] border border-[#e2e8e4] flex items-center gap-3.5 w-full">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#168841] to-[#126d34] flex items-center justify-center font-black text-white text-base shadow-xs">
                {matchedData.opponent.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="text-sm font-black text-[#141b16] truncate">
                  {matchedData.opponent.username}
                </div>
                <div className="text-xs text-[#6b7770] flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold text-[#141b16]">
                    {matchedData.opponent.eloRating || 1000} ELO
                  </span>
                  <span>•</span>
                  <span className="text-[#15803d] font-bold">
                    {matchedData.roundDuration || selectedDuration}s Modu
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#15803d] font-bold animate-pulse">
              Maç odasına aktarılıyorsunuz...
            </p>
          </div>
        )}

        {/* 4. AŞAMA: HATA */}
        {status === "error" && (
          <div className="py-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mx-auto mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#141b16] mb-1">Bağlantı Hatası</h3>
            <p className="text-xs text-[#6b7770] mb-5">
              Eşleştirme sunucusuna bağlanırken bir sorun oluştu. Lütfen tekrar deneyin.
            </p>
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl bg-[#f0f4f2] text-[#141b16] text-xs font-bold hover:bg-[#e2e8e4] transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
