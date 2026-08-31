/**
 * PartyKit Cloud Canlı Matchmaking Havuzu (Eşleştirme Sunucusu).
 * - Süre Bazlı Eşleştirme (5s, 10s, 15s, 20s)
 * - Sadece aynı süreyi seçen oyuncular birbiriyle eşleşir.
 */

import type * as Party from "partykit/server";

interface QueuedPlayer {
  connectionId: string;
  userId: string;
  username: string;
  eloRating?: number;
  roundDuration: number;
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
        const roundDuration = [5, 10, 15, 20].includes(Number(data.roundDuration))
          ? Number(data.roundDuration)
          : 15;

        // Eski bağlantıyı temizle
        this.queue = this.queue.filter((p) => p.connectionId !== sender.id && p.userId !== userId);

        // Kuyrukta AYNI SÜREYİ seçmiş başka bir oyuncu var mı?
        const opponentIndex = this.queue.findIndex((p) => p.roundDuration === roundDuration);

        if (opponentIndex !== -1) {
          // Rakip bulundu!
          const opponent = this.queue.splice(opponentIndex, 1)[0];
          const matchId = `match_${roundDuration}s_${Math.random().toString(36).substring(2, 8)}`;

          // 1. Yeni katılan oyuncuya bildir
          sender.send(
            JSON.stringify({
              type: "MATCH_FOUND",
              matchId,
              roundDuration,
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
                roundDuration,
                opponent: {
                  userId,
                  username,
                  eloRating: eloRating || 1000,
                },
              })
            );
          }
        } else {
          // Kuyrukta bu süre için kimse yok, sıraya gir
          this.queue.push({
            connectionId: sender.id,
            userId,
            username,
            eloRating,
            roundDuration,
            joinedAt: Date.now(),
          });

          sender.send(
            JSON.stringify({
              type: "QUEUE_STATUS",
              queueSize: this.queue.filter((p) => p.roundDuration === roundDuration).length,
              roundDuration,
            })
          );
        }
      } else if (data.type === "MATCHMAKING_LEAVE") {
        this.queue = this.queue.filter((p) => p.connectionId !== sender.id);
      } else if (data.type === "REQUEST_BOT_MATCH") {
        const roundDuration = [5, 10, 15, 20].includes(Number(data.roundDuration))
          ? Number(data.roundDuration)
          : 15;
        this.queue = this.queue.filter((p) => p.connectionId !== sender.id);
        const matchId = `match_bot_${roundDuration}s_${Math.random().toString(36).substring(2, 8)}`;
        sender.send(
          JSON.stringify({
            type: "MATCH_FOUND",
            matchId,
            roundDuration,
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
