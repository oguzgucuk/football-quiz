"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import { CheckCircle2, Search, Lock, Globe } from "lucide-react";
import { Nation } from "@/types/game";
import { POPULAR_NATIONS } from "@/lib/data/nations";

interface NationPickerProps {
  nations?: Nation[];
  selectedNation: Nation | null;
  onSelectNation: (nation: Nation) => void;
  disabled?: boolean;
}

export function NationPicker({
  nations = POPULAR_NATIONS,
  selectedNation,
  onSelectNation,
  disabled = false,
}: NationPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(nations, {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "englishName", weight: 0.3 },
        { name: "aliases", weight: 0.3 },
      ],
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [nations]);

  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.trim().length < 2) return [];
    const lowerQuery = inputValue.toLowerCase().trim();
    const results = fuse.search(inputValue, { limit: 20 });

    const scored = results.map((r) => {
      const textMatchScore = 1 - (r.score ?? 1);
      const normalizedPopularity = (r.item.popularityScore ?? 0) / 100;
      const lowerName = r.item.name.toLowerCase();
      const exactWordMatch = lowerName.startsWith(lowerQuery);
      const bonus = exactWordMatch ? 0.2 : 0;
      const finalScore = textMatchScore * 0.5 + normalizedPopularity * 0.3 + bonus;
      return { item: r.item, finalScore };
    });

    return scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 6)
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
            <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center font-mono font-black text-emerald-400 text-sm shadow-xs">
              {selectedNation.flagCode.toUpperCase()}
            </div>
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
              placeholder="Örn: Brezilya, Türkiye, İspanya, Fransa..."
              disabled={disabled}
              className="w-full py-4 pr-10 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none text-sm sm:text-base font-medium"
            />

            <div className="pr-4 text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
          </div>

          {/* Hızlı Seçim Hapları (En Popüler 6 Ülke) */}
          {!inputValue && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
              {nations.slice(0, 8).map((nation) => (
                <button
                  key={nation.id}
                  type="button"
                  onClick={() => handlePick(nation)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-950/50 hover:border-emerald-500/40 border border-white/10 text-xs text-zinc-300 hover:text-emerald-300 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="font-mono text-[10px] text-emerald-400 font-black">
                    {nation.flagCode.toUpperCase()}
                  </span>
                  <span>{nation.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-2 py-1.5 bg-[#0c1612]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-fadeIn">
              {suggestions.map((nation, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <li
                    key={nation.id}
                    onClick={() => handlePick(nation)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-4 py-3 cursor-pointer transition-all duration-150 flex items-center justify-between border-b border-white/5 last:border-0 ${
                      isSelected
                        ? "bg-emerald-500/20 text-white border-l-4 border-l-emerald-400 pl-3"
                        : "hover:bg-white/5 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-[10px] font-mono font-black text-emerald-400">
                        {nation.flagCode.toUpperCase()}
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? "text-emerald-300" : "text-zinc-100"}`}>
                        {nation.name}
                      </span>
                    </div>

                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/10 text-zinc-400">
                      {isSelected ? "Seç (Enter)" : "Seç"}
                    </span>
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
