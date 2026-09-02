"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, UserPlus, Infinity as InfinityIcon, Shield, Gavel, ArrowLeft, Trophy, Swords, Sparkles, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ViewOptionClientProps {
  onStartRanked: () => void;
  onOpenCustomRoom: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewOptionClient({
  onStartRanked,
  onOpenCustomRoom,
  isOpen,
  onClose,
}: ViewOptionClientProps) {
  const [selectedTab, setSelectedTab] = useState<"ranked" | "casual">("ranked");

  // Eğer OYNA menüsü açık DEĞİLSE: Ana Lobi Vitrini
  if (!isOpen) {
    return (
      <div className="flex-1 h-full p-8 flex flex-col justify-between overflow-hidden select-none">
        {/* Üst Karşılama Bannerı */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0D1522] via-[#0B101B] to-[#080C14] border border-emerald-500/20 p-8 relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Günün Özel Eşleşmesi
            </div>
            <h2 className="text-3xl font-black text-white">
              Real Madrid <span className="text-emerald-400">vs</span> AC Milan
            </h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Her iki dev kulüpte de forma giymiş efsaneleri biliyor musun? (Örn: Kaká, Seedorf, Ronaldo Nazário, Essien, Theo Hernández...)
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 relative z-10">
            <div className="text-right">
              <div className="text-xs text-zinc-500 font-bold uppercase">Ödül</div>
              <div className="text-sm font-black text-amber-400">+50 Bonus ELO</div>
            </div>
          </div>
        </div>

        {/* Orta Mod Kartları Önizlemesi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-4">
          <div className="p-5 rounded-2xl bg-[#0B101B]/80 border border-zinc-800/80 hover:border-emerald-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Trophy className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Dereceli Sezonu</h4>
            <p className="text-xs text-zinc-400 mt-1">1v1 eşleşerek lig sıralamasında yüksel.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B101B]/80 border border-zinc-800/80 hover:border-cyan-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
              <UserPlus className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Özel Lobi</h4>
            <p className="text-xs text-zinc-400 mt-1">Arkadaşınla oda kodu üzerinden kapış.</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B101B]/80 border border-zinc-800/80 hover:border-purple-500/30 transition-all">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Gavel className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white">Açık Arttırma</h4>
            <p className="text-xs text-zinc-400 mt-1">Gelecek mod: Canlı transfer müzayedesi.</p>
          </div>
        </div>

        {/* Alt Çağrı Metni */}
        <div className="p-4 rounded-2xl bg-[#080C14] border border-zinc-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-300 font-medium">
              Sıraya girmek veya mod seçmek için sol üstteki <strong className="text-emerald-400">"OYNA"</strong> butonuna tıkla.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // OYNA Menüsü Açıldığında: LoL Tarzı Mod Seçici Ekranı
  return (
    <div className="flex-1 h-full p-8 flex flex-col justify-between overflow-hidden select-none bg-gradient-to-b from-[#0D1522]/90 to-[#080C14]">
      {/* Üst Sekmeler ve Geri Butonu */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Lobiye Dön
          </button>
          <span className="h-5 w-[1px] bg-zinc-800" />
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTab("ranked")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                selectedTab === "ranked"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Dereceli (Ranked)
            </button>
            <button
              onClick={() => setSelectedTab("casual")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                selectedTab === "casual"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <Swords className="w-4 h-4" />
              Eğlence & Özel Odalar
            </button>
          </div>
        </div>
      </div>

      {/* Seçilen Sekmenin İçeriği */}
      <div className="flex-1 py-6 flex items-center justify-center">
        {selectedTab === "ranked" ? (
          <div className="max-w-xl w-full text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20 animate-pulse">
              <Shield className="w-12 h-12" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">1v1 Dereceli Eşleşme</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Kendi ELO seviyene uygun rakiple eşleş, turları kazan ve sıralamada yüksel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left text-xs bg-[#0B101B] p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>5s Takım Seçimi</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>6 Büyük Avrupa Ligi</span>
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              onClick={onStartRanked}
              className="w-full max-w-sm h-14 text-base font-black uppercase tracking-wider shadow-xl shadow-emerald-500/30 rounded-2xl"
            >
              <Zap className="w-5 h-5 mr-2 fill-current" />
              Sıraya Gir (1v1)
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl w-full">
            <div
              onClick={onOpenCustomRoom}
              className="p-6 rounded-2xl bg-[#0B101B] border border-zinc-800 hover:border-cyan-500/40 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-48"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Arkadaşınla Oyna</h4>
                <p className="text-xs text-zinc-400 mt-1">Özel oda aç veya davet kodunu gir.</p>
              </div>
              <span className="text-xs font-bold text-cyan-400">Oda Başlat &rarr;</span>
            </div>

            <Link
              href="/sandbox"
              className="p-6 rounded-2xl bg-[#0B101B] border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between h-48"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <InfinityIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Sonsuz Seri (Sandbox)</h4>
                <p className="text-xs text-zinc-400 mt-1">Süresiz tek kişilik futbol hafızası testi.</p>
              </div>
              <span className="text-xs font-bold text-amber-400">Antrenman &rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
