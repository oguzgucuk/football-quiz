"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SandboxMode } from "./SandboxMode";
import { Team, PlayerSearchItem } from "@/types/game";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StadiumBackground } from "@/components/ui/StadiumBackground";

export function SandboxPageClient() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [playerList, setPlayerList] = useState<PlayerSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tRes, pRes] = await Promise.all([
          fetch("/api/teams/search"),
          fetch("/data/players-index.json"),
        ]);
        const [tData, pRaw] = await Promise.all([
          tRes.json(),
          pRes.json().catch(() => []),
        ]);

        if (tData.teams) setTeams(tData.teams);

        if (Array.isArray(pRaw)) {
          setPlayerList(
            pRaw.map((p: { id: string; n: string; p?: number }) => ({
              id: p.id,
              name: p.n,
              popularityScore: p.p || 0,
            }))
          );
        }
      } catch (err) {
        console.error("Yükleme hatası:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#090a0f] text-zinc-100 relative overflow-hidden">
      {/* Koyu Temalı Stadyum Arka Planı */}
      <StadiumBackground variant="dark" />

      {/* Üst Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Ana Sayfaya Dön
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
              🛠️ Süresiz Serbest Mod
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-zinc-400">Veri tabanı yükleniyor...</span>
          </div>
        ) : (
          <SandboxMode teams={teams} playerList={playerList} />
        )}
      </main>

      <footer className="py-4 border-t border-zinc-800/60 bg-zinc-950/40 text-center text-xs text-zinc-500">
        <span>Futbol Quiz Sandbox • İstediğin iki kulübü seç ve ortak oyuncuları sınırsız sürede test et</span>
      </footer>
    </div>
  );
}
