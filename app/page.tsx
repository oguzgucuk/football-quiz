"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, Zap, Users, Play, Sparkles, Wrench, Swords, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { MatchmakingModal } from "@/components/game/MatchmakingModal";
import { CreateCustomRoomModal } from "@/components/game/CreateCustomRoomModal";

export default function HomePage() {
  const { user } = useAuth();
  const [isCustomRoomOpen, setIsCustomRoomOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);

  const {
    status: matchmakingStatus,
    waitingSeconds,
    matchedData,
    startMatchmaking,
    cancelMatchmaking,
    requestBotMatch,
  } = useMatchmaking();

  const handleStartQuickMatch = () => {
    setIsMatchmakingOpen(true);
    const userId = user?.id || `guest_${Math.random().toString(36).substring(2, 7)}`;
    const username = user?.username || "Misafir Oyuncu";
    const elo = user?.eloRating || 1000;
    startMatchmaking(userId, username, elo);
  };

  const handleCancelMatchmaking = () => {
    cancelMatchmaking();
    setIsMatchmakingOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header / Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 sm:py-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gerçek Zamanlı 1v1 Futbolcu Bulmaca Düellosu</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15] mb-6">
          İki Takım, Tek Ortak Futbolcu.{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            İlk Yazan Kazanır!
          </span>
        </h1>

        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          5 saniyede takımını seç, rakibinin seçimiyle eşleş. Her iki kulüpte de forma giymiş
          efsaneyi saniyeler içinde yaz ve tur puanını kap.
        </p>

        {/* Ana CTA Eylem Butonları */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-xl mb-16">
          <Button
            size="lg"
            variant="primary"
            onClick={handleStartQuickMatch}
            className="w-full sm:w-auto text-base shadow-xl shadow-emerald-500/20 font-black px-6"
          >
            <Zap className="w-5 h-5 mr-2 fill-current" />
            Hızlı Maç Bul (1v1)
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={() => setIsCustomRoomOpen(true)}
            className="w-full sm:w-auto text-base border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-bold px-6"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Arkadaşınla Oyna
          </Button>

          <Link href="/sandbox" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-sm border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <Wrench className="w-4 h-4 mr-1.5 text-zinc-400" />
              Sandbox (Test)
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <Card variant="glass" className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-zinc-100">Anlık & Hızlı</h2>
            <p className="text-sm text-zinc-400 leading-normal">
              5 saniye takım seçimi, 15 saniye anlık cevap süresi ve anında sonuç bildirimi.
            </p>
          </Card>

          <Card variant="glass" className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-zinc-100">Özel Oda & Düello</h2>
            <p className="text-sm text-zinc-400 leading-normal">
              Arkadaşına tek tıkla oda linki veya WhatsApp daveti gönderip 1v1 kapış.
            </p>
          </Card>

          <Card variant="glass" className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-zinc-100">50.000+ Futbolcu Havuzu</h2>
            <p className="text-sm text-zinc-400 leading-normal">
              Kaggle + Wikidata kaynaklı 2.850+ kulüp ve 95.000+ transfer geçmişi.
            </p>
          </Card>
        </div>
      </main>

      {/* Matchmaking Canlı Eşleşme Modalı */}
      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        status={matchmakingStatus}
        waitingSeconds={waitingSeconds}
        matchedData={matchedData}
        onCancel={handleCancelMatchmaking}
        onRequestBot={requestBotMatch}
      />

      {/* Özel Oda ve Arkadaş Davet Modalı */}
      <CreateCustomRoomModal
        isOpen={isCustomRoomOpen}
        onClose={() => setIsCustomRoomOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500">
        <p>Futbol Quiz Game &copy; 2026. Wikidata (CC-BY-SA) ve Kaggle Transfermarkt verileriyle hazırlanmıştır.</p>
      </footer>
    </div>
  );
}
