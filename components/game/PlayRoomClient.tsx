"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MatchHeader } from "./MatchHeader";
import { TeamPicker } from "./TeamPicker";
import { VersusDisplay } from "./VersusDisplay";
import { PlayerAnswerInput } from "./PlayerAnswerInput";
import { RoundTimer } from "./RoundTimer";
import { RoundResultModal } from "./RoundResultModal";
import { SandboxMode } from "./SandboxMode";
import { useGameRoom } from "@/hooks/useGameRoom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Trophy, RotateCcw, Wrench, Play, ArrowLeft, Home, FastForward, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function getOrInitGuestId(): string {
  if (typeof window === "undefined") return "";
  let savedId = sessionStorage.getItem("football_quiz_user_id");
  if (!savedId) {
    savedId = `guest_${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem("football_quiz_user_id", savedId);
  }
  return savedId;
}

function getOrInitGuestUsername(): string {
  if (typeof window === "undefined") return "";
  let savedName = sessionStorage.getItem("football_quiz_username");
  if (!savedName) {
    savedName = `Misafir_${Math.floor(100 + Math.random() * 900)}`;
    sessionStorage.setItem("football_quiz_username", savedName);
  }
  return savedName;
}

interface PlayRoomClientProps {
  roomId: string;
}

export function PlayRoomClient({ roomId }: PlayRoomClientProps) {
  const [isSandboxActive, setIsSandboxActive] = useState(false);
  const [guestId] = useState(getOrInitGuestId);
  const [guestName] = useState(getOrInitGuestUsername);

  const { user, isLoading } = useAuth();

  const currentUserId = user?.id || guestId;
  const username = user?.username || guestName;

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
    const p1Score = roomState.player1?.score ?? 0;
    const p2Score = roomState.player2?.score ?? 0;
    const isWinner = p1Score > p2Score;
    const isDraw = p1Score === p2Score;
    const isForfeit = Boolean(roomState.forfeitInfo);
    const isForfeitWinner = roomState.forfeitInfo?.winnerUserId === currentUserId;

    return (
      <div className="flex flex-col min-h-screen bg-[#090a0f] text-zinc-100 items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full text-center p-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-500/10">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            {isForfeit
              ? isForfeitWinner
                ? "Hükmen Kazandın! 🏆"
                : "Hükmen Mağlup!"
              : isDraw
              ? "Maç Berabere Bitti!"
              : isWinner
              ? "Tebrikler, Kazandın! 🎉"
              : "Maçı Kaybettin!"}
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            {isForfeit
              ? isForfeitWinner
                ? "Rakip bağlantıyı kesti ve 10 saniye içinde dönmediği için maç sonuçlandı."
                : "Bağlantı koptuğu ve 10 saniye içinde dönülmediği için maç sonuçlandı."
              : "5 tur sonunda nihai skor tablosu"}
          </p>

          <div className="flex items-center justify-center gap-6 my-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 w-full">
            <div className="text-center">
              <span className="text-xs text-zinc-500 font-bold block">{username}</span>
              <span className="text-3xl font-black text-emerald-400">{p1Score}</span>
            </div>
            <span className="text-xl font-bold text-zinc-600">-</span>
            <div className="text-center">
              <span className="text-xs text-zinc-500 font-bold block">Rakip</span>
              <span className="text-3xl font-black text-cyan-400">{p2Score}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full mt-6">
            <Link href="/" className="w-full">
              <Button size="lg" className="w-full">
                <RotateCcw className="w-4 h-4" />
                Yeniden Oyna
              </Button>
            </Link>
          </div>
        </Card>
      </div>
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
      />

      {/* Rakip Bağlantı Kopması (Grace Period) Bildirimi */}
      {roomState.disconnectGrace && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-3 animate-pulse">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Rakibin bağlantısı koptu! Yeniden bağlanması bekleniyor...</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30">
              <span>KALAN:</span>
              <span className="text-sm">{roomState.disconnectGrace.secondsLeft}s</span>
            </div>
          </div>
        </div>
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
        {/* MOD 1: TEST / SANDBOX MODU (2 Takımı da Kendin Seç & Süresiz) */}
        {isSandboxActive ? (
          <SandboxMode teams={allTeams} playerList={playerList} />
        ) : (
          <>
            {/* FAZ 0: RAKİP BEKLENİYOR EKRANI (Tek oyuncu bağlandığında) */}
            {roomState.status === "waiting_for_players" && !roomState.player2 && (
              <div className="w-full max-w-md flex flex-col items-center text-center p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
                  <RotateCcw className="w-8 h-8 animate-spin" style={{ animationDuration: "6s" }} />
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight">Rakip Bekleniyor...</h2>
                <p className="text-xs text-zinc-400 mt-2 mb-6">
                  Bu odaya 2. oyuncu katıldığında 5 saniyelik takım seçimi ve maç otomatik olarak başlayacak!
                </p>

                <div className="w-full flex flex-col gap-3">
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(window.location.href);
                        alert("📋 Oda bağlantısı kopyalandı! 2. sekmede veya arkadaşında açabilirsin.");
                      }
                    }}
                  >
                    📋 Oda Linkini Kopyala (2. Sekmede Aç)
                  </Button>

                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                    onClick={addBotOpponent}
                  >
                    🤖 Bot Rakip Ekle (Tek Başına Oyna)
                  </Button>

                  <Link href="/" className="w-full mt-1">
                    <Button
                      size="md"
                      variant="outline"
                      className="w-full text-xs text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <Home className="w-3.5 h-3.5 mr-1" />
                      Ana Sayfaya Dön
                    </Button>
                  </Link>
                </div>
              </div>
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

                  {/* Pas Geçme Butonu & Bildirimi */}
                  <div className="flex items-center justify-center pt-1">
                    {hasVotedPass ? (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold animate-pulse shadow-sm shadow-amber-500/10">
                        <FastForward className="w-3.5 h-3.5" />
                        <span>Pas İsteğin İletildi ({passVotesCount}/2) • Rakibin onayı bekleniyor...</span>
                      </div>
                    ) : opponentWantsPass ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleVotePass}
                        disabled={isSubmitting}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg shadow-amber-500/25 animate-bounce flex items-center gap-1.5"
                      >
                        <FastForward className="w-4 h-4" />
                        ⚡ Rakip Pas İstiyor! Turu Geçmek İçin Tıkla (1/2)
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleVotePass}
                        disabled={isSubmitting}
                        className="text-xs text-zinc-400 hover:text-zinc-200 border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/80 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <FastForward className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Pas Geç (İki taraf da onaylarsa tur atlanır)</span>
                      </Button>
                    )}
                  </div>
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
            className={`w-2 h-2 rounded-full ${isConnectedToSocket ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" : "bg-amber-400"
              }`}
          />
          <span>{isConnectedToSocket ? "Canlı 1v1 Çok Oyunculu Aktif" : "Tek Oyunculu Mod"}</span>
        </div>
        <span>Oda: #{roomId} • İki takımda da forma giymiş futbolcuyu en hızlı yazan kazanır</span>
      </footer>
    </div>
  );
}
