"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import { Shield, CheckCircle2, Search, Lock } from "lucide-react";
import { Team } from "@/types/game";

interface TeamPickerProps {
  teams: Team[];
  selectedTeam: Team | null;
  onSelectTeam: (team: Team) => void;
  disabled?: boolean;
}

export function TeamPicker({
  teams,
  selectedTeam,
  onSelectTeam,
  disabled = false,
}: TeamPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(teams, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "aliases", weight: 0.3 },
      ],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [teams]);

  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.trim().length < 2) return [];
    const lowerQuery = inputValue.toLowerCase().trim();
    const results = fuse.search(inputValue, { limit: 30 });

    const scored = results.map((r) => {
      const textMatchScore = 1 - (r.score ?? 1);
      const normalizedPopularity = (r.item.popularityScore ?? 0) / 100;

      const lowerName = r.item.name.toLowerCase();
      const words = lowerName.split(/\s+/);
      const exactWordMatch = words.some((w) => w.startsWith(lowerQuery));
      const containsBonus = lowerName.includes(lowerQuery) ? 0.2 : 0;
      const wordBonus = exactWordMatch ? 0.15 : 0;

      const finalScore = textMatchScore * 0.4 + normalizedPopularity * 0.4 + wordBonus + containsBonus;
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
    if (!selectedTeam) {
      inputRef.current?.focus();
    }
  }, [selectedTeam]);

  const handlePick = (team: Team) => {
    onSelectTeam(team);
    setInputValue(team.name);
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
      } else if (inputValue.trim().length > 0) {
        const exactMatch = teams.find(
          (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()
        );
        if (exactMatch) handlePick(exactMatch);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto text-center animate-fadeIn">
      <div className="mb-6">
        <h3 className="text-2xl font-black text-white tracking-tight">
          Takımını Yaz (5 Saniye)
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          İstediğin kulübü yaz ve seç — seçimler süre dolana kadar gizli kalır!
        </p>
      </div>

      {selectedTeam ? (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/80 flex flex-col items-center justify-center animate-fadeIn shadow-xl shadow-emerald-500/10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Takımın Kilitlendi
            </span>
          </div>
          <h4 className="text-2xl font-extrabold text-white">{selectedTeam.name}</h4>
          <span className="text-xs text-zinc-400 mt-1">
            {selectedTeam.league} • {selectedTeam.country}
          </span>
          <span className="text-[11px] text-zinc-500 mt-4 animate-pulse">
            Süre bitince rakibin takımıyla karşılıklı açılacak...
          </span>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="relative flex items-center rounded-2xl border border-zinc-700 bg-zinc-900/90 backdrop-blur-xl shadow-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
            <div className="pl-4 pr-2 text-zinc-400">
              <Search className="w-5 h-5" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Kulüp adı yaz (örn: Real Madrid, Fenerbahçe, Boca...)"
              disabled={disabled}
              className="w-full py-4 pr-4 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none text-base font-semibold"
            />
          </div>

          {isDropdownOpen && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-2 py-2 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden text-left animate-fadeIn">
              {suggestions.map((team, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <li
                    key={team.id}
                    onClick={() => handlePick(team)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-4 py-3 cursor-pointer transition-all duration-150 flex items-center justify-between border-b border-zinc-800/40 last:border-0 ${
                      isSelected
                        ? "bg-emerald-500/20 text-white border-l-4 border-l-emerald-400 pl-3"
                        : "hover:bg-zinc-800/80 text-zinc-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isSelected ? "bg-emerald-500/30 text-emerald-300" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className={`font-bold text-sm block ${
                            isSelected ? "text-emerald-300" : "text-zinc-100"
                          }`}
                        >
                          {team.name}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {team.league} • {team.country}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-emerald-500 text-zinc-950 font-bold"
                          : "text-emerald-400 bg-emerald-500/10"
                      }`}
                    >
                      Seç (Enter)
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
