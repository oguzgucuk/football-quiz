import React from "react";
import Link from "next/link";
import { Trophy, Zap, Users, Play, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  const randomRoomId = `duel_${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header / Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg shadow-sm">
              ⚽
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Futbol<span className="text-emerald-400">Quiz</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sandbox">
              <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
                <Wrench className="w-3.5 h-3.5 mr-1" />
                Sandbox (Test Modu)
              </Button>
            </Link>
            <Badge variant="brand">v0.1.0 MVP</Badge>
          </div>
        </div>
      </header>

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

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link href={`/play/${randomRoomId}`} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base">
              <Play className="w-5 h-5 fill-current mr-1" />
              Hızlı Maç Bul (1v1)
            </Button>
          </Link>
          <Link href="/sandbox" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto border border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
              <Wrench className="w-4 h-4 mr-1 text-amber-400" />
              Sandbox Modu (2 Takımı Seç & Süresiz)
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
            <h2 className="font-bold text-lg text-zinc-100">Sandbox Test Özgürlüğü</h2>
            <p className="text-sm text-zinc-400 leading-normal">
              İstediğin iki kulübü seçerek süre kısıtlaması olmadan eşleşmeleri dene.
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

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500">
        <p>Futbol Quiz Game &copy; 2026. Wikidata (CC-BY-SA) ve Kaggle Transfermarkt verileriyle hazırlanmıştır.</p>
      </footer>
    </div>
  );
}
