"use client";

import React, { useState, useEffect } from "react";
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
import { Trophy, RotateCcw, Wrench, Play } from "lucide-react";

interface PlayRoomClientProps {
  roomId: string;
}

import { useAuth } from "@/hooks/useAuth";

export function PlayRoomClient({ roomId }: PlayRoomClientProps) {
  const [mounted, setMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [username, setUsername] = useState("");
  const [isSandboxActive, setIsSandboxActive] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
      setUsername(user.username);
      setMounted(true);
      return;
    }

    let savedId = typeof window !== "undefined" ? sessionStorage.getItem("football_quiz_user_id") : null;
    let savedName = typeof window !== "undefined" ? sessionStorage.getItem("football_quiz_username") : null;

    if (!savedId) {
      savedId = `user_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem("football_quiz_user_id", savedId);
    }
    if (!savedName) {
      savedName = `Oyuncu_${Math.floor(100 + Math.random() * 900)}`;
      sessionStorage.setItem("football_quiz_username", savedName);
    }

    setCurrentUserId(savedId);
    setUsername(savedName);
    setMounted(true);
  }, [user]);

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
    handleSelectTeam,
    handleSubmitAnswer,
    handleTimeExpired,
    addBotOpponent,
  } = useGameRoom({ roomId, userId: currentUserId, username });

  // Maç Tamamlandı Ekranı
  if (roomState.status === "match_finished") {
    const p1Score = roomState.player1?.score ?? 0;
    const p2Score = roomState.player2?.score ?? 0;
    const isWinner = p1Score > p2Score;
    const isDraw = p1Score === p2Score;

    return (
      <div className="flex flex-col min-h-screen bg-[#090a0f] text-zinc-100 items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full text-center p-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-500/10">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            {isDraw ? "Maç Berabere Bitti!" : isWinner ? "Tebrikler, Kazandın! 🎉" : "Maçı Kaybettin!"}
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            5 tur sonunda nihai skor tablosu
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
    <div className="flex flex-col min-h-screen bg-[#090a0f] text-zinc-100">
      {/* Üst Maç Başlığı */}
      <MatchHeader
        currentRound={roomState.currentRound}
        maxRounds={roomState.maxRounds}
        player1={roomState.player1}
        player2={roomState.player2}
        currentUserId={currentUserId}
      />

      {/* Mod Değiştirme Butonu (Sandbox Test Modu Toggle) */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-4 flex justify-end">
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
                </div>
              </div>
            )}

            {/* FAZ 1: Serbest Takım Yazma Ekranı (5 sn) */}
            {roomState.status === "in_round" && roomState.roundStatus === "picking_teams" && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="mb-6">
                  <RoundTimer
                    durationSeconds={5}
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

            {/* FAZ 2: Cevap Yazma Ekranı (15 sn) */}
            {roomState.status === "in_round" && roomState.roundStatus === "answering" && (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <div className="mb-4">
                  <RoundTimer
                    durationSeconds={15}
                    serverSecondsLeft={serverSecondsLeft}
                    onTimeExpired={handleTimeExpired}
                  />
                </div>

                <VersusDisplay team1={roomState.team1} team2={roomState.team2} />

                <div className="w-full mt-4">
                  <PlayerAnswerInput
                    playerList={playerList}
                    onSubmitAnswer={handleSubmitAnswer}
                    isSubmitting={isSubmitting}
                    hasErrorFeedback={hasErrorFeedback}
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
