"use client";

/**
 * Müzayede Lobisi Görünümü.
 * Kullanıcının çizdiği 1. taslağa tam sadık kalınarak:
 * - 6 slotlu oyuncu paneli ([Oyuncu Adı] / [BOŞ])
 * - Bütçe ve Rating ayar kaydırıcıları (Sadece Host değiştirebilir)
 * - "Oyunu Başlat" ana butonu
 */

import React, { useState } from "react";
import { AuctionRoomState, AuctionLobbySettings } from "@/lib/auction/auctionTypes";
import { Users, Crown, Shield, Coins, Sparkles, Copy, Check, Share2, Loader2, ChevronRight } from "lucide-react";

import { AuctionLobbySettingsCards } from "./AuctionLobbySettingsCards";

interface AuctionLobbyViewProps {
  state: AuctionRoomState;
  currentUserId: string;
  onUpdateSettings: (settings: Partial<AuctionLobbySettings>) => void;
  onStartGame: () => void;
}

export function AuctionLobbyView({
  state,
  currentUserId,
  onUpdateSettings,
  onStartGame,
}: AuctionLobbyViewProps) {
  const isHost = state.hostUserId === currentUserId;
  const [isStarting, setIsStarting] = useState(false);
  const participantsList = Object.values(state.participants).filter(
    (p) => Boolean(p.userId && p.userId.trim())
  );
  const totalSlots = 6;
  const slots = Array.from({ length: totalSlots }, (_, i) => participantsList[i] || null);
  const canStart = isHost && participantsList.length >= 2;

  const [copied, setCopied] = React.useState(false);
  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 p-4 sm:p-6 select-none animate-fadeIn">
      {/* Üst Başlık & Oda Kodu */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full border-b border-white/10 pb-4 gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
            Özel Lobi
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Müzayede Lobisi
          </h1>
        </div>

        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/40 text-xs font-mono text-zinc-300 transition-all cursor-pointer"
        >
          <span>Oda Kodu: <strong className="text-emerald-400">{state.roomId}</strong></span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
        </button>
      </div>

      {/* 1. OYUNCU SLOTLARI (Çizimdeki 6 Slotlu Izgara) */}
      <div className="w-full p-4 sm:p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            Lobideki Oyuncular ({participantsList.length}/{totalSlots})
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">En az 2 oyuncu gereklidir</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slots.map((player, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                player
                  ? "bg-white/5 border-emerald-500/40 shadow-sm shadow-emerald-950/40"
                  : "bg-black/20 border-white/5 border-dashed"
              }`}
            >
              {player ? (
                <>
                  <div className="relative flex size-10 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-black text-sm">
                    {player.username.charAt(0).toUpperCase()}
                    {player.isHost && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                      {player.username}
                      {player.userId === currentUserId && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">(Sen)</span>
                      )}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {player.isHost ? "Oda Sahibi" : "Hazır"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-center py-2 text-xs font-bold tracking-wider text-zinc-600">
                  BOŞ
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Davet Bağlantısı Barı */}
      <div className="w-full p-3.5 px-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <span className="font-bold text-zinc-400">Davet Linki:</span>
          <span className="font-mono text-emerald-400 truncate max-w-[240px] sm:max-w-[340px]">
            {typeof window !== "undefined" ? `${window.location.origin}/auction/${state.roomId}` : state.roomId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const url = `${window.location.origin}/auction/${state.roomId}`;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-600/30 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? "Kopyalandı!" : "Linki Kopyala"}</span>
          </button>

          <button
            onClick={() => {
              const url = `${window.location.origin}/auction/${state.roomId}`;
              const text = encodeURIComponent(`Futbol Quiz Canlı Müzayede Odasına katıl: ${url}`);
              window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 2. AYARLAR KARTLARI */}
      <AuctionLobbySettingsCards
        settings={state.settings}
        isHost={isHost}
        onUpdateSettings={onUpdateSettings}
      />

      {!isHost && (
        <p className="text-xs text-zinc-400 italic">
          * Ayarları yalnızca oda sahibi değiştirebilir ve oyunu başlatabilir.
        </p>
      )}

      {/* 3. OYUNU BAŞLAT BUTONU (Dönme Efektli Spinner ile) */}
      <div className="w-full flex justify-center pt-2">
        {isHost ? (
          <button
            onClick={() => {
              setIsStarting(true);
              onStartGame();
            }}
            disabled={!canStart || isStarting}
            className={`w-full sm:w-80 h-14 rounded-2xl font-black text-base uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2.5 ${
              canStart && !isStarting
                ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-950/50 cursor-pointer active:scale-98"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
            }`}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Oyun Kuruluyor...</span>
              </>
            ) : (
              <>
                <span>Oyunu Başlat</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        ) : (
          <div className="w-full sm:w-80 h-14 rounded-2xl bg-black/40 border border-white/10 text-zinc-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
            Oda Sahibinin Başlatması Bekleniyor...
          </div>
        )}
      </div>
    </div>
  );
}
