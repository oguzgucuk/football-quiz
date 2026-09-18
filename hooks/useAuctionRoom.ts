"use client";

/**
 * Müzayede Odası İstemci WebSocket Hook'u.
 * Gerçek zamanlı açık artırma durumu, teklifler, sayaç ve simülasyon olaylarını yönetir.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { AuctionRoomState, AuctionLobbySettings, TeamLineup, TeamTactics } from "@/lib/auction/auctionTypes";
import { createInitialAuctionState } from "@/lib/auction/auctionRoomEngine";
import { getWebSocketUrl } from "@/lib/realtime/getWebSocketUrl";

interface UseAuctionRoomProps {
  roomId: string;
  userId: string;
  username: string;
}

export function useAuctionRoom({ roomId, userId, username }: UseAuctionRoomProps) {
  const [state, setState] = useState<AuctionRoomState>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(`auction_state_${roomId}`);
        if (cached) {
          const parsed = JSON.parse(cached) as AuctionRoomState;
          if (parsed && parsed.roomId === roomId && parsed.status && parsed.status !== "finished") {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return createInitialAuctionState(roomId, userId, username);
  });
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [roomClosedReason, setRoomClosedReason] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((payload: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return;

    let isUnmounted = false;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const originParam = origin ? `?origin=${encodeURIComponent(origin)}` : "";
    const wsUrl = getWebSocketUrl(`/parties/auction/${roomId}${originParam}`);

    function connect() {
      if (isUnmounted) return;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmounted) return;
        setIsConnected(true);
        sendMessage({
          type: "AUCTION_JOIN",
          userId,
          username,
          siteUrl: origin,
        });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(data, roomId, setState, setIsSpectator, setErrorMessage, setToastMessage, setRoomClosedReason);
        } catch (err) {
          console.error("[AuctionSocket] Parse hatası:", err);
        }
      };

      socket.onclose = () => {
        if (isUnmounted) return;
        setIsConnected(false);
        // Otomatik yeniden bağlanma (sayfa yenilemeye gerek kalmadan)
        reconnectTimeout = setTimeout(() => {
          if (!isUnmounted) {
            connect();
          }
        }, 1500);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [roomId, userId, username, sendMessage]);


  const updateSettings = useCallback(
    (settings: Partial<AuctionLobbySettings>) => {
      sendMessage({ type: "AUCTION_UPDATE_SETTINGS", userId, settings });
    },
    [userId, sendMessage]
  );

  const startGame = useCallback(() => {
    sendMessage({ type: "AUCTION_START", userId });
  }, [userId, sendMessage]);

  const placeBid = useCallback(
    (amount: number, cardIndex?: number, cardId?: string) => {
      sendMessage({ type: "AUCTION_BID", userId, amount, cardIndex, cardId });
    },
    [userId, sendMessage]
  );

  const passBid = useCallback(() => {
    sendMessage({ type: "AUCTION_PASS", userId });
  }, [userId, sendMessage]);

  const confirmLineup = useCallback(
    (lineup: TeamLineup) => {
      sendMessage({ type: "AUCTION_CONFIRM_LINEUP", userId, lineup });
    },
    [userId, sendMessage]
  );

  const unconfirmLineup = useCallback(() => {
    sendMessage({ type: "AUCTION_UNCONFIRM_LINEUP", userId });
  }, [userId, sendMessage]);

  const nextSimMatch = useCallback(() => {
    sendMessage({ type: "AUCTION_NEXT_SIM_MATCH", userId });
  }, [userId, sendMessage]);

  const readyForNextSimMatch = useCallback(() => {
    sendMessage({ type: "AUCTION_SIM_READY", userId });
  }, [userId, sendMessage]);

  const returnToLobby = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`auction_state_${roomId}`);
      } catch {
        // ignore
      }
    }
    sendMessage({ type: "AUCTION_RETURN_TO_LOBBY", userId });
  }, [roomId, userId, sendMessage]);

  const leaveRoom = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`auction_state_${roomId}`);
      } catch {
        // ignore
      }
    }
    sendMessage({ type: "AUCTION_LEAVE", userId });
  }, [roomId, userId, sendMessage]);

  const substitutePlayer = useCallback(
    (outPlayerId: string, inPlayerId: string) => {
      sendMessage({ type: "AUCTION_SUBSTITUTE", userId, outPlayerId, inPlayerId });
    },
    [userId, sendMessage]
  );

  const updateHalftimeTactics = useCallback(
    (tactics: Partial<TeamTactics>) => {
      sendMessage({ type: "AUCTION_UPDATE_TACTICS", userId, tactics });
    },
    [userId, sendMessage]
  );

  return {
    state,
    isConnected,
    errorMessage,
    clearError: () => setErrorMessage(null),
    toastMessage,
    clearToast: () => setToastMessage(null),
    roomClosedReason,
    isSpectator,
    updateSettings,
    startGame,
    placeBid,
    passBid,
    confirmLineup,
    unconfirmLineup,
    nextSimMatch,
    readyForNextSimMatch,
    returnToLobby,
    leaveRoom,
    substitutePlayer,
    updateHalftimeTactics,
  };
}

type ServerAuctionEvent = {
  type: string;
  state?: AuctionRoomState;
  secondsLeft?: number;
  currentRoundMinute?: number;
  viewerMode?: boolean;
  message?: string;
  username?: string;
  reason?: string;
};

function handleIncomingMessage(
  data: ServerAuctionEvent,
  roomId: string,
  setState: React.Dispatch<React.SetStateAction<AuctionRoomState>>,
  setIsSpectator: React.Dispatch<React.SetStateAction<boolean>>,
  setErrorMessage: (msg: string | null) => void,
  setToastMessage: (msg: string | null) => void,
  setRoomClosedReason: (msg: string | null) => void
) {
  if (data.type === "AUCTION_STATE_SYNC" && data.state) {
    setState((prev) => {
      let syncedState = data.state!;
      // Server time is authoritative; device clock skew must not reveal future minutes.
      if (syncedState.status === "simulation") {
        const effectiveMinute = Math.max(
          syncedState.currentRoundMinute ?? 0,
          prev.status === "simulation" && prev.currentRoundIndex === syncedState.currentRoundIndex
            ? (prev.currentRoundMinute ?? 0)
            : 0
        );
        syncedState = {
          ...syncedState,
          currentRoundMinute: effectiveMinute,
          currentSimMinute: effectiveMinute,
        };
      }

      // F5 yenilemelerinde anlık lobiye düşmeyi önlemek için geçerli oda durumunu sakla
      if (typeof window !== "undefined") {
        try {
          if (syncedState.status === "finished") {
            sessionStorage.removeItem(`auction_state_${roomId}`);
          } else {
            sessionStorage.setItem(`auction_state_${roomId}`, JSON.stringify(syncedState));
          }
        } catch {
          // ignore storage quota errors
        }
      }

      return syncedState;
    });
    if (typeof data.viewerMode === "boolean") setIsSpectator(data.viewerMode);
  } else if (data.type === "AUCTION_SIM_TICK" && typeof data.currentRoundMinute === "number") {
    setState((prev) => {
      if (prev.status !== "simulation") return prev;
      const nextMinute = Math.max(prev.currentRoundMinute ?? 0, data.currentRoundMinute!);
      return {
        ...prev,
        currentRoundMinute: nextMinute,
        currentSimMinute: nextMinute,
      };
    });
  } else if (data.type === "AUCTION_TIMER_TICK" && typeof data.secondsLeft === "number") {
    setState((prev) => ({ ...prev, secondsLeft: data.secondsLeft! }));
  } else if (data.type === "AUCTION_HALFTIME_TICK" && typeof data.secondsLeft === "number") {
    setState((prev) => ({
      ...prev,
      isHalftime: true,
      halftimeSecondsLeft: data.secondsLeft!,
    }));
  } else if (data.type === "AUCTION_ERROR") {
    setErrorMessage(data.message || "İşlem gerçekleştirilemedi");
    setTimeout(() => setErrorMessage(null), 4000);
  } else if (data.type === "AUCTION_PLAYER_LEFT") {
    setToastMessage(`${data.username || "Bir oyuncu"} lobiden ayrıldı.`);
    setTimeout(() => setToastMessage(null), 4000);
  } else if (data.type === "AUCTION_ROOM_CLOSED") {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`auction_state_${roomId}`);
      } catch {
        // ignore
      }
    }
    setRoomClosedReason(data.reason || "Oda sahibi lobiden ayrıldığı için lobi kapatıldı.");
  }
}
