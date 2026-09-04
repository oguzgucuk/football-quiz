"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Gavel,
  Swords,
  ChevronRight,
  Trophy,
  Zap,
  Users,
  Lock,
  HelpCircle,
  X,
  Play,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type SubModeType = "ranked" | "casual" | "custom";

type GuideInfo = {
  title: string;
  subtitle: string;
  goal: string;
  steps: string[];
  tip: string;
  mediaPlaceholder: string;
};

const MODE_GUIDES: Record<string, GuideInfo> = {
  common_player: {
    title: "Ortak Oyuncu Modu",
    subtitle: "İki Takım Arasındaki Ortak Yıldızı Bul",
    goal: "Ekranda beliren 2 farklı kulüpte (örn: Real Madrid & Inter) kariyerinde forma giymiş ortak bir futbolcuyu rakibinden önce bulup yazmak.",
    steps: [
      "Tur başladığında iki kulübün logoları ve isimleri ekranda belirir.",
      "Input alanına aklına gelen ortak oyuncunun ismini yazmaya başla (Otomatik tamamlama önerileri sunar).",
      "Doğru futbolcuyu ilk yazıp Enter'a basan oyuncu turu ve puanı kazanır!",
    ],
    tip: "Sadece doğrudan transfer olanlar değil; kariyerinin herhangi bir döneminde (kiralık veya altyapı dahil) her iki kulüpte de oynamış oyuncular geçerlidir.",
    mediaPlaceholder: "Ortak Oyuncu Oynanış Rehberi (GIF / Video Yakında)",
  },
  grid: {
    title: "Millet-Takım Grid Modu",
    subtitle: "Kesişimleri En Nadir Yıldızlarla Doldur",
    goal: "3x3 veya 4x4 matristeki satır (millet) ve sütun (kulüp) kesişimlerine uyan futbolcuları bularak gridi en yüksek nadirlik puanıyla tamamlamak.",
    steps: [
      "Doldurmak istediğin kareye tıkla (Örn: Brezilya x Barcelona).",
      "Kriterlere uyan futbolcuyu yaz (Örn: Ronaldinho, Neymar, Rivaldo).",
      "Daha az bilinen, sürpriz oyuncuları buldukça daha yüksek 'Nadir Oyuncu' bonusu kazanırsın!",
    ],
    tip: "Her futbolcu yalnızca bir kez kullanılabilir; bu yüzden kilit oyuncuları doğru kutucuklara saklamayı unutma!",
    mediaPlaceholder: "Grid Bulmaca Oynanış Rehberi (GIF / Video Yakında)",
  },
  auction: {
    title: "Müzayede Modu",
    subtitle: "Canlı Açık Arttırma & Kadro Kurma",
    goal: "Sana verilen 100M€ bütçeyle açık arttırmaya çıkan dünya yıldızlarına pey sürüp en dengeli ilk 11'i kurmak.",
    steps: [
      "Her tur transfer pazarına rastgele dünya yıldızı bir futbolcu çıkar.",
      "Canlı sayaç geri sayarken diğer oyuncularla bütçeni yöneterek teklifleri artır.",
      "Süre bittiğinde en yüksek teklifi veren oyuncu kartı alır. 11 mevkiyi en uyumlu tamamlayan şampiyon olur!",
    ],
    tip: "Tüm bütçeni tek bir forvete harcama; savunma ve kaleci mevkileri zayıf kalırsa puan kaybedersin!",
    mediaPlaceholder: "Canlı Müzayede Oynanış Rehberi (GIF / Video Yakında)",
  },
};

