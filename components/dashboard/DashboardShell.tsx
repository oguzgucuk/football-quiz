"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "./TopBar";
import { RightSocialSidebar } from "./RightSocialSidebar";
import { SocialToggleTab } from "./SocialToggleTab";
import { DashboardTab } from "./types";
import { HomeStage } from "./stages/HomeStage";
import { PlayStage } from "./stages/PlayStage";
import { ProfileStage } from "./stages/ProfileStage";
import { StoreStage } from "./stages/StoreStage";
import { SettingsStage } from "./stages/SettingsStage";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { MatchmakingModal } from "@/components/game/MatchmakingModal";
import { CreateCustomRoomModal } from "@/components/game/CreateCustomRoomModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { StadiumBackground } from "@/components/ui/StadiumBackground";
import { GameMode } from "@/types/game";

interface DashboardShellProps {
  initialTab?: DashboardTab;
}

export function DashboardShell({ initialTab = "play" }: DashboardShellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { friends, pendingRequests } = useFriends();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  const onlineFriendsCount = friends.filter(
    (f) => f.status === "çevrimiçi" || f.status === "oyunda"
  ).length;
  const hasPendingRequests = pendingRequests.length > 0;

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

  const [matchmakingMode, setMatchmakingMode] = useState<"ranked" | "casual">("ranked");
  const [matchmakingGameMode, setMatchmakingGameMode] = useState<GameMode>("team_vs_team");

  const handleOpenRankedModal = () => {
    if (!user) {
      handleOpenAuthModal("login");
      return;
    }
    setMatchmakingMode("ranked");
    setMatchmakingGameMode("team_vs_team");
    cancelMatchmaking();
    setIsMatchmakingOpen(true);
  };

  const handleOpenCasualModal = (gameMode: GameMode = "team_vs_team") => {
    if (!user) {
      handleOpenAuthModal("login");
      return;
    }
    setMatchmakingMode("casual");
    setMatchmakingGameMode(gameMode);
    cancelMatchmaking();
    setIsMatchmakingOpen(true);
  };

  const handleStartSearching = (duration: number) => {
    if (!user) {
      handleOpenAuthModal("login");
      return;
    }
    startMatchmaking(user.id, user.username, user.eloRating || 1000, duration, matchmakingMode, matchmakingGameMode);
  };

  const handleOpenCustomRoom = (gameMode: GameMode = "team_vs_team") => {
    if (!user) {
      handleOpenAuthModal("login");
      return;
    }
    setMatchmakingGameMode(gameMode);
    setIsCustomRoomOpen(true);
  };

  const handleCancelMatchmaking = () => {
    cancelMatchmaking();
    setIsMatchmakingOpen(false);
  };

  return (
    <main className="relative flex h-screen w-full overflow-hidden bg-[#0d1611] text-white font-sans select-none">
      {/* 1. Tam Ekran Stadyum Arka Planı (TopBar, Sahne ve SocialBar arkasında kesintisiz uzanır) */}
      <StadiumBackground variant="light" />

      {/* 2. Sol / Ana Gövde (TopBar + Dinamik Sahne İçeriği) */}
      <div className="relative z-10 flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Üst Navigasyon Barı */}
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAuthModal={handleOpenAuthModal}
          isSocialOpen={isSocialOpen}
          onToggleSocial={() => setIsSocialOpen((prev) => !prev)}
          onlineFriendsCount={onlineFriendsCount}
          hasPendingRequests={hasPendingRequests}
        />

        {/* Merkezde Değişen Sahne (Main Stage İçeriği) */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {activeTab === "home" && (
            <HomeStage onGoToPlay={() => setActiveTab("play")} />
          )}

          {activeTab === "play" && (
            <PlayStage
              onStartRanked={handleOpenRankedModal}
              onStartCasual={handleOpenCasualModal}
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

      {/* Sağ Kenar Yüzen Açma Düğmesi (Sidebar kapalıyken hızlı erişim) */}
      <SocialToggleTab
        isOpen={isSocialOpen}
        onToggle={() => setIsSocialOpen(true)}
        onlineCount={onlineFriendsCount}
        hasPendingRequests={hasPendingRequests}
      />

      {/* Sağ: Kayan Açılır/Kapanır Arkadaşlar ve Sosyal Bar (Drawer) */}
      <RightSocialSidebar
        isOpen={isSocialOpen}
        onClose={() => setIsSocialOpen(false)}
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
        mode={matchmakingMode}
        gameMode={matchmakingGameMode}
        onCancel={handleCancelMatchmaking}
        onStartSearching={handleStartSearching}
        onSelectDuration={setSelectedDuration}
        status={matchmakingStatus}
        waitingSeconds={waitingSeconds}
        matchedData={matchedData}
        selectedDuration={selectedDuration}
      />

      {/* Özel Lobi Kurma Modalı */}
      <CreateCustomRoomModal
        isOpen={isCustomRoomOpen}
        onClose={() => setIsCustomRoomOpen(false)}
        gameMode={matchmakingGameMode}
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
