"use client";

import React, { useState } from "react";
import { gameModes } from "@/lib/game-data";
import { TopBar } from "@/components/dashboard/top-bar";
import { MainStage } from "@/components/dashboard/main-stage";
import { FriendsList } from "@/components/dashboard/friends-list";
import { useAuth } from "@/hooks/useAuth";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { MatchmakingModal } from "@/components/game/MatchmakingModal";
import { CreateCustomRoomModal } from "@/components/game/CreateCustomRoomModal";

export type MenuCategory = "ranked" | "custom" | "unranked";

export default function Page() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>("ranked");

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
      {/* Sol / Ana Alan (TopBar + MainStage) */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <TopBar />
        <MainStage
          onStartRanked={() => handleStartRanked(5)}
          onOpenCustomRoom={() => setIsCustomRoomOpen(true)}
        />
      </div>

      {/* Sağ: Tam Boy Dikey Arkadaşlar ve Profil Paneli */}
      <FriendsList
        onQuickInvite={(friendName) => {
          setIsCustomRoomOpen(true);
        }}
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

      {/* Özel Oda (Custom Room) Modalı */}
      <CreateCustomRoomModal
        isOpen={isCustomRoomOpen}
        onClose={() => setIsCustomRoomOpen(false)}
      />
    </main>
  );
}
