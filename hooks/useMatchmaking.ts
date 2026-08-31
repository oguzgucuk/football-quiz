"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getWebSocketUrl } from "@/lib/realtime/getWebSocketUrl";

export type MatchmakingStatus = "idle" | "searching" | "matched" | "error";

export interface MatchedOpponent {
  userId?: string;
  username: string;
  eloRating?: number;
}

export interface MatchedData {
  matchId: string;
  opponent: MatchedOpponent;
  isBot?: boolean;
}

export function useMatchmaking() {
  const [status, setStatus] = useState<MatchmakingStatus>("idle");
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [queueSize, setQueueSize] = useState(1);
  const [matchedData, setMatchedData] = useState<MatchedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Stale closure'dan kaçınmak için status'u ref'te tut
  const statusRef = useRef<MatchmakingStatus>("idle");

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "MATCHMAKING_LEAVE" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startMatchmaking = useCallback(
    (userId: string, username: string, eloRating: number = 1000) => {
      cleanup();
      setStatus("searching");
      setWaitingSeconds(0);
      setMatchedData(null);
      setError(null);

      timerRef.current = setInterval(() => {
        setWaitingSeconds((prev) => prev + 1);
      }, 1000);

      try {
        const wsUrl = getWebSocketUrl("/parties/matchmaking");

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "MATCHMAKING_JOIN",
              userId,
              username,
              eloRating,
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "MATCH_FOUND") {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }

              setMatchedData({
                matchId: data.matchId,
                opponent: data.opponent || { username: "Rakip", eloRating: 1000 },
                isBot: Boolean(data.isBot),
              });
              setStatus("matched");
            } else if (data.type === "QUEUE_STATUS") {
              setQueueSize(data.queueSize || 1);
            }
          } catch (err) {
            console.error("Matchmaking parse error:", err);
          }
        };

        ws.onerror = () => {
          setError("Eşleştirme sunucusuna bağlanılamadı.");
          setStatus("error");
        };

        ws.onclose = () => {
          // statusRef kullan: stale closure'dan kaçın
          if (statusRef.current === "searching") {
            setError("Bağlantı kesildi. Tekrar deneyin.");
            setStatus("error");
          }
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Bağlantı hatası";
        setError(message);
        setStatus("error");
      }
    },
    [cleanup]
  );

  const cancelMatchmaking = useCallback(() => {
    cleanup();
    setStatus("idle");
    setWaitingSeconds(0);
  }, [cleanup]);

  const requestBotMatch = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "REQUEST_BOT_MATCH" }));
    }
  }, []);

  return {
    status,
    waitingSeconds,
    queueSize,
    matchedData,
    error,
    startMatchmaking,
    cancelMatchmaking,
    requestBotMatch,
  };
}
