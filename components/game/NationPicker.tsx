"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import { CheckCircle2, Search, Lock, Globe, AlertCircle } from "lucide-react";
import { Nation } from "@/types/game";
import { POPULAR_NATIONS } from "@/lib/data/nations";
import { NationFlag } from "@/components/ui/NationFlag";
import { normalizeText } from "@/lib/validation/normalizeText";

interface NationPickerProps {
  nations?: Nation[];
  selectedNation: Nation | null;
  onSelectNation: (nation: Nation) => void;
  disabled?: boolean;
  usedNationIds?: string[];
}

export function NationPicker({
  nations = POPULAR_NATIONS,
  selectedNation,
  onSelectNation,
  disabled = false,
  usedNationIds = [],
}: NationPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(nations, {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "englishName", weight: 0.3 },
        { name: "aliases", weight: 0.4 },
      ],
      includeScore: true,
      threshold: 0.38,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [nations]);

  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.trim().length < 2) return [];
    const lowerQuery = inputValue.toLowerCase().trim();
    const normalizedQuery = normalizeText(inputValue);

    const results = fuse.search(inputValue, { limit: 20 });
    const resultsNorm = normalizedQuery !== lowerQuery ? fuse.search(normalizedQuery, { limit: 20 }) : [];

    const uniqueMap = new Map<string, (typeof results)[0]>();
    for (const r of [...results, ...resultsNorm]) {
      const existing = uniqueMap.get(r.item.id);
      if (!existing || (r.score ?? 1) < (existing.score ?? 1)) {
        uniqueMap.set(r.item.id, r);
      }
    }

    const scored = Array.from(uniqueMap.values()).map((r) => {
      const textMatchScore = 1 - (r.score ?? 1);
      const normalizedPopularity = (r.item.popularityScore ?? 0) / 100;
      const lowerName = r.item.name.toLowerCase();
      const exactWordMatch = lowerName.startsWith(lowerQuery) || lowerName.startsWith(normalizedQuery);
      const bonus = exactWordMatch ? 0.3 : 0;
      const finalScore = textMatchScore * 0.5 + normalizedPopularity * 0.3 + bonus;
      return { item: r.item, finalScore };
    });

    return scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8)
      .map((s) => s.item);
  }, [fuse, inputValue]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    if (!selectedNation) {
      inputRef.current?.focus();
    }
  }, [selectedNation]);

  const handlePick = (nation: Nation) => {
    if (usedNationIds.includes(nation.id)) {
      setErrorMessage(`"${nation.name}" bu maç oturumunda daha önce seçildi!`);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    setErrorMessage(null);
    onSelectNation(nation);
    setInputValue(nation.name);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setIsDropdownOpen(true);
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setIsDropdownOpen(true);
        setSelectedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handlePick(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handlePick(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      <div className="text-center mb-4">
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Milletini Belirle
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Bu tur millet seçme sırası sende! Bir ülke yaz veya aşağıdaki önerilerden tıkla.
        </p>
      </div>

      {selectedNation ? (
        <div className="w-full p-4 rounded-2xl bg-[#0c1612]/95 border-2 border-emerald-500/80 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-between animate-scaleUp">
          <div className="flex items-center gap-3.5">
            <NationFlag
              flagCode={selectedNation.flagCode}
              name={selectedNation.name}
              size="lg"
              className="shadow-[0_0_20px_rgba(34,197,94,0.3)] border-emerald-500/50"
            />
            <div className="text-left">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                SEÇİLEN MİLLET
              </span>
              <span className="text-lg font-black text-white">
                {selectedNation.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Kilitlendi</span>
          </div>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="relative flex items-center rounded-2xl border border-white/10 bg-[#0c1612]/90 backdrop-blur-xl shadow-2xl focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-200">
            <div className="pl-4 pr-2 text-zinc-400">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>

            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Örn: Brezilya, Çin, Arnavutluk, Cezayir, İspanya, Nijerya..."
              disabled={disabled}
              className="w-full py-4 pr-10 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none text-sm sm:text-base font-medium"
            />

            <div className="pr-4 text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
          </div>

          {errorMessage && (
            <div className="mt-2 text-xs font-semibold text-rose-300 bg-rose-950/70 border border-rose-500/40 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 animate-fadeIn shadow-lg">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hızlı Seçim Hapları (En Popüler 8 Ülke) */}
          {!inputValue && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
              {nations.slice(0, 8).map((nation) => {
                const isUsed = usedNationIds.includes(nation.id);
                return (
                  <button
                    key={nation.id}
                    type="button"
                    onClick={() => handlePick(nation)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 group ${
                      isUsed
                        ? "bg-white/2 border-white/5 text-zinc-500 opacity-40 cursor-not-allowed line-through"
                        : "bg-white/5 hover:bg-emerald-950/50 hover:border-emerald-500/40 border-white/10 text-zinc-300 hover:text-emerald-300 cursor-pointer"
                    }`}
                  >
                    <NationFlag
                      flagCode={nation.flagCode}
                      name={nation.name}
                      size="xs"
                      className={isUsed ? "grayscale opacity-50" : "group-hover:scale-105 transition-transform"}
                    />
                    <span>{nation.name}</span>
                    {isUsed && <Lock className="w-2.5 h-2.5 text-zinc-500 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-2 py-1.5 bg-[#0c1612]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-fadeIn">
              {suggestions.map((nation, index) => {
                const isSelected = index === selectedIndex;
                const isUsed = usedNationIds.includes(nation.id);

                return (
                  <li
                    key={nation.id}
                    onClick={() => handlePick(nation)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-4 py-3 transition-all duration-150 flex items-center justify-between border-b border-white/5 last:border-0 ${
                      isUsed
                        ? "opacity-45 bg-zinc-900/40 cursor-not-allowed"
                        : isSelected
                        ? "bg-emerald-500/20 text-white border-l-4 border-l-emerald-400 pl-3 cursor-pointer"
                        : "hover:bg-white/5 text-zinc-300 hover:text-white cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <NationFlag
                        flagCode={nation.flagCode}
                        name={nation.name}
                        size="sm"
                        className={isUsed ? "grayscale opacity-50" : ""}
                      />
                      <span
                        className={`text-sm font-bold ${
                          isUsed ? "text-zinc-400 line-through" : isSelected ? "text-emerald-300" : "text-zinc-100"
                        }`}
                      >
                        {nation.name}
                      </span>
                    </div>

                    {isUsed ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300/90 border border-amber-500/20 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Kullanıldı</span>
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/10 text-zinc-400">
                        {isSelected ? "Seç (Enter)" : "Seç"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
