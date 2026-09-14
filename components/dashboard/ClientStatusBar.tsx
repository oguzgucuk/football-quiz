"use client";

/* Hallmark · component: ClientStatusBar · genre: atmospheric · archetype: Ft2 (inline-single-line)
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * anti-slop rules: Ft2 single-line (anti-AI 4-column footer), honest copy, restrained monospace, accessible contrast
 */

import React from "react";
import Link from "next/link";
import { DashboardTab } from "./types";
import { ShieldCheck, Database, Wrench, Trophy, ShoppingBag, Radio } from "lucide-react";

interface ClientStatusBarProps {
  onTabChange: (tab: DashboardTab) => void;
}

export function ClientStatusBar({ onTabChange }: ClientStatusBarProps) {
  return (
    <footer className="h-7.5 shrink-0 border-t border-white/5 bg-[#060b08]/90 backdrop-blur-md px-4 flex items-center justify-between z-20 select-none text-[11px] font-mono text-zinc-400">
      {/* Sol Kısım: Sunucu Durumu & Sürüm Bilgisi */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="tracking-tight text-[10px] uppercase">Sunucular Aktif</span>
        </div>

        <span className="text-zinc-700 hidden sm:inline">•</span>

        <span className="text-zinc-500 hidden sm:inline text-[10px]">
          AlimBALL v1.2.0 • Scout Arena
        </span>
      </div>

      {/* Sağ Kısım: SEO & Gezinme İç Linkleri */}
      <nav className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/players"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
              e.preventDefault();
              onTabChange("players");
            }
          }}
          className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
          title="18.000+ Futbolcu Veritabanı ve Scout Rehberi"
        >
          <Database className="size-3 text-zinc-500" />
          <span className="hidden md:inline">Futbolcu</span> Veritabanı
        </Link>

        <span className="text-zinc-700">•</span>

        <Link
          href="/sandbox"
          className="flex items-center gap-1 hover:text-amber-400 transition-colors"
          title="Süresiz Futbol Quiz Antrenman Modu"
        >
          <Wrench className="size-3 text-zinc-500" />
          <span>Sandbox</span>
        </Link>

        <span className="text-zinc-700">•</span>

        <Link
          href="/dashboard"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
              e.preventDefault();
              onTabChange("home");
            }
          }}
          className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
          title="Liderlik Tablosu & Sezon Sıralaması"
        >
          <Trophy className="size-3 text-zinc-500" />
          <span>Liderlik</span>
        </Link>

        <span className="text-zinc-700 hidden sm:inline">•</span>

        <Link
          href="/store"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
              e.preventDefault();
              onTabChange("store");
            }
          }}
          className="hidden sm:flex items-center gap-1 hover:text-emerald-400 transition-colors"
          title="Arena Mağazası & AC Paketleri"
        >
          <ShoppingBag className="size-3 text-zinc-500" />
          <span>Mağaza</span>
        </Link>
      </nav>
    </footer>
  );
}
