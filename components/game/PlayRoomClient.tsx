"use client";

/**
 * 1v1 Çok Oyunculu ve Sandbox Maç Odası Ana İstemci Bileşeni.
 * Ekran durumlarını (bekleme, takım seçme, cevap verme, maç sonu) koordine eder.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MatchHeader } from "./MatchHeader";
import { TeamPicker } from "./TeamPicker";
import { VersusDisplay } from "./VersusDisplay";
import { PlayerAnswerInput } from "./PlayerAnswerInput";
import { RoundTimer } from "./RoundTimer";
import { RoundResultModal } from "./RoundResultModal";
import { SandboxMode } from "./SandboxMode";
import { MatchFinishedView } from "./MatchFinishedView";
import { WaitingForOpponentView } from "./WaitingForOpponentView";
import { PassVoteControl } from "./PassVoteControl";
import { DisconnectGraceAlert } from "./DisconnectGraceAlert";
import { useGameRoom } from "@/hooks/useGameRoom";
import { useGamePresence } from "@/hooks/useGamePresence";
import { Button } from "@/components/ui/Button";
import { RotateCcw, Wrench, Play, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PlayRoomClientProps {
  roomId: string;
}

export function PlayRoomClient({ roomId }: PlayRoomClientProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSandboxActive, setIsSandboxActive] = useState(false);

  // Giriş yapılmamışsa ana sayfada login modalına yönlendir
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/?auth=login");
    }
  }, [isLoading, user, router]);

  const currentUserId = user?.id || "";
  const username = user?.username || "";

  const {
    roomState,
    allTeams,
    playerList,
    mySelectedTeam,
    isSubmitting,
    hasErrorFeedback,
    serverSecondsLeft,
    isConnectedToSocket,
    lastRoundWinner,
    hasVotedPass,
    opponentWantsPass,
    passVotesCount,
    handleSelectTeam,
    handleSubmitAnswer,
    handleTimeExpired,
    handleVotePass,
    addBotOpponent,
  } = useGameRoom({ roomId, userId: currentUserId, username });

  const opponentUserId =
    roomState.player1?.userId === currentUserId
      ? roomState.player2?.userId
      : roomState.player1?.userId;

  const { h2hSummary } = useGamePresence({
    currentUserId,
    opponentUserId,
  });

  if (isLoading || !currentUserId) {
    return (
      <div className="flex flex-col min-h-screen bg-[#090a0f] text-zinc-100 items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
          <RotateCcw className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  // Maç Tamamlandı Ekranı
  if (roomState.status === "match_finished") {
    return (
      <MatchFinishedView
        roomState={roomState}
        currentUserId={currentUserId}
        username={username}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090a0f] text-zinc-100">
      {/* Üst Maç Başlığı */}
      <MatchHeader
        currentRound={roomState.currentRound}
        maxRounds={roomState.maxRounds}
        player1={roomState.player1}
        player2={roomState.player2}
        currentUserId={currentUserId}
        h2hSummary={h2hSummary}
      />

      {/* Rakip Bağlantı Kopması (Grace Period) Bildirimi */}
      {roomState.disconnectGrace && (
        <DisconnectGraceAlert secondsLeft={roomState.disconnectGrace.secondsLeft} />
      )}

      {/* Üst Eylem Butonları (Ana Sayfa + Sandbox Test Modu Toggle) */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-4 flex items-center justify-between">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-900"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Ana Sayfa
          </Button>
        </Link>

        <Button
          variant={isSandboxActive ? "primary" : "outline"}
          size="sm"
          onClick={() => setIsSandboxActive(!isSandboxActive)}
          className="text-xs font-bold"
        >
          {isSandboxActive ? (
            <>
              <Play className="w-3.5 h-3.5 mr-1" />
              1v1 Maç Moduna Dön
            </>
          ) : (
            <>
              <Wrench className="w-3.5 h-3.5 mr-1" />
              Test / Sandbox Modu (2 Takımı Kendin Seç & Süresiz)
            </>
          )}
        </Button>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-center">
        {isSandboxActive ? (
          <SandboxMode teams={allTeams} playerList={playerList} />
        ) : (
          <>
            {/* FAZ 0: RAKİP BEKLENİYOR EKRANI */}
            {roomState.status === "waiting_for_players" && !roomState.player2 && (
              <WaitingForOpponentView onAddBot={addBotOpponent} />
            )}

            {/* FAZ 1: Serbest Takım Yazma Ekranı (5 sn) */}
            {roomState.status === "in_round" && roomState.roundStatus === "picking_teams" && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="mb-6">
                  <RoundTimer
                    durationSeconds={roomState.roundDuration || 15}
                    serverSecondsLeft={serverSecondsLeft}
                    onTimeExpired={handleTimeExpired}
                  />
                </div>
                <TeamPicker
                  teams={allTeams}
                  selectedTeam={mySelectedTeam}
                  onSelectTeam={handleSelectTeam}
                />
              </div>
            )}

            {/* FAZ 2: Cevap Yazma Ekranı (Dinamik Süre) */}
            {roomState.status === "in_round" && roomState.roundStatus === "answering" && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="mb-4">
                  <RoundTimer
                    durationSeconds={roomState.roundDuration || 15}
                    serverSecondsLeft={serverSecondsLeft}
                    onTimeExpired={handleTimeExpired}
                  />
                </div>

                <VersusDisplay team1={roomState.team1} team2={roomState.team2} />

                <div className="w-full mt-4 flex flex-col items-center gap-3">
                  <PlayerAnswerInput
                    playerList={playerList}
                    onSubmitAnswer={handleSubmitAnswer}
                    isSubmitting={isSubmitting}
                    hasErrorFeedback={hasErrorFeedback}
                  />

                  <PassVoteControl
                    hasVotedPass={hasVotedPass}
                    opponentWantsPass={opponentWantsPass}
                    passVotesCount={passVotesCount}
                    isSubmitting={isSubmitting}
                    onVotePass={handleVotePass}
                  />
                </div>
              </div>
            )}

            {/* Tur Bittiğinde Kazanan Modalı */}
            {lastRoundWinner && (
              <RoundResultModal
                roundNumber={roomState.currentRound}
                winnerUsername={lastRoundWinner.username}
                correctAnswer={lastRoundWinner.correctAnswer}
                isDraw={lastRoundWinner.isDraw}
                team1Id={roomState.team1?.id}
                team2Id={roomState.team2?.id}
              />
            )}
          </>
        )}
      </main>

      {/* Alt Bar */}
      <footer className="py-4 border-t border-zinc-800/60 bg-zinc-950/40 text-center text-xs text-zinc-500 flex items-center justify-between px-6 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnectedToSocket ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" : "bg-amber-400"
            }`}
          />
          <span>{isConnectedToSocket ? "Canlı 1v1 Çok Oyunculu Aktif" : "Tek Oyunculu Mod"}</span>
        </div>
        <span>Oda: #{roomId} • İki takımda da forma giymiş futbolcuyu en hızlı yazan kazanır</span>
      </footer>
    </div>
  );
}
