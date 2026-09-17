"use client";

import React, { useState } from "react";
import { Sparkles, Calendar, ChevronDown, ChevronUp, CheckCircle2, Flame, ShieldAlert } from "lucide-react";
import { PATCH_RELEASES, PatchRelease } from "./patchNotesData";

export function PatchNotesSection() {
  const [selectedPatch, setSelectedPatch] = useState<PatchRelease>(PATCH_RELEASES[0]);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });

  const toggleCategory = (index: number) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <section aria-labelledby="patch-notes-title" className="w-full space-y-4">
      {/* Başlık Alanı */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <h2 id="patch-notes-title" className="text-lg sm:text-xl font-black tracking-tight text-white">
              Yama Notları & Güncellemeler
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Oyuna eklenen yeni modlar, mekanik dengelemeleri ve sistem güncellemeleri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-black">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{selectedPatch.version}</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
            <Calendar className="size-3 text-zinc-500" />
            <span>{selectedPatch.releaseDate}</span>
          </span>
        </div>
      </div>

      {/* Yama Özeti Kartı */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#0c1a13] to-[#070f0b] border border-emerald-500/30 p-5 sm:p-6 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider border border-emerald-500/30">
              {selectedPatch.version}
            </span>
            <span className="text-sm sm:text-base font-black text-white">
              {selectedPatch.codeName}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
            {selectedPatch.highlightSummary}
          </p>
        </div>
      </div>

      {/* Kategorilere Ayrılmış Güncelleme Başlıkları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {selectedPatch.categories.map((cat, idx) => {
          const isExpanded = Boolean(expandedCategories[idx]);

          return (
            <div
              key={cat.title}
              className="rounded-2xl bg-[#0c1612]/75 border border-white/10 hover:border-emerald-500/30 transition-colors p-4 backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" role="img" aria-hidden="true">
                      {cat.icon}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300">
                      {cat.badge}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategory(idx)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    aria-label={isExpanded ? "Detayları gizle" : "Detayları göster"}
                  >
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>

                <h3 className="text-sm font-black text-white tracking-tight mb-1.5">
                  {cat.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed font-medium mb-3">
                  {cat.summary}
                </p>
              </div>

              {/* Detay Maddeleri (Katlanabilir) */}
              {isExpanded && (
                <div className="pt-2 border-t border-white/5 mt-auto">
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {cat.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug text-[11px] text-zinc-300">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
