"use client";

/**
 * Müzayede Odası Ana İstemci Orkestratörü.
 * Lobi, Teklif, Taktik ve Simülasyon aşamaları arasındaki geçişi yönetir.
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuctionRoom } from "@/hooks/useAuctionRoom";
import { AuctionLobbyView } from "./AuctionLobbyView";
import { AuctionBiddingStage } from "./AuctionBiddingStage";
import { AuctionPitchBuilder } from "./AuctionPitchBuilder";
import { AuctionSimulationStage } from "./AuctionSimulationStage";
import { StadiumBackground } from "@/components/ui/StadiumBackground";
import { Loader2, ArrowLeft, AlertTriangle, AlertCircle } from "lucide-react";

interface AuctionRoomClientProps {
  roomId: string;
}

export function AuctionRoomClient({ roomId }: AuctionRoomClientProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/?auth=login");
    }
  }, [isLoading, user, router]);

  const currentUserId = user?.id || "";
  const username = user?.username || "Misafir";

  const {
    state,
    isConnected,
    errorMessage,
    toastMessage,
    roomClosedReason,
    isSpectator,
    updateSettings,
    startGame,
    placeBid,
    passBid,
    confirmLineup,
    nextSimMatch,
    readyForNextSimMatch,
    returnToLobby,
    leaveRoom,
  } = useAuctionRoom({ roomId, userId: currentUserId, username });

  useEffect(() => {
    if (roomClosedReason) {
      const t = setTimeout(() => {
        router.push("/?tab=play");
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [roomClosedReason, router]);

  if (isLoading || !currentUserId) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0d1611] text-zinc-100 items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  const myParticipant = state.participants[currentUserId];

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#0d1611] text-white font-sans select-none">
      <StadiumBackground variant="light" />

      {/* Üst Çubuk */}
      <header className="relative z-20 w-full border-b border-white/10 bg-black/40 backdrop-blur-md px-4 sm:px-8 lg:px-12 py-3.5">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                leaveRoom();
                router.push("/?tab=play");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ayrıl</span>
            </button>
            <span className="font-mono text-xs text-zinc-400 font-bold hidden sm:inline">
              Oda #{roomId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isSpectator && (
              <div className="px-3 py-1 rounded-xl bg-sky-950/60 border border-sky-400/30 text-sky-200 font-mono text-xs font-bold">
                👁 İzliyorsunuz
              </div>
            )}
            {myParticipant && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                <span>Bütçe:</span>
                <span className="text-sm font-black">${myParticipant.budget}M</span>
              </div>
            )}

            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${
                isConnected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              <span
                className={`size-2.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : "bg-red-500"
                }`}
              />
              <span className="text-xs sm:text-sm font-mono font-bold">
                {isConnected ? "Canlı" : "Bağlanıyor..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Aşama İçeriği */}
      <div className="relative z-10 flex-1 flex flex-col w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        {state.status === "lobby" && (
          <AuctionLobbyView
            state={state}
            currentUserId={currentUserId}
            onUpdateSettings={updateSettings}
            onStartGame={startGame}
          />
        )}

        {state.status === "auction" && (
          <AuctionBiddingStage
            state={state}
            currentUserId={currentUserId}
            errorMessage={errorMessage}
            onPlaceBid={placeBid}
            onPass={passBid}
            isSpectator={isSpectator}
          />
        )}

        {state.status === "tactics" && !isSpectator && (
          <AuctionPitchBuilder
            userId={currentUserId}
            squad={myParticipant?.squad || []}
            secondsLeft={state.secondsLeft}
            confirmedUserIds={state.confirmedLineupUserIds || []}
            totalParticipantCount={
              Object.keys(state.participants).filter((id) => Boolean(id && id.trim())).length
            }
            onConfirmLineup={confirmLineup}
          />
        )}

        {state.status === "tactics" && isSpectator && (
          <div className="mx-auto max-w-md rounded-3xl border border-sky-400/30 bg-slate-950/70 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mb-3 text-3xl">👁</div>
            <h2 className="text-lg font-black text-white">Dizilişler hazırlanıyor</h2>
            <p className="mt-2 text-sm text-zinc-300">Bu turu seyirci olarak izliyorsunuz. Maç başladığında canlı simülasyon otomatik açılacak.</p>
          </div>
        )}

        {(state.status === "simulation" || state.status === "finished") && (
          <AuctionSimulationStage
            state={state}
            currentUserId={currentUserId}
            isSpectator={isSpectator}
            onNextMatch={nextSimMatch}
            onReadyForNextMatch={readyForNextSimMatch}
            onReturnToLobby={returnToLobby}
          />
        )}
      </div>

      {/* Oyuncu Ayrıldı Toast Bildirimi */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/85 border border-amber-500/50 text-amber-300 font-bold text-xs shadow-2xl backdrop-blur-xl animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Lobi Sahibi Ayrıldı / Lobi Kapatıldı Modalı */}
      {roomClosedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-[#121c15] border border-red-500/40 shadow-2xl max-w-md w-full">
            <div className="size-16 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Lobi Kapatıldı</h2>
            <p className="text-sm text-zinc-300 mb-6">{roomClosedReason}</p>
            <button
              onClick={() => router.push("/?tab=play")}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
            >
              Ana Sayfaya Dön
            </button>
            <span className="text-[11px] text-zinc-500 font-mono mt-3">3 saniye içinde yönlendiriliyorsunuz...</span>
          </div>
        </div>
      )}
    </main>
  );
}
