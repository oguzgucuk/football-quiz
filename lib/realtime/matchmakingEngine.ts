/**
 * Eşleştirme (Matchmaking) havuzu ve eşleşme arama saf fonksiyonları.
 * Sadece aynı süreyi (5s, 10s, 15s, 20s) seçen oyuncuları birbiriyle eşleştirir.
 */

import { GameMode } from "@/types/game";

export type MatchmakingMode = "ranked" | "casual";

export interface MatchmakingQueuePlayer {
  id: string; // ws veya connectionId
  userId: string;
  username: string;
  eloRating?: number;
  roundDuration: number;
  mode?: MatchmakingMode;
  gameMode?: GameMode;
  joinedAt: number;
}

export interface MatchFoundResult {
  matchId: string;
  roundDuration: number;
  mode: MatchmakingMode;
  gameMode?: GameMode;
  player1: MatchmakingQueuePlayer;
  player2: MatchmakingQueuePlayer;
}

export function sanitizeRoundDuration(durationInput: unknown, fallback = 15): number {
  const parsed = Number(durationInput);
  return [5, 10, 15, 20].includes(parsed) ? parsed : fallback;
}

export function generateMatchId(
  prefix = "match",
  roundDuration = 15,
  mode: MatchmakingMode = "ranked",
  gameMode?: GameMode
): string {
  const randomStr = Math.random().toString(36).substring(2, 8);
  const gmSuffix = gameMode && gameMode !== "team_vs_team" ? `_${gameMode}` : "";
  return `${prefix}_${roundDuration}s_${mode}${gmSuffix}_${randomStr}`;
}

export function enqueueAndMatch(
  currentQueue: MatchmakingQueuePlayer[],
  newPlayer: MatchmakingQueuePlayer
): {
  updatedQueue: MatchmakingQueuePlayer[];
  match: MatchFoundResult | null;
} {
  const playerMode = newPlayer.mode || "ranked";
  const playerGameMode = newPlayer.gameMode || "team_vs_team";

  // 1. Aynı kullanıcı veya eski bağlantıyı temizle
  const cleanedQueue = currentQueue.filter(
    (p) => p.id !== newPlayer.id && p.userId !== newPlayer.userId
  );

  // 2. Hem aynı tur süresini hem de aynı oyun modunu seçmiş rakip var mı?
  const opponentIndex = cleanedQueue.findIndex(
    (p) =>
      p.roundDuration === newPlayer.roundDuration &&
      (p.mode || "ranked") === playerMode &&
      (p.gameMode || "team_vs_team") === playerGameMode
  );

  if (opponentIndex !== -1) {
    const opponent = cleanedQueue[opponentIndex];
    const updatedQueue = cleanedQueue.filter((_, idx) => idx !== opponentIndex);
    const matchId = generateMatchId("match", newPlayer.roundDuration, playerMode, playerGameMode);

    return {
      updatedQueue,
      match: {
        matchId,
        roundDuration: newPlayer.roundDuration,
        mode: playerMode,
        gameMode: playerGameMode,
        player1: newPlayer,
        player2: opponent,
      },
    };
  }

  // 3. Eşleşme yoksa kuyruğa ekle
  return {
    updatedQueue: [...cleanedQueue, newPlayer],
    match: null,
  };
}

export function removePlayerFromQueue(
  queue: MatchmakingQueuePlayer[],
  connectionIdOrUserId: string
): MatchmakingQueuePlayer[] {
  return queue.filter(
    (p) => p.id !== connectionIdOrUserId && p.userId !== connectionIdOrUserId
  );
}
