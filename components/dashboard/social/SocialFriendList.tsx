"use client";

import React from "react";
import { Circle, Swords, UserPlus, X } from "lucide-react";
import { Friend, PresenceStatus } from "@/hooks/useFriends";

interface SocialFriendListProps {
  friends: Friend[];
  isLoading: boolean;
  onQuickInvite?: (friendId: string, friendName: string) => void;
  onRemoveFriend: (friendId: string) => void;
}

export function SocialFriendList({
  friends,
  isLoading,
  onQuickInvite,
  onRemoveFriend,
}: SocialFriendListProps) {
  const getStatusDisplay = (status: PresenceStatus) => {
    switch (status) {
      case "oyunda":
        return {
          dotClass: "text-amber-500 fill-amber-500 animate-pulse",
          textClass: "text-amber-400 font-bold",
          label: "Oyunda",
        };
      case "çevrimiçi":
        return {
          dotClass: "text-emerald-500 fill-emerald-500",
          textClass: "text-emerald-400 font-semibold",
          label: "Çevrimiçi",
        };
      case "çevrimdışı":
      default:
        return {
          dotClass: "text-zinc-500 fill-zinc-500",
          textClass: "text-zinc-500 font-medium",
          label: "Çevrimdışı",
        };
    }
  };

  return (
    <>
      {/* Arkadaşlar Başlığı */}
      <div className="px-4 py-2.5 border-b border-white/10 bg-white/5 backdrop-blur-xs flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-white">
          Arkadaşlar
        </span>
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2 py-0.5 rounded-full">
          {friends.length}
        </span>
      </div>

      {/* Arkadaş Listesi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
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
                      className="p-1.5 rounded-lg bg-emerald-900/60 text-emerald-400 hover:bg-emerald-800 text-xs flex items-center gap-1 font-bold cursor-pointer transition-colors"
                      title="1v1 Maça Davet Et"
                    >
                      <Swords className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveFriend(friend.id)}
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
    </>
  );
}
