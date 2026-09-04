"use client";

import React from "react";
import { Coins, Shield, Crown, Palette, Check, Loader2 } from "lucide-react";

export interface StoreItemDto {
  id: string;
  name: string;
  category: "frame" | "title" | "theme" | string;
  price: number;
  currency: "COIN" | "ALIM_COIN";
  description: string;
  previewColor?: string | null;
  badgeText?: string | null;
}

interface StoreItemCardProps {
  item: StoreItemDto;
  isOwned: boolean;
  isLoading: boolean;
  onBuy: (item: StoreItemDto) => void;
}

export function StoreItemCard({ item, isOwned, isLoading, onBuy }: StoreItemCardProps) {
  const isAcCurrency = item.currency === "ALIM_COIN";

  return (
    <div className="relative rounded-[24px] bg-white border border-[#e2e8e4] p-6 shadow-xs flex flex-col justify-between hover:border-[#bfe0cc] hover:shadow-sm transition-all group">
      <div>
        <div className="flex items-start justify-between mb-3">
          {/* Kategori İkonu */}
          <div
            className="flex size-12 items-center justify-center rounded-2xl border group-hover:scale-105 transition-transform"
            style={{
              backgroundColor: item.previewColor ? `${item.previewColor}15` : "#f5f8f6",
              borderColor: item.previewColor ? `${item.previewColor}30` : "#e2e8e4",
            }}
          >
            {item.category === "frame" && (
              <Shield
                className="size-6"
                style={{ color: item.previewColor || "#15803d" }}
              />
            )}
            {item.category === "title" && (
              <Crown
                className="size-6"
                style={{ color: item.previewColor || "#d97706" }}
              />
            )}
            {item.category === "theme" && (
              <Palette
                className="size-6"
                style={{ color: item.previewColor || "#0284c7" }}
              />
            )}
          </div>

          {/* Rozet Varsa */}
          {item.badgeText && (
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isAcCurrency
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {item.badgeText}
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-base text-[#141b16] tracking-tight mb-1">
          {item.name}
        </h3>
        <p className="text-xs text-[#6b7770] leading-relaxed">
          {item.description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-[#f0f4f2] flex items-center justify-between">
        {/* Fiyat ve Para Birimi */}
        <div className="flex items-center gap-1.5 font-mono font-black text-sm">
          {isAcCurrency ? (
            <div className="flex items-center gap-1.5">
              <span className="flex size-5 items-center justify-center rounded-md bg-emerald-600 text-white font-black text-[9px] shadow-xs">
                AC
              </span>
              <span className="text-emerald-700">{item.price.toLocaleString()} AC</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Coins className="size-4 fill-amber-500 text-amber-600" />
              <span className="text-[#141b16]">{item.price.toLocaleString()} Coin</span>
            </div>
          )}
        </div>

        {/* Aksiyon Butonu */}
        <button
          onClick={() => onBuy(item)}
          disabled={isOwned || isLoading}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            isOwned
              ? "bg-[#e8f3ed] text-[#15803d] border border-[#cbe4d4] cursor-default flex items-center gap-1.5"
              : isAcCurrency
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs active:scale-95 disabled:opacity-50"
              : "bg-[#15803d] text-white hover:bg-[#126d34] shadow-xs active:scale-95 disabled:opacity-50"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="size-3.5 animate-spin" />
              <span>İşleniyor</span>
            </div>
          ) : isOwned ? (
            <>
              <Check className="size-3.5 stroke-[3]" />
              <span>Kuşanıldı</span>
            </>
          ) : (
            "Satın Al"
          )}
        </button>
      </div>
    </div>
  );
}
