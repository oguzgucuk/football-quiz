"use client";

import React, { useEffect } from "react";
import { X, HelpCircle, Lightbulb, Tag, CheckCircle2 } from "lucide-react";
import { TAB_INFO_MAP, TabInfoContent } from "./tabInfoData";
import { DashboardTab } from "./types";

interface TabInfoModalProps {
  tab: DashboardTab | null;
  onClose: () => void;
}

export function TabInfoModal({ tab, onClose }: TabInfoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (tab) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tab, onClose]);

  if (!tab) return null;
  const info: TabInfoContent = TAB_INFO_MAP[tab];
  if (!info) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tab-info-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#0d1611]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white transition-all flex flex-col max-h-[85vh]"
      >
        {/* Üst Kısım: Başlık & Rozet */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                <HelpCircle className="size-3 text-emerald-400" />
                <span>{info.badge}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-zinc-400">
                Sekme: {info.tabLabel}
              </span>
            </div>

            <h2 id="tab-info-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {info.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1 leading-snug">
              {info.subtitle}
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

        {/* Kaydırılabilir İçerik Alanı */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 text-sm">
          {/* Genel Açıklama */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
            {info.description}
          </div>

          {/* Öne Çıkan Özellikler */}
          <div>
            <span className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider block mb-2.5">
              Bu Sekmede Neler Var?
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {info.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors"
                >
                  <span className="text-xl shrink-0" role="img" aria-hidden="true">
                    {feat.icon}
                  </span>
                  <div>
                    <h3 className="text-xs font-black text-white">{feat.title}</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Taktik İpucu */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-3.5 text-xs text-amber-200">
            <Lightbulb className="size-4 shrink-0 mt-0.5 text-amber-400" />
            <p className="leading-relaxed">
              <strong className="text-amber-300">İpucu:</strong> {info.tips}
            </p>
          </div>

          {/* Anahtar Kelimeler (SEO & Hızlı Tarama) */}
          <div className="pt-2 border-t border-white/10">
            <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 mb-2">
              <Tag className="size-3 text-emerald-400" />
              <span>İlgili Başlıklar & Anahtar Kelimeler</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {info.keywords.map((kw, idx) => (
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

        {/* Alt Kapat Düğmesi */}
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
