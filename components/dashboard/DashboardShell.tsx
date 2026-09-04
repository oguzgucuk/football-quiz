"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "./top-bar";
import { RightSocialSidebar } from "./RightSocialSidebar";
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
import { AuthModal } from "@/components/auth/AuthModal";

interface DashboardShellProps {
  initialTab?: DashboardTab;
}

export function DashboardShell({ initialTab = "play" }: DashboardShellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  const [isCustomRoomOpen, setIsCustomRoomOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const handleOpenAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  // URL'de ?auth=login veya ?auth=register varsa modalı otomatik aç
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authQuery = params.get("auth");
      if (authQuery === "login" || authQuery === "register") {
        setAuthModalTab(authQuery);
        setIsAuthModalOpen(true);
      }
    }
  }, []);

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
    if (!user) {
      handleOpenAuthModal("login");
      return;
    }
    setIsMatchmakingOpen(true);
    startMatchmaking(user.id, user.username, user.eloRating || 1000, duration);
  };

  const handleOpenCustomRoom = () => {
    if (!user) {
      handleOpenAuthModal("login");
      return;
    }
    setIsCustomRoomOpen(true);
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
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAuthModal={handleOpenAuthModal}
        />

        {/* Merkezde Değişen Sahne (Main Stage İçeriği) */}
        <div className="flex-1 min-h-0 relative">
          {activeTab === "home" && (
            <HomeStage onGoToPlay={() => setActiveTab("play")} />
          )}

          {activeTab === "play" && (
            <PlayStage
              onStartRanked={() => handleStartRanked(15)}
              onOpenCustomRoom={handleOpenCustomRoom}
              onOpenAuthModal={handleOpenAuthModal}
            />
          )}

          {activeTab === "profile" && (
            <ProfileStage
              onGoToPlay={() => setActiveTab("play")}
              onOpenAuthModal={handleOpenAuthModal}
            />
          )}

          {activeTab === "store" && (
            <StoreStage onOpenAuthModal={handleOpenAuthModal} />
          )}

          {activeTab === "settings" && <SettingsStage />}
        </div>
      </div>

      {/* Sağ: Tam Boy Dikey Arkadaşlar ve Sosyal Bar (Her Sayfada Sabit) */}
      <RightSocialSidebar
        onQuickInvite={(friendId, friendName) => {
          if (!user) {
            handleOpenAuthModal("login");
            return;
          }
          setIsCustomRoomOpen(true);
        }}
        onOpenAuthModal={handleOpenAuthModal}
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

      {/* Dashboard Üzeri Giriş / Kayıt Ol Penceresi (Auth Modal) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}
