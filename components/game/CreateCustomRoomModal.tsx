"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Copy, Check, Share2, Play, Users, LogIn, X, Link as LinkIcon } from "lucide-react";

interface CreateCustomRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCustomRoomModal({ isOpen, onClose }: CreateCustomRoomModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [copied, setCopied] = useState(false);
  const [customRoomId, setCustomRoomId] = useState(() => `oda_${Math.floor(1000 + Math.random() * 9000)}`);
  const [joinCode, setJoinCode] = useState("");

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
  const roomUrl = `${origin}/play/${customRoomId}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Futbol Quiz 1v1 düellosuna davet edildin! İki takım, ortak futbolcu. Hemen katıl: ${roomUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = joinCode.trim();
    if (!cleaned) return;

    // Eğer tam URL yapıştırılmışsa ID'yi çıkar
    if (cleaned.includes("/play/")) {
      const parts = cleaned.split("/play/");
      cleaned = parts[parts.length - 1];
    }

    router.push(`/play/${cleaned}`);
  };

  const handleEnterCreatedRoom = () => {
    router.push(`/play/${customRoomId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <Card variant="glass" className="max-w-md w-full p-8 text-center relative overflow-hidden shadow-2xl border-zinc-700/80">
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-4">
          <Users className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">Arkadaşınla Oyna</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          Özel bir oda oluşturup linki arkadaşına gönder veya mevcut bir odaya katıl.
        </p>

        {/* Tab Seçimi */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "create"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Oda Oluştur
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "join"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Koda Katıl
          </button>
        </div>

        {/* TAB 1: ODA OLUŞTUR */}
        {activeTab === "create" && (
          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                Oda Davet Bağlantısı
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <input
                  type="text"
                  readOnly
                  value={roomUrl}
                  className="w-full bg-transparent text-xs text-zinc-300 font-mono px-2 focus:outline-none"
                />
                <Button size="sm" variant="secondary" onClick={handleCopyLink} className="text-xs px-3 flex-shrink-0">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                variant="outline"
                size="md"
                onClick={handleShareWhatsApp}
                className="text-xs border-emerald-600/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                WhatsApp'ta Paylaş
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleEnterCreatedRoom}
                className="text-xs font-bold"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Odaya Gir & Bekle
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: KODA KATIL */}
        {activeTab === "join" && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                Oda Kodu veya Linki Yapıştır
              </label>
              <div className="relative flex items-center">
                <div className="pl-3 text-zinc-500 absolute">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Örn: oda_4876 veya link..."
                  required
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-1">
              <LogIn className="w-4 h-4 mr-1.5" />
              Odaya Katıl
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
