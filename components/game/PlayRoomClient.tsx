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
import { NationPicker } from "./NationPicker";
import { RoundTimer } from "./RoundTimer";
import { RoundResultModal } from "./RoundResultModal";
import { SandboxMode } from "./SandboxMode";
import { MatchFinishedView } from "./MatchFinishedView";
import { WaitingForOpponentView } from "./WaitingForOpponentView";
import { DisconnectGraceAlert } from "./DisconnectGraceAlert";
import { PlayRoomFooter } from "./PlayRoomFooter";
import { PlayRoomAnsweringPhase } from "./PlayRoomAnsweringPhase";
import { useGameRoom } from "@/hooks/useGameRoom";
import { useGamePresence } from "@/hooks/useGamePresence";
import { Button } from "@/components/ui/Button";
import { Loader2, Wrench, Play, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { StadiumBackground } from "@/components/ui/StadiumBackground";

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
    mySelectedNation,
    isCountryVsTeam,
    isMyTurnToPickNation,
    isSubmitting,
    hasErrorFeedback,
    serverSecondsLeft,
    isConnectedToSocket,
    lastRoundWinner,
    matchEloResult,
    hasVotedPass,
    opponentWantsPass,
    passVotesCount,
    handleSelectTeam,
    handleSelectNation,
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
      <div className="flex flex-col min-h-screen bg-[#0d1611] text-zinc-100 items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
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
        matchEloResult={matchEloResult}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d1611] text-zinc-100 relative">
      {/* 1v1 Maç Odası Stadyum Arka Planı (Koyu Varyant) */}
      <StadiumBackground variant="dark" />

      {/* Üst Maç Başlığı */}
      <MatchHeader
        currentRound={roomState.currentRound}
        maxRounds={roomState.maxRounds}
        targetScore={roomState.targetScore || 3}
        isReplayRound={roomState.isReplayRound}
        player1={roomState.player1}
        player2={roomState.player2}
        currentUserId={currentUserId}
        h2hSummary={h2hSummary}
        roundDuration={roomState.roundDuration || 15}
        roundStatus={roomState.roundStatus}
      />

      {/* Faul Bildirimi (Seçim zaman aşımı) */}
      {roomState.lastFoulEvent && (
        <div className="w-full max-w-4xl mx-auto px-4 pt-3">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-fadeIn shadow-xs shadow-amber-500/10">
            <span className="text-base">⚠️</span>
            <span>{roomState.lastFoulEvent.message}</span>
          </div>
        </div>
      )}

      {/* Beraberlik Sonrası Tur Tekrarı Bildirimi */}
      {roomState.isReplayRound && roomState.roundStatus === "picking_teams" && (
        <div className="w-full max-w-4xl mx-auto px-4 pt-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-fadeIn">
            <span>🔁</span>
            <span>Önceki tur berabere bittiği için bu tur yeniden başlatıldı. İlk 3 puanı alan maçı kazanır!</span>
          </div>
        </div>
      )}

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
            className="text-xs font-bold text-zinc-300 hover:text-white border-white/10 hover:bg-white/5"
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

            {/* FAZ 1: Serbest Takım veya Millet Yazma Ekranı (Dinamik Süre: roundDuration) */}
            {roomState.status === "in_round" && roomState.roundStatus === "picking_teams" && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="flex flex-col items-center gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    1. Aşama: {isCountryVsTeam ? (isMyTurnToPickNation ? "Milletini Seç" : "Kulübünü Seç") : "Takımını Seç"} ({roomState.roundDuration || 15} sn)
                  </span>
                  <RoundTimer
                    key={`timer-${roomState.currentRound}-${roomState.roundStatus}`}
                    label={isCountryVsTeam ? (isMyTurnToPickNation ? "Millet Seçim Süresi" : "Kulüp Seçim Süresi") : "Takım Seçim Süresi"}
                    variant="picking"
                    durationSeconds={roomState.roundDuration || 15}
                    serverSecondsLeft={serverSecondsLeft}
                    onTimeExpired={handleTimeExpired}
                  />
                  <span className="text-xs text-zinc-400 font-medium text-center">
                    {isCountryVsTeam
                      ? (isMyTurnToPickNation
                          ? "Bu tur milleti sen belirliyorsun! Rakip bir kulüp seçecek."
                          : "Bu tur kulübü sen belirliyorsun! Rakip bir millet seçecek.")
                      : `Takımını seç! Süre biterse faul alırsın (3 faul = rakibe +1 puan). Ardından ${roomState.roundDuration || 15} saniyelik tahmin turu başlayacak!`}
                  </span>
                </div>
                {isCountryVsTeam ? (
                  !roomState.currentNationPickerUserId ? (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400 text-sm animate-pulse">
                      <span className="font-semibold text-emerald-400">Roller kura ile belirleniyor...</span>
                    </div>
                  ) : isMyTurnToPickNation ? (
                    <NationPicker
                      selectedNation={mySelectedNation}
                      onSelectNation={handleSelectNation}
                      usedNationIds={roomState.usedNationIds || []}
                    />
                  ) : (
                    <TeamPicker
                      teams={allTeams}
                      selectedTeam={mySelectedTeam}
                      onSelectTeam={handleSelectTeam}
                      usedTeamIds={roomState.usedTeamIds || []}
                    />
                  )
                ) : (
                  <TeamPicker
                    teams={allTeams}
                    selectedTeam={mySelectedTeam}
                    onSelectTeam={handleSelectTeam}
                    usedTeamIds={roomState.usedTeamIds || []}
                  />
                )}
              </div>
            )}

            {/* FAZ 2: Cevap Yazma Ekranı (Dinamik Süre) */}
            {roomState.status === "in_round" && roomState.roundStatus === "answering" && (
              <PlayRoomAnsweringPhase
                roomState={roomState}
                isCountryVsTeam={isCountryVsTeam}
                serverSecondsLeft={serverSecondsLeft}
                onTimeExpired={handleTimeExpired}
                playerList={playerList}
                onSubmitAnswer={handleSubmitAnswer}
                isSubmitting={isSubmitting}
                hasErrorFeedback={hasErrorFeedback}
                hasVotedPass={hasVotedPass}
                opponentWantsPass={opponentWantsPass}
                passVotesCount={passVotesCount}
                onVotePass={handleVotePass}
              />
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
                nationId={roomState.nation?.id}
              />
            )}
          </>
        )}
      </main>

      {/* Alt Bar */}
      <PlayRoomFooter
        roomId={roomId}
        isConnectedToSocket={isConnectedToSocket}
        isCountryVsTeam={isCountryVsTeam}
      />
    </div>
  );
}
