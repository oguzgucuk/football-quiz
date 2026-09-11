"use client";

import React from "react";
import { Edit3, ChevronLeft, ChevronRight, Users, Shield } from "lucide-react";
import { RatingBadge } from "../ui/RatingBadge";
import { TeamBadge } from "../ui/TeamBadge";

export interface AdminPlayerListItem {
  id: string;
  fullName: string;
  position: string | null;
  positions: string[];
  overallPrime: number | null;
  popularityScore: number;
  nationality: string | null;
  birthDate: string | null;
  teamsHistory: Array<{
    seasonStart: number | null;
    seasonEnd: number | null;
    team: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
  }>;
}

interface PlayerListTableProps {
  players: AdminPlayerListItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onEditPlayer: (player: AdminPlayerListItem) => void;
}

export function PlayerListTable({
  players,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onEditPlayer,
}: PlayerListTableProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
        <span className="text-sm">Oyuncular yükleniyor...</span>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-16 flex flex-col items-center justify-center text-zinc-400 gap-2 text-center">
        <Users className="size-10 text-zinc-600 mb-2" />
        <span className="text-base font-semibold text-white">Eşleşen Oyuncu Bulunamadı</span>
        <span className="text-xs text-zinc-500">Arama kriterlerinizi değiştirerek tekrar deneyin.</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950/80 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-3.5 px-4 w-16 text-center">Reyting</th>
              <th className="py-3.5 px-4">Oyuncu</th>
              <th className="py-3.5 px-4 w-28">Mevkiler</th>
              <th className="py-3.5 px-4">Son Kulüpleri</th>
              <th className="py-3.5 px-4 w-24 text-center">Popülerlik</th>
              <th className="py-3.5 px-4 w-24 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {players.map((p) => {
              const birthYear = p.birthDate ? new Date(p.birthDate).getFullYear() : null;

              return (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 text-center">
                    <RatingBadge rating={p.overallPrime} size="sm" />
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-white text-sm">{p.fullName}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <span>{p.nationality || "Belirtilmemiş"}</span>
                      {birthYear && <span>• {birthYear}</span>}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1">
                      {p.position && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                          {p.position}
                        </span>
                      )}
                      {p.positions
                        ?.filter((pos) => pos !== p.position)
                        .slice(0, 2)
                        .map((pos) => (
                          <span
                            key={pos}
                            className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {pos}
                          </span>
                        ))}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {p.teamsHistory.length > 0 ? (
                        p.teamsHistory.map((h, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 bg-zinc-950/60 border border-zinc-800 px-2 py-1 rounded-lg"
                            title={`${h.team.name} (${h.seasonStart || "?"}-${h.seasonEnd || "Devam"})`}
                          >
                            <TeamBadge logoUrl={h.team.logoUrl} name={h.team.name} size="sm" />
                            <span className="text-xs font-medium text-zinc-300 max-w-[120px] truncate">
                              {h.team.name}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {h.seasonStart || "?"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-600 italic">Kulüp geçmişi yok</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="text-xs font-mono font-semibold text-zinc-300">
                      {p.popularityScore}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onEditPlayer(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-slate-950 text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Düzenle</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="bg-zinc-950/80 px-4 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div>
          Toplam <span className="text-white font-semibold">{totalCount.toLocaleString()}</span> oyuncu
          (Sayfa {page} / {totalPages || 1})
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-2 font-mono font-semibold text-white">{page}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-white transition-all cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
