"use client";

import React, { useState } from "react";
import { Search, UserPlus, RefreshCw, Filter, CheckCircle, AlertCircle } from "lucide-react";

const POSITIONS = [
  "Tümü",
  "ST",
  "CF",
  "RW",
  "LW",
  "CAM",
  "CM",
  "CDM",
  "CB",
  "LB",
  "RB",
  "GK",
];

interface PlayerSearchFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  position: string;
  onPositionChange: (val: string) => void;
  minRating: string;
  onMinRatingChange: (val: string) => void;
  maxRating: string;
  onMaxRatingChange: (val: string) => void;
  onAddNewPlayer: () => void;
  onApplyFilters: () => void;
}

export function PlayerSearchFilter({
  search,
  onSearchChange,
  position,
  onPositionChange,
  minRating,
  onMinRatingChange,
  maxRating,
  onMaxRatingChange,
  onAddNewPlayer,
  onApplyFilters,
}: PlayerSearchFilterProps) {
  const [reindexing, setReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleReindex = async () => {
    if (reindexing) return;
    setReindexing(true);
    setReindexMsg(null);

    try {
      const res = await fetch("/api/admin/reindex", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setReindexMsg({ text: "İndeks başarıyla güncellendi!" });
      } else {
        setReindexMsg({ text: data.error || "İndeksleme başarısız", isError: true });
      }
    } catch {
      setReindexMsg({ text: "Bağlantı hatası", isError: true });
    } finally {
      setReindexing(false);
      setTimeout(() => setReindexMsg(null), 4000);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm mb-6 space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
            placeholder="Oyuncu adı veya uyruk ara (örn: Icardi, Modric, Arda, Türkiye)..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
          />
          <Search className="size-4 text-zinc-500 absolute left-3.5 top-3" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onApplyFilters}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="size-3.5" />
            <span>Filtrele</span>
          </button>

          <button
            type="button"
            onClick={onAddNewPlayer}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="size-3.5" />
            <span>Yeni Oyuncu Ekle</span>
          </button>

          <button
            type="button"
            onClick={handleReindex}
            disabled={reindexing}
            title="Oyun içi arama indeksini (players-index.json) yeniler"
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 hover:text-white text-xs font-medium py-2.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${reindexing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{reindexing ? "İndeksleniyor..." : "İndeksi Yenile"}</span>
          </button>
        </div>
      </div>

      {reindexMsg && (
        <div
          className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
            reindexMsg.isError
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {reindexMsg.isError ? <AlertCircle className="size-3.5" /> : <CheckCircle className="size-3.5" />}
          <span>{reindexMsg.text}</span>
        </div>
      )}

      {/* Position and Rating filters */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800/80 text-xs">
        <span className="text-zinc-400 font-medium">Mevki:</span>
        <div className="flex flex-wrap items-center gap-1">
          {POSITIONS.map((pos) => {
            const isSelected = (pos === "Tümü" && !position) || position === pos;
            return (
              <button
                key={pos}
                type="button"
                onClick={() => {
                  onPositionChange(pos === "Tümü" ? "" : pos);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto text-zinc-400">
          <span>Reyting:</span>
          <input
            type="number"
            min="40"
            max="99"
            placeholder="Min"
            value={minRating}
            onChange={(e) => onMinRatingChange(e.target.value)}
            className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-emerald-500"
          />
          <span>-</span>
          <input
            type="number"
            min="40"
            max="99"
            placeholder="Max"
            value={maxRating}
            onChange={(e) => onMaxRatingChange(e.target.value)}
            className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
