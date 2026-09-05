"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PlayCommonPlayerCard, SubModeType } from "./play/PlayCommonPlayerCard";
import { PlayGridModeCard, NationTeamSubMode } from "./play/PlayGridModeCard";
import { PlayAuctionModeCard } from "./play/PlayAuctionModeCard";
import { PlayModeGuidesModal } from "./play/PlayModeGuidesModal";
import { GameMode } from "@/types/game";

interface PlayStageProps {
  onStartRanked: () => void;
  onStartCasual: (gameMode?: GameMode) => void;
  onOpenCustomRoom: (gameMode?: GameMode) => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function PlayStage({
  onStartRanked,
  onStartCasual,
  onOpenCustomRoom,
  onOpenAuthModal,
}: PlayStageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedModeId, setSelectedModeId] = useState<"common_player" | "grid" | "auction">("common_player");
  const [selectedSubMode, setSelectedSubMode] = useState<SubModeType>("ranked");
  const [selectedNationTeamSubMode, setSelectedNationTeamSubMode] = useState<NationTeamSubMode>("casual");
  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!user) {
      onOpenAuthModal?.("login");
      return;
    }

    if (selectedModeId === "common_player") {
      if (selectedSubMode === "ranked") {
        onStartRanked();
      } else if (selectedSubMode === "casual") {
        onStartCasual("team_vs_team");
      } else if (selectedSubMode === "custom") {
        onOpenCustomRoom("team_vs_team");
      }
    } else if (selectedModeId === "grid") {
      if (selectedNationTeamSubMode === "casual") {
        onStartCasual("country_vs_team");
      } else if (selectedNationTeamSubMode === "custom") {
        onOpenCustomRoom("country_vs_team");
      }
    }
  };

  const getButtonLabel = () => {
    if (selectedModeId === "auction") return "YAKINDA GELECEK";
    if (selectedModeId === "grid") {
      return selectedNationTeamSubMode === "casual" ? "OYNA" : "OYUN KUR";
    }
    if (selectedSubMode === "ranked" || selectedSubMode === "casual") return "OYNA";
    return "OYUN KUR";
  };

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
          <PlayCommonPlayerCard
            isSelected={selectedModeId === "common_player"}
            onSelect={() => setSelectedModeId("common_player")}
            selectedSubMode={selectedSubMode}
            onSelectSubMode={setSelectedSubMode}
            onOpenGuide={() => setActiveGuideKey("common_player")}
          />

          <PlayGridModeCard
            isSelected={selectedModeId === "grid"}
            onSelect={() => setSelectedModeId("grid")}
            selectedSubMode={selectedNationTeamSubMode}
            onSelectSubMode={setSelectedNationTeamSubMode}
            onOpenGuide={() => setActiveGuideKey("grid")}
          />

          <PlayAuctionModeCard
            isSelected={selectedModeId === "auction"}
            onSelect={() => setSelectedModeId("auction")}
            onOpenGuide={() => setActiveGuideKey("auction")}
          />
        </div>
      </div>

      {/* Onay Butonu */}
      <div className="relative z-10 flex justify-center pt-5">
        {selectedModeId !== "auction" ? (
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
      <PlayModeGuidesModal
        guideKey={activeGuideKey}
        onClose={() => setActiveGuideKey(null)}
      />
    </div>
  );
}
