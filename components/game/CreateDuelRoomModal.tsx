"use client";

/**
 * 1v1 Özel Oda Kurma Modalı (CreateDuelRoomModal).
 * Kullanıcının arkadaşıyla oynamak için Takım-Takım veya Millet-Takım
 * modunda özel lobi odası oluşturmasını sağlar.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Swords, Globe, X, PlusCircle, ChevronRight } from "lucide-react";

interface CreateDuelRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateDuelRoomModal({ isOpen, onClose }: CreateDuelRoomModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleCreateRoom = (mode: "team_vs_team" | "country_vs_team") => {
    onClose();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const roomId = mode === "country_vs_team" ? `oda_millet_${randomCode}` : `oda_${randomCode}`;
    router.push(`/play/${roomId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <Card
        variant="glass"
        className="max-w-md w-full p-6 sm:p-7 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border-white/15 bg-[#0c1612]/95 backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
          <PlusCircle className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">Özel Oda Kur</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          Arkadaşınla oynamak istediğin ortak oyuncu modunu seç:
        </p>

        <div className="flex flex-col gap-3">
          {/* 1. Takım - Takım */}
          <button
            type="button"
            onClick={() => handleCreateRoom("team_vs_team")}
            className="group w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-950/30 text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                  Takım - Takım
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Her iki oyuncu kulüp seçer, ortak futbolcuyu ilk yazan kazanır.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0" />
          </button>

          {/* 2. Millet - Takım */}
          <button
            type="button"
            onClick={() => handleCreateRoom("country_vs_team")}
            className="group w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-950/30 text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                  Millet - Takım
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Bir oyuncu millet, diğeri kulüp belirler (Sırayla değişir).
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors shrink-0" />
          </button>
        </div>
      </Card>
    </div>
  );
}
