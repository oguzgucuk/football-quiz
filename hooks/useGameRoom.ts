"use client";

/**
 * Canlı oyun odası orkestrasyon hook'u.
 * useGameRoomData ve useGameRoomSocket hook'larını birleştirerek kullanıcı etkileşimlerini
 * (takım seçme, cevap gönderme, süre bitimi ve pas oylaması) yönetir.
 */

import { useState, useCallback } from "react";
import { RoomState, createInitialRoomState } from "@/lib/realtime/roomState";
import { Team } from "@/types/game";
import { useGameRoomData } from "./useGameRoomData";
import { useGameRoomSocket, MatchEloResult, RoundWinnerState } from "./useGameRoomSocket";

const POPULAR_CLUB_NAMES = [
  "Real Madrid",
  "FC Barcelona",
  "Galatasaray",
  "Fenerbahçe",
  "Beşiktaş",
  "AC Milan",
  "Inter Milan",
  "Juventus",
  "Manchester United",
  "Arsenal FC",
  "Chelsea FC",
  "Liverpool FC",
  "Manchester City",
  "Bayern München",
  "Borussia Dortmund",
  "Paris Saint-Germain",
  "Atlético de Madrid",
  "Trabzonspor",
  "SSC Napoli",
  "Tottenham Hotspur",
];

interface UseGameRoomProps {
  roomId: string;
  userId: string;
  username: string;
}

export function useGameRoom({ roomId, userId, username }: UseGameRoomProps) {
  const [roomState, setRoomState] = useState<RoomState>(() => createInitialRoomState(roomId));
  const [mySelectedTeam, setMySelectedTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasErrorFeedback, setHasErrorFeedback] = useState(false);
  const [serverSecondsLeft, setServerSecondsLeft] = useState<number | null>(null);
  const [matchEloResult, setMatchEloResult] = useState<MatchEloResult | null>(null);
  const [lastRoundWinner, setLastRoundWinner] = useState<RoundWinnerState | null>(null);

  // 1. Veri havuzunu yükle
  const { allTeams, playerList } = useGameRoomData();

  // 2. Canlı WebSocket bağlantısını ve mesaj dinleyicilerini yönet
  const { isConnectedToSocket, sendSocketMessage } = useGameRoomSocket({
    roomId,
    userId,
    username,
    setRoomState,
    setServerSecondsLeft,
    setMySelectedTeam,
    setIsSubmitting,
    setHasErrorFeedback,
    setLastRoundWinner,
    setMatchEloResult,
  });

  // 3. Kullanıcı Takım Seçimi
  const handleSelectTeam = useCallback(
    (team: Team) => {
      setMySelectedTeam(team);
      sendSocketMessage({
        type: "TEAM_PICKED",
        userId,
        team,
      });
    },
    [userId, sendSocketMessage]
  );

  // 4. Cevap Gönderme ve Doğrulama
  const handleSubmitAnswer = useCallback(
    async (submittedName: string) => {
      if (!roomState.team1 || !roomState.team2 || isSubmitting) return;

      setIsSubmitting(true);
      setHasErrorFeedback(false);

      try {
        const sent = sendSocketMessage({
          type: "SUBMIT_ANSWER",
          userId,
          name: submittedName,
        });

        if (!sent) {
          // LOKAL BOT MODU FALLBACK
          const res = await fetch("/api/game/verify-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              team1Id: roomState.team1.id,
              team2Id: roomState.team2.id,
              submittedName,
            }),
          });

          const data = await res.json();

          if (data.isCorrect && data.player) {
            setLastRoundWinner({
              username,
              correctAnswer: data.player.fullName,
              isDraw: false,
            });

            setRoomState((prev) => ({
              ...prev,
              roundStatus: "round_finished",
              player1: prev.player1 ? { ...prev.player1, score: prev.player1.score + 1 } : null,
            }));

            setTimeout(() => {
              setLastRoundWinner(null);
              setMySelectedTeam(null);
              setRoomState((prev) => ({
                ...prev,
                currentRound: prev.currentRound + 1,
                roundStatus: "picking_teams",
                team1: null,
                team2: null,
              }));
            }, 3000);
          } else {
            setHasErrorFeedback(true);
            setTimeout(() => setHasErrorFeedback(false), 800);
          }
        }
      } catch (err) {
        console.error("Cevap gönderim hatası:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomState.team1, roomState.team2, isSubmitting, userId, username, sendSocketMessage]
  );

  // 5. Süre Dolduğunda (Local Fallback)
  const handleTimeExpired = useCallback(() => {
    if (isConnectedToSocket) {
      if (roomState.roundStatus === "answering") {
        sendSocketMessage({ type: "ROUND_TIMEOUT" });
      }
      return;
    }

    // Lokal Bot Fallback:
    if (roomState.roundStatus === "picking_teams") {
      const popular = allTeams.filter((t) =>
        POPULAR_CLUB_NAMES.some((n) => t.name.toLowerCase().includes(n.toLowerCase()))
      );
      const pool = popular.length > 0 ? popular : allTeams;
      const t1 = mySelectedTeam || pool[Math.floor(Math.random() * pool.length)];
      const remaining = pool.filter((t) => t.id !== t1.id);
      const t2 = remaining[Math.floor(Math.random() * remaining.length)] || allTeams[0];

      setRoomState((prev) => ({
        ...prev,
        team1: t1,
        team2: t2,
        roundStatus: "answering",
        roundStartTime: Date.now(),
      }));
    }
  }, [isConnectedToSocket, roomState.roundStatus, allTeams, mySelectedTeam, sendSocketMessage]);

  // 6. Pas Geçme İsteği Gönder (Mutual Skip)
  const handleVotePass = useCallback(() => {
    sendSocketMessage({
      type: "PASS_VOTE",
      userId,
    });
  }, [userId, sendSocketMessage]);

  const hasVotedPass = Boolean(roomState.passVotes?.includes(userId));
  const opponentWantsPass = Boolean(roomState.passVotes?.some((id) => id !== userId));
  const passVotesCount = roomState.passVotes?.length || 0;

  return {
    roomState,
    allTeams,
    playerList,
    mySelectedTeam,
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
    handleSubmitAnswer,
    handleTimeExpired,
    handleVotePass,
    addBotOpponent: () => {
      if (isConnectedToSocket) {
        sendSocketMessage({ type: "ADD_BOT" });
        sendSocketMessage({ type: "ADD_BOT_PLAYER" });
      } else {
        setRoomState((prev) => ({
          ...prev,
          player2: {
            userId: "bot_ai",
            username: "Yapay Zeka 🤖",
            score: 0,
            isReady: true,
          },
          status: "in_round",
          roundStatus: "picking_teams",
        }));
      }
    },
  };
}
