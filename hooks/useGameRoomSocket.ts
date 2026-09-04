"use client";

/**
 * Canlı WebSocket (PartyKit) bağlantı yaşam döngüsünü, otomatik REJOIN / token yönetimini
 * ve gelen gerçek zamanlı socket mesajlarını yöneten custom hook.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { RoomState } from "@/lib/realtime/roomState";
import { getWebSocketUrl } from "@/lib/realtime/getWebSocketUrl";
import { Team } from "@/types/game";
import {
  getStoredSessionToken,
  saveStoredSessionToken,
  clearStoredSessionToken,
} from "@/hooks/useRoomSession";

export interface MatchEloResult {
  matchId: string;
  isDraw: boolean;
  p1EloChange: number;
  p2EloChange: number;
  p1NewElo: number;
  p2NewElo: number;
}

export interface RoundWinnerState {
  username: string | null;
  correctAnswer: string | null;
  isDraw: boolean;
}

interface UseGameRoomSocketProps {
  roomId: string;
  userId: string;
  username: string;
  setRoomState: React.Dispatch<React.SetStateAction<RoomState>>;
  setServerSecondsLeft: React.Dispatch<React.SetStateAction<number | null>>;
  setMySelectedTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setHasErrorFeedback: React.Dispatch<React.SetStateAction<boolean>>;
  setLastRoundWinner: React.Dispatch<React.SetStateAction<RoundWinnerState | null>>;
  setMatchEloResult: React.Dispatch<React.SetStateAction<MatchEloResult | null>>;
}

export function useGameRoomSocket({
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
}: UseGameRoomSocketProps) {
  const [isConnectedToSocket, setIsConnectedToSocket] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const sendSocketMessage = useCallback((message: Record<string, unknown>): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !userId || !username) return;

    const wsUrl = getWebSocketUrl(`/parties/game/${roomId}`);
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnectedToSocket(true);
        console.log("🔌 [GameRoomSocket] Canlı WebSocket sunucusuna bağlanıldı:", wsUrl);

        const existingToken = getStoredSessionToken(roomId);
        if (existingToken) {
          console.log("🔄 [GameRoomSocket] Mevcut sessionToken ile REJOIN deneniyor:", existingToken);
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
              console.log("✅ [GameRoomSocket] REJOIN başarılı, maç durumu senkronize edildi.");
              setRoomState(data.state);
              break;

            case "REJOIN_FAILED":
              console.warn("⚠️ [GameRoomSocket] REJOIN başarısız, sıfırdan PLAYER_JOIN deneniyor:", data.reason);
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

            case "MATCH_PERSISTED":
              console.log("🏆 [GameRoomSocket] Maç DB'ye işlendi ve ELO güncellendi:", data.result);
              if (data.result) {
                setMatchEloResult(data.result);
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
                isDraw: Boolean(data.isDraw),
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
          console.error("[GameRoomSocket] Mesaj işleme hatası:", parseErr);
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
  }, [
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
  ]);

  return {
    isConnectedToSocket,
    sendSocketMessage,
  };
}
