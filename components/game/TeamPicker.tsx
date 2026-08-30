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
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(teams, {
      keys: ["name"],
      threshold: 0.35,
      minMatchCharLength: 2,
    });
  }, [teams]);

  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.trim().length < 2) return [];
    return fuse.search(inputValue).slice(0, 6).map((res) => res.item);
  }, [fuse, inputValue]);

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
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        handlePick(suggestions[0]);
      } else if (inputValue.trim().length > 0) {
        const exactMatch = teams.find(
          (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()
        );
        if (exactMatch) handlePick(exactMatch);
      }
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
              {suggestions.map((team) => (
                <li
                  key={team.id}
                  onClick={() => handlePick(team)}
                  className="px-4 py-3 hover:bg-zinc-800/80 text-zinc-200 hover:text-white cursor-pointer transition-colors duration-150 flex items-center justify-between border-b border-zinc-800/40 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-zinc-100 block">{team.name}</span>
                      <span className="text-xs text-zinc-400">
                        {team.league} • {team.country}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    Seç
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
