"use client";

/**
 * Oyuncu araması için Web Worker yönetim kancası (Hook).
 * Arama ve Fuse.js index'leme işini ana UI iş parçacığından ayırarak sıfır gecikme sağlar.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { PlayerSearchItem } from "@/types/game";
import type {
  WorkerInMessage,
  WorkerOutMessage,
  WorkerInitMessage,
  WorkerSearchMessage,
} from "@/workers/playerSearch.worker";

export function usePlayerSearch() {
  const [isReady, setIsReady] = useState(false);
  const [suggestions, setSuggestions] = useState<PlayerSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const searchIdCounter = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let worker: Worker | null = null;
    try {
      worker = new Worker(
        new URL("../workers/playerSearch.worker.ts", import.meta.url)
      );

      worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
        const data = e.data;
        if (data.type === "READY") {
          setIsReady(true);
        } else if (data.type === "RESULTS") {
          if (data.searchId === searchIdCounter.current) {
            setSuggestions(data.results);
            setIsSearching(false);
          }
        }
      };

      worker.onerror = (err) => {
        console.error("[usePlayerSearch] Worker hatası:", err);
      };

      const initMsg: WorkerInitMessage = {
        type: "INIT",
        url: "/data/players-index.json",
      };
      worker.postMessage(initMsg);
      workerRef.current = worker;
    } catch (err) {
      console.warn("[usePlayerSearch] Web Worker oluşturulamadı:", err);
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
      workerRef.current = null;
    };
  }, []);

  const search = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    searchIdCounter.current += 1;
    const currentId = searchIdCounter.current;
    setIsSearching(true);

    if (workerRef.current) {
      const searchMsg: WorkerSearchMessage = {
        type: "SEARCH",
        query: trimmed,
        searchId: currentId,
      };
      workerRef.current.postMessage(searchMsg);
    }
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setIsSearching(false);
  }, []);

  return {
    isReady,
    isSearching,
    suggestions,
    search,
    clear,
  };
}
