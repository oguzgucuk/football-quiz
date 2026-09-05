"use client";

/**
 * 2. oyuncu henüz odaya katılmamışken gösterilen bekleme,
 * oda linki kopyalama ve bot ekleme ekranı.
 */

import React, { useState } from "react";
import Link from "next/link";
import { RotateCcw, Home, Copy, Check, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WaitingForOpponentViewProps {
  onAddBot: () => void;
}

export function WaitingForOpponentView({ onAddBot }: WaitingForOpponentViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center text-center p-8 rounded-3xl bg-[#0c1612]/95 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-fadeIn">
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
        <RotateCcw className="w-8 h-8 animate-spin" style={{ animationDuration: "6s" }} />
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight">Rakip Bekleniyor...</h2>
      <p className="text-xs text-zinc-400 mt-2 mb-6">
        Bu odaya 2. oyuncu katıldığında takım seçimi ve maç otomatik olarak başlayacak!
      </p>

      <div className="w-full flex flex-col gap-3">
        <Button
          size="lg"
          variant="primary"
          className="w-full bg-gradient-to-b from-[#168841] to-[#126d34] hover:from-[#15803d] hover:to-[#0f5c2b] flex items-center justify-center gap-2"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Bağlantı Kopyalandı!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Oda Linkini Kopyala (2. Sekmede Aç)</span>
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="secondary"
          className="w-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 flex items-center justify-center gap-2"
          onClick={onAddBot}
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>Bot Rakip Ekle (Tek Başına Oyna)</span>
        </Button>

        <Link href="/" className="w-full mt-1">
          <Button
            size="md"
            variant="outline"
            className="w-full text-xs text-zinc-400 hover:text-white border-white/10 hover:bg-white/5"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  );
}
