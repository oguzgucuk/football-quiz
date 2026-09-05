/**
 * PartyKit Cloud Canlı Matchmaking Havuzu (Eşleştirme Sunucusu).
 * - Süre Bazlı Eşleştirme (5s, 10s, 15s, 20s)
 * - Sadece aynı süreyi seçen oyuncular birbiriyle eşleşir.
 */

import type * as Party from "partykit/server";
import {
  MatchmakingQueuePlayer,
  sanitizeRoundDuration,
  enqueueAndMatch,
  removePlayerFromQueue,
  generateMatchId,
} from "../lib/realtime/matchmakingEngine";
import { getBotOpponentMetadata } from "../lib/realtime/botSimulator";

export default class MatchmakingServer implements Party.Server {
  queue: MatchmakingQueuePlayer[] = [];

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    conn.send(
      JSON.stringify({
        type: "QUEUE_STATUS",
        queueSize: this.queue.length,
      })
    );
  }

  onClose(conn: Party.Connection) {
    this.queue = removePlayerFromQueue(this.queue, conn.id);
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);

      if (data.type === "MATCHMAKING_JOIN") {
        const roundDuration = sanitizeRoundDuration(data.roundDuration);
        const mode = data.mode === "casual" ? "casual" : "ranked";
        const gameMode = data.gameMode === "country_vs_team" ? "country_vs_team" : "team_vs_team";
        const player: MatchmakingQueuePlayer = {
          id: sender.id,
          userId: data.userId,
          username: data.username,
          eloRating: data.eloRating,
          roundDuration,
          mode,
          gameMode,
          joinedAt: Date.now(),
        };

        const { updatedQueue, match } = enqueueAndMatch(this.queue, player);
        this.queue = updatedQueue;

        if (match) {
          sender.send(
            JSON.stringify({
              type: "MATCH_FOUND",
              matchId: match.matchId,
              roundDuration: match.roundDuration,
              mode: match.mode,
              gameMode: match.gameMode,
              opponent: {
                userId: match.player2.userId,
                username: match.player2.username,
                eloRating: match.player2.eloRating || 1000,
              },
            })
          );

          const opponentConn = this.room.getConnection(match.player2.id);
          if (opponentConn) {
            opponentConn.send(
              JSON.stringify({
                type: "MATCH_FOUND",
                matchId: match.matchId,
                roundDuration: match.roundDuration,
                mode: match.mode,
                gameMode: match.gameMode,
                opponent: {
                  userId: match.player1.userId,
                  username: match.player1.username,
                  eloRating: match.player1.eloRating || 1000,
                },
              })
            );
          }
        } else {
          sender.send(
            JSON.stringify({
              type: "QUEUE_STATUS",
              queueSize: this.queue.filter(
                (p) =>
                  p.roundDuration === roundDuration &&
                  (p.mode || "ranked") === mode &&
                  (p.gameMode || "team_vs_team") === gameMode
              ).length,
              roundDuration,
              mode,
              gameMode,
            })
          );
        }
      } else if (data.type === "MATCHMAKING_LEAVE") {
        this.queue = removePlayerFromQueue(this.queue, sender.id);
      } else if (data.type === "REQUEST_BOT_MATCH") {
        const roundDuration = sanitizeRoundDuration(data.roundDuration);
        const mode = data.mode === "casual" ? "casual" : "ranked";
        const gameMode = data.gameMode === "country_vs_team" ? "country_vs_team" : "team_vs_team";
        this.queue = removePlayerFromQueue(this.queue, sender.id);
        const matchId = generateMatchId("match_bot", roundDuration, mode, gameMode);
        sender.send(
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
  }
}
