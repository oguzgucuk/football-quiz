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
      className={`relative rounded-[26px] p-6 transition-all flex flex-col justify-between border backdrop-blur-xl ${
        isHighValue
          ? "bg-gradient-to-b from-[#13281d]/90 via-[#0c1612]/90 to-[#0c1612]/95 border-emerald-500/60 shadow-[0_0_30px_rgba(34,197,94,0.18)] ring-1 ring-emerald-500/30"
          : "bg-[#0c1612]/80 border-white/10 shadow-lg hover:border-emerald-500/40 hover:bg-[#0c1612]/90"
      }`}
    >
      {/* Üst Rozet */}
      {pkg.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-wider uppercase shadow-md shadow-emerald-500/30">
            <Sparkles className="size-3" />
            <span>{pkg.badge}</span>
          </span>
        </div>
      )}

      <div>
        {/* Paket Başlığı */}
        <div className="text-center mb-4 mt-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            {pkg.description}
          </span>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-500 text-white font-black text-xs shadow-sm">
              AC
            </span>
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {pkg.totalAc.toLocaleString()}
            </span>
            <span className="text-sm font-black text-emerald-400">AC</span>
          </div>

          {pkg.bonusAmount > 0 && (
            <p className="text-[11px] font-bold text-emerald-400 mt-1">
              ({pkg.acAmount} Temel + {pkg.bonusAmount} Bonus AC)
            </p>
          )}
        </div>

        {/* Avantaj Listesi */}
        <div className="space-y-2.5 py-3 border-y border-white/10 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            <span>Anında oyuncu hesabına tanımlanır</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            <span>Özel unvan ve VIP temalar için geçerlidir</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
            <span>3D Secure & Güvenli Ödeme Koruması</span>
          </div>
        </div>
      </div>

      {/* Alt Fiyat ve Buton */}
      <div className="mt-6 pt-2">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-zinc-400 font-bold">Toplam Fiyat</span>
          <span className="text-2xl font-black font-mono text-white">
            {pkg.priceTry.toFixed(2).replace(".", ",")} ₺
          </span>
        </div>

        <button
          onClick={() => onCheckout(pkg)}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isHighValue
              ? "bg-[#15803d] hover:bg-[#126d34] text-white shadow-md shadow-emerald-900/40 active:scale-98"
              : "bg-white/10 hover:bg-white/15 text-white border border-white/15 active:scale-98"
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
