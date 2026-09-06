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
import { RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    updateSettings,
    startGame,
    placeBid,
    passBid,
    confirmLineup,
    nextSimMatch,
  } = useAuctionRoom({ roomId, userId: currentUserId, username });

  if (isLoading || !currentUserId) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0d1611] text-zinc-100 items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
          <RotateCcw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  const myParticipant = state.participants[currentUserId];

  return (
    <main className="relative flex flex-col min-h-screen w-full overflow-y-auto overflow-x-hidden bg-[#0d1611] text-white font-sans select-none">
      <StadiumBackground variant="light" />

      {/* Üst Çubuk */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ayrıl</span>
          </Link>
          <span className="font-mono text-xs text-zinc-400 font-bold hidden sm:inline">
            Oda #{roomId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {myParticipant && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
              <span>Bütçe:</span>
              <span className="text-sm font-black">${myParticipant.budget}M</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-[11px] font-mono text-zinc-400">
              {isConnected ? "Canlı" : "Bağlanıyor..."}
            </span>
          </div>
        </div>
      </header>

      {/* Aşama İçeriği */}
      <div className="relative z-10 flex-1 flex flex-col justify-center p-2 sm:p-6">
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
          />
        )}

        {state.status === "tactics" && (
          <AuctionPitchBuilder
            userId={currentUserId}
            squad={myParticipant?.squad || []}
            secondsLeft={state.secondsLeft}
            onConfirmLineup={confirmLineup}
          />
        )}

        {(state.status === "simulation" || state.status === "finished") && (
          <AuctionSimulationStage
            state={state}
            currentUserId={currentUserId}
            onNextMatch={nextSimMatch}
          />
        )}
      </div>
    </main>
  );
}
