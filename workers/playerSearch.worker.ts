/**
 * Web Worker: Oyuncu Arama & Fuse.js İndeksleme İş Parçacığı.
 * Tarayıcının ana UI thread'inden bağımsız çalışarak 20.000+ oyuncu aramasında
 * arayüzün kilitlenmesini ve klavye donmasını tamamen engeller.
 */

import Fuse from "fuse.js";
import type { PlayerSearchItem } from "../types/game";

export interface WorkerInitMessage {
  type: "INIT";
  url?: string;
  players?: PlayerSearchItem[];
}

export interface WorkerSearchMessage {
  type: "SEARCH";
  query: string;
  searchId: number;
}

export type WorkerInMessage = WorkerInitMessage | WorkerSearchMessage;

export interface WorkerReadyResponse {
  type: "READY";
  count: number;
}

export interface WorkerResultsResponse {
  type: "RESULTS";
  query: string;
  searchId: number;
  results: PlayerSearchItem[];
}

export type WorkerOutMessage = WorkerReadyResponse | WorkerResultsResponse;

let fuseInstance: Fuse<PlayerSearchItem> | null = null;
let cachedList: PlayerSearchItem[] = [];

self.onmessage = async (e: MessageEvent<WorkerInMessage>) => {
  const data = e.data;

  if (data.type === "INIT") {
    try {
      if (data.players && data.players.length > 0) {
        cachedList = data.players;
      } else {
        const fetchUrl = data.url || "/data/players-index.json";
        const res = await fetch(fetchUrl);
        cachedList = await res.json();
      }

      fuseInstance = new Fuse(cachedList, {
        keys: ["name", "asciiName"],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      });

      self.postMessage({
        type: "READY",
        count: cachedList.length,
      } as WorkerReadyResponse);
    } catch (err) {
      console.error("[PlayerSearch Worker] INIT Hatası:", err);
    }
    return;
  }

  if (data.type === "SEARCH") {
    const { query, searchId } = data;

    if (!fuseInstance || !query || query.trim().length < 2) {
      self.postMessage({
        type: "RESULTS",
        query,
        searchId,
        results: [],
      } as WorkerResultsResponse);
      return;
    }

    const normalizeAccents = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/İ/g, "I").toLowerCase();
    };

    const lowerQuery = query.toLowerCase().trim();
    const asciiQuery = normalizeAccents(query).trim();
    // Fuse'a ascii normalize edilmiş halini de aratabiliriz (daha iyi match için)
    const rawMatches = fuseInstance.search(asciiQuery, { limit: 30 });

    const scored = rawMatches.map((r) => {
      // 0 = tam eşleşme, 1 = sıfır eşleşme -> (1 - score)
      const textMatchScore = 1 - (r.score ?? 1);
      const normalizedPopularity = (r.item.popularityScore ?? 0) / 100;

      const lowerName = r.item.name.toLowerCase();
      const asciiName = (r.item.asciiName || lowerName).toLowerCase();
      
      const exactWordMatch = lowerName.split(/\s+/).some((w: string) => w.startsWith(lowerQuery)) ||
                             asciiName.split(/\s+/).some((w: string) => w.startsWith(asciiQuery));

      const containsBonus = lowerName.includes(lowerQuery) || asciiName.includes(asciiQuery) ? 0.2 : 0;
      const wordBonus = exactWordMatch ? 0.15 : 0;

      const finalScore = textMatchScore * 0.4 + normalizedPopularity * 0.4 + wordBonus + containsBonus;
      return { item: r.item, finalScore };
    });

    const topResults = scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 6)
      .map((s) => s.item);

    self.postMessage({
      type: "RESULTS",
      query,
      searchId,
      results: topResults,
    } as WorkerResultsResponse);
  }
};
