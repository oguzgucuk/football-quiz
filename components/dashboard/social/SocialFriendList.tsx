"use client";

import React from "react";
import { Circle, Swords, UserPlus, X, Loader2 } from "lucide-react";
import { Friend, PresenceStatus } from "@/hooks/useFriends";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      <div className="px-4 py-2.5 border-b border-white/10 bg-black/20 backdrop-blur-xs flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-white">
          Arkadaşlar
        </span>
        <span className="bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 text-[11px] font-black px-2 py-0.5 rounded-full font-mono">
          {friends.length}
        </span>
      </div>

      {/* Arkadaş Listesi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-emerald-400" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-black/25 border border-dashed border-white/10">
            <UserPlus className="size-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-white">Henüz arkadaşın yok</p>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px] mx-auto">
              Yukarıdaki arama çubuğundan kullanıcı adıyla arkadaş ekleyebilirsin.
            </p>
          </div>
        ) : (
          friends.map((friend) => {
            const statusDisplay = getStatusDisplay(friend.status);
            const isAvailableForDuel = friend.status === "çevrimiçi";
            const initials = friend.username.substring(0, 2).toUpperCase();

            return (
              <div
                key={friend.id}
                className="group p-2.5 rounded-2xl bg-black/30 backdrop-blur-xs border border-white/10 hover:border-emerald-500/40 hover:bg-black/50 transition-all flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar className="size-8 rounded-xl border border-white/10">
                      <AvatarFallback className="rounded-xl bg-emerald-950/70 text-emerald-400 font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Circle
                      className={`size-2.5 absolute -bottom-0.5 -right-0.5 ${statusDisplay.dotClass}`}
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
                      className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/80 text-xs flex items-center gap-1 font-bold cursor-pointer transition-colors shadow-xs"
                      title="1v1 Maça Davet Et"
                    >
                      <Swords className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveFriend(friend.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                    title="Arkadaşı Sil"
                  >
                    <X className="size-3.5" />
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
