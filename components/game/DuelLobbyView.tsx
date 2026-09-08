"use client";

/**
 * 1v1 Ortak Oyuncu ve Millet-Takım Özel Lobi Görünümü (DuelLobbyView).
 * Müzayede lobisi tasarımına birebir sadık kalarak:
 * - 2 slotlu oyuncu paneli ([Oda Sahibi] / [BOŞ] veya [Katılan Oyuncu])
 * - Takım seçme süresi ve Oyuncu bulma süresi ayar kartları
 * - Davet linki, WhatsApp paylaşım ve "OYUNU BAŞLAT" butonu.
 */

import React, { useState } from "react";
import Link from "next/link";
import { Users, Crown, Shield, Copy, Check, Share2, Loader2, ChevronRight, Bot, ArrowLeft } from "lucide-react";
import { RoomState } from "@/lib/realtime/roomState";
import { DuelLobbySettings, DEFAULT_DUEL_LOBBY_SETTINGS } from "@/lib/realtime/roomEngine";
import { DuelLobbySettingsCards } from "./DuelLobbySettingsCards";

interface DuelLobbyViewProps {
  state: RoomState;
  currentUserId: string;
  onUpdateSettings: (settings: Partial<DuelLobbySettings>) => void;
  onStartGame: () => void;
  onAddBot?: () => void;
}

export function DuelLobbyView({
  state,
  currentUserId,
  onUpdateSettings,
  onStartGame,
  onAddBot,
}: DuelLobbyViewProps) {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Host tespiti: Kullanıcı açıkça odaya 2. katılan misafir oyuncu (player2) değilse, oda sahibidir
  const isGuest = Boolean(
    state.player2 &&
      state.player2.userId === currentUserId &&
      state.player1 &&
      state.player1.userId !== currentUserId
  );
  const isHost = !isGuest;

  const isCountryVsTeam = state.gameMode === "country_vs_team";
  const participantsCount = (state.player1 ? 1 : 0) + (state.player2 ? 1 : 0);
  const canStart = isHost && Boolean(state.player1 && state.player2);

  const lobbySettings: DuelLobbySettings = state.lobbySettings || {
    pickDuration: state.pickDuration || 15,
    answerDuration: state.roundDuration || 15,
  };

  const handleCopyCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(state.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const roomUrl = typeof window !== "undefined" ? `${window.location.origin}/play/${state.roomId}` : state.roomId;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      isCountryVsTeam
        ? `Futbol Quiz Millet-Takım 1v1 lobime katıl: ${roomUrl}`
        : `Futbol Quiz Ortak Oyuncu 1v1 lobime katıl: ${roomUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleStart = () => {
    if (!canStart || isStarting) return;
    setIsStarting(true);
    onStartGame();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 p-4 sm:p-6 select-none animate-fadeIn">
      {/* 1. Üst Başlık & Oda Kodu */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full border-b border-white/10 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button
              type="button"
              className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Ana Sayfaya Dön"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Özel Lobi
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              {isCountryVsTeam ? "Millet-Takım Lobisi" : "Ortak Oyuncu Lobisi"}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/40 text-xs font-mono text-zinc-300 transition-all cursor-pointer shadow-lg"
        >
          <span>Oda Kodu: <strong className="text-emerald-400 font-bold">{state.roomId}</strong></span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
        </button>
      </div>

      {/* 2. 2 KİŞİLİK OYUNCU PANELİ (Müzayede Izgarası Tarzında 1e1 Slotlar) */}
      <div className="w-full p-5 sm:p-6 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            Lobideki Oyuncular ({participantsCount}/2)
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">2 kişilik 1v1 lobi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* SLOT 1: ODA SAHİBİ (PLAYER 1) */}
          <div
            className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all ${
              state.player1
                ? "bg-white/5 border-emerald-500/40 shadow-sm shadow-emerald-950/40"
                : "bg-black/20 border-white/5 border-dashed"
            }`}
          >
            {state.player1 ? (
              <>
                <div className="relative flex size-11 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-black text-base">
                  {state.player1.username.charAt(0).toUpperCase()}
                  <Crown className="w-4 h-4 text-amber-400 absolute -top-1.5 -right-1" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {state.player1.username}
                    {state.player1.userId === currentUserId && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">(Sen)</span>
                    )}
                  </span>
                  <span className="text-[11px] text-amber-400 font-medium">Oda Sahibi</span>
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center py-3 text-xs font-bold tracking-wider text-zinc-600">
                BOŞ
              </div>
            )}
          </div>

          {/* SLOT 2: 2. OYUNCU (PLAYER 2) */}
          <div
            className={`flex items-center gap-3.5 p-4 rounded-xl border transition-all ${
              state.player2
                ? "bg-white/5 border-emerald-500/40 shadow-sm shadow-emerald-950/40"
                : "bg-black/20 border-white/10 border-dashed"
            }`}
          >
            {state.player2 ? (
              <>
                <div className="relative flex size-11 items-center justify-center rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-black text-base">
                  {state.player2.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {state.player2.username}
                    {state.player2.userId === currentUserId && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">(Sen)</span>
                    )}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">Hazır</span>
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center py-3 text-xs font-bold tracking-wider text-zinc-500">
                BOŞ (Rakip Bekleniyor...)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Davet Bağlantısı Barı */}
      <div className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs text-zinc-300 min-w-0">
          <span className="font-bold text-zinc-400 shrink-0">Davet Linki:</span>
          <span className="font-mono text-emerald-400 truncate max-w-[220px] sm:max-w-[340px]">
            {roomUrl}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-600/30 border border-white/15 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? "Kopyalandı!" : "Linki Kopyala"}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-xs font-bold text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 4. AYARLAR KARTLARI (Takım Seçme Süresi & Oyuncu Bulma Süresi) */}
      <DuelLobbySettingsCards
        settings={lobbySettings}
        isHost={isHost}
        isCountryVsTeam={isCountryVsTeam}
        onUpdateSettings={onUpdateSettings}
      />

      {!isHost && (
        <p className="text-xs text-zinc-400 italic">
          * Süre ayarlarını yalnızca oda sahibi değiştirebilir ve oyunu başlatabilir.
        </p>
      )}

      {/* 5. OYUNU BAŞLAT VE BOT SEÇENEĞİ */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {isHost ? (
          <>
            <button
              type="button"
              onClick={handleStart}
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
                  <span>Oyun Başlatılıyor...</span>
                </>
              ) : canStart ? (
                <>
                  <span>Oyunu Başlat</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <span>Rakip Bekleniyor... (1/2)</span>
              )}
            </button>

            {/* Rakip yokken tek başına test / pratik için Bot Ekleme butonu */}
            {!state.player2 && onAddBot && (
              <button
                type="button"
                onClick={onAddBot}
                className="px-4 h-14 rounded-2xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Bot Rakip Ekle (Hızlı Başla)</span>
              </button>
            )}
          </>
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
