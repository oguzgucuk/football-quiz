"use client";

/**
 * 2. oyuncu henüz odaya katılmamışken gösterilen bekleme,
 * oda linki kopyalama ve bot ekleme ekranı.
 */

import React from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WaitingForOpponentViewProps {
  onAddBot: () => void;
}

export function WaitingForOpponentView({ onAddBot }: WaitingForOpponentViewProps) {
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("📋 Oda bağlantısı kopyalandı! 2. sekmede veya arkadaşında açabilirsin.");
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center text-center p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl animate-fadeIn">
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
        <RotateCcw className="w-8 h-8 animate-spin" style={{ animationDuration: "6s" }} />
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight">Rakip Bekleniyor...</h2>
      <p className="text-xs text-zinc-400 mt-2 mb-6">
        Bu odaya 2. oyuncu katıldığında 5 saniyelik takım seçimi ve maç otomatik olarak başlayacak!
      </p>

      <div className="w-full flex flex-col gap-3">
        <Button
          size="lg"
          variant="primary"
          className="w-full"
          onClick={handleCopyLink}
        >
          📋 Oda Linkini Kopyala (2. Sekmede Aç)
        </Button>

        <Button
          size="lg"
          variant="secondary"
          className="w-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          onClick={onAddBot}
        >
          🤖 Bot Rakip Ekle (Tek Başına Oyna)
        </Button>

        <Link href="/" className="w-full mt-1">
          <Button
            size="md"
            variant="outline"
            className="w-full text-xs text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800/50"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  );
}