interface PlayStageProps {
  onStartRanked: () => void;
  onOpenCustomRoom: () => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function PlayStage({
  onStartRanked,
  onOpenCustomRoom,
  onOpenAuthModal,
}: PlayStageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedModeId, setSelectedModeId] = useState<"common_player" | "grid" | "auction">("common_player");
  const [selectedSubMode, setSelectedSubMode] = useState<SubModeType>("ranked");
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);

  const subModes = [
    {
      id: "ranked" as const,
      name: "Dereceli",
      subtitle: "1v1 Rekabetçi",
      icon: Trophy,
      badge: "ELO",
    },
    {
      id: "casual" as const,
      name: "Hızlı Maç",
      subtitle: "Sonsuz Antrenman",
      icon: Zap,
      badge: "Serbest",
    },
    {
      id: "custom" as const,
      name: "Özel Oyun",
      subtitle: "Arkadaşla Lobi",
      icon: Users,
      badge: "Lobi",
    },
  ];

  const handleConfirm = () => {
    if (selectedModeId === "common_player") {
      // Oturum açmamış kullanıcı oyuna veya lobiye girmeye çalıştığında Auth Modalı aç
      if (!user) {
        onOpenAuthModal?.("login");
        return;
      }

      if (selectedSubMode === "ranked") {
        onStartRanked();
      } else if (selectedSubMode === "casual") {
        router.push("/sandbox");
      } else if (selectedSubMode === "custom") {
        onOpenCustomRoom();
      }
    }
  };

  const getButtonLabel = () => {
    if (selectedModeId !== "common_player") return "YAKINDA GELECEK";
    if (selectedSubMode === "ranked" || selectedSubMode === "casual") return "OYNA";
    return "OYUN KUR";
  };

  const currentGuide = activeGuideKey ? MODE_GUIDES[activeGuideKey] : null;

  return (
    <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-transparent text-white select-none font-sans p-8 lg:p-12 h-full">
      {/* 1. Merkez Odaklı Sıcak Zümrüt Radyal Işık */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_46%,rgba(34,197,94,0.12)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      {/* 2. Merkez Mimari Saha Çizgileri */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-25">
        <svg
          viewBox="0 0 1000 600"
          className="w-[950px] max-w-full h-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="500" cy="300" r="140" stroke="#22c55e" strokeWidth="1.25" strokeDasharray="4 4" />
          <circle cx="500" cy="300" r="4" fill="#22c55e" />
          <line x1="500" y1="60" x2="500" y2="540" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
          <path d="M 280 300 A 180 180 0 0 0 420 460" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
          <path d="M 720 300 A 180 180 0 0 0 580 140" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
        </svg>
      </div>

      {/* 3 Mod Grid */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-10 w-full max-w-5xl">
          {/* 1. Ortak Oyuncu Modu */}
          <div
            onClick={() => setSelectedModeId("common_player")}
            className={`relative flex flex-col items-center justify-between p-7 lg:p-8 rounded-[28px] cursor-pointer overflow-hidden border-2 transition duration-200 ease-out ${
              selectedModeId === "common_player"
                ? "bg-[#0c1612]/85 backdrop-blur-xl border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-100 opacity-100 z-10"
                : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs scale-[0.92] opacity-75 z-0"
            }`}
          >
            {/* Üst Vurgu Çizgisi — Smooth Fade */}
            <div
              className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-200 pointer-events-none ${
                selectedModeId === "common_player" ? "opacity-100" : "opacity-0"
              }`}
            />

            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Hazır
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGuideKey("common_player");
                }}
                title="Nasıl Oynanır?"
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                <HelpCircle className="size-4" />
              </button>
            </div>

            <div className="relative flex items-center justify-center size-28 mb-5">
              <div
                className={`relative flex size-24 items-center justify-center rounded-2xl border transition-colors duration-200 ${
                  selectedModeId === "common_player"
                    ? "bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                    : "bg-white/5 text-zinc-400 border-white/10"
                }`}
              >
                <Swords
                  className="size-12 relative z-10 drop-shadow-xs"
                  strokeWidth={selectedModeId === "common_player" ? 2.25 : 1.75}
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-emerald-400 mb-1">
                Farklı Takım
              </p>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Ortak Oyuncu
              </h3>
            </div>

            <div className="w-full space-y-2 mt-1">
              {subModes.map((sub) => {
                const isSubActive = selectedModeId === "common_player" && selectedSubMode === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModeId("common_player");
                      setSelectedSubMode(sub.id);
                    }}
                    className={`w-full h-[46px] flex items-center justify-between px-3.5 rounded-xl border text-left transition-colors duration-200 cursor-pointer ${
                      isSubActive
                        ? "bg-[#15803d] text-white border-emerald-400/60 shadow-md shadow-emerald-900/40 font-bold"
                        : "bg-white/5 text-zinc-300 border-white/10 hover:border-white/20 hover:bg-white/10 font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <sub.icon
                        className={`size-4 ${
                          isSubActive ? "text-white" : "text-zinc-400"
                        }`}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {sub.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        isSubActive
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-zinc-300 border border-white/10"
                      }`}
                    >
                      {sub.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Millet-Takım Modu */}
          <div
            onClick={() => setSelectedModeId("grid")}
            className={`relative flex flex-col items-center justify-between p-7 lg:p-8 rounded-[28px] cursor-pointer overflow-hidden border-2 transition duration-200 ease-out ${
              selectedModeId === "grid"
                ? "bg-[#0c1612]/85 backdrop-blur-xl border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-100 opacity-100 z-10"
                : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs scale-[0.92] opacity-75 z-0"
            }`}
          >
            <div
              className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-200 pointer-events-none ${
                selectedModeId === "grid" ? "opacity-100" : "opacity-0"
              }`}
            />

            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                1. Sezon
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGuideKey("grid");
                }}
                title="Nasıl Oynanır?"
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                <HelpCircle className="size-4" />
              </button>
            </div>

            <div className="relative flex items-center justify-center size-28 mb-5">
              <div
                className={`relative flex size-24 items-center justify-center rounded-2xl border transition-colors duration-200 ${
                  selectedModeId === "grid"
                    ? "bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                    : "bg-white/5 text-zinc-400 border-white/10"
                }`}
              >
                <Globe
                  className="size-12 relative z-10"
                  strokeWidth={selectedModeId === "grid" ? 2.25 : 1.75}
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-zinc-400 mb-1">
                Grid Bulmaca
              </p>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Millet-Takım
              </h3>
            </div>

            <div className="w-full py-8 flex flex-col items-center justify-center text-center rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xs">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/10 border border-white/15 shadow-2xs mb-2">
                <Lock className="size-4 text-zinc-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Çok Yakında
              </span>
              <span className="text-[11px] text-zinc-400 font-medium mt-0.5">3x3 / 4x4 Matris</span>
            </div>
          </div>

          {/* 3. Müzayede Modu */}
          <div
            onClick={() => setSelectedModeId("auction")}
            className={`relative flex flex-col items-center justify-between p-7 lg:p-8 rounded-[28px] cursor-pointer overflow-hidden border-2 transition duration-200 ease-out ${
              selectedModeId === "auction"
                ? "bg-[#0c1612]/85 backdrop-blur-xl border-emerald-500 shadow-[0_0_35px_rgba(34,197,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-100 opacity-100 z-10"
                : "bg-[#0a120e]/65 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-[#0a120e]/80 shadow-xs scale-[0.92] opacity-75 z-0"
            }`}
          >
            <div
              className={`absolute top-0 inset-x-12 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-opacity duration-200 pointer-events-none ${
                selectedModeId === "auction" ? "opacity-100" : "opacity-0"
              }`}
            />

            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                1. Sezon
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGuideKey("auction");
                }}
                title="Nasıl Oynanır?"
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                <HelpCircle className="size-4" />
              </button>
            </div>

            <div className="relative flex items-center justify-center size-28 mb-5">
              <div
                className={`relative flex size-24 items-center justify-center rounded-2xl border transition-colors duration-200 ${
                  selectedModeId === "auction"
                    ? "bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                    : "bg-white/5 text-zinc-400 border-white/10"
                }`}
              >
                <Gavel
                  className="size-12 relative z-10"
                  strokeWidth={selectedModeId === "auction" ? 2.25 : 1.75}
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-zinc-400 mb-1">
                Canlı Transfer
              </p>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Müzayede
              </h3>
            </div>

            <div className="w-full py-8 flex flex-col items-center justify-center text-center rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xs">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/10 border border-white/15 shadow-2xs mb-2">
                <Lock className="size-4 text-zinc-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Geliştirme Aşamasında
              </span>
              <span className="text-[11px] text-zinc-400 font-medium mt-0.5">4-8 Kişilik Canlı Pazar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onay Butonu */}
      <div className="relative z-10 flex justify-center pt-5">
        {selectedModeId === "common_player" ? (
          <button
            onClick={handleConfirm}
            className="relative group flex items-center justify-center transition-transform active:scale-[0.98] w-[340px] h-[62px] cursor-pointer"
          >
            <div className="absolute -inset-1 border border-emerald-500/40 group-hover:border-emerald-400/80 transition-colors rounded-2xl" />
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#168841] to-[#126d34] border border-emerald-400/50 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all overflow-hidden">
              <span className="relative flex items-center gap-3 text-white font-black text-lg tracking-[0.18em] uppercase">
                {getButtonLabel()} <ChevronRight className="size-5 text-white stroke-[2.5]" />
              </span>
            </div>
          </button>
        ) : (
          <button
            disabled
            className="w-[340px] h-[62px] flex items-center justify-center bg-black/40 text-zinc-500 font-black text-base tracking-[0.18em] uppercase cursor-not-allowed rounded-xl border border-white/10 backdrop-blur-md"
          >
            YAKINDA GELECEK
          </button>
        )}
      </div>

      {/* "Nasıl Oynanır?" Modal Rehberi */}
      {currentGuide && (
        <div
          onClick={() => setActiveGuideKey(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0d1611]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white transition-all"
          >
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full mb-1">
                  Oyun Rehberi
                </span>
                <h3 className="text-xl font-black tracking-tight text-white">
                  {currentGuide.title}
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  {currentGuide.subtitle}
                </p>
              </div>

              <button
                onClick={() => setActiveGuideKey(null)}
                className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 relative h-36 sm:h-40 w-full overflow-hidden rounded-2xl border border-dashed border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-black/40 to-emerald-950/40 flex flex-col items-center justify-center text-center p-4 group">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#15803d] text-white shadow-md mb-2 group-hover:scale-110 transition-transform">
                <Play className="size-5 fill-white ml-0.5" />
              </div>
              <p className="text-xs font-bold text-white">
                {currentGuide.mediaPlaceholder}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Kısa oynanış döngüsü animasyonu burada yer alacak
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                Nasıl Oynanır?
              </p>
              {currentGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-white leading-relaxed">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-300 font-medium">{step}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/40 p-3 text-[11px] text-amber-200 leading-snug">
              <Lightbulb className="size-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300">Taktik: </strong>
                {currentGuide.tip}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveGuideKey(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:bg-[#16a34a] active:scale-95 transition-all cursor-pointer"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
