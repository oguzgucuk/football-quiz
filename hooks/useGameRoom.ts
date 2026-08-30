/**
 * Oyun odası durumunu (RoomState), takım seçimini, cevap doğrulamasını
 * ve tur geçişlerini yöneten özel React hook'u.
 */

import { useState, useEffect, useCallback } from "react";
import { RoomState, createInitialRoomState } from "@/lib/realtime/roomState";
import { Team, PlayerSearchItem } from "@/types/game";

interface UseGameRoomProps {
  roomId: string;
  userId: string;
  username: string;
}

export function useGameRoom({ roomId, userId, username }: UseGameRoomProps) {
  const [roomState, setRoomState] = useState<RoomState>(() =>
    createInitialRoomState(roomId)
  );
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [playerList, setPlayerList] = useState<PlayerSearchItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasErrorFeedback, setHasErrorFeedback] = useState(false);
  const [lastRoundWinner, setLastRoundWinner] = useState<{
    username: string | null;
    correctAnswer: string | null;
    isDraw: boolean;
  } | null>(null);

  // 1. Oyuncu arama havuzunu (Fuse.js için) yükle
  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetch("/api/players/search");
        const data = await res.json();
        if (data.players) {
          setPlayerList(data.players);
        }
      } catch (err) {
        console.error("Oyuncu listesi yüklenemedi:", err);
      }
    }
    loadPlayers();
  }, []);

  // 2. Rastgele takımları yükle
  const fetchRandomTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams/random");
      const data = await res.json();
      if (data.teams) {
        setAvailableTeams(data.teams);
      }
    } catch (err) {
      console.error("Takımlar yüklenemedi:", err);
    }
  }, []);

  // 3. Odaya katıl ve ilk durumu başlat
  useEffect(() => {
    setRoomState((prev) => {
      const isP1 = !prev.player1 || prev.player1.userId === userId;
      return {
        ...prev,
        status: isP1 ? "waiting_for_players" : "in_round",
        player1: isP1
          ? { userId, username, score: 0, isReady: true }
          : prev.player1,
        player2: isP1
          ? prev.player2
          : { userId, username, score: 0, isReady: true },
      };
    });
    fetchRandomTeams();
  }, [roomId, userId, username, fetchRandomTeams]);

  // 4. Takım Seçimi
  const handleSelectTeam = useCallback(
    (teamId: string) => {
      const selectedTeam = availableTeams.find((t) => t.id === teamId);
      if (!selectedTeam) return;

      setRoomState((prev) => {
        const isPlayer1 = prev.player1?.userId === userId;
        const newTeam1 = isPlayer1 ? selectedTeam : prev.team1;
        const newTeam2 = !isPlayer1 ? selectedTeam : prev.team2;

        // Test/Demo modunda rakip otomatik bir takım seçer
        const opponentTeam =
          availableTeams.find((t) => t.id !== teamId) || availableTeams[0];
        const finalTeam1 = newTeam1 || opponentTeam;
        const finalTeam2 = newTeam2 || opponentTeam;

        return {
          ...prev,
          team1: finalTeam1,
          team2: finalTeam2,
          roundStatus: "answering",
          roundStartTime: Date.now(),
        };
      });
    },
    [availableTeams, userId]
  );

  // 5. Cevap Gönderme ve Doğrulama
  const handleSubmitAnswer = useCallback(
    async (submittedName: string) => {
      if (!roomState.team1 || !roomState.team2 || isSubmitting) return;

      setIsSubmitting(true);
      setHasErrorFeedback(false);

      try {
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
          // Doğru cevap!
          setLastRoundWinner({
            username,
            correctAnswer: data.player.fullName,
            isDraw: false,
          });

          setRoomState((prev) => {
            const isP1 = prev.player1?.userId === userId;
            return {
              ...prev,
              roundStatus: "round_finished",
              player1: prev.player1
                ? { ...prev.player1, score: prev.player1.score + (isP1 ? 1 : 0) }
                : null,
              player2: prev.player2
                ? { ...prev.player2, score: prev.player2.score + (!isP1 ? 1 : 0) }
                : null,
            };
          });

          // 3 saniye sonra yeni tura geç
          setTimeout(() => {
            setLastRoundWinner(null);
            setRoomState((prev) => {
              if (prev.currentRound >= prev.maxRounds) {
                return { ...prev, status: "match_finished" };
              }
              return {
                ...prev,
                currentRound: prev.currentRound + 1,
                roundStatus: "picking_teams",
                team1: null,
                team2: null,
              };
            });
            fetchRandomTeams();
          }, 3500);
        } else {
          // Yanlış cevap: Kural 12'ye uygun hafif feedback ve hızlı tekrar deneme
          setHasErrorFeedback(true);
        }
      } catch (err) {
        console.error("Cevap gönderim hatası:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomState.team1, roomState.team2, isSubmitting, userId, username, fetchRandomTeams]
  );

  // 6. Süre Dolduğunda (Berabere)
  const handleTimeExpired = useCallback(() => {
    if (roomState.roundStatus === "picking_teams") {
      // Takım seçmediyse rastgele bir takım ata
      if (availableTeams.length > 0) {
        handleSelectTeam(availableTeams[0].id);
      }
    } else if (roomState.roundStatus === "answering") {
      setLastRoundWinner({
        username: null,
        correctAnswer: "Süre doldu!",
        isDraw: true,
      });

      setRoomState((prev) => ({
        ...prev,
        roundStatus: "round_finished",
      }));

      setTimeout(() => {
        setLastRoundWinner(null);
        setRoomState((prev) => {
          if (prev.currentRound >= prev.maxRounds) {
            return { ...prev, status: "match_finished" };
          }
          return {
            ...prev,
            currentRound: prev.currentRound + 1,
            roundStatus: "picking_teams",
            team1: null,
            team2: null,
          };
        });
        fetchRandomTeams();
      }, 3500);
    }
  }, [roomState.roundStatus, availableTeams, handleSelectTeam, fetchRandomTeams]);

  return {
    roomState,
    availableTeams,
    playerList,
    isSubmitting,
    hasErrorFeedback,
    lastRoundWinner,
    handleSelectTeam,
    handleSubmitAnswer,
    handleTimeExpired,
  };
}
