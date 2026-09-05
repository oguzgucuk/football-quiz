/**
 * Standalone Node.js ws sunucusu için yerel eşleştirme (Matchmaking) işleyicisi.
 * ws istemcileri için süre bazlı havuz yönetimini ve eşleşme bildirimini sağlar.
 */

import { WebSocket } from "ws";
import {
  MatchmakingQueuePlayer,
  sanitizeRoundDuration,
  enqueueAndMatch,
  generateMatchId,
} from "../lib/realtime/matchmakingEngine";
import { getBotOpponentMetadata } from "../lib/realtime/botSimulator";

interface LocalQueuedPlayer extends MatchmakingQueuePlayer {
  ws: WebSocket;
}

let matchmakingQueue: LocalQueuedPlayer[] = [];

export function getMatchmakingQueueCount(roundDuration?: number): number {
  if (roundDuration) {
    return matchmakingQueue.filter((p) => p.roundDuration === roundDuration).length;
  }
  return matchmakingQueue.length;
}

export function handleLocalMatchmakingSocket(ws: WebSocket) {
  let boundUserId: string | undefined;

  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      if (data.type === "MATCHMAKING_JOIN") {
        const roundDuration = sanitizeRoundDuration(data.roundDuration);
        const mode = data.mode === "casual" ? "casual" : "ranked";
        const gameMode = data.gameMode === "country_vs_team" ? "country_vs_team" : "team_vs_team";
        boundUserId = data.userId;

        const player: LocalQueuedPlayer = {
          id: data.userId,
          userId: data.userId,
          username: data.username,
          eloRating: data.eloRating,
          roundDuration,
          mode,
          gameMode,
          joinedAt: Date.now(),
          ws,
        };

        const { updatedQueue, match } = enqueueAndMatch(matchmakingQueue, player);
        matchmakingQueue = updatedQueue as LocalQueuedPlayer[];

        if (match) {
          const opponent = match.player2 as LocalQueuedPlayer;
          console.log(`🎉 [Matchmaking] Eşleşme bulundu (${roundDuration}s, ${mode}, ${match.gameMode}): ${player.username} vs ${opponent.username} -> Oda: ${match.matchId}`);

          if (opponent.ws.readyState === WebSocket.OPEN) {
            opponent.ws.send(
              JSON.stringify({
                type: "MATCH_FOUND",
                matchId: match.matchId,
                roundDuration: match.roundDuration,
                mode: match.mode,
                gameMode: match.gameMode,
                opponent: {
                  userId: player.userId,
                  username: player.username,
                  eloRating: player.eloRating || 1000,
                },
              })
            );
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "MATCH_FOUND",
                matchId: match.matchId,
                roundDuration: match.roundDuration,
                mode: match.mode,
                gameMode: match.gameMode,
                opponent: {
                  userId: opponent.userId,
                  username: opponent.username,
                  eloRating: opponent.eloRating || 1000,
                },
              })
            );
          }
        } else {
          ws.send(
            JSON.stringify({
              type: "QUEUE_STATUS",
              queueSize: getMatchmakingQueueCount(roundDuration),
              roundDuration,
              mode,
              gameMode,
            })
          );
        }
      } else if (data.type === "MATCHMAKING_LEAVE") {
        matchmakingQueue = matchmakingQueue.filter((p) => p.ws !== ws);
      } else if (data.type === "REQUEST_BOT_MATCH") {
        const roundDuration = sanitizeRoundDuration(data.roundDuration);
        const mode = data.mode === "casual" ? "casual" : "ranked";
        const gameMode = data.gameMode === "country_vs_team" ? "country_vs_team" : "team_vs_team";
        matchmakingQueue = matchmakingQueue.filter((p) => p.ws !== ws);
        const matchId = generateMatchId("match_bot", roundDuration, mode, gameMode);
        ws.send(
          JSON.stringify({
            type: "MATCH_FOUND",
            matchId,
            roundDuration,
            mode,
            gameMode,
            isBot: true,
            opponent: getBotOpponentMetadata(),
          })
        );
      }
    } catch (err) {
      console.error("[Matchmaking Error]:", err);
    }
  });

  ws.on("close", () => {
    matchmakingQueue = matchmakingQueue.filter((p) => p.ws !== ws);
    if (boundUserId) {
      console.log(`👋 [Matchmaking] Ayrıldı: ${boundUserId} (Kalan: ${matchmakingQueue.length})`);
    }
  });
}
