/**
 * Canlı PartyKit/WebSocket bağlantısı, Server-Side Timer senkronizasyonu,
 * takım seçimi, çift taraflı skor takibi ve Kural 12 uyumlu cevap doğrulamasını yöneten React hook'u.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { RoomState, createInitialRoomState } from "@/lib/realtime/roomState";
import { getWebSocketUrl } from "@/lib/realtime/getWebSocketUrl";
import { Team, PlayerSearchItem } from "@/types/game";
import {
  getStoredSessionToken,
  saveStoredSessionToken,
  clearStoredSessionToken,
} from "@/hooks/useRoomSession";


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

  // 1. Kulüp ve statik optimize oyuncu listesini yükle (Fuse.js asistanı için)
  useEffect(() => {
    async function loadData() {
      try {
        const [teamsRes, playersRes] = await Promise.all([
          fetch("/api/teams/search"),
          fetch("/data/players-index.json"),
        ]);

        const [teamsData, playersRaw] = await Promise.all([
          teamsRes.json(),
          playersRes.json().catch(() => []),
        ]);

        if (teamsData.teams) setAllTeams(teamsData.teams);

        if (Array.isArray(playersRaw) && playersRaw.length > 0) {
          // Ultra hafif { id, n, p } -> PlayerSearchItem dönüşümü
          const items: PlayerSearchItem[] = playersRaw.map((item: { id: string; n: string; p?: number }) => ({
            id: item.id,
            name: item.n,
            popularityScore: item.p || 0,
          }));
          setPlayerList(items);
        }
      } catch (err) {
        console.error("Kulüp/oyuncu havuzu yüklenemedi:", err);
      }
    }
    loadData();
  }, []);

  // 2. Canlı WebSocket Sunucusuna Bağlan (PartyKit Protokolü)
  useEffect(() => {
    if (typeof window === "undefined" || !userId || !username) return;

    const wsUrl = getWebSocketUrl(`/parties/game/${roomId}`);

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnectedToSocket(true);
        console.log("🔌 [GameRoom] Canlı WebSocket sunucusuna bağlanıldı:", wsUrl);

        const existingToken = getStoredSessionToken(roomId);
        if (existingToken) {
          console.log("🔄 [GameRoom] Mevcut sessionToken ile REJOIN deneniyor:", existingToken);
          ws?.send(
            JSON.stringify({
              type: "REJOIN",
              roomId,
              sessionToken: existingToken,
              userId,
              username,
            })
          );
        } else {
          let roundDuration = 15;
          const match = roomId.match(/_(\d+)s_/);
          if (match && match[1]) {
            roundDuration = parseInt(match[1], 10);
          }

          ws?.send(
            JSON.stringify({
              type: "PLAYER_JOIN",
              userId,
              username,
              roundDuration,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "SESSION_GRANTED":
              if (data.sessionToken) {
                saveStoredSessionToken(roomId, data.sessionToken);
              }
              break;

            case "REJOIN_SUCCESS":
              console.log("✅ [GameRoom] REJOIN başarılı, maç durumu senkronize edildi.");
              setRoomState(data.state);
              break;

            case "REJOIN_FAILED":
              console.warn("⚠️ [GameRoom] REJOIN başarısız, sıfırdan PLAYER_JOIN deneniyor:", data.reason);
              clearStoredSessionToken(roomId);
              ws?.send(
                JSON.stringify({
                  type: "PLAYER_JOIN",
                  userId,
                  username,
                  roundDuration: 15,
                })
              );
              break;

            case "PLAYER_DISCONNECTED":
              setRoomState((prev) => ({
                ...prev,
                disconnectGrace: {
                  userId: data.userId,
                  username: "Rakip",
                  expiresAt: Date.now() + (data.graceSeconds || 10) * 1000,
                  secondsLeft: data.graceSeconds || 10,
                },
              }));
              break;

            case "DISCONNECT_TICK":
              setRoomState((prev) =>
                prev.disconnectGrace
                  ? {
                      ...prev,
                      disconnectGrace: {
                        ...prev.disconnectGrace,
                        secondsLeft: data.secondsLeft,
                      },
                    }
                  : prev
              );
              break;

            case "PLAYER_RECONNECTED":
              setRoomState((prev) => ({
                ...prev,
                disconnectGrace: null,
              }));
              break;

            case "PLAYER_FORFEIT":
              clearStoredSessionToken(roomId);
              if (data.state) {
                setRoomState(data.state);
              } else {
                setRoomState((prev) => ({
                  ...prev,
                  status: "match_finished",
                  disconnectGrace: null,
                  forfeitInfo: {
                    forfeitUserId: data.forfeitUserId,
                    winnerUserId: data.winnerUserId,
                    reason: data.reason,
                  },
                }));
              }
              break;

            case "ROOM_STATE_SYNC":
              setRoomState(data.state);
              if (data.state.status === "match_finished") {
                clearStoredSessionToken(roomId);
              }
              if (data.state.roundStatus === "picking_teams" && !data.state.team1 && !data.state.team2) {
                setMySelectedTeam(null);
              }
              break;

            case "TIMER_START":
              setServerSecondsLeft(data.durationSeconds || data.duration || 5);
              break;

            case "TIMER_TICK":
              setServerSecondsLeft(data.secondsLeft);
              break;

            case "ROUND_RESULT":
              setIsSubmitting(false);
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

            case "ANSWER_FEEDBACK":
              setIsSubmitting(false);
              if (!data.isCorrect) {
                setHasErrorFeedback(true);
                setTimeout(() => setHasErrorFeedback(false), 800);
              }
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // P0-2: Cevabı doğrudan sunucuya ilet, doğrulamayı sunucu yapsın
          wsRef.current.send(
            JSON.stringify({
              type: "SUBMIT_ANSWER",
              userId,
              name: submittedName,
            })
          );
        } else {
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

    // 6. Pas Geçme İsteği Gönder (Mutual Skip)
  const handleVotePass = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "PASS_VOTE",
          userId,
        })
      );
    }
  }, [userId]);

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
    hasVotedPass,
    opponentWantsPass,
    passVotesCount,
    handleSelectTeam,
    handleSubmitAnswer,
    handleTimeExpired,
    handleVotePass,
    addBotOpponent: () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ADD_BOT" }));
        wsRef.current.send(JSON.stringify({ type: "ADD_BOT_PLAYER" }));
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
