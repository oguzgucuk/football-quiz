"use client";

import React from "react";
import { Coins, Gem, User, Settings, LogIn, UserPlus, Users, LogOut } from "lucide-react";
import { DashboardTab } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarUserMenuProps {
  onTabChange: (tab: DashboardTab) => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
  isSocialOpen?: boolean;
  onToggleSocial?: () => void;
  onlineFriendsCount?: number;
  hasPendingRequests?: boolean;
}

export function TopBarUserMenu({
  onTabChange,
  onOpenAuthModal,
  isSocialOpen,
  onToggleSocial,
  onlineFriendsCount = 0,
  hasPendingRequests = false,
}: TopBarUserMenuProps) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading && !user) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-8 w-16 rounded-xl bg-white/10" />
        <div className="h-8 w-16 rounded-xl bg-white/10" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenAuthModal?.("login")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/50 text-emerald-400 text-xs font-bold hover:bg-emerald-900/60 transition-all cursor-pointer"
        >
          <LogIn className="size-3.5" />
          <span>Giriş Yap</span>
        </button>

        <button
          onClick={() => onOpenAuthModal?.("register")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-950/50"
        >
          <UserPlus className="size-3.5" />
          <span>Kayıt Ol</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" suppressHydrationWarning>
      {/* Düz Coin Bakiyesi */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={() => onTabChange("store")}
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 hover:border-amber-400/50 hover:bg-amber-500/10 transition-all cursor-pointer group"
          >
            <div className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Coins className="size-3 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-xs font-black font-mono text-white tracking-tight">
              {(user.coins ?? 0).toLocaleString()}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Oyun İçi Altın — Oyuncu kartları ve modlarda harcanır</p>
        </TooltipContent>
      </Tooltip>

      {/* AlimCoin (AC) Premium Bakiyesi */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={() => onTabChange("store")}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:border-emerald-400 hover:shadow-emerald-500/20 transition-all cursor-pointer group"
          >
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white font-black text-[9px] shadow-sm group-hover:scale-110 transition-transform">
              AC
            </div>
            <span className="text-xs font-black font-mono text-emerald-400 tracking-tight">
              {(user.alimCoins ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 rounded px-1 py-0.2">
              +
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>AlimCoin (AC) — Müzayede ve özel paketler için bütçe</p>
        </TooltipContent>
      </Tooltip>

      {/* ELO Derecesi */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={() => onTabChange("profile")}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40 hover:border-emerald-500/40 hover:bg-emerald-950/30 transition-all cursor-pointer"
          >
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Gem className="size-3 fill-emerald-400/20 text-emerald-400" />
            </div>
            <span className="text-xs font-black font-mono text-emerald-400 tracking-tight">
              {user.eloRating || 1000}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Mevcut Lig Dereceniz: {user.eloRating || 1000} ELO</p>
        </TooltipContent>
      </Tooltip>

      {/* Kullanıcı Avatarı ve Dropdown Profil Menüsü */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-xl p-0.5 hover:ring-2 hover:ring-emerald-500/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-emerald-400">
            <Avatar className="h-8 w-8 border border-emerald-500/40 shadow-sm shadow-emerald-950/50">
              <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-950 text-white font-black text-xs">
                {user.username ? user.username.substring(0, 2).toUpperCase() : "OY"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-xs font-black text-white">{user.username}</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {user.eloRating || 1000} ELO Derecesi
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onTabChange("profile")}>
            <User className="size-4 mr-2 text-emerald-400" />
            <span>Profil & Maç Geçmişi</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTabChange("settings")}>
            <Settings className="size-4 mr-2 text-zinc-400" />
            <span>Ayarlar</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              logout();
              toast.info("Oturum kapatıldı.");
            }}
            className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40"
          >
            <LogOut className="size-4 mr-2 text-rose-400" />
            <span>Çıkış Yap</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sosyal / Arkadaşlar Paneli Aç/Kapa Butonu */}
      {onToggleSocial && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleSocial}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
                isSocialOpen
                  ? "bg-emerald-700 text-white border-emerald-400 shadow-md shadow-emerald-950/50"
                  : "border-white/15 bg-black/40 text-zinc-300 hover:border-emerald-500/40 hover:text-white hover:bg-white/5"
              }`}
              aria-label="Arkadaşlar"
            >
              <div className="relative">
                <Users className="size-3.5" />
                {hasPendingRequests ? (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                ) : onlineFriendsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ) : null}
              </div>
              <span className="text-xs font-bold hidden lg:inline">Sosyal</span>
              {onlineFriendsCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.2 rounded-md">
                  {onlineFriendsCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {onlineFriendsCount > 0
                ? `${onlineFriendsCount} Arkadaşın Çevrimiçi`
                : "Sosyal Panel & Arkadaşlar"}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
