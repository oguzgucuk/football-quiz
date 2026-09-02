"use client";

import React, { useState } from "react";
import { friends, statusMeta } from "@/lib/game-data";
import { Search, UserPlus, Swords, MessageSquare, Coins, Gem } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface FriendsListProps {
  onQuickInvite?: (friendName: string) => void;
}

export function FriendsList({ onQuickInvite }: FriendsListProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = friends.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const online = filtered.filter((f) => f.status !== "offline");
  const offline = filtered.filter((f) => f.status === "offline");

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-[#e2e8e4] bg-white select-none shadow-sm h-full">
      {/* Üst Profil Bölümü */}
      <div className="flex flex-col gap-3 p-4 border-b border-[#e2e8e4] bg-[#f5f8f6] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#15803d] text-sm font-black text-white shadow-sm">
              SEN
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-[#15803d]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#141b16]">
              {user?.username ? `${user.username} #TR0` : "Sen #TR0"}
            </p>
            <p className="truncate text-xs font-semibold text-[#15803d]">
              {user?.eloRating ? `${user.eloRating} ELO` : "Elmas II"}
            </p>
          </div>
        </div>
        
        {/* Bakiye Bilgileri */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#e2e8e4] bg-white py-1.5 shadow-sm">
            <Coins className="size-3.5 text-amber-500 fill-amber-500/20" />
            <span className="text-[11px] font-bold text-[#141b16] font-mono">12.450</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#e2e8e4] bg-white py-1.5 shadow-sm">
            <Gem className="size-3.5 text-[#15803d]" />
            <span className="text-[11px] font-bold text-[#15803d] font-mono">{user?.eloRating || 340}</span>
          </div>
        </div>
      </div>

      {/* Üst Başlık & Arkadaş Ekle */}
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#141b16]">
          Arkadaşlar
          <span className="ml-2 text-[#15803d] font-mono">{online.length}</span>
        </h2>
        <button
          className="rounded-lg p-1.5 text-[#6b7770] transition-colors hover:bg-[#f0f4f2] hover:text-[#15803d]"
          title="Arkadaş Ekle"
        >
          <UserPlus className="size-4" />
        </button>
      </div>

      {/* Arama Kutusu */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#e2e8e4] bg-[#f0f4f2] px-2.5 py-1.5">
          <Search className="size-3.5 text-[#6b7770]" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Arkadaş ara..."
            className="w-full bg-transparent text-xs text-[#141b16] placeholder:text-[#6b7770] focus:outline-none"
          />
        </div>
      </div>

      {/* Arkadaş Listesi */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <p className="px-2 pb-1 pt-1 text-[10px] font-black uppercase tracking-wider text-[#6b7770]">
          Çevrimiçi — {online.length}
        </p>
        {online.map((f) => (
          <FriendRow key={f.id} friend={f} onInvite={onQuickInvite} />
        ))}

        <p className="px-2 pb-1 pt-3 text-[10px] font-black uppercase tracking-wider text-[#6b7770]">
          Çevrimdışı — {offline.length}
        </p>
        {offline.map((f) => (
          <FriendRow key={f.id} friend={f} muted />
        ))}
      </div>

    </aside>
  );
}

function FriendRow({
  friend,
  muted = false,
  onInvite,
}: {
  friend: (typeof friends)[number];
  muted?: boolean;
  onInvite?: (friendName: string) => void;
}) {
  const meta = statusMeta[friend.status];

  return (
    <div className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#f0f4f2] justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
              muted ? "bg-[#e2e8e4] text-[#6b7770]" : "bg-[#dcfce7] text-[#15803d]"
            }`}
          >
            {friend.name.slice(0, 2).toUpperCase()}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white ${meta.dot}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-bold ${muted ? "text-[#6b7770]" : "text-[#141b16]"}`}>
            {friend.name}
          </p>
          <p className={`truncate text-[10px] ${friend.status === "in-match" ? "text-[#15803d] font-semibold" : "text-[#6b7770]"}`}>
            {friend.activity}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {friend.rank && !muted && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7770] group-hover:hidden">
            {friend.rank}
          </span>
        )}
        {friend.status === "online" && onInvite && (
          <button
            onClick={() => onInvite(friend.name)}
            className="hidden group-hover:flex p-1 rounded-md bg-[#15803d]/10 text-[#15803d] hover:bg-[#15803d]/20 text-xs items-center gap-1 font-semibold"
            title="1v1 Maça Davet Et"
          >
            <Swords className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
