"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Trophy, Flame, UserPlus, Swords, Circle, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RightSocialSidebarProps {
  onQuickInvite?: (friendName: string) => void;
}

export function RightSocialSidebar({ onQuickInvite }: RightSocialSidebarProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "leaderboard">("friends");

  const friends = [
    { id: "1", name: "Emre_10", status: "online", activity: "Lobide Bekliyor", elo: 1340 },
    { id: "2", name: "BurakScout", status: "in_game", activity: "1v1 Maçta (2-1)", elo: 1480 },
    { id: "3", name: "CanTaktik", status: "online", activity: "Çevrimiçi", elo: 1190 },
    { id: "4", name: "Mert_FC", status: "offline", activity: "15dk önce aktifti", elo: 1050 },
  ];

  const topPlayers = [
    { rank: 1, name: "ScoutMaster", elo: 1890, tier: "Efsane" },
    { rank: 2, name: "TaktikDehası", elo: 1740, tier: "Usta" },
    { rank: 3, name: "TransferUzmanı", elo: 1680, tier: "Scout" },
  ];

  return (
    <aside className="w-80 h-full bg-[#0B101B]/95 border-l border-zinc-800/80 flex flex-col shrink-0 select-none z-20">
      {/* 1. ÜST: Kullanıcı Profil Kartı */}
      <div className="p-4 border-b border-zinc-800/60 bg-gradient-to-b from-emerald-950/20 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#080C14] rounded-[10px] flex items-center justify-center text-emerald-400 font-bold">
                <User className="w-6 h-6" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#080C14] rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white truncate">
                {user?.username || "Misafir Oyuncu"}
              </h3>
              <Link href="/profile" className="text-zinc-500 hover:text-emerald-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Scout
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {user?.eloRating || 1000} ELO
              </span>
            </div>
          </div>
        </div>

        {/* Seri ve İstatistik Çubuğu */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800/40">
          <div className="bg-[#080C14]/80 p-2 rounded-lg border border-zinc-800/60 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Seri</div>
              <div className="text-xs font-bold text-white font-mono">4 Galibiyet</div>
            </div>
          </div>
          <div className="bg-[#080C14]/80 p-2 rounded-lg border border-zinc-800/60 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Kazanma</div>
              <div className="text-xs font-bold text-white font-mono">%68 (32M)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ORTA: Aktif Parti / Lobi Kartı */}
      <div className="p-3 border-b border-zinc-800/60 bg-[#080C14]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Aktif Lobi (1/2)
          </span>
          <button className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <UserPlus className="w-3 h-3" />
            Davet Et
          </button>
        </div>
        <div className="flex items-center gap-2 p-2 bg-[#0D1522] rounded-lg border border-zinc-800">
          <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
            👑
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{user?.username || "Sen"} (Lider)</div>
            <div className="text-[10px] text-emerald-400">Hazır</div>
          </div>
        </div>
      </div>

      {/* 3. ALTI: Sekmeler (Arkadaşlar / Liderlik) */}
      <div className="flex border-b border-zinc-800/60 bg-[#080C14]/60">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === "friends"
              ? "border-emerald-400 text-white bg-emerald-500/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Arkadaşlar (4)
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex-1 py-2 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === "leaderboard"
              ? "border-emerald-400 text-white bg-emerald-500/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Liderlik (Top 3)
        </button>
      </div>

      {/* Liste İçeriği */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === "friends" ? (
          friends.map((friend) => (
            <div
              key={friend.id}
              className="group p-2.5 rounded-xl bg-[#080C14]/60 border border-zinc-800/60 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {friend.name.substring(0, 2).toUpperCase()}
                  </div>
                  <Circle
                    className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-current ${
                      friend.status === "online"
                        ? "text-emerald-400"
                        : friend.status === "in_game"
                        ? "text-amber-400"
                        : "text-zinc-600"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-200 truncate group-hover:text-white">
                    {friend.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">{friend.activity}</div>
                </div>
              </div>

              {friend.status === "online" && (
                <button
                  onClick={() => onQuickInvite?.(friend.name)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs flex items-center gap-1 shrink-0 font-semibold"
                  title="1v1 Düelloya Davet Et"
                >
                  <Swords className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        ) : (
          topPlayers.map((player) => (
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
                      : "bg-orange-700/20 text-orange-300 border border-orange-600/40"
                  }`}
                >
                  #{player.rank}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-200">{player.name}</div>
                  <div className="text-[10px] text-emerald-400 font-medium">{player.tier}</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-zinc-400">{player.elo} ELO</span>
            </div>
          ))
        )}
      </div>

      {/* Alt Durum Çubuğu */}
      <div className="p-2.5 border-t border-zinc-800/60 bg-[#080C14] text-[11px] text-zinc-500 flex items-center justify-between font-mono">
        <span>Sunucu: TR-Istanbul</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          18ms Ping
        </span>
      </div>
    </aside>
  );
}
