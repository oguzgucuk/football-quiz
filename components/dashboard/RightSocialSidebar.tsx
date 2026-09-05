"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { SocialProfileHeader } from "./social/SocialProfileHeader";
import { SocialAddFriendInput } from "./social/SocialAddFriendInput";
import { SocialPendingRequests } from "./social/SocialPendingRequests";
import { SocialFriendList } from "./social/SocialFriendList";
import { SocialLockedView } from "./social/SocialLockedView";

interface RightSocialSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickInvite?: (friendId: string, friendName: string) => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function RightSocialSidebar({
  isOpen,
  onClose,
  onQuickInvite,
  onOpenAuthModal,
}: RightSocialSidebarProps) {
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth();
  const {
    friends,
    pendingRequests,
    isLoading: isFriendsLoading,
    sendRequestByUsername,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriends();

  // Sidebar açıldığında güncel ELO ve kullanıcı verisini yenile
  useEffect(() => {
    if (isOpen) {
      refreshUser();
    }
  }, [isOpen, refreshUser]);

  // Escape tuşuna basıldığında sidebar'ı kapat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Kalp atışı (Heartbeat) — Çevrimiçi durumunu canlı tutar
  useEffect(() => {
    if (!user) return;

    const pingHeartbeat = async () => {
      try {
        await fetch("/api/users/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inGame: false }),
        });
      } catch {
        // Sessizce geç
      }
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 25000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      {/* 1. Koyu Bulanık Arka Plan Katmanı (Drawer açıkken tıklanırsa kapatır) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* 2. Kayan Sağ Sidebar (Drawer) */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 sm:w-88 max-w-[85vw] bg-[#0a120e]/95 backdrop-blur-xl border-l border-white/10 flex flex-col select-none z-50 shadow-2xl text-white transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        suppressHydrationWarning
      >
        {isAuthLoading && !user ? (
          /* Oturum Yüklenirken Skeleton */
          <div className="p-4 space-y-4 animate-pulse">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="size-12 rounded-2xl bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/15 rounded w-28" />
                <div className="h-3 bg-white/10 rounded w-16" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-white/5 rounded-xl border border-white/10" />
              <div className="h-12 bg-white/5 rounded-xl border border-white/10" />
            </div>
          </div>
        ) : !user ? (
          /* Oturum Açmamış Kullanıcı Kilitli Görünüm */
          <SocialLockedView onClose={onClose} onOpenAuthModal={onOpenAuthModal} />
        ) : (
          /* Oturum Açmış Kullanıcı Ana İçerik */
          <>
            {/* Profil ve Özet Başlık */}
            <SocialProfileHeader user={user} onClose={onClose} />

            {/* Arkadaş Arama / Ekleme */}
            <SocialAddFriendInput onAddFriend={sendRequestByUsername} />

            {/* Gelen Bekleyen İstekler */}
            <SocialPendingRequests
              pendingRequests={pendingRequests}
              onAccept={acceptRequest}
              onReject={rejectRequest}
            />

            {/* Arkadaş Listesi */}
            <SocialFriendList
              friends={friends}
              isLoading={isFriendsLoading}
              onQuickInvite={onQuickInvite}
              onRemoveFriend={removeFriend}
            />

            {/* Alt Durum Çubuğu */}
            <div className="p-2.5 border-t border-white/10 bg-black/40 backdrop-blur-xs text-[11px] text-zinc-400 flex items-center justify-between font-mono">
              <span>Sunucu: TR-Istanbul</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif
              </span>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
