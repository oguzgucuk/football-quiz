"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PlayCommonModesCard, CommonSubModeType } from "./play/PlayCommonModesCard";
import { PlaySimulationModesCard, SimulationSubModeType } from "./play/PlaySimulationModesCard";
import { PlayTrainingCard, TrainingSubMode } from "./play/PlayTrainingCard";
import { PlayModeGuidesModal } from "./play/PlayModeGuidesModal";
import { PlayActionButtons } from "./play/PlayActionButtons";
import { JoinAuctionRoomModal } from "@/components/auction/JoinAuctionRoomModal";
import { JoinDuelRoomModal } from "@/components/game/JoinDuelRoomModal";
import { CreateDuelRoomModal } from "@/components/game/CreateDuelRoomModal";
import { GameMode } from "@/types/game";

interface PlayStageProps {
  onStartRanked: () => void;
  onStartCasual: (gameMode?: GameMode) => void;
  onGoToPlayers: () => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function PlayStage({
  onStartRanked,
  onStartCasual,
  onGoToPlayers,
  onOpenAuthModal,
}: PlayStageProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedModeId, setSelectedModeId] = useState<"common" | "simulation" | "training">("common");
  const [selectedCommonSubMode, setSelectedCommonSubMode] = useState<CommonSubModeType>("team_vs_team");
  const [selectedSimSubMode, setSelectedSimSubMode] = useState<SimulationSubModeType>("auction");
  const [selectedTrainingSubMode, setSelectedTrainingSubMode] = useState<TrainingSubMode>("players");

  const [activeGuideKey, setActiveGuideKey] = useState<string | null>(null);
  const [isJoinAuctionModalOpen, setIsJoinAuctionModalOpen] = useState(false);
  const [isJoinDuelModalOpen, setIsJoinDuelModalOpen] = useState(false);
  const [isCreateDuelModalOpen, setIsCreateDuelModalOpen] = useState(false);

  const isCustomMode =
    (selectedModeId === "common" && selectedCommonSubMode === "custom") ||
    (selectedModeId === "simulation" && selectedSimSubMode === "auction");

  const isAvailable =
    selectedModeId === "common"
      ? true
      : selectedModeId === "simulation"
      ? selectedSimSubMode === "auction"
      : selectedTrainingSubMode === "players";

  const handleCreateGame = () => {
    if (!user) {
      onOpenAuthModal?.("login");
      return;
    }
    if (selectedModeId === "simulation") {
      router.push(`/auction/oda_muzayede_${Math.floor(1000 + Math.random() * 9000)}`);
    } else if (selectedModeId === "common") {
      setIsCreateDuelModalOpen(true);
    }
  };

  const handleJoinGame = () => {
    if (!user) {
      onOpenAuthModal?.("login");
      return;
    }
    if (selectedModeId === "simulation") {
      setIsJoinAuctionModalOpen(true);
    } else if (selectedModeId === "common") {
      setIsJoinDuelModalOpen(true);
    }
  };

  const handleConfirm = () => {
    if (selectedModeId === "training") {
      if (selectedTrainingSubMode === "players") onGoToPlayers();
      return;
    }
    if (!user) {
      onOpenAuthModal?.("login");
      return;
    }
    if (selectedModeId === "common") {
      if (selectedCommonSubMode === "team_vs_team") {
        onStartRanked();
      } else if (selectedCommonSubMode === "country_vs_team") {
        onStartCasual("country_vs_team");
      }
    } else if (selectedModeId === "simulation") {
      if (selectedSimSubMode === "auction") {
        router.push(`/auction/oda_muzayede_${Math.floor(1000 + Math.random() * 9000)}`);
      }
    }
  };

  const buttonLabel =
    selectedModeId === "training"
      ? selectedTrainingSubMode === "players"
        ? "OYUNCULARI GÖRÜNTÜLE"
        : "YAKINDA GELECEK"
      : !isAvailable
      ? "YAKINDA GELECEK"
      : "OYNA";

  return (
    <div className="relative flex flex-1 flex-col justify-between overflow-y-auto overflow-x-hidden bg-transparent text-white select-none font-sans p-4 sm:p-6 lg:p-8 min-h-full">
      {/* 1. Merkez Odaklı Sıcak Zümrüt Radyal Işık */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_46%,rgba(34,197,94,0.12)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      {/* 2. Merkez Mimari Saha Çizgileri */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-25">
        <svg viewBox="0 0 1000 600" className="w-[950px] max-w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="500" cy="300" r="140" stroke="#22c55e" strokeWidth="1.25" strokeDasharray="4 4" />
          <circle cx="500" cy="300" r="4" fill="#22c55e" />
          <line x1="500" y1="60" x2="500" y2="540" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
          <path d="M 280 300 A 180 180 0 0 0 420 460" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
          <path d="M 720 300 A 180 180 0 0 0 580 140" stroke="#22c55e" strokeWidth="0.75" opacity="0.4" />
        </svg>
      </div>

      {/* 3 Mod Grid (Ortak Oyuncu Modları - Simülasyon Modları - Antrenman) */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto py-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8 w-full max-w-6xl items-center">
          <PlayCommonModesCard
            isSelected={selectedModeId === "common"}
            onSelect={() => setSelectedModeId("common")}
            selectedSubMode={selectedCommonSubMode}
            onSelectSubMode={setSelectedCommonSubMode}
            onOpenGuide={() => setActiveGuideKey("common_player")}
          />

          <PlaySimulationModesCard
            isSelected={selectedModeId === "simulation"}
            onSelect={() => setSelectedModeId("simulation")}
            selectedSubMode={selectedSimSubMode}
            onSelectSubMode={setSelectedSimSubMode}
            onOpenGuide={() => setActiveGuideKey("auction")}
          />

          <PlayTrainingCard
            isSelected={selectedModeId === "training"}
            onSelect={() => setSelectedModeId("training")}
            selectedSubMode={selectedTrainingSubMode}
            onSelectSubMode={setSelectedTrainingSubMode}
            onOpenGuide={() => setActiveGuideKey("training")}
          />
        </div>
      </div>

      {/* Onay Butonları */}
      <PlayActionButtons
        isCustomMode={isCustomMode}
        isAvailable={isAvailable}
        buttonLabel={buttonLabel}
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        onConfirm={handleConfirm}
      />

      {/* "Nasıl Oynanır?" Modal Rehberi */}
      <PlayModeGuidesModal
        guideKey={activeGuideKey}
        onClose={() => setActiveGuideKey(null)}
      />

      {/* Müzayede Koda Katıl Modalı */}
      <JoinAuctionRoomModal
        isOpen={isJoinAuctionModalOpen}
        onClose={() => setIsJoinAuctionModalOpen(false)}
      />

      {/* 1v1 Ortak Oyuncu / Millet-Takım Koda Katıl Modalı */}
      <JoinDuelRoomModal
        isOpen={isJoinDuelModalOpen}
        onClose={() => setIsJoinDuelModalOpen(false)}
        defaultMode={selectedCommonSubMode === "country_vs_team" ? "country_vs_team" : "team_vs_team"}
      />

      {/* 1v1 Ortak Oyuncu / Millet-Takım Özel Oda Kurma Modalı */}
      <CreateDuelRoomModal
        isOpen={isCreateDuelModalOpen}
        onClose={() => setIsCreateDuelModalOpen(false)}
      />
    </div>
  );
}
