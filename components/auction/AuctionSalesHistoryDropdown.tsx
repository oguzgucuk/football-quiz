"use client";

/**
 * Müzayede Satış Geçmişi ve Son Satış Göstergesi Bileşeni.
 * - Üst çubukta tek satırda son satılan oyuncuyu ve alıcısını gösterir.
 * - Tıklandığında açılan saf React Dropdown ile geçmiş tüm satışları listeler.
 * - Deploy/SSR ve portal uyumludur, kütüphane bağımlılığı yoktur.
 */

import React, { useState, useRef, useEffect } from "react";
import { AuctionSoldEvent } from "@/lib/auction/auctionTypes";
import { ShoppingCart, ChevronDown, User } from "lucide-react";
import { getRatingTier } from "@/lib/game/playerRatingTiers";

interface AuctionSalesHistoryDropdownProps {
  sales: AuctionSoldEvent[];
}

export function AuctionSalesHistoryDropdown({ sales }: AuctionSalesHistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestSale = sales[0];

  // Dışarı tıklandığında veya ESC tuşuna basıldığında kapat
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!latestSale) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 select-none">
        <ShoppingCart className="w-3.5 h-3.5 text-zinc-500" />
        <span className="hidden sm:inline">Henüz satış yapılmadı</span>
        <span className="sm:hidden">Satış yok</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${isOpen ? "z-50" : "z-10"}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 text-xs text-zinc-100 transition-all cursor-pointer shadow-lg active:scale-98 group"
      >
        <span className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <span className="font-extrabold uppercase text-[10px] tracking-wider text-amber-400 font-mono hidden md:inline">
          Son Satış:
        </span>

        {/* Oyuncu Adı & Reyting */}
        <span className="font-black text-white truncate max-w-[110px] sm:max-w-[150px]">
          {latestSale.playerName}
        </span>

        <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">➔</span>

        {/* Alıcı */}
        <span className="font-bold text-emerald-300 truncate max-w-[90px] sm:max-w-[120px]">
          {latestSale.buyerUsername}
        </span>

        {/* Fiyat */}
        <span className="font-mono font-black text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-500/40 text-[11px]">
          ${latestSale.amount}M
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 p-3 rounded-2xl border border-zinc-700/80 bg-zinc-950/98 shadow-[0_16px_50px_rgba(0,0,0,0.9)] text-white z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                Satış Geçmişi
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-300 font-bold bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/50">
              {sales.length} Oyuncu Satıldı
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {sales.map((sale, idx) => {
              const tier = getRatingTier(sale.overall);
              return (
                <div
                  key={`${sale.playerName}_${sale.timestamp}_${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700 transition-colors gap-2"
                >
                  {/* Sol: Reyting & İsim */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`size-6 rounded-lg flex items-center justify-center font-mono text-[11px] font-black shrink-0 ${tier.badgeClass}`}
                    >
                      {sale.overall}
                    </span>
                    <span className="font-bold text-xs text-zinc-100 truncate">
                      {sale.playerName}
                    </span>
                  </div>

                  {/* Sağ: Alıcı & Fiyat */}
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <div className="flex items-center gap-1.5 bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-700/40">
                      <User className="w-3 h-3 text-zinc-400" />
                      <span className="font-bold text-xs truncate max-w-[85px] text-emerald-300">
                        {sale.buyerUsername}
                      </span>
                    </div>

                    <span className="text-xs font-black text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-md">
                      ${sale.amount}M
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

