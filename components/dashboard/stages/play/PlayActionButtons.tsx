"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface PlayActionButtonsProps {
  isCustomMode: boolean;
  selectedModeId: "common_player" | "grid" | "auction" | "training";
  selectedTrainingSubMode: string;
  buttonLabel: string;
  onCreateGame: () => void;
  onJoinGame: () => void;
  onConfirm: () => void;
}

export function PlayActionButtons({
  isCustomMode,
  selectedModeId,
  selectedTrainingSubMode,
  buttonLabel,
  onCreateGame,
  onJoinGame,
  onConfirm,
}: PlayActionButtonsProps) {
  return (
    <div className="relative z-10 flex justify-center items-center h-[76px] py-2 shrink-0">
      <div className="w-full max-w-[420px] h-[56px] flex items-center justify-center">
        {isCustomMode ? (
          <div className="flex items-center gap-3 w-full h-full">
            {/* OYUN KUR */}
            <button
              type="button"
              onClick={onCreateGame}
              className="flex-1 h-full rounded-xl bg-gradient-to-b from-[#168841] to-[#126d34] hover:from-[#15803d] hover:to-[#0f5c2b] text-white font-black text-sm tracking-[0.14em] uppercase border border-emerald-400/50 shadow-md shadow-emerald-900/40 active:translate-y-[1px] transition-[background-color,border-color,box-shadow,transform] duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>OYUN KUR</span>
              <ChevronRight className="size-4 stroke-[2.5]" />
            </button>

            {/* OYUNA KATIL */}
            <button
              type="button"
              onClick={onJoinGame}
              className="flex-1 h-full rounded-xl bg-black/60 hover:bg-black/80 text-zinc-200 hover:text-white font-black text-sm tracking-[0.14em] uppercase border border-white/20 hover:border-emerald-400/50 backdrop-blur-xl shadow-md active:translate-y-[1px] transition-[background-color,border-color,box-shadow,transform] duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>OYUNA KATIL</span>
            </button>
          </div>
        ) : selectedModeId !== "training" || selectedTrainingSubMode === "players" ? (
          <button
            type="button"
            onClick={onConfirm}
            className="w-full h-full rounded-xl bg-gradient-to-b from-[#168841] to-[#126d34] hover:from-[#15803d] hover:to-[#0f5c2b] text-white font-black text-base tracking-[0.18em] uppercase border border-emerald-400/50 shadow-md shadow-emerald-900/40 active:translate-y-[1px] transition-[background-color,border-color,box-shadow,transform] duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>{buttonLabel}</span>
            <ChevronRight className="size-5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full h-full flex items-center justify-center bg-black/40 text-zinc-500 font-black text-sm tracking-[0.18em] uppercase cursor-not-allowed rounded-xl border border-white/10 backdrop-blur-md"
          >
            YAKINDA GELECEK
          </button>
        )}
      </div>
    </div>
  );
}
