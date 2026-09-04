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
        className="w-80 h-full bg-white/95 backdrop-blur-md border-l border-[#e2e8e4] flex flex-col shrink-0 p-4 space-y-4 animate-pulse select-none z-20"
        suppressHydrationWarning
      >
        <div className="flex items-center gap-3 pb-3 border-b border-[#e2e8e4]">
          <div className="size-12 rounded-2xl bg-[#f0f4f2]" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-[#e2e8e4] rounded w-28" />
            <div className="h-3 bg-[#f0f4f2] rounded w-16" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-[#f4f7f5] rounded-xl" />
          <div className="h-12 bg-[#f4f7f5] rounded-xl" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#f8faf8] border border-[#e2e8e4]">
              <div className="size-8 rounded-xl bg-[#e8f3ed]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-[#e2e8e4] rounded w-24" />
                <div className="h-2.5 bg-[#f0f4f2] rounded w-14" />
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
        className="w-80 h-full bg-white/95 backdrop-blur-md border-l border-[#e2e8e4] flex flex-col shrink-0 select-none z-20 relative overflow-hidden"
        suppressHydrationWarning
      >
        {/* Arka Plan Bulanık Silüet */}
        <div className="absolute inset-0 p-4 space-y-4 filter blur-[2px] opacity-35 pointer-events-none select-none">
          <div className="flex items-center gap-3 pb-3 border-b border-[#e2e8e4]">
            <div className="size-12 rounded-2xl bg-[#e2e8e4]" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#cbd5ce] rounded w-24" />
              <div className="h-3 bg-[#e2e8e4] rounded w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-[#f0f4f2] rounded-xl" />
            <div className="h-12 bg-[#f0f4f2] rounded-xl" />
          </div>
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#e2e8e4]">
                <div className="size-8 rounded-xl bg-[#e8f3ed]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-[#e2e8e4] rounded w-28" />
                  <div className="h-2.5 bg-[#f0f4f2] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kilitli İçerik ve Giriş Butonları */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md bg-white/80">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#e8f3ed] border border-[#bfe0cc] text-[#15803d] mb-4 shadow-sm">
            <Lock className="size-6 text-[#15803d]" />
          </div>

          <h3 className="text-base font-black text-[#141b16] tracking-tight mb-2">
            Sosyallik Paneli Kilitli
          </h3>

          <p className="text-xs text-[#6b7770] leading-relaxed mb-6 max-w-[220px]">
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
              className="w-full py-2.5 rounded-xl bg-white hover:bg-[#f8faf8] text-[#141b16] border border-[#e2e8e4] text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <UserPlus className="size-3.5 text-[#15803d]" />
              <span>Hesap Oluştur</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-80 h-full bg-white/95 backdrop-blur-md border-l border-[#e2e8e4] flex flex-col shrink-0 select-none z-20 shadow-xs"
      suppressHydrationWarning
    >
      {/* 1. ÜST: Kullanıcı Profil Kartı */}
      <div className="p-4 border-b border-[#e2e8e4] bg-gradient-to-b from-[#e8f3ed]/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#168841] to-[#126d34] p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-[#15803d] font-bold">
                <User className="w-6 h-6" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#141b16] truncate">
                {user?.username ?? "Yükleniyor..."}
              </h3>
              <Link href="/profile" className="text-[#6b7770] hover:text-[#15803d] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-[#15803d]/10 px-2 py-0.5 rounded-md border border-[#15803d]/20 capitalize">
                <ShieldCheck className="w-3 h-3" />
                {user?.rankTier ?? "bronze"}
              </span>
              <span className="text-[11px] font-mono font-bold text-[#6b7770]">
                {user?.eloRating ?? 1000} ELO
              </span>
            </div>
          </div>
        </div>

        {/* Gerçek İstatistik Çubukları */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#e2e8e4]/60">
          <div className="bg-white p-2.5 rounded-xl border border-[#e2e8e4] shadow-2xs flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20 shrink-0" />
            <div>
              <div className="text-[10px] text-[#8a968f] uppercase font-black tracking-wider">Seri</div>
              <div className="text-xs font-black text-[#141b16] font-mono">
                {user?.currentStreak ?? 0} Galibiyet
              </div>
            </div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-[#e2e8e4] shadow-2xs flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#15803d] shrink-0" />
            <div>
              <div className="text-[10px] text-[#8a968f] uppercase font-black tracking-wider">Kazanma</div>
              <div className="text-xs font-black text-[#141b16] font-mono">
                %{winRate} ({totalMatches}M)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Arkadaş Ekleme Girişi */}
      <div className="px-3.5 py-2.5 border-b border-[#e2e8e4] bg-[#f8faf8]">
        <form onSubmit={handleInlineAddFriend} className="flex items-center gap-1.5">
          <input
            type="text"
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
            placeholder="Kullanıcı adı yaz..."
            maxLength={20}
            className="flex-1 bg-white border border-[#e2e8e4] focus:border-[#15803d] rounded-xl px-3 py-1.5 text-xs text-[#141b16] placeholder:text-[#8a968f] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !addFriendInput.trim()}
            className="px-3 py-1.5 rounded-xl bg-[#15803d] hover:bg-[#126d34] text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer shadow-2xs"
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
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-emerald-50 border-emerald-200 text-[#15803d]"
            }`}
          >
            {actionFeedback.message}
          </div>
        )}
      </div>

      {/* 3. Bekleyen İstekler */}
      {pendingRequests.length > 0 && (
        <div className="p-3 border-b border-amber-200/60 bg-amber-50/50">
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingRequests.length} Bekleyen İstek
          </div>
          <div className="space-y-1.5">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.friendshipId} className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-amber-200/60 shadow-2xs">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#141b16] truncate">{req.senderUsername}</div>
                  <div className="text-[10px] text-[#6b7770] font-mono">{req.senderEloRating} ELO</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => acceptRequest(req.friendshipId)}
                    className="p-1.5 rounded-lg bg-emerald-50 text-[#15803d] hover:bg-emerald-100 transition-colors"
                    title="Kabul Et"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => rejectRequest(req.senderId)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
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
      <div className="px-4 py-2.5 border-b border-[#e2e8e4] bg-[#f8faf8] flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-[#141b16]">
          Arkadaşlar
        </span>
        <span className="bg-[#15803d]/10 text-[#15803d] text-[11px] font-black px-2 py-0.5 rounded-full">
          {friends.length}
        </span>
      </div>

      {/* 5. Arkadaş Listesi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#15803d] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-10">
            <UserPlus className="w-8 h-8 text-[#8a968f] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#141b16]">Henüz arkadaşın yok</p>
            <p className="text-[11px] text-[#6b7770] mt-0.5">
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
                className="group p-2.5 rounded-2xl bg-white border border-[#e2e8e4] hover:border-[#15803d]/40 hover:shadow-2xs transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-[#e8f3ed] flex items-center justify-center text-xs font-black text-[#15803d]">
                      {friend.username.substring(0, 2).toUpperCase()}
                    </div>
                    <Circle
                      className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 ${statusDisplay.dotClass}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#141b16] truncate">
                        {friend.username}
                      </span>
                      <span className="text-[10px] font-mono text-[#6b7770] font-bold">
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-emerald-50 text-[#15803d] hover:bg-emerald-100 text-xs flex items-center gap-1 font-bold cursor-pointer"
                      title="1v1 Maça Davet Et"
                    >
                      <Swords className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
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
      <div className="p-2.5 border-t border-[#e2e8e4] bg-[#f8faf8] text-[11px] text-[#6b7770] flex items-center justify-between font-mono">
        <span>Sunucu: TR-Istanbul</span>
        <span className="text-[#15803d] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Aktif
        </span>
      </div>
    </aside>
  );
}
