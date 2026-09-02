"use client";

import React from "react";
import Link from "next/link";
import { Zap, UserPlus, Infinity as InfinityIcon, Trophy, Flame, Shield, Sparkles, ArrowRight, Gavel } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ViewOptionSplitProps {
  onStartRanked: () => void;
  onOpenCustomRoom: () => void;
}

export function ViewOptionSplit({ onStartRanked, onOpenCustomRoom }: ViewOptionSplitProps) {
  return (
    <div className="flex-1 h-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden select-none">
      {/* SOL BÖLGE: DERECELİ ARENA (7 Kolon) */}
      <section className="lg:col-span-7 h-full flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#0D1522]/90 via-[#0B101B]/80 to-[#080C14] border border-emerald-500/30 p-7 relative overflow-hidden shadow-2xl shadow-emerald-950/20 group">
        {/* Arka Plan Glow & Saha Çizgileri */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-500" />
        <div className="absolute right-6 top-6 opacity-10 text-emerald-400 pointer-events-none">
          <Shield className="w-64 h-64" />
        </div>

        {/* Üst Bilgi Rozeti */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sezon 1: Scout Ligi</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            1v1 DERECELİ <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              FUTBOLCU DÜELLOSU
            </span>
          </h2>

          <p className="text-zinc-400 text-sm mt-3 max-w-md leading-relaxed">
            İki kulüp, tek ortak futbolcu. 5 saniyede takımını seç, rakibinle eşleş ve ortak yıldızı saniyeler içinde yazarak ELO puanını yükselt.
          </p>
        </div>

        {/* Orta İstatistik & Bilgi Kutusu */}
        <div className="relative z-10 grid grid-cols-3 gap-3 my-4 bg-[#080C14]/80 p-4 rounded-2xl border border-zinc-800/80">
          <div>
            <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Mevcut Rütbe</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Scout II
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Kazanım / Kayıp</div>
            <div className="text-sm font-bold text-zinc-200 font-mono mt-0.5">
              <span className="text-emerald-400">+25</span> / <span className="text-rose-400">-15</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Format</div>
            <div className="text-sm font-bold text-zinc-200 mt-0.5">5 Tur (İlk 3)</div>
          </div>
        </div>

        {/* Alt Ana Buton */}
        <div className="relative z-10 pt-2">
          <Button
            size="lg"
            variant="primary"
            onClick={onStartRanked}
            className="w-full h-14 text-base font-black uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black rounded-2xl"
          >
            <Zap className="w-5 h-5 fill-current" />
            Dereceli Maç Bul (1v1)
          </Button>
        </div>
      </section>

      {/* SAĞ BÖLGE: EĞLENCE & ÖZEL MODLAR (5 Kolon) */}
      <section className="lg:col-span-5 h-full flex flex-col gap-4 overflow-hidden">
        {/* Kart 1: Arkadaşınla Oyna */}
        <div
          onClick={onOpenCustomRoom}
          className="flex-1 rounded-2xl bg-[#0B101B]/80 border border-zinc-800 hover:border-emerald-500/40 p-5 flex flex-col justify-between cursor-pointer group transition-all duration-200 hover:bg-[#0D1522]/90 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Özel Lobi
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              Arkadaşınla Oyna
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Özel bir oda kodu oluştur veya arkadaşının paylaştığı odaya katılıp pratik yap.
            </p>
          </div>
          <div className="text-xs font-bold text-cyan-400 flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
            Oda Kur / Katıl <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Kart 2: Tek Kişilik Antrenman (Sandbox) */}
        <Link
          href="/sandbox"
          className="flex-1 rounded-2xl bg-[#0B101B]/80 border border-zinc-800 hover:border-amber-500/40 p-5 flex flex-col justify-between cursor-pointer group transition-all duration-200 hover:bg-[#0D1522]/90 relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <InfinityIcon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Sonsuz Mod
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
              Sonsuz Seri (Antrenman)
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Süre kısıtlaması olmadan rastgele kulüp kombinasyonlarıyla futbol hafızanı test et.
            </p>
          </div>
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1 mt-1 group-hover:translate-x-1 transition-transform">
            Antrenmana Başla <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Kart 3: Gelecek Mod Vitrini (Açık Arttırma) */}
        <div className="p-4 rounded-2xl bg-[#080C14]/70 border border-dashed border-zinc-800 flex items-center justify-between opacity-80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Açık Arttırma & Simülasyon</div>
              <div className="text-[10px] text-zinc-500">Çok yakında: 4-8 kişilik müzayede draftı</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            Yakında
          </span>
        </div>
      </section>
    </div>
  );
}
