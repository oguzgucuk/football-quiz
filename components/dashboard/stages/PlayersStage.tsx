"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Database, Sparkles, Loader2, SearchX } from "lucide-react";
import { PlayerCard, PlayerCardData } from "@/components/players/PlayerCard";
import {
  PlayerFiltersBar,
  SortOption,
  PositionGroup,
} from "@/components/players/PlayerFiltersBar";
import { PlayerPagination } from "@/components/players/PlayerPagination";

interface PlayersStageProps {
  onBackToPlay?: () => void;
}

export function PlayersStage({ onBackToPlay }: PlayersStageProps = {}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("rating_desc");
  const [positionGroup, setPositionGroup] = useState<PositionGroup>("ALL");
  const [onlyPrime, setOnlyPrime] = useState(true);
  const [page, setPage] = useState(1);

  const [players, setPlayers] = useState<PlayerCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Arama metnini 300ms gecikmeyle tetikle
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Yeni aramada 1. sayfaya dön
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Sıralama veya filtre değişince 1. sayfaya dön
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handlePositionGroupChange = (newGroup: PositionGroup) => {
    setPositionGroup(newGroup);
    setPage(1);
  };

  const handleOnlyPrimeToggle = () => {
    setOnlyPrime((prev) => !prev);
    setPage(1);
  };

  // Veri Çekme
  const fetchPlayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "24",
        sortBy,
        positionGroup,
        onlyPrime: onlyPrime.toString(),
      });
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }

      const res = await fetch(`/api/players?${params.toString()}`);
      if (!res.ok) throw new Error("Veriler yüklenemedi");
      const data = await res.json();

      setPlayers(data.players || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Oyuncu verileri alınırken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, sortBy, positionGroup, onlyPrime, page]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return (
    <div className="h-full w-full overflow-y-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
      {/* 1. Başlık & Tanıtım Rozeti */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Database className="size-4" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Futbolcu Veritabanı
            </h1>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
              <Sparkles className="size-3 text-emerald-400" />
              {total.toLocaleString()} Oyuncu
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            2004–2025 kesintisiz video oyunu arşivlerinden derlenmiş kariyer zirve reytingleri ve mevkiler.
          </p>
        </div>

        {onBackToPlay && (
          <button
            onClick={onBackToPlay}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer border border-white/10 shadow-xs self-start sm:self-auto"
          >
            <span>← Oyna Menüsüne Dön</span>
          </button>
        )}
      </div>

      {/* 2. Filtre ve Arama Çubuğu */}
      <PlayerFiltersBar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        positionGroup={positionGroup}
        onPositionGroupChange={handlePositionGroupChange}
        onlyPrime={onlyPrime}
        onOnlyPrimeToggle={handleOnlyPrimeToggle}
      />

      {/* 3. Oyuncu Kartları Grid / Yüklenme / Boş Durum */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-white/5 bg-white/5 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-2.5 w-14 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-4 w-3/4 bg-white/10 rounded" />
              <div className="h-6 w-full bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <p className="text-sm font-bold text-rose-400">{error}</p>
          <button
            onClick={fetchPlayers}
            className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Yeniden Dene
          </button>
        </div>
      ) : players.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-white/5 bg-white/5">
          <SearchX className="size-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-bold text-white">Eşleşen Oyuncu Bulunamadı</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Arama terimini değiştirebilir veya filtreleri sıfırlayabilirsiniz.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setPositionGroup("ALL");
              setOnlyPrime(true);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      {/* 4. Sayfalama Kontrolü */}
      {!isLoading && players.length > 0 && (
        <PlayerPagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={24}
          onPageChange={(newPage) => {
            setPage(newPage);
            // Sayfa başına kaydır
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
}
