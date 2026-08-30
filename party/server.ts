/**
 * Realtime WebSocket Oyun ve Oda Sunucusu (PartyKit Protokolü Uyumlu).
 * Server-side Timer, Oda Yönetimi, Ping-Pong Bağlantı Testi ve 1v1 Eşleşme.
 */

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team } from "../types/game";

const PORT = parseInt(process.env.PORT || "1999", 10);
const ROUNDS_PER_MATCH = 5;
const PICK_TIME_SECONDS = 5;
const ANSWER_TIME_SECONDS = 15;

interface Room {
  id: string;
  state: RoomState;
  clients: Set<WebSocket>;
  timer?: NodeJS.Timeout;
  timerSecondsLeft?: number;
}

const rooms = new Map<string, Room>();

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", activeRooms: rooms.size, timestamp: Date.now() }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

// URL'den roomId ayrıştırma (Örn: /parties/game/oda-123 veya /rooms/oda-123 veya /oda-123)
function extractRoomId(url: string | undefined): string {
  if (!url) return "default";
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/").filter(Boolean);
  return parts[parts.length - 1] || "default";
}

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      state: createInitialRoomState(roomId),
      clients: new Set(),
    };
    room.state.maxRounds = ROUNDS_PER_MATCH;
    rooms.set(roomId, room);
  }
  return room;
}

function broadcastToRoom(room: Room, message: object) {
  const payload = JSON.stringify(message);
  for (const client of room.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function broadcastRoomState(room: Room) {
  broadcastToRoom(room, {
    type: "ROOM_STATE_SYNC",
    state: room.state,
    serverTimestamp: Date.now(),
  });
}

// Server-Side Timer Yönetimi (Adil, senkronize geri sayım)
function startServerTimer(room: Room, durationSeconds: number, onComplete: () => void) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = undefined;
  }

  room.timerSecondsLeft = durationSeconds;

  broadcastToRoom(room, {
    type: "TIMER_START",
    duration: durationSeconds,
    serverTimestamp: Date.now(),
  });

  room.timer = setInterval(() => {
    if (room.timerSecondsLeft === undefined || room.timerSecondsLeft <= 1) {
      clearInterval(room.timer);
      room.timer = undefined;
      room.timerSecondsLeft = 0;
      onComplete();
    } else {
      room.timerSecondsLeft -= 1;
      broadcastToRoom(room, {
        type: "TIMER_TICK",
        secondsLeft: room.timerSecondsLeft,
        serverTimestamp: Date.now(),
      });
    }
  }, 1000);
}

server.on("upgrade", (request, socket, head) => {
  const roomId = extractRoomId(request.url);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, roomId);
  });
});

