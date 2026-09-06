"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PlayerPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function PlayerPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PlayerPaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Sayfa numarası butonlarını akıllıca oluştur (1 ... 4 5 6 ... 750)
  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    const pages: (number | string)[] = [1];
    if (range.length > 0 && range[0] > 2) {
      pages.push("...");
    }
    pages.push(...range);
    if (range.length > 0 && range[range.length - 1] < totalPages - 1) {
      pages.push("...");
    }
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs">
      {/* Sol: Sayaç Bilgisi */}
      <span className="text-zinc-400 font-medium">
        Toplam <strong className="text-white font-mono">{total.toLocaleString()}</strong> oyuncudan{" "}
        <strong className="text-white font-mono">{start} - {end}</strong> arası gösteriliyor
      </span>

      {/* Sağ: Sayfalama Düğmeleri */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="İlk Sayfa"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Önceki Sayfa"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((p, idx) =>
            typeof p === "number" ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  page === p
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-zinc-500 font-mono">
                {p}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Sonraki Sayfa"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Son Sayfa"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
