"use client";

import React, { useState, useCallback, useEffect } from "react";
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

  const [activeTab, setActiveTab] = useState<"friends" | "leaderboard">("friends");
  const [addFriendInput, setAddFriendInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Kalp atışı (Heartbeat) — Sitede aktifken çevrimiçi durumunu canlı tutar
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
        // Ağ hatası sessizce geçilir
      }
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 25000); // 25 saniyede bir
    return () => clearInterval(interval);
  }, [user]);

  const totalMatches = (user?.matchesWon ?? 0) + (user?.matchesLost ?? 0) + (user?.matchesDraw ?? 0);
  const winRate = totalMatches > 0
    ? Math.round(((user?.matchesWon ?? 0) / totalMatches) * 100)
    : 0;

  // Profilin altında, sosyallik barının üstündeki inline arkadaş ekleme
  const handleInlineAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = addFriendInput.trim();
    if (!cleanUsername || isSubmitting) return;

    // Alfanümerik kuralı (özel karakter ve boşluk yok)
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
          dotClass: "text-amber-400 fill-amber-400 animate-pulse",
          textClass: "text-amber-400 font-semibold",
          label: "Oyunda",
        };
      case "çevrimiçi":
        return {
          dotClass: "text-emerald-400 fill-emerald-400",
          textClass: "text-emerald-400 font-medium",
          label: "Çevrimiçi",
        };
      case "çevrimdışı":
      default:
        return {
          dotClass: "text-zinc-600 fill-zinc-600",
          textClass: "text-zinc-500",
          label: "Çevrimdışı",
        };
    }
  };

  // OTURUM HENÜZ YÜKLENİYORSA: Kilitli ekran parlamasını önlemek için hafif skeleton göster
  if (isAuthLoading && !user) {
    return (
      <aside className="w-80 h-full bg-[#0B101B]/95 border-l border-zinc-800/80 flex flex-col shrink-0 p-4 space-y-4 animate-pulse select-none z-20" suppressHydrationWarning>
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
          <div className="size-12 rounded-xl bg-zinc-800/60" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-700/50 rounded w-28" />
            <div className="h-3 bg-zinc-800/50 rounded w-16" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-zinc-800/40 rounded-lg" />
          <div className="h-12 bg-zinc-800/40 rounded-lg" />
        </div>
        <div className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <div className="size-8 rounded-lg bg-zinc-800/60" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-zinc-700/50 rounded w-24" />
                <div className="h-2.5 bg-zinc-800/40 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  // OTURUM AÇMAMIŞ KULLANICI İÇİN: Boş, bulanık ve kilitli sosyallik paneli
  if (!user) {
    return (
      <aside className="w-80 h-full bg-[#0B101B]/95 border-l border-zinc-800/80 flex flex-col shrink-0 select-none z-20 relative overflow-hidden" suppressHydrationWarning>
        {/* Arka Plan Hayalet Çizgileri (Bulanık silüet) */}
        <div className="absolute inset-0 p-4 space-y-4 filter blur-[2.5px] opacity-25 pointer-events-none select-none">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
            <div className="size-12 rounded-xl bg-zinc-800" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-zinc-700 rounded w-24" />
              <div className="h-3 bg-zinc-800 rounded w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-zinc-800 rounded-lg" />
            <div className="h-12 bg-zinc-800 rounded-lg" />
          </div>
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="size-8 rounded-lg bg-zinc-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-zinc-700 rounded w-28" />
                  <div className="h-2.5 bg-zinc-800 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buzlu Cam Overlay + Giriş / Kayıt Butonları */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md bg-[#080C14]/75">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl shadow-emerald-500/10">
            <Lock className="size-6 text-emerald-400" />
          </div>

          <h3 className="text-base font-black text-white tracking-tight mb-2">
            Sosyallik Paneli Kilitli
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed mb-6 max-w-[220px]">
            Arkadaş eklemek, durumlarını (çevrimiçi / oyunda) görmek ve maçlara davet etmek için oturum açın.
          </p>

          <div className="w-full space-y-2.5">
            <button
              onClick={() => onOpenAuthModal?.("login")}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="size-3.5" />
              <span>Giriş Yap</span>
            </button>

            <button
              onClick={() => onOpenAuthModal?.("register")}
              className="w-full py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
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
    <aside className="w-80 h-full bg-[#0B101B]/95 border-l border-zinc-800/80 flex flex-col shrink-0 select-none z-20" suppressHydrationWarning>
      {/* 1. ÜST: Kullanıcı Profil Kartı */}
      <div className="p-4 border-b border-zinc-800/60 bg-gradient-to-b from-emerald-950/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#080C14] rounded-[10px] flex items-center justify-center text-emerald-400 font-bold">
                <User className="w-6 h-6" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#080C14] rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white truncate">
                {user?.username ?? "Yükleniyor..."}
              </h3>
              <Link href="/profile" className="text-zinc-500 hover:text-emerald-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                {user?.rankTier ?? "bronze"}
              </span>
              <span className="text-[11px] font-mono text-zinc-400 font-bold">
                {user?.eloRating ?? 1000} ELO
              </span>
            </div>
          </div>
        </div>

        {/* Gerçek İstatistik Çubuğu */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800/40">
          <div className="bg-[#080C14]/80 p-2 rounded-lg border border-zinc-800/60 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Seri</div>
              <div className="text-xs font-bold text-white font-mono">
                {user?.currentStreak ?? 0} Galibiyet
              </div>
            </div>
          </div>
          <div className="bg-[#080C14]/80 p-2 rounded-lg border border-zinc-800/60 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Kazanma</div>
              <div className="text-xs font-bold text-white font-mono">
                %{winRate} ({totalMatches}M)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Profilin altında, sosyallik barının üstünde: ARKADAŞ EKLE KUTUSU */}
      <div className="px-3 py-2.5 border-b border-zinc-800/60 bg-[#080C14]/40">
        <form onSubmit={handleInlineAddFriend} className="flex items-center gap-1.5">
          <input
            type="text"
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
            placeholder="Kullanıcı adı yaz..."
            maxLength={20}
            className="flex-1 bg-[#090D18] border border-zinc-800 focus:border-emerald-500/60 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isSubmitting || !addFriendInput.trim()}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/35 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
            title="Arkadaş Ekle"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ekle</span>
          </button>
        </form>

        {/* Anlık Bildirim (Varsa başarı veya 'böyle bir kullanıcı yok' uyarısı) */}
        {actionFeedback && (
          <div
            className={`mt-2 px-2 py-1.5 rounded-lg text-xs text-center border animate-in fade-in duration-200 ${
              actionFeedback.isError
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {actionFeedback.message}
          </div>
        )}
      </div>

      {/* 3. Bekleyen İstekler (Gelen) */}
      {pendingRequests.length > 0 && (
        <div className="p-3 border-b border-zinc-800/60 bg-amber-500/5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pendingRequests.length} Bekleyen İstek
          </div>
          <div className="space-y-1.5">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.friendshipId} className="flex items-center justify-between gap-2 p-2 bg-[#080C14]/60 rounded-lg border border-zinc-800/60">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-200 truncate">{req.senderUsername}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{req.senderEloRating} ELO</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => acceptRequest(req.friendshipId)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    title="Kabul Et"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => rejectRequest(req.senderId)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
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

      {/* 4. SOSYALLİK BARI: Tab Seçimi (Arkadaşlar / Liderlik) */}
      <div className="flex border-b border-zinc-800/60 bg-[#080C14]/60">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === "friends"
              ? "border-emerald-400 text-white bg-emerald-500/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Arkadaşlar ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === "leaderboard"
              ? "border-emerald-400 text-white bg-emerald-500/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Liderlik
        </button>
      </div>

      {/* 5. Liste İçeriği */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === "friends" ? (
          isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Henüz arkadaşın yok</p>
              <p className="text-[11px] text-zinc-600 mt-1">Yukarıdaki alandan kullanıcı adıyla ekleyebilirsin</p>
            </div>
          ) : (
            friends.map((friend) => {
              const statusDisplay = getStatusDisplay(friend.status);
              const isAvailableForDuel = friend.status === "çevrimiçi";

              return (
                <div
                  key={friend.id}
                  className="group p-2.5 rounded-xl bg-[#080C14]/60 border border-zinc-800/60 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                        {friend.username.substring(0, 2).toUpperCase()}
                      </div>
                      <Circle
                        className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 ${statusDisplay.dotClass}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200 truncate group-hover:text-white">
                          {friend.username}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 font-semibold">
                          {friend.eloRating}
                        </span>
                      </div>
                      {/* Sadece çevrimiçi / oyunda / çevrimdışı — lastseen yok */}
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs flex items-center gap-1 font-semibold"
                        title="1v1 Maça Davet Et"
                      >
                        <Swords className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Arkadaşı Sil"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          <LeaderboardTab />
        )}
      </div>

      {/* Alt Durum Çubuğu */}
      <div className="p-2.5 border-t border-zinc-800/60 bg-[#080C14] text-[11px] text-zinc-500 flex items-center justify-between font-mono">
        <span>Sunucu: TR-Istanbul</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Aktif
        </span>
      </div>
    </aside>
  );
}

/** Liderlik tablosu alt bileşeni — gerçek ELO sıralaması */
function LeaderboardTab() {
  const [topPlayers, setTopPlayers] = useState<
    { rank: number; username: string; eloRating: number; rankTier: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/leaderboard?limit=10")
      .then((r) => r.json())
      .then((data) => {
        const players = (data.users ?? []).map(
          (u: { username: string; eloRating: number; rankTier: string }, i: number) => ({
            rank: i + 1,
            username: u.username,
            eloRating: u.eloRating,
            rankTier: u.rankTier,
          })
        );
        setTopPlayers(players);
      })
      .catch(() => setTopPlayers([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {topPlayers.map((player) => (
        <div
          key={player.rank}
          className="p-2.5 rounded-xl bg-[#080C14]/60 border border-zinc-800/60 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black font-mono ${
                player.rank === 1
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : player.rank === 2
                  ? "bg-zinc-300/20 text-zinc-200 border border-zinc-400/40"
                  : player.rank === 3
                  ? "bg-orange-700/20 text-orange-300 border border-orange-600/40"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              #{player.rank}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">{player.username}</div>
              <div className="text-[10px] text-emerald-400 font-medium capitalize">
                {player.rankTier}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-400">
            {player.eloRating} ELO
          </span>
        </div>
      ))}
    </>
  );
}
