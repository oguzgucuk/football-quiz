"use client";

/**
 * Müzayede Odası İstemci WebSocket Hook'u.
 * Gerçek zamanlı açık artırma durumu, teklifler, sayaç ve simülasyon olaylarını yönetir.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { AuctionRoomState, AuctionLobbySettings, TeamLineup } from "@/lib/auction/auctionTypes";
import { createInitialAuctionState } from "@/lib/auction/auctionRoomEngine";
import { getWebSocketUrl } from "@/lib/realtime/getWebSocketUrl";

interface UseAuctionRoomProps {
  roomId: string;
  userId: string;
  username: string;
}

export function useAuctionRoom({ roomId, userId, username }: UseAuctionRoomProps) {
  const [state, setState] = useState<AuctionRoomState>(() =>
    createInitialAuctionState(roomId, userId, username)
  );
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [roomClosedReason, setRoomClosedReason] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((payload: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!roomId || !userId) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const originParam = origin ? `?origin=${encodeURIComponent(origin)}` : "";
    const wsUrl = getWebSocketUrl(`/parties/auction/${roomId}${originParam}`);
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
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
        handleIncomingMessage(data, setState, setErrorMessage, setToastMessage, setRoomClosedReason);
      } catch (err) {
        console.error("[AuctionSocket] Parse hatası:", err);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      socket.close();
      wsRef.current = null;
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
    (amount: number) => {
      sendMessage({ type: "AUCTION_BID", userId, amount });
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

  const nextSimMatch = useCallback(() => {
    sendMessage({ type: "AUCTION_NEXT_SIM_MATCH", userId });
  }, [userId, sendMessage]);

  const readyForNextSimMatch = useCallback(() => {
    sendMessage({ type: "AUCTION_SIM_READY", userId });
  }, [userId, sendMessage]);

  const returnToLobby = useCallback(() => {
    sendMessage({ type: "AUCTION_RETURN_TO_LOBBY", userId });
  }, [userId, sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ type: "AUCTION_LEAVE", userId });
  }, [userId, sendMessage]);

  return {
    state,
    isConnected,
    errorMessage,
    clearError: () => setErrorMessage(null),
    toastMessage,
    clearToast: () => setToastMessage(null),
    roomClosedReason,
    updateSettings,
    startGame,
    placeBid,
    passBid,
    confirmLineup,
    nextSimMatch,
    readyForNextSimMatch,
    returnToLobby,
    leaveRoom,
  };
}

type ServerAuctionEvent = {
  type: string;
  state?: AuctionRoomState;
  secondsLeft?: number;
  currentMinute?: number;
  currentMatchIndex?: number;
  message?: string;
  username?: string;
  reason?: string;
};

function handleIncomingMessage(
  data: ServerAuctionEvent,
  setState: React.Dispatch<React.SetStateAction<AuctionRoomState>>,
  setErrorMessage: (msg: string | null) => void,
  setToastMessage: (msg: string | null) => void,
  setRoomClosedReason: (msg: string | null) => void
) {
  if (data.type === "AUCTION_STATE_SYNC" && data.state) {
    setState(data.state);
  } else if (data.type === "AUCTION_TIMER_TICK" && typeof data.secondsLeft === "number") {
    setState((prev) => ({ ...prev, secondsLeft: data.secondsLeft! }));
  } else if (data.type === "AUCTION_SIM_TICK" && typeof data.currentMinute === "number") {
    setState((prev) => ({
      ...prev,
      currentSimMinute: data.currentMinute!,
      currentSimMatchIndex: data.currentMatchIndex ?? prev.currentSimMatchIndex,
    }));
  } else if (data.type === "AUCTION_ERROR") {
    setErrorMessage(data.message || "İşlem gerçekleştirilemedi");
    setTimeout(() => setErrorMessage(null), 4000);
  } else if (data.type === "AUCTION_PLAYER_LEFT") {
    setToastMessage(`${data.username || "Bir oyuncu"} lobiden ayrıldı.`);
    setTimeout(() => setToastMessage(null), 4000);
  } else if (data.type === "AUCTION_ROOM_CLOSED") {
    setRoomClosedReason(data.reason || "Oda sahibi lobiden ayrıldığı için lobi kapatıldı.");
  }
}