wss.on("connection", (ws: WebSocket, request: any, roomId: string) => {
  const room = getOrCreateRoom(roomId);
  room.clients.add(ws);

  console.log(`[WebSocket] Client bağlandı. Oda: "${roomId}" (Aktif bağlantı: ${room.clients.size})`);

  // İlk bağlantıda mevcut oda durumunu gönder
  ws.send(
    JSON.stringify({
      type: "ROOM_STATE_SYNC",
      state: room.state,
      serverTimestamp: Date.now(),
    })
  );

  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      switch (data.type) {
        // --- 1. Minimal Sanity Check (Ping/Pong / Chat) ---
        case "PING": {
          ws.send(JSON.stringify({ type: "PONG", clientTimestamp: data.timestamp, serverTimestamp: Date.now() }));
          break;
        }

        case "CHAT": {
          broadcastToRoom(room, {
            type: "CHAT_MESSAGE",
            sender: data.sender || "Anonim",
            text: data.text,
            timestamp: Date.now(),
          });
          break;
        }

        // --- 2. Oyuncu Katılımı (1v1) ---
        case "PLAYER_JOIN": {
          const { userId, username } = data;
          if (!room.state.player1) {
            room.state.player1 = { userId, username, score: 0, isReady: true };
          } else if (!room.state.player2 && room.state.player1.userId !== userId) {
            room.state.player2 = { userId, username, score: 0, isReady: true };
            // İki oyuncu da odaya girdi -> Maç başlasın ve 1. Tur takım seçimi başlasın
            room.state.status = "in_round";
            room.state.roundStatus = "picking_teams";
            room.state.currentRound = 1;
            broadcastRoomState(room);

            // Server-side 5sn takım seçimi sayacını başlat
            startServerTimer(room, PICK_TIME_SECONDS, () => {
              // 5 saniye dolunca takımları aç ve cevaplama aşamasına geç
              room.state.roundStatus = "answering";
              room.state.roundStartTime = Date.now();
              broadcastRoomState(room);
            });
            break;
          }
          broadcastRoomState(room);
          break;
        }

        // --- 3. Takım Seçimi (Oyuncu bağımsız seçer) ---
        case "TEAM_PICKED": {
          const { userId, team } = data as { userId: string; team: Team };
          if (room.state.player1?.userId === userId) {
            room.state.player1.selectedTeamId = team.id;
            room.state.team1 = team;
          } else if (room.state.player2?.userId === userId) {
            room.state.player2.selectedTeamId = team.id;
            room.state.team2 = team;
          }

          // İki oyuncu da süreden önce takım seçtiyse hemen cevaplama aşamasına geç
          if (room.state.team1 && room.state.team2 && room.state.roundStatus === "picking_teams") {
            if (room.timer) {
              clearInterval(room.timer);
              room.timer = undefined;
            }
            room.state.roundStatus = "answering";
            room.state.roundStartTime = Date.now();
          }

          broadcastRoomState(room);
          break;
        }

        // --- 4. Tur Kazananı / Doğru Cevap Bildirimi ---
        case "ROUND_WINNER": {
          const { winnerUserId, correctAnswer } = data;
          if (room.state.roundStatus !== "answering") return; // Tur zaten bittiyse çift puan vermeyi engelle

          if (room.state.player1 && room.state.player1.userId === winnerUserId) {
            room.state.player1.score += 1;
          } else if (room.state.player2 && room.state.player2.userId === winnerUserId) {
            room.state.player2.score += 1;
          }

          room.state.roundStatus = "round_finished";
          broadcastToRoom(room, {
            type: "ROUND_RESULT",
            winnerUserId,
            correctAnswer,
            state: room.state,
          });

          // 3 saniye sonra bir sonraki tura geç veya maçı bitir
          setTimeout(() => {
            if (room.state.currentRound >= (room.state.maxRounds || ROUNDS_PER_MATCH)) {
              room.state.status = "match_finished";
            } else {
              room.state.currentRound += 1;
              room.state.roundStatus = "picking_teams";
              room.state.team1 = null;
              room.state.team2 = null;
              if (room.state.player1) room.state.player1.selectedTeamId = null;
              if (room.state.player2) room.state.player2.selectedTeamId = null;

              // Yeni tur için 5sn sayacını başlat
              startServerTimer(room, PICK_TIME_SECONDS, () => {
                room.state.roundStatus = "answering";
                room.state.roundStartTime = Date.now();
                broadcastRoomState(room);
              });
            }
            broadcastRoomState(room);
          }, 3000);
          break;
        }

        // --- 5. Zaman Aşımı (Kimse cevap veremediğinde) ---
        case "ROUND_TIMEOUT": {
          if (room.state.roundStatus !== "answering") return;
          room.state.roundStatus = "round_finished";
          broadcastToRoom(room, {
            type: "ROUND_RESULT",
            winnerUserId: null,
            isDraw: true,
            state: room.state,
          });

          setTimeout(() => {
            if (room.state.currentRound >= (room.state.maxRounds || ROUNDS_PER_MATCH)) {
              room.state.status = "match_finished";
            } else {
              room.state.currentRound += 1;
              room.state.roundStatus = "picking_teams";
              room.state.team1 = null;
              room.state.team2 = null;
              if (room.state.player1) room.state.player1.selectedTeamId = null;
              if (room.state.player2) room.state.player2.selectedTeamId = null;
            }
            broadcastRoomState(room);
          }, 3000);
          break;
        }
      }
    } catch (err) {
      console.error("[WebSocket Message Parse Error]:", err);
    }
  });

  ws.on("close", () => {
    room.clients.delete(ws);
    console.log(`[WebSocket] Client ayrıldı. Oda: "${roomId}" (Kalan: ${room.clients.size})`);
    if (room.clients.size === 0) {
      if (room.timer) clearInterval(room.timer);
      rooms.delete(roomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Realtime Server] WebSocket sunucusu port ${PORT} üzerinde hazır! (ws://localhost:${PORT})`);
});
