"use client";

/**
 * Arkadaş listesi, bekleyen istekler ve mutasyon fonksiyonlarını yöneten React hook'u.
 * Giriş yapılmamışsa boş veri döndürür.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export type PresenceStatus = "çevrimiçi" | "oyunda" | "çevrimdışı";

export interface Friend {
  id: string;
  friendshipId: string;
  username: string;
  eloRating: number;
  rankTier: string;
  avatarUrl: string | null;
  status: PresenceStatus;
}

export interface PendingRequest {
  friendshipId: string;
  senderId: string;
  senderUsername: string;
  senderEloRating: number;
  senderAvatarUrl: string | null;
  sentAt: string;
}

export function useFriends() {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends ?? []);
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPendingRequests(data.requests ?? []);
      }
    } catch (err) {
      setError("Arkadaşlar yüklenirken hata oluştu.");
      console.error("[useFriends] Yükleme hatası:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendRequestByUsername = useCallback(
    async (username: string): Promise<string> => {
      const res = await fetch("/api/friends/request-by-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Arkadaşlık isteği gönderilemedi.");
      }
      await fetchFriends();
      return data.message || `${username} kullanıcısına arkadaşlık isteği gönderildi.`;
    },
    [fetchFriends]
  );

  const sendRequest = useCallback(
    async (targetUserId: string): Promise<void> => {
      const res = await fetch(`/api/friends/${targetUserId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "İstek gönderilemedi");
      await fetchFriends();
    },
    [fetchFriends]
  );

  const acceptRequest = useCallback(
    async (friendshipId: string): Promise<void> => {
      const res = await fetch(`/api/friends/${friendshipId}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "İstek kabul edilemedi");
      await fetchFriends();
    },
    [fetchFriends]
  );

  const rejectRequest = useCallback(
    async (senderId: string): Promise<void> => {
      const res = await fetch(`/api/friends/${senderId}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "İstek reddedilemedi");
      await fetchFriends();
    },
    [fetchFriends]
  );

  const removeFriend = useCallback(
    async (friendId: string): Promise<void> => {
      const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Arkadaş silinemedi");
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    },
    []
  );

  return {
    friends,
    pendingRequests,
    isLoading,
    error,
    sendRequest,
    sendRequestByUsername,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refetch: fetchFriends,
  };
}
