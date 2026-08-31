"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { Send, UserCheck, AlertCircle } from "lucide-react";
import { PlayerSearchItem } from "@/types/game";

interface PlayerAnswerInputProps {
  playerList: PlayerSearchItem[];
  onSubmitAnswer: (name: string) => void;
  isSubmitting?: boolean;
  hasErrorFeedback?: boolean;
  disabled?: boolean;
}

export function PlayerAnswerInput({
  playerList,
  onSubmitAnswer,
  isSubmitting = false,
  hasErrorFeedback = false,
  disabled = false,
}: PlayerAnswerInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(playerList, {
      keys: ["name"],
      threshold: 0.35,
      minMatchCharLength: 2,
    });
  }, [playerList]);

  const suggestions = useMemo(() => {
    if (!inputValue || inputValue.trim().length < 2) return [];
    return fuse.search(inputValue).slice(0, 6).map((res) => res.item);
  }, [fuse, inputValue]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    // Cevaplama aşaması başlar başlamaz fareye ihtiyaç olmadan doğrudan inputa odaklan
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasErrorFeedback) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue("");
      inputRef.current?.focus();
    }
  }, [hasErrorFeedback]);

  const handleSubmit = (nameToSubmit: string) => {
    const trimmed = nameToSubmit.trim();
    if (!trimmed || isSubmitting || disabled) return;
    onSubmitAnswer(trimmed);
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
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        setInputValue(suggestions[selectedIndex].name);
        handleSubmit(suggestions[selectedIndex].name);
      } else {
        handleSubmit(inputValue);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div
        className={`relative flex items-center rounded-2xl border transition-all duration-200 bg-zinc-900/90 backdrop-blur-md shadow-2xl ${
          hasErrorFeedback
            ? "border-rose-500/80 ring-2 ring-rose-500/30 animate-shake"
            : "border-zinc-800 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20"
        }`}
      >
        <div className="pl-4 pr-2 text-zinc-500">
          <UserCheck className="w-5 h-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="İki takımda da oynayan futbolcuyu yaz..."
          disabled={disabled || isSubmitting}
          className="w-full py-4 pr-12 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:outline-none text-base font-medium"
        />

        <button
          type="button"
          onClick={() => handleSubmit(inputValue)}
          disabled={!inputValue.trim() || disabled || isSubmitting}
          className="absolute right-3 p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-black font-bold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Cevabı Gönder"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {hasErrorFeedback && (
        <div className="flex items-center gap-1.5 mt-2 px-2 text-xs font-medium text-rose-400 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Yanlış cevap! Hızlıca yeni bir deneme yapabilirsin.</span>
        </div>
      )}

      {isDropdownOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 py-1.5 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/90 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
          {suggestions.map((player, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li
                key={player.id}
                onClick={() => {
                  setInputValue(player.name);
                  handleSubmit(player.name);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-4 py-2.5 cursor-pointer transition-all duration-150 text-sm font-medium flex items-center justify-between border-b border-zinc-800/40 last:border-0 ${
                  isSelected
                    ? "bg-emerald-500/20 text-white border-l-4 border-l-emerald-400 pl-3"
                    : "hover:bg-zinc-800/70 text-zinc-300 hover:text-white"
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className={isSelected ? "text-emerald-300 font-bold" : "text-zinc-100"}>
                    {player.name}
                  </span>
                  {(player.nationality || player.birthYear) && (
                    <span className="text-[11px] text-zinc-400 font-normal mt-0.5">
                      {[player.nationality, player.birthYear, player.position].filter(Boolean).join(" • ")}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-medium transition-colors ${
                    isSelected
                      ? "bg-emerald-500 text-zinc-950 font-bold"
                      : "text-zinc-500 font-normal"
                  }`}
                >
                  {isSelected ? "Gönder (Enter)" : "Seç & Gönder"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
