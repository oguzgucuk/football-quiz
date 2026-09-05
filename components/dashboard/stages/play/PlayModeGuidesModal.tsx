"use client";

import React from "react";
import { X, Play, Lightbulb } from "lucide-react";

export type GuideInfo = {
  title: string;
  subtitle: string;
  goal: string;
  steps: string[];
  tip: string;
  mediaPlaceholder: string;
};

export const MODE_GUIDES: Record<string, GuideInfo> = {
  common_player: {
    title: "Ortak Oyuncu Modu",
    subtitle: "İki Takım Arasındaki Ortak Yıldızı Bul",
    goal: "Ekranda beliren 2 farklı kulüpte (örn: Real Madrid & Inter) kariyerinde forma giymiş ortak bir futbolcuyu rakibinden önce bulup yazmak.",
    steps: [
      "Tur başladığında iki kulübün logoları ve isimleri ekranda belirir.",
      "Input alanına aklına gelen ortak oyuncunun ismini yazmaya başla (Otomatik tamamlama önerileri sunar).",
      "Doğru futbolcuyu ilk yazıp Enter'a basan oyuncu turu ve puanı kazanır!",
    ],
    tip: "Sadece doğrudan transfer olanlar değil; kariyerinin herhangi bir döneminde (kiralık veya altyapı dahil) her iki kulüpte de oynamış oyuncular geçerlidir.",
    mediaPlaceholder: "Ortak Oyuncu Oynanış Rehberi (GIF / Video Yakında)",
  },
  grid: {
    title: "Millet-Takım Modu",
    subtitle: "Bir Oyuncu Millet, Diğeri Kulüp Söyler",
    goal: "Her tur bir oyuncu millet, diğeri kulüp belirler. O milletten olup o kulüpte forma giymiş futbolcuyu ilk yazan puanı kapar.",
    steps: [
      "İlk turda kimin milleti, kimin kulübü seçeceğine sistem adil kura ile karar verir.",
      "Her tur seçim rolleri sırayla değişir (1. tur sen millet rakip kulüp, 2. tur sen kulüp rakip millet).",
      "Kriterlere uyan (o milletten olup o kulüpte oynamış) futbolcuyu ilk yazan oyuncu turu kazanır.",
      "Toplam 5 tur üzerinden oynanır; en çok puan toplayan maçı kazanır!",
    ],
    tip: "Hızlı Maç ve Özel Oyun modunda serbestçe oynanır; ELO kaybı riski olmadan rekabet edebilirsin.",
    mediaPlaceholder: "Millet-Takım Oynanış Rehberi (Görsel Yakında)",
  },
  auction: {
    title: "Müzayede Modu",
    subtitle: "Canlı Açık Arttırma & Kadro Kurma",
    goal: "Sana verilen 100M€ bütçeyle açık arttırmaya çıkan dünya yıldızlarına pey sürüp en dengeli ilk 11'i kurmak.",
    steps: [
      "Her tur transfer pazarına rastgele dünya yıldızı bir futbolcu çıkar.",
      "Canlı sayaç geri sayarken diğer oyuncularla bütçeni yöneterek teklifleri artır.",
      "Süre bittiğinde en yüksek teklifi veren oyuncu kartı alır. 11 mevkiyi en uyumlu tamamlayan şampiyon olur!",
    ],
    tip: "Tüm bütçeni tek bir forvete harcama; savunma ve kaleci mevkileri zayıf kalırsa puan kaybedersin!",
    mediaPlaceholder: "Canlı Müzayede Oynanış Rehberi (GIF / Video Yakında)",
  },
};

interface PlayModeGuidesModalProps {
  guideKey: string | null;
  onClose: () => void;
}

export function PlayModeGuidesModal({ guideKey, onClose }: PlayModeGuidesModalProps) {
  if (!guideKey) return null;
  const guide = MODE_GUIDES[guideKey];
  if (!guide) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#0d1611]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white transition-all"
      >
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full mb-1">
              Oyun Rehberi
            </span>
            <h3 className="text-xl font-black tracking-tight text-white">
              {guide.title}
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {guide.subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-sm custom-scrollbar">
          <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-zinc-500 p-4 text-center">
            <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-2">
              <Play className="size-6 ml-0.5" />
            </div>
            <span className="text-xs font-bold text-zinc-400">
              {guide.mediaPlaceholder}
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <span className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider block mb-1">
              Mod Amacı
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              {guide.goal}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider block mb-2">
              Nasıl Oynanır? (Adım Adım)
            </span>
            <ul className="space-y-2 text-xs text-zinc-300">
              {guide.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-xs text-amber-200">
            <Lightbulb className="size-4 shrink-0 mt-0.5 text-amber-400" />
            <p className="leading-relaxed">
              <strong className="text-amber-300">Taktik İpucu:</strong> {guide.tip}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
