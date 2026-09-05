"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProfileGuestView } from "./profile/ProfileGuestView";
import { ProfileHeaderCard } from "./profile/ProfileHeaderCard";
import { ProfileMetricsGrid } from "./profile/ProfileMetricsGrid";
import { ProfileMatchHistory, RecentMatchItem } from "./profile/ProfileMatchHistory";
import { ProfileLogoutModal } from "./profile/ProfileLogoutModal";

interface ProfileStageProps {
  onGoToPlay?: () => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function ProfileStage({ onGoToPlay, onOpenAuthModal }: ProfileStageProps) {
  const router = useRouter();
  const { user, isLoading, logout, refreshUser } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Gerçek Maç Geçmişi
  const [matchHistory, setMatchHistory] = useState<RecentMatchItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user?.id) return;
    setIsHistoryLoading(true);

    fetch(`/api/users/${user.id}/matches?limit=30`)
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((data) => setMatchHistory(data.matches ?? []))
      .catch(() => setMatchHistory([]))
      .finally(() => setIsHistoryLoading(false));
  }, [user?.id]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onGoToPlay?.();
      router.push("/");
    } catch (err) {
      console.error("[ProfileStage] Çıkış hatası:", err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const totalMatches = (user?.matchesWon || 0) + (user?.matchesLost || 0) + (user?.matchesDraw || 0);
  const winRate =
    totalMatches > 0
      ? Math.round(((user?.matchesWon || 0) / totalMatches) * 100)
      : 0;

  if (isLoading && !user) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center bg-transparent text-white select-none font-sans p-8 lg:p-12 h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-zinc-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <ProfileGuestView onOpenAuthModal={onOpenAuthModal} />;
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-white select-none font-sans p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,197,94,0.1)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Üst Profil Kartı */}
        <ProfileHeaderCard
          user={user}
          onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
        />

        {/* 2. İstatistik Metrikleri */}
        <ProfileMetricsGrid
          totalMatches={totalMatches}
          winRate={winRate}
          matchesWon={user.matchesWon || 0}
          matchesLost={user.matchesLost || 0}
          matchesDraw={user.matchesDraw || 0}
          currentStreak={user.currentStreak ?? 0}
          bestStreak={user.bestStreak ?? 0}
        />

        {/* 3. Karşılaşma Geçmişi Tablosu */}
        <ProfileMatchHistory
          matchHistory={matchHistory}
          isHistoryLoading={isHistoryLoading}
          onGoToPlay={onGoToPlay}
        />
      </div>

      {/* Çıkış Yap Onay Modalı */}
      <ProfileLogoutModal
        isOpen={isLogoutModalOpen}
        isLoggingOut={isLoggingOut}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />
    </div>
  );
}
