"use client";

import React from "react";
import { X, Lightbulb, Tag, Sparkles, CheckCircle2 } from "lucide-react";
import { MODE_GUIDES } from "./playModeGuidesData";

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
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-guide-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#0d1611]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white transition-all flex flex-col max-h-[85vh]"
      >
        {/* Başlık */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full mb-1">
              Nasıl Oynanır?
            </span>
            <h2 id="mode-guide-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {guide.title}
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {guide.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* İçerik */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 text-sm custom-scrollbar flex-1">
          {/* Mod Amacı */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <span className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider block mb-1">
              Modun Amacı & Kazanma Şartı
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              {guide.goal}
            </p>
          </div>

          {/* Adım Adım Kurallar */}
          <div>
            <span className="text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider block mb-2">
              Adım Adım Oynanış
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

          {/* Yeni Eklenen Özellikler (Varsa) */}
          {guide.newFeatures && guide.newFeatures.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-400" />
                <span>Yeni Eklenen Özellikler (Yama 0.1)</span>
              </span>
              <ul className="space-y-1.5 text-xs text-zinc-200">
                {guide.newFeatures.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug text-[11px]">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Taktik İpucu */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-3.5 text-xs text-amber-200">
            <Lightbulb className="size-4 shrink-0 mt-0.5 text-amber-400" />
            <p className="leading-relaxed">
              <strong className="text-amber-300">Taktik İpucu:</strong> {guide.tip}
            </p>
          </div>

          {/* Anahtar Kelimeler */}
          <div className="pt-2 border-t border-white/10">
            <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Tag className="size-3 text-emerald-400" />
              <span>Anahtar Terimler</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {guide.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium text-zinc-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Alt Buton */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}
