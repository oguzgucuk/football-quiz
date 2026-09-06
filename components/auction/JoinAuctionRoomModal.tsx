"use client";

/**
 * Sade Müzayede Odasına Katılma Modalı.
 * Kullanıcının doğrudan oda kodu veya davet linkiyle odaya girmesini sağlar.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogIn, X } from "lucide-react";

interface JoinAuctionRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinAuctionRoomModal({ isOpen, onClose }: JoinAuctionRoomModalProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = joinCode.trim();
    if (!cleaned) return;
    if (cleaned.includes("/auction/")) {
      const parts = cleaned.split("/auction/");
      cleaned = parts[parts.length - 1];
    }
    onClose();
    router.push(`/auction/${cleaned}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <Card
        variant="glass"
        className="max-w-sm w-full p-6 text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border-white/15 bg-[#0c1612]/95 backdrop-blur-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-[0_0_20px_rgba(34,197,94,0.25)]">
          <LogIn className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-black text-white tracking-tight">Oyuna Katıl</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-4">
          Arkadaşının gönderdiği oda kodunu veya bağlantısını gir:
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-3 text-left">
          <input
            type="text"
            autoFocus
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="örn. oda_muzayede_1234"
            className="w-full p-3 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <Button type="submit" size="md" className="w-full text-xs font-black py-3">
            Odaya Giriş Yap ➔
          </Button>
        </form>
      </Card>
    </div>
  );
}
