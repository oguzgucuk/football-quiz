"use client";

import React from "react";
import { Search, X, ArrowUpDown, Filter } from "lucide-react";

export type SortOption =
  | "rating_desc"
  | "rating_asc"
  | "age_asc"
  | "age_desc"
  | "name_asc"
  | "name_desc";

export type PositionGroup = "ALL" | "ATT" | "MID" | "DEF" | "GK";

interface PlayerFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  positionGroup: PositionGroup;
  onPositionGroupChange: (value: PositionGroup) => void;
  onlyPrime: boolean;
  onOnlyPrimeToggle: () => void;
}

export function PlayerFiltersBar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  positionGroup,
  onPositionGroupChange,
  onlyPrime,
  onOnlyPrimeToggle,
}: PlayerFiltersBarProps) {
  const positionTabs: { id: PositionGroup; label: string }[] = [
    { id: "ALL", label: "Tümü" },
    { id: "ATT", label: "Forvet" },
    { id: "MID", label: "Orta Saha" },
    { id: "DEF", label: "Defans" },
    { id: "GK", label: "Kaleci" },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0a120e]/85 backdrop-blur-md p-4 shadow-lg">
      {/* 1. Satır: İsimle Arama + Sıralama Seçimi */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Arama Inputu */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="İsimle ara (örn: Henry, Messi, Arda Güler, Ronaldinho)..."
            className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-9 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sıralama Açılır Menüsü */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-2 w-full sm:w-auto">
            <ArrowUpDown className="size-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-zinc-400 shrink-0 hidden md:inline">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Oyuncuları Sırala"
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="rating_desc" className="bg-zinc-900 text-white">🏆 Reyting (En Yüksek)</option>
              <option value="rating_asc" className="bg-zinc-900 text-white">📉 Reyting (En Düşük)</option>
              <option value="age_asc" className="bg-zinc-900 text-white">⚡ Yaş (En Genç)</option>
              <option value="age_desc" className="bg-zinc-900 text-white">👴 Yaş (En Yaşlı / Efsane)</option>
              <option value="name_asc" className="bg-zinc-900 text-white">🔤 İsim (A - Z)</option>
              <option value="name_desc" className="bg-zinc-900 text-white">🔡 İsim (Z - A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Satır: Pozisyon Sekmeleri + Sadece Prime Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
        {/* Pozisyon Grupları */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {positionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onPositionGroupChange(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                positionGroup === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sadece Prime Filtresi */}
        <button
          onClick={onOnlyPrimeToggle}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
            onlyPrime
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
              : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
          }`}
        >
          <Filter className="size-3" />
          <span>Sadece 67+ Prime Reytingliler</span>
        </button>
      </div>
    </div>
  );
}
