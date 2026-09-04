"use client";

/**
 * Oyun odası için gerekli kulüp arama listesini ve optimize
 * statik oyuncu indeksini (Fuse.js asistanı için) yükleyen veri hook'u.
 */

import { useState, useEffect } from "react";
import { Team, PlayerSearchItem } from "@/types/game";

export function useGameRoomData() {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [playerList, setPlayerList] = useState<PlayerSearchItem[]>([]);

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
          const items: PlayerSearchItem[] = playersRaw.map(
            (item: { id: string; n: string; p?: number }) => ({
              id: item.id,
              name: item.n,
              popularityScore: item.p || 0,
            })
          );
          setPlayerList(items);
        }
      } catch (err) {
        console.error("Kulüp/oyuncu havuzu yüklenemedi:", err);
      }
    }

    loadData();
  }, []);

  return {
    allTeams,
    playerList,
  };
}
