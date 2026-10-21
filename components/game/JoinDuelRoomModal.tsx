"use client";

/**
 * 1v1 Özel Maç Odasına Katılma Modalı (JoinDuelRoomModal).
 * Ortak Oyuncu veya Millet-Takım modlarında oda kodu veya davet linkiyle
 * doğrudan lobiye giriş yapmayı sağlar.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogIn, X, AlertTriangle, Swords, Globe } from "lucide-react";
import { validateRoomCodeForMode } from "@/lib/realtime/roomLobbyManager";

interface JoinDuelRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "team_vs_team" | "country_vs_team";
}

export function JoinDuelRoomModal({
  isOpen,
  onClose,
  defaultMode = "team_vs_team",
}: JoinDuelRoomModalProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"team_vs_team" | "country_vs_team">(defaultMode);
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setJoinCode("");
    onClose();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let effectiveMode = selectedMode;
    const lower = joinCode.toLowerCase().trim();
    if (lower.includes("millet") || lower.includes("country")) {
      effectiveMode = "country_vs_team";
    } else if (lower.startsWith("oda_") && !lower.includes("millet")) {
      effectiveMode = "team_vs_team";
    }

    const validation = validateRoomCodeForMode(joinCode, effectiveMode);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Geçersiz lobi kodu.");
      return;
    }

    handleClose();
    router.push(`/play/${validation.normalizedCode}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <Card
        variant="glass"
        className="max-w-sm w-full p-6 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border-white/15 bg-[#0c1612]/95 backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
          <LogIn className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">Oyuna Katıl</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-4">
          Arkadaşının lobi kodunu veya davet bağlantısını gir:
        </p>

        {/* Mod Seçici Sekmeler */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10 mb-4">
          <button
            type="button"
            onClick={() => setSelectedMode("team_vs_team")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedMode === "team_vs_team"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Takım - Takım</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode("country_vs_team")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedMode === "country_vs_team"
                ? "bg-cyan-600 text-white shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Millet - Takım</span>
          </button>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-3 text-left">
          <input
            type="text"
            autoFocus
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={selectedMode === "country_vs_team" ? "örn. oda_millet_1234 veya 1234" : "örn. oda_1234 veya 1234"}
            className={`w-full p-3 rounded-xl bg-black/40 border text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none transition-colors ${
              errorMessage ? "border-red-500/80 focus:border-red-500" : "border-white/15 focus:border-emerald-500"
            }`}
          />

          {errorMessage && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-1 font-black uppercase tracking-wider"
          >
            Odaya Gir
          </Button>
        </form>
      </Card>
    </div>
  );
}
