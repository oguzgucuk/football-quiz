"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Gavel, Swords, ChevronRight, Trophy, Zap, Users, Lock } from "lucide-react";

type SubModeType = "ranked" | "casual" | "custom";

type MainStageProps = {
  onStartRanked: () => void;
  onOpenCustomRoom: () => void;
};

export function MainStage({ onStartRanked, onOpenCustomRoom }: MainStageProps) {
  const router = useRouter();
  const [selectedModeId, setSelectedModeId] = useState<"common_player" | "grid" | "auction">("common_player");
  const [selectedSubMode, setSelectedSubMode] = useState<SubModeType>("ranked");

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
    if (selectedSubMode === "ranked") return "SIRAYA GİR";
    if (selectedSubMode === "casual") return "ANTRENMANA BAŞLA";
    return "LOBİ KUR";
  };

  return (
    <section className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[#f5f8f6] text-[#141b16] select-none font-sans p-10 lg:p-14">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffffff]/70 via-[#f5f8f6] to-[#e2e8e4]/60 z-0 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-[#15803d]/5 rounded-full blur-[140px] z-0 pointer-events-none" />

      {/* Main 3 Modes Grid */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 w-full max-w-5xl">
          {/* 1. Ortak Oyuncu Modu */}
          <div
            onClick={() => setSelectedModeId("common_player")}
            className={`relative flex flex-col items-center justify-between p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${
              selectedModeId === "common_player"
                ? "bg-white border-[#15803d] shadow-[0_15px_40px_rgba(21,128,61,0.12)] scale-[1.02]"
                : "bg-white/60 border-[#e2e8e4] hover:border-[#b8c4bc] hover:bg-white/90"
            }`}
          >
            {/* Top Tag */}
            <span
              className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6 ${
                selectedModeId === "common_player"
                  ? "bg-[#15803d] text-white"
                  : "bg-[#e2e8e4] text-[#6b7770]"
              }`}
            >
              Aktif Mod
            </span>

            {/* Icon */}
            <div className="relative flex items-center justify-center size-28 mb-5">
              <Swords
                className={`size-14 relative z-10 transition-colors ${
                  selectedModeId === "common_player" ? "text-[#15803d]" : "text-[#6b7770]"
                }`}
                strokeWidth={selectedModeId === "common_player" ? 2.5 : 1.75}
              />
              <div
                className={`absolute inset-0 border-2 rotate-45 rounded-2xl transition-all ${
                  selectedModeId === "common_player"
                    ? "border-[#15803d] bg-[#15803d]/10 shadow-[0_0_20px_rgba(21,128,61,0.2)]"
                    : "border-[#e2e8e4] bg-white/50"
                }`}
              />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#6b7770] mb-1">
                Farklı Takım
              </p>
              <h3 className="text-2xl font-black tracking-tight text-[#141b16]">
                Ortak Oyuncu
              </h3>
            </div>

            {/* Sub-modes selector directly under Ortak Oyuncu */}
            <div className="w-full space-y-2 mt-2">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                      isSubActive
                        ? "bg-[#15803d] text-white border-[#15803d] shadow-sm font-black"
                        : "bg-[#f5f8f6] text-[#6b7770] border-[#e2e8e4] hover:border-[#15803d]/40 hover:text-[#141b16]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <sub.icon
                        className={`size-4 ${
                          isSubActive ? "text-white" : "text-[#6b7770]"
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
                          : "bg-white text-[#6b7770] border border-[#e2e8e4]"
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
            className={`relative flex flex-col items-center justify-between p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer opacity-75 hover:opacity-95 ${
              selectedModeId === "grid"
                ? "bg-white border-[#15803d] shadow-[0_15px_40px_rgba(21,128,61,0.1)] scale-[1.02]"
                : "bg-white/50 border-[#e2e8e4] hover:border-[#b8c4bc]"
            }`}
          >
            {/* Top Tag */}
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6 bg-[#f0f4f2] text-[#6b7770] border border-[#e2e8e4]">
              Yakında
            </span>

            {/* Icon */}
            <div className="relative flex items-center justify-center size-28 mb-5">
              <Globe className="size-14 relative z-10 text-[#6b7770]" strokeWidth={1.75} />
              <div className="absolute inset-0 border-2 rotate-45 rounded-2xl border-[#e2e8e4] bg-white/50" />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#6b7770] mb-1">
                Grid Bulmaca
              </p>
              <h3 className="text-2xl font-black tracking-tight text-[#141b16]">
                Millet-Takım
              </h3>
            </div>

            {/* Placeholder state */}
            <div className="w-full py-8 flex flex-col items-center justify-center text-center text-[#9aa59e] border border-dashed border-[#d1dbd4] rounded-2xl bg-[#f5f8f6]/70">
              <Lock className="size-5 mb-1.5 text-[#b8c4bc]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#6b7770]">
                Çok Yakında
              </span>
              <span className="text-[10px] text-[#9aa59e] mt-0.5">3x3 / 4x4 Matris</span>
            </div>
          </div>

          {/* 3. Müzayede Modu */}
          <div
            onClick={() => setSelectedModeId("auction")}
            className={`relative flex flex-col items-center justify-between p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer opacity-75 hover:opacity-95 ${
              selectedModeId === "auction"
                ? "bg-white border-[#15803d] shadow-[0_15px_40px_rgba(21,128,61,0.1)] scale-[1.02]"
                : "bg-white/50 border-[#e2e8e4] hover:border-[#b8c4bc]"
            }`}
          >
            {/* Top Tag */}
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6 bg-[#f0f4f2] text-[#6b7770] border border-[#e2e8e4]">
              Geliştirmede
            </span>

            {/* Icon */}
            <div className="relative flex items-center justify-center size-28 mb-5">
              <Gavel className="size-14 relative z-10 text-[#6b7770]" strokeWidth={1.75} />
              <div className="absolute inset-0 border-2 rotate-45 rounded-2xl border-[#e2e8e4] bg-white/50" />
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#6b7770] mb-1">
                Canlı Transfer
              </p>
              <h3 className="text-2xl font-black tracking-tight text-[#141b16]">
                Müzayede
              </h3>
            </div>

            {/* Placeholder state */}
            <div className="w-full py-8 flex flex-col items-center justify-center text-center text-[#9aa59e] border border-dashed border-[#d1dbd4] rounded-2xl bg-[#f5f8f6]/70">
              <Lock className="size-5 mb-1.5 text-[#b8c4bc]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#6b7770]">
                Geliştirme Aşamasında
              </span>
              <span className="text-[10px] text-[#9aa59e] mt-0.5">4-8 Kişilik Canlı Pazar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Center Confirm Button (Clean floating style) */}
      <div className="relative z-10 flex justify-center pt-6">
        {selectedModeId === "common_player" ? (
          <button
            onClick={handleConfirm}
            className="relative group flex items-center justify-center transition-transform active:scale-95"
          >
            <div className="absolute -inset-1.5 border-2 border-[#15803d]/25 group-hover:border-[#15803d]/60 transition-colors rounded-2xl" />
            <div className="relative px-20 py-4 bg-[#15803d] border-2 border-[#15803d] rounded-xl group-hover:shadow-[0_0_35px_rgba(21,128,61,0.45)] transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative flex items-center gap-3 text-white font-black text-lg tracking-[0.2em] uppercase">
                {getButtonLabel()} <ChevronRight className="size-5 text-white" />
              </span>
            </div>
          </button>
        ) : (
          <button
            disabled
            className="px-16 py-4 bg-[#e2e8e4] text-[#6b7770] font-black text-base tracking-[0.2em] uppercase cursor-not-allowed rounded-xl border border-[#d1dbd4]"
          >
            YAKINDA GELECEK
          </button>
        )}
      </div>
    </section>
  );
}
