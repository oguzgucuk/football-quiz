"use client";

import React, { useState } from "react";
import { TopBar } from "./top-bar";
import { FriendsList } from "./friends-list";
import { DashboardTab } from "./types";
import { HomeStage } from "./stages/HomeStage";
import { PlayStage } from "./stages/PlayStage";
import { ProfileStage } from "./stages/ProfileStage";
import { StoreStage } from "./stages/StoreStage";
import { SettingsStage } from "./stages/SettingsStage";
import { useAuth } from "@/hooks/useAuth";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { MatchmakingModal } from "@/components/game/MatchmakingModal";
import { CreateCustomRoomModal } from "@/components/game/CreateCustomRoomModal";

interface DashboardShellProps {
  initialTab?: DashboardTab;
}

export function DashboardShell({ initialTab = "play" }: DashboardShellProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  const [isCustomRoomOpen, setIsCustomRoomOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);

  const {
    status: matchmakingStatus,
    waitingSeconds,
    matchedData,
    selectedDuration,
    setSelectedDuration,
    startMatchmaking,
    cancelMatchmaking,
    requestBotMatch,
  } = useMatchmaking();

  const handleStartRanked = (duration: number = selectedDuration) => {
    setIsMatchmakingOpen(true);
    const userId = user?.id || `guest_${Math.random().toString(36).substring(2, 7)}`;
    const username = user?.username || "Misafir Oyuncu";
    const elo = user?.eloRating || 1000;
    startMatchmaking(userId, username, elo, duration);
  };

  const handleCancelMatchmaking = () => {
    cancelMatchmaking();
    setIsMatchmakingOpen(false);
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#f5f8f6] text-[#141b16] font-sans select-none">
      {/* Sol / Ana Gövde (TopBar + Dinamik Sahne İçeriği) */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Üst Navigasyon Barı */}
        <TopBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Merkezde Değişen Sahne (Main Stage İçeriği) */}
        <div className="flex-1 min-h-0 relative">
          {activeTab === "home" && (
            <HomeStage onGoToPlay={() => setActiveTab("play")} />
          )}

          {activeTab === "play" && (
            <PlayStage
              onStartRanked={() => handleStartRanked(15)}
              onOpenCustomRoom={() => setIsCustomRoomOpen(true)}
            />
          )}

          {activeTab === "profile" && (
            <ProfileStage onGoToPlay={() => setActiveTab("play")} />
          )}

          {activeTab === "store" && <StoreStage />}

          {activeTab === "settings" && <SettingsStage />}
        </div>
      </div>

      {/* Sağ: Tam Boy Dikey Arkadaşlar ve Sosyal Bar (Her Sayfada Sabit) */}
      <FriendsList
        onQuickInvite={(friendName) => {
          setIsCustomRoomOpen(true);
        }}
        onOpenProfile={() => setActiveTab("profile")}
        onOpenStore={() => setActiveTab("store")}
      />

      {/* Eşleşme (Matchmaking) Modalı */}
      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        onCancel={handleCancelMatchmaking}
        onSelectDuration={setSelectedDuration}
        status={matchmakingStatus}
        waitingSeconds={waitingSeconds}
        matchedData={matchedData}
        selectedDuration={selectedDuration}
        onRequestBot={requestBotMatch}
      />

      {/* Özel Lobi Kurma Modalı */}
      <CreateCustomRoomModal
        isOpen={isCustomRoomOpen}
        onClose={() => setIsCustomRoomOpen(false)}
      />
    </main>
  );
}
