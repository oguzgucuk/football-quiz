"use client";

/**
 * Üst Navigasyon Barı (TopBar).
 * Modüler mimari:
 * - TopBarBrand: Logo ve rozet
 * - TopBarNav: Framer Motion akıcı kayan kapsüllü sekmeler
 * - TopBarUserMenu: Bakiyeler, Tooltip'ler ve Profil Dropdown Menüsü
 */

import React from "react";
import { DashboardTab } from "./types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopBarBrand } from "./topbar/TopBarBrand";
import { TopBarNav } from "./topbar/TopBarNav";
import { TopBarUserMenu } from "./topbar/TopBarUserMenu";

interface TopBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
  isSocialOpen?: boolean;
  onToggleSocial?: () => void;
  onlineFriendsCount?: number;
  hasPendingRequests?: boolean;
}

export function TopBar({
  activeTab,
  onTabChange,
  onOpenAuthModal,
  isSocialOpen,
  onToggleSocial,
  onlineFriendsCount = 0,
  hasPendingRequests = false,
}: TopBarProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#0a120e]/85 backdrop-blur-xl px-4 sm:px-6 z-30 select-none shadow-[0_4px_30px_rgba(0,0,0,0.6)] relative">
        {/* Sol: Logo & Marka Rozeti */}
        <TopBarBrand onTabChange={onTabChange} />

        {/* Orta: Navigasyon Sekmeleri (Framer Motion Akıcı Kapsül) */}
        <TopBarNav activeTab={activeTab} onTabChange={onTabChange} />

        {/* Sağ: Oturum Butonları VEYA Bakiyeler + Avatar Menüsü */}
        <TopBarUserMenu
          onTabChange={onTabChange}
          onOpenAuthModal={onOpenAuthModal}
          isSocialOpen={isSocialOpen}
          onToggleSocial={onToggleSocial}
          onlineFriendsCount={onlineFriendsCount}
          hasPendingRequests={hasPendingRequests}
        />
      </header>
    </TooltipProvider>
  );
}
