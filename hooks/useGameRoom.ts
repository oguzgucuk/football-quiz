/**
 * Oyun odası durumunu (RoomState), serbest takım yazımını, 5sn bitiminde karşılıklı açılmayı,
 * cevap doğrulamasını ve tur geçişlerini yöneten React hook'u.
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
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [playerList, setPlayerList] = useState<PlayerSearchItem[]>([]);
  const [mySelectedTeam, setMySelectedTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasErrorFeedback, setHasErrorFeedback] = useState(false);
  const [lastRoundWinner, setLastRoundWinner] = useState<{
    username: string | null;
    correctAnswer: string | null;
    isDraw: boolean;
  } | null>(null);

  // 1. Tüm kulüp ve oyuncu listesini yükle (Fuse.js için)
  useEffect(() => {
    async function loadData() {
      try {
        const [playersRes, teamsRes] = await Promise.all([
          fetch("/api/players/search"),
          fetch("/api/teams/search"),
        ]);
        const [playersData, teamsData] = await Promise.all([
          playersRes.json(),
          teamsRes.json(),
        ]);

        if (playersData.players) setPlayerList(playersData.players);
        if (teamsData.teams) setAllTeams(teamsData.teams);
      } catch (err) {
        console.error("Veri havuzu yüklenemedi:", err);
      }
    }
    loadData();
  }, []);

  // 2. Odaya katıl ve ilk durumu başlat
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
  }, [roomId, userId, username]);

  // 3. Kullanıcı Takımını Yazdı/Kilitledi (5 saniye dolana kadar gizli kalır)
  const handleSelectTeam = useCallback((team: Team) => {
    setMySelectedTeam(team);
  }, []);

  // 4. 5 Saniye Doldu -> Karşılıklı Takımları Aç (Reveal)
  const handleRevealTeams = useCallback(() => {
    if (allTeams.length === 0) return;

    // Kullanıcı takım seçmediyse rastgele bir takım ata
    const chosenTeam =
      mySelectedTeam || allTeams[Math.floor(Math.random() * Math.min(allTeams.length, 50))];

    // Rakibin takımı (Demo / bot eşleşmesinde farklı bir takım)
    const opponentTeam =
      allTeams.find((t) => t.id !== chosenTeam.id) ||
      allTeams[Math.floor(Math.random() * allTeams.length)];

    setRoomState((prev) => ({
      ...prev,
      team1: chosenTeam,
      team2: opponentTeam,
      roundStatus: "answering",
      roundStartTime: Date.now(),
    }));
  }, [allTeams, mySelectedTeam]);

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

          setTimeout(() => {
            setLastRoundWinner(null);
            setMySelectedTeam(null);
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
          }, 3500);
        } else {
          setHasErrorFeedback(true);
        }
      } catch (err) {
        console.error("Cevap gönderim hatası:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomState.team1, roomState.team2, isSubmitting, userId, username]
  );

  // 6. Sayaç Bittiğinde
  const handleTimeExpired = useCallback(() => {
    if (roomState.roundStatus === "picking_teams") {
      handleRevealTeams();
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
        setMySelectedTeam(null);
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
      }, 3500);
    }
  }, [roomState.roundStatus, handleRevealTeams]);

  return {
    roomState,
    allTeams,
    playerList,
    mySelectedTeam,
    isSubmitting,
    hasErrorFeedback,
    lastRoundWinner,
    handleSelectTeam,
    handleSubmitAnswer,
    handleTimeExpired,
  };
}
