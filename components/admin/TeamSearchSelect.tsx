"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { TeamBadge } from "../ui/TeamBadge";

export interface SelectedTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
  country?: string | null;
  league?: string | null;
}

interface TeamSearchSelectProps {
  onSelect: (team: SelectedTeam) => void;
  selectedTeam?: SelectedTeam | null;
  onClear?: () => void;
}

export function TeamSearchSelect({
  onSelect,
  selectedTeam,
  onClear,
}: TeamSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SelectedTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/teams/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.teams || []);
      } catch (err) {
        console.error("Team search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selectedTeam) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-zinc-800/80 border border-zinc-700/60 rounded-xl">
        <div className="flex items-center gap-2.5">
          <TeamBadge logoUrl={selectedTeam.logoUrl} name={selectedTeam.name} size="sm" />
          <div>
            <div className="text-sm font-semibold text-white">{selectedTeam.name}</div>
            <div className="text-xs text-zinc-400">
              {selectedTeam.league || selectedTeam.country || "Kulüp"}
            </div>
          </div>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Kulüp adı yazın (örn: Galatasaray, Real Madrid)..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 pl-9 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <Search className="size-4 text-zinc-500 absolute left-3 top-2.5" />
        {loading && (
          <Loader2 className="size-4 text-emerald-400 animate-spin absolute right-3 top-2.5" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1">
          {results.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                onSelect(team);
                setIsOpen(false);
                setQuery("");
              }}
              className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <TeamBadge logoUrl={team.logoUrl} name={team.name} size="sm" />
              <div>
                <div className="text-sm font-medium text-white">{team.name}</div>
                <div className="text-[11px] text-zinc-400">
                  {[team.league, team.country].filter(Boolean).join(" • ")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
