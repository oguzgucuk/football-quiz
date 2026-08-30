/**
 * Canlı PartyKit/WebSocket bağlantısı, Server-Side Timer senkronizasyonu,
 * takım seçimi, çift taraflı skor takibi ve Kural 12 uyumlu cevap doğrulamasını yöneten React hook'u.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { RoomState, createInitialRoomState } from "@/lib/realtime/roomState";
import { Team, PlayerSearchItem } from "@/types/game";

const ROUNDS_PER_MATCH = 5;
const PICK_TIME_SECONDS = 5;
const ANSWER_TIME_SECONDS = 15;

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
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [playerList, setPlayerList] = useState<PlayerSearchItem[]>([]);
  const [mySelectedTeam, setMySelectedTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasErrorFeedback, setHasErrorFeedback] = useState(false);
  const [serverSecondsLeft, setServerSecondsLeft] = useState<number | null>(null);
  const [isConnectedToSocket, setIsConnectedToSocket] = useState(false);

  const [lastRoundWinner, setLastRoundWinner] = useState<{
    username: string | null;
    correctAnswer: string | null;
    isDraw: boolean;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // 1. Tüm kulüp ve oyuncu listesini yükle (Fuse.js için)
  useEffect(() => {
    async function loadData() {
      try {
        const [playersRes, teamsRes] = await Promise.all([
          fetch("/api/players/search"),
          fetch("/api/teams/search"),
        ]);
        const [playersData, teamsData] = await Promise.all([playersRes.json(), teamsRes.json()]);

        if (playersData.players) setPlayerList(playersData.players);
        if (teamsData.teams) setAllTeams(teamsData.teams);
      } catch (err) {
        console.error("Veri havuzu yüklenemedi:", err);
      }
    }
    loadData();
  }, []);

  // 2. Canlı WebSocket Sunucusuna Bağlan (PartyKit Protokolü)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname || "localhost";
    const port = process.env.NEXT_PUBLIC_PARTYKIT_PORT || "1999";
    const wsUrl = `ws://${host}:${port}/parties/game/${roomId}`;

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnectedToSocket(true);
        console.log("🔌 [GameRoom] Canlı WebSocket sunucusuna bağlanıldı:", wsUrl);
        ws?.send(
          JSON.stringify({
            type: "PLAYER_JOIN",
            userId,
            username,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "ROOM_STATE_SYNC":
              setRoomState(data.state);
              if (data.state.roundStatus === "picking_teams" && !data.state.team1 && !data.state.team2) {
                setMySelectedTeam(null);
              }
              break;

            case "TIMER_START":
              setServerSecondsLeft(data.duration);
              break;

            case "TIMER_TICK":
              setServerSecondsLeft(data.secondsLeft);
              break;

            case "ROUND_RESULT":
              setLastRoundWinner({
                username: data.winnerUserId === userId ? username : data.winnerUserId ? "Rakip" : null,
                correctAnswer: data.correctAnswer || "Tur Tamamlandı",
                isDraw: !!data.isDraw,
              });
              setRoomState(data.state);
              setTimeout(() => {
                setLastRoundWinner(null);
                setMySelectedTeam(null);
              }, 3000);
              break;
          }
        } catch (parseErr) {
          console.error("[GameRoom] Mesaj işleme hatası:", parseErr);
        }
      };

      ws.onclose = () => {
        setIsConnectedToSocket(false);
      };

      ws.onerror = () => {
        setIsConnectedToSocket(false);
      };

      wsRef.current = ws;
    } catch {
      setIsConnectedToSocket(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [roomId, userId, username]);

  // 3. Kullanıcı Takım Seçimi
  const handleSelectTeam = useCallback(
    (team: Team) => {
      setMySelectedTeam(team);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "TEAM_PICKED",
            userId,
            team,
          })
        );
      }
    },
    [userId]
  );

  // 4. Cevap Gönderme ve Doğrulama
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
          // Doğru bildi -> Sunucuya kazananı bildir
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "ROUND_WINNER",
                winnerUserId: userId,
                correctAnswer: data.player.fullName,
              })
            );
          } else {
            // Lokal bot modu fallback
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
          }
        } else {
          // Kural 12: Yanlış cevap -> anında hata bildirimi (Input bileşeni otomatik temizleyip odaklayacak)
          setHasErrorFeedback(true);
          setTimeout(() => setHasErrorFeedback(false), 800);
        }
      } catch (err) {
        console.error("Cevap gönderim hatası:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomState.team1, roomState.team2, isSubmitting, userId, username]
  );

  // 5. Süre Dolduğunda (Local Fallback)
  const handleTimeExpired = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (roomState.roundStatus === "answering") {
        wsRef.current.send(JSON.stringify({ type: "ROUND_TIMEOUT" }));
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
  }, [roomState.roundStatus, allTeams, mySelectedTeam]);

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
    handleSelectTeam,
    handleSubmitAnswer,
    handleTimeExpired,
  };
}
