"use client";

import React from "react";
import { Team } from "@/types/game";
import { Shield, CheckCircle2 } from "lucide-react";

interface TeamPickerProps {
  teams: Team[];
  selectedTeamId?: string | null;
  onSelectTeam: (teamId: string) => void;
  disabled?: boolean;
}

export function TeamPicker({
  teams,
  selectedTeamId,
  onSelectTeam,
  disabled = false,
}: TeamPickerProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
          Takımını Seç
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Rakibinle eşleşecek takımı 5 saniye içinde belirle
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {teams.map((team) => {
          const isSelected = selectedTeamId === team.id;

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onSelectTeam(team.id)}
              disabled={disabled}
              className={`relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 scale-[1.02]"
                  : "bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800/80 hover:border-zinc-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}

              <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-3 text-zinc-300">
                <Shield className="w-6 h-6" />
              </div>

              <span className="font-semibold text-zinc-100 text-sm sm:text-base text-center line-clamp-1">
                {team.name}
              </span>
              <span className="text-xs text-zinc-400 mt-0.5 text-center">
                {team.league}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
