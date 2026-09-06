"use client";

/**
 * Müzayede Odası Kurma ve Koda Katılma Modalı.
 * Oda bağlantısı oluşturma, kopyalama ve yönlendirme.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Copy, Check, Share2, Users, LogIn, X, Gavel } from "lucide-react";

interface CreateAuctionRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAuctionRoomModal({ isOpen, onClose }: CreateAuctionRoomModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [copied, setCopied] = useState(false);
  const [customRoomId, setCustomRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCustomRoomId(`oda_muzayede_${Math.floor(1000 + Math.random() * 9000)}`);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
  const roomUrl = `${origin}/auction/${customRoomId}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Futbol Quiz Canlı Müzayede Odasına davet edildin! Kadronu kur, taktiğini yap ve ligde şampiyon ol: ${roomUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = joinCode.trim();
    if (!cleaned) return;
    if (cleaned.includes("/auction/")) {
      const parts = cleaned.split("/auction/");
      cleaned = parts[parts.length - 1];
    }
    router.push(`/auction/${cleaned}`);
  };

  const handleEnterRoom = () => {
    if (!customRoomId) return;
    router.push(`/auction/${customRoomId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <Card
        variant="glass"
        className="max-w-md w-full p-7 text-center relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] border-white/15 bg-[#0c1612]/95 backdrop-blur-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
          <Gavel className="w-7 h-7" />
        </div>

        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1 rounded-full mb-2">
          Canlı Müzayede & Taktik Modu
        </span>

        <h2 className="text-2xl font-black text-white tracking-tight">Müzayede Odası</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-5">
          Özel oda kurarak arkadaşlarınla canlı açık artırmada kadro topla ve lig simülasyonunda kapış!
        </p>

        {/* Tab Seçimi */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "create"
                ? "bg-[#15803d] text-white shadow-md shadow-emerald-900/40 font-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Oda Kur
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "join"
                ? "bg-[#15803d] text-white shadow-md shadow-emerald-900/40 font-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Koda Katıl
          </button>
        </div>

        {activeTab === "create" ? (
          <div className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                Oda Davet Bağlantısı
              </label>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-black/30 border border-white/10">
                <input
                  type="text"
                  readOnly
                  value={roomUrl}
                  className="w-full bg-transparent text-xs text-zinc-300 font-mono px-2 focus:outline-none"
                />
                <Button size="sm" variant="secondary" onClick={handleCopyLink} className="text-xs px-3">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button variant="outline" size="md" onClick={handleShareWhatsApp} className="text-xs">
                <Share2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                WhatsApp
              </Button>
              <Button size="md" onClick={handleEnterRoom} className="text-xs font-black">
                Odaya Gir ➔
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                Oda Kodu veya Bağlantısı
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="örn. oda_muzayede_1234"
                className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Button type="submit" size="md" className="w-full text-xs font-black">
              Müzayedeye Katıl
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
