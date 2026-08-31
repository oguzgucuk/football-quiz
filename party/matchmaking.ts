/**
 * PartyKit Cloud Canlı Matchmaking Havuzu (Eşleştirme Sunucusu).
 */

import type * as Party from "partykit/server";

interface QueuedPlayer {
  connectionId: string;
  userId: string;
  username: string;
  eloRating?: number;
  joinedAt: number;
}

export default class MatchmakingServer implements Party.Server {
  queue: QueuedPlayer[] = [];

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
    this.queue = this.queue.filter((p) => p.connectionId !== conn.id);
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);

      if (data.type === "MATCHMAKING_JOIN") {
        const { userId, username, eloRating } = data;

        // Eski bağlantıyı temizle
        this.queue = this.queue.filter((p) => p.connectionId !== sender.id && p.userId !== userId);

        if (this.queue.length > 0) {
          // Rakip bulundu!
          const opponent = this.queue.shift()!;
          const matchId = `match_${Math.random().toString(36).substring(2, 8)}`;

          // 1. Yeni katılan oyuncuya bildir
          sender.send(
            JSON.stringify({
              type: "MATCH_FOUND",
              matchId,
              opponent: {
                userId: opponent.userId,
                username: opponent.username,
                eloRating: opponent.eloRating || 1000,
              },
            })
          );

          // 2. Bekleyen rakibe bildir
          const opponentConn = this.room.getConnection(opponent.connectionId);
          if (opponentConn) {
            opponentConn.send(
              JSON.stringify({
                type: "MATCH_FOUND",
                matchId,
                opponent: {
                  userId,
                  username,
                  eloRating: eloRating || 1000,
                },
              })
            );
          }
        } else {
          // Kuyrukta kimse yok, sıraya gir
          this.queue.push({
            connectionId: sender.id,
            userId,
            username,
            eloRating,
            joinedAt: Date.now(),
          });

          sender.send(
            JSON.stringify({
              type: "QUEUE_STATUS",
              queueSize: this.queue.length,
            })
          );
        }
      } else if (data.type === "MATCHMAKING_LEAVE") {
        this.queue = this.queue.filter((p) => p.connectionId !== sender.id);
      } else if (data.type === "REQUEST_BOT_MATCH") {
        this.queue = this.queue.filter((p) => p.connectionId !== sender.id);
        const matchId = `match_bot_${Math.random().toString(36).substring(2, 8)}`;
        sender.send(
          JSON.stringify({
            type: "MATCH_FOUND",
            matchId,
            isBot: true,
            opponent: { userId: "bot_ai", username: "Yapay Zeka 🤖", eloRating: 1000 },
          })
        );
      }
    } catch (err) {
      console.error("[Matchmaking Error]:", err);
    }
  }
}
