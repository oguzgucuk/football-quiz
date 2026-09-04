"use client";

import React from "react";
import { Sparkles, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { ACPackage } from "@/lib/db/storeCatalog";

interface AcPackageCardProps {
  pkg: ACPackage;
  isLoading: boolean;
  onCheckout: (pkg: ACPackage) => void;
}

export function AcPackageCard({ pkg, isLoading, onCheckout }: AcPackageCardProps) {
  const isHighValue = pkg.totalAc >= 1200;

  return (
    <div
      className={`relative rounded-[26px] p-6 transition-all flex flex-col justify-between border ${
        isHighValue
          ? "bg-gradient-to-b from-white via-emerald-50/30 to-emerald-100/40 border-emerald-300 shadow-md ring-2 ring-emerald-500/20"
          : "bg-white border-[#e2e8e4] shadow-xs hover:border-emerald-300"
      }`}
    >
      {/* Üst Rozet */}
      {pkg.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
            <Sparkles className="size-3" />
            <span>{pkg.badge}</span>
          </span>
        </div>
      )}

      <div>
        {/* Paket Başlığı */}
        <div className="text-center mb-4 mt-1">
          <span className="text-xs font-bold text-[#6b7770] uppercase tracking-wider block">
            {pkg.description}
          </span>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs">
              AC
            </span>
            <span className="text-3xl font-black text-[#141b16] font-mono tracking-tight">
              {pkg.totalAc.toLocaleString()}
            </span>
            <span className="text-sm font-black text-emerald-700">AC</span>
          </div>

          {pkg.bonusAmount > 0 && (
            <p className="text-[11px] font-bold text-emerald-600 mt-1">
              ({pkg.acAmount} Temel + {pkg.bonusAmount} Bonus AC)
            </p>
          )}
        </div>

        {/* Avantaj Listesi */}
        <div className="space-y-2 py-3 border-y border-[#f0f4f2] text-xs text-[#525f56]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
            <span>Anında oyuncu hesabına tanımlanır</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
            <span>Özel unvan ve VIP temalar için geçerlidir</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
            <span>3D Secure & Güvenli Ödeme Koruması</span>
          </div>
        </div>
      </div>

      {/* Alt Fiyat ve Buton */}
      <div className="mt-6 pt-2">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-[#6b7770] font-bold">Toplam Fiyat</span>
          <span className="text-2xl font-black font-mono text-[#141b16]">
            {pkg.priceTry.toFixed(2).replace(".", ",")} ₺
          </span>
        </div>

        <button
          onClick={() => onCheckout(pkg)}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isHighValue
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 active:scale-98"
              : "bg-[#141b16] hover:bg-[#253028] text-white shadow-xs active:scale-98"
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>İşlem Yapılıyor...</span>
            </>
          ) : (
            <>
              <CreditCard className="size-4" />
              <span>Satın Al & Yükle</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
