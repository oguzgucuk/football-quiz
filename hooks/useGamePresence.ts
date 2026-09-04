"use client";

/**
 * Oyundayken kullanıcının çevrimiçi/maçta varlık durumunu (heartbeat) koruyan
 * ve rakiple olan ikili karşılaşma geçmişini (H2H) getiren hook.
 */

import { useState, useEffect } from "react";

interface UseGamePresenceProps {
  currentUserId: string;
  opponentUserId?: string | null;
}

export function useGamePresence({ currentUserId, opponentUserId }: UseGamePresenceProps) {
  const [h2hSummary, setH2hSummary] = useState<string | null>(null);

  // 1. Oyundayken anlık durumu "oyunda" olarak canlı tutan heartbeat
  useEffect(() => {
    if (!currentUserId) return;

    const sendGameHeartbeat = async (inGame: boolean) => {
      try {
        await fetch("/api/users/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inGame }),
        });
      } catch {
        // Sessiz hata yakalama
      }
    };

    sendGameHeartbeat(true);
    const interval = setInterval(() => sendGameHeartbeat(true), 20000);
    return () => {
      clearInterval(interval);
      sendGameHeartbeat(false);
    };
  }, [currentUserId]);

  // 2. Rakibe karşı H2H (head-to-head) istatistiği çek
  useEffect(() => {
    if (!currentUserId || !opponentUserId || opponentUserId.startsWith("bot_")) {
      setH2hSummary(null);
      return;
    }

    let isMounted = true;
    fetch(`/api/users/${currentUserId}/h2h/${opponentUserId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data || data.totalMatches === 0) return;
        setH2hSummary(`H2H: ${data.myWins}G - ${data.opponentWins}M (${data.totalMatches} Maç)`);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentUserId, opponentUserId]);

  return { h2hSummary };
}
