"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User, Trophy, Flame, UserPlus, Swords, Circle,
  ShieldCheck, ChevronRight, Check, X, Lock, LogIn,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFriends, PresenceStatus } from "@/hooks/useFriends";

interface RightSocialSidebarProps {
  onQuickInvite?: (friendId: string, friendName: string) => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

export function RightSocialSidebar({ onQuickInvite, onOpenAuthModal }: RightSocialSidebarProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    friends, pendingRequests, isLoading,
    sendRequestByUsername, acceptRequest, rejectRequest, removeFriend,
  } = useFriends();

  const [addFriendInput, setAddFriendInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError: boolean } | null>(null);

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

  const totalMatches = (user?.matchesWon ?? 0) + (user?.matchesLost ?? 0) + (user?.matchesDraw ?? 0);
  const winRate = totalMatches > 0
    ? Math.round(((user?.matchesWon ?? 0) / totalMatches) * 100)
    : 0;

  // Kullanıcı adıyla arkadaş ekleme
  const handleInlineAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = addFriendInput.trim();
    if (!cleanUsername || isSubmitting) return;

    if (!/^[a-zA-Z0-9]+$/.test(cleanUsername)) {
      setActionFeedback({
        message: "Kullanıcı adı sadece harf ve rakam içerebilir.",
        isError: true,
      });
      setTimeout(() => setActionFeedback(null), 3500);
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await sendRequestByUsername(cleanUsername);
      setActionFeedback({ message: msg, isError: false });
      setAddFriendInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İstek gönderilemedi.";
      setActionFeedback({ message: msg, isError: true });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const getStatusDisplay = (status: PresenceStatus) => {
    switch (status) {
      case "oyunda":
        return {
          dotClass: "text-amber-500 fill-amber-500 animate-pulse",
          textClass: "text-amber-600 font-bold",
          label: "Oyunda",
        };
      case "çevrimiçi":
        return {
          dotClass: "text-emerald-500 fill-emerald-500",
          textClass: "text-emerald-600 font-semibold",
          label: "Çevrimiçi",
        };
      case "çevrimdışı":
      default:
        return {
          dotClass: "text-zinc-400 fill-zinc-400",
          textClass: "text-zinc-400 font-medium",
          label: "Çevrimdışı",
        };
    }
  };

  // OTURUM YÜKLENİRKEN SKELETON
  if (isAuthLoading && !user) {
    return (
      <aside
        className="w-80 h-full bg-[#0a120e]/80 backdrop-blur-md border-l border-white/10 flex flex-col shrink-0 p-4 space-y-4 animate-pulse select-none z-20"
        suppressHydrationWarning
      >
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
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="size-8 rounded-xl bg-white/10" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-white/15 rounded w-24" />
                <div className="h-2.5 bg-white/10 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // OTURUM AÇMAMIŞ KULLANICI İÇİN KİLİTLİ GÖRÜNÜM
  if (!user) {
    return (
      <aside
        className="w-80 h-full bg-[#0a120e]/80 backdrop-blur-md border-l border-white/10 flex flex-col shrink-0 select-none z-20 relative overflow-hidden"
        suppressHydrationWarning
      >
        {/* Arka Plan Bulanık Silüet */}
        <div className="absolute inset-0 p-4 space-y-4 filter blur-[2px] opacity-20 pointer-events-none select-none">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="size-12 rounded-2xl bg-white/10" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-white/15 rounded w-24" />
              <div className="h-3 bg-white/10 rounded w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-white/10 rounded-xl" />
            <div className="h-12 bg-white/10 rounded-xl" />
          </div>
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="size-8 rounded-xl bg-white/10" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-white/15 rounded w-28" />
                  <div className="h-2.5 bg-white/10 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kilitli İçerik ve Giriş Butonları */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md bg-[#0a120e]/85">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mb-4 shadow-sm">
            <Lock className="size-6 text-emerald-400" />
          </div>

          <h3 className="text-base font-black text-white tracking-tight mb-2">
            Sosyallik Paneli Kilitli
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed mb-6 max-w-[220px]">
            Arkadaş eklemek, durumlarını görmek ve maçlara davet etmek için oturum açın.
          </p>

          <div className="w-full space-y-2.5">
            <button
              onClick={() => onOpenAuthModal?.("login")}
              className="w-full py-2.5 rounded-xl bg-gradient-to-b from-[#168841] to-[#126d34] hover:from-[#15803d] hover:to-[#0f5c2b] text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="size-3.5" />
              <span>Giriş Yap</span>
            </button>

            <button
              onClick={() => onOpenAuthModal?.("register")}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <UserPlus className="size-3.5 text-emerald-400" />
              <span>Hesap Oluştur</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-80 h-full bg-[#0a120e]/80 backdrop-blur-md border-l border-white/10 flex flex-col shrink-0 select-none z-20 shadow-xl text-white"
      suppressHydrationWarning
    >
      {/* 1. ÜST: Kullanıcı Profil Kartı */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-b from-emerald-950/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#168841] to-[#126d34] p-0.5 shadow-sm">
              <div className="w-full h-full bg-[#0a120e] rounded-[14px] flex items-center justify-center text-emerald-400 font-bold">
                <User className="w-6 h-6" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a120e] rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white truncate">
                {user?.username ?? "Yükleniyor..."}
              </h3>
              <Link href="/profile" className="text-zinc-400 hover:text-emerald-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 capitalize">
                <ShieldCheck className="w-3 h-3" />
                {user?.rankTier ?? "bronze"}
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-400">
                {user?.eloRating ?? 1000} ELO
              </span>
            </div>
          </div>
        </div>

        {/* Gerçek İstatistik Çubukları */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 shadow-2xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Seri</div>
              <div className="text-xs font-black text-white font-mono">
                {user?.currentStreak ?? 0} Galibiyet
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 shadow-2xs flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Kazanma</div>
              <div className="text-xs font-black text-white font-mono">
                %{winRate} ({totalMatches}M)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Arkadaş Ekleme Girişi */}
      <div className="px-3.5 py-2.5 border-b border-white/10 bg-white/5 backdrop-blur-xs">
        <form onSubmit={handleInlineAddFriend} className="flex items-center gap-1.5">
          <input
            type="text"
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
            placeholder="Kullanıcı adı yaz..."
            maxLength={20}
            className="flex-1 bg-black/40 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !addFriendInput.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer shadow-2xs"
            title="Arkadaş Ekle"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ekle</span>
          </button>
        </form>

        {actionFeedback && (
          <div
            className={`mt-2 px-2 py-1.5 rounded-lg text-xs text-center border animate-in fade-in duration-200 ${
              actionFeedback.isError
                ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                : "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
            }`}
          >
            {actionFeedback.message}
          </div>
        )}
      </div>

      {/* 3. Bekleyen İstekler */}
      {pendingRequests.length > 0 && (
        <div className="p-3 border-b border-amber-500/30 bg-amber-950/30 backdrop-blur-xs">
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pendingRequests.length} Bekleyen İstek
          </div>
          <div className="space-y-1.5">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.friendshipId} className="flex items-center justify-between gap-2 p-2 bg-black/40 rounded-xl border border-amber-500/30 shadow-2xs">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{req.senderUsername}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{req.senderEloRating} ELO</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => acceptRequest(req.friendshipId)}
                    className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 transition-colors"
                    title="Kabul Et"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => rejectRequest(req.senderId)}
                    className="p-1.5 rounded-lg bg-rose-950/60 text-rose-400 hover:bg-rose-900 transition-colors"
                    title="Reddet"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Arkadaşlar Başlığı (Liderlik kaldırıldı, sadece Arkadaşlar) */}
      <div className="px-4 py-2.5 border-b border-white/10 bg-white/5 backdrop-blur-xs flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-white">
          Arkadaşlar
        </span>
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2 py-0.5 rounded-full">
          {friends.length}
        </span>
      </div>

      {/* 5. Arkadaş Listesi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-10">
            <UserPlus className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-white">Henüz arkadaşın yok</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Yukarıdaki alandan kullanıcı adıyla ekleyebilirsin
            </p>
          </div>
        ) : (
          friends.map((friend) => {
            const statusDisplay = getStatusDisplay(friend.status);
            const isAvailableForDuel = friend.status === "çevrimiçi";

            return (
              <div
                key={friend.id}
                className="group p-2.5 rounded-2xl bg-white/5 backdrop-blur-xs border border-white/10 hover:border-emerald-500/40 hover:bg-white/10 hover:shadow-2xs transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black text-emerald-400">
                      {friend.username.substring(0, 2).toUpperCase()}
                    </div>
                    <Circle
                      className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 ${statusDisplay.dotClass}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white truncate">
                        {friend.username}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">
                        {friend.eloRating}
                      </span>
                    </div>
                    <div className="text-[10px] mt-0.5 flex items-center gap-1">
                      <span className={statusDisplay.textClass}>
                        {statusDisplay.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isAvailableForDuel && onQuickInvite && (
                    <button
                      onClick={() => onQuickInvite(friend.id, friend.username)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-emerald-900/60 text-emerald-400 hover:bg-emerald-800 text-xs flex items-center gap-1 font-bold cursor-pointer"
                      title="1v1 Maça Davet Et"
                    >
                      <Swords className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                    title="Arkadaşı Sil"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Alt Durum Çubuğu */}
      <div className="p-2.5 border-t border-white/10 bg-black/40 backdrop-blur-xs text-[11px] text-zinc-400 flex items-center justify-between font-mono">
        <span>Sunucu: TR-Istanbul</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Aktif
        </span>
      </div>
    </aside>
  );
}
