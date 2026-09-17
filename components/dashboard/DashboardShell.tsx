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
import { PlayersStage } from "./stages/PlayersStage";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { MatchmakingModal } from "@/components/game/MatchmakingModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { StadiumBackground } from "@/components/ui/StadiumBackground";
import { ClientStatusBar } from "./ClientStatusBar";
import { GameMode } from "@/types/game";
import { TabInfoButton } from "./TabInfoButton";
import { TabInfoModal } from "./TabInfoModal";

const TAB_PATHS: Record<DashboardTab, string> = {
  play: "/",
  home: "/dashboard",
  profile: "/profile",
  store: "/store",
  settings: "/settings",
  players: "/players",
};

interface DashboardShellProps {
  initialTab?: DashboardTab;
}

export function DashboardShell({ initialTab = "play" }: DashboardShellProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { friends, pendingRequests } = useFriends();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isTabInfoModalOpen, setIsTabInfoModalOpen] = useState(false);

  // Sekme değiştiğinde tarayıcı URL'sini yumuşakça (pushState ile) güncelle
  const handleTabChange = (tab: DashboardTab, updateHistory = true) => {
    setActiveTab(tab);
    if (updateHistory && typeof window !== "undefined") {
      const targetPath = TAB_PATHS[tab];
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, "", targetPath);
      }
    }
  };

  // initialTab değişirse (örn: doğrudan link ile sayfa geçişinde) senkronize et
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Tarayıcının Geri / İleri tuşlarına basıldığında sekmeyi URL ile senkronize et
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const matchingTab = (Object.keys(TAB_PATHS) as DashboardTab[]).find(
        (key) => TAB_PATHS[key] === path
      );
      if (matchingTab) {
        setActiveTab(matchingTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const onlineFriendsCount = friends.filter(
    (f) => f.status === "çevrimiçi" || f.status === "oyunda"
  ).length;
  const hasPendingRequests = pendingRequests.length > 0;

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

  const [isAuctionRoomOpen, setIsAuctionRoomOpen] = useState(false);

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

  const handleStartSearching = (
    duration: number,
    mode: "ranked" | "casual" = matchmakingMode,
    gameMode: GameMode = matchmakingGameMode
  ) => {
    if (!user) {
      handleOpenAuthModal("login");
      return;
    }
    startMatchmaking(user.id, user.username, user.eloRating || 1000, duration, mode, gameMode);
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
          onTabChange={handleTabChange}
          onOpenAuthModal={handleOpenAuthModal}
          isSocialOpen={isSocialOpen}
          onToggleSocial={() => setIsSocialOpen((prev) => !prev)}
          onlineFriendsCount={onlineFriendsCount}
          hasPendingRequests={hasPendingRequests}
        />

        {/* Merkezde Değişen Sahne (Main Stage İçeriği - Dikey Kaydırma Destekli) */}
        <div className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
          {/* Her Sekmenin Sağ Üstündeki Belirgin Bilgilendirme / Rehber Butonu */}
          <TabInfoButton
            activeTab={activeTab}
            onClick={() => setIsTabInfoModalOpen(true)}
          />

          {activeTab === "home" && (
            <HomeStage onGoToPlay={() => handleTabChange("play")} />
          )}

          {activeTab === "play" && (
            <PlayStage
              onStartRanked={handleOpenRankedModal}
              onStartCasual={handleOpenCasualModal}
              onGoToPlayers={() => handleTabChange("players")}
              onOpenAuthModal={handleOpenAuthModal}
            />
          )}

          {activeTab === "profile" && (
            <ProfileStage
              onGoToPlay={() => handleTabChange("play")}
              onOpenAuthModal={handleOpenAuthModal}
            />
          )}

          {activeTab === "store" && (
            <StoreStage
              onGoToPlay={() => handleTabChange("play")}
              onOpenAuthModal={handleOpenAuthModal}
            />
          )}

          {activeTab === "players" && (
            <PlayersStage onBackToPlay={() => handleTabChange("play")} />
          )}

          {activeTab === "settings" && <SettingsStage />}
        </div>

        {/* 3. LoL / Riot Tarzı Alt Durum Çubuğu (Ft2 Inline Single Line - Hallmark Uyumlu) */}
        <ClientStatusBar onTabChange={handleTabChange} />
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
        onQuickInvite={(_friendId, _friendName) => {
          if (!user) {
            handleOpenAuthModal("login");
            return;
          }
          const roomId = `oda_${Math.floor(1000 + Math.random() * 9000)}`;
          router.push(`/play/${roomId}`);
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

      {/* Dashboard Üzeri Giriş / Kayıt Ol Penceresi (Auth Modal) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Her Sekmenin İçeriğini & SEO Detaylarını Anlatan Modal */}
      <TabInfoModal
        tab={isTabInfoModalOpen ? activeTab : null}
        onClose={() => setIsTabInfoModalOpen(false)}
      />
    </main>
  );
}
