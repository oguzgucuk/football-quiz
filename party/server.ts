/**
 * Realtime WebSocket Oyun ve Oda Sunucusu (PartyKit Protokolü Uyumlu).
 * Kesintisiz Server-Side Timer, Otomatik Tur Geçişi, 5sn Takım Seçimi ve 15sn Cevap Sayacı.
 */

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team } from "../types/game";

const PORT = parseInt(process.env.PORT || "1999", 10);
const ROUNDS_PER_MATCH = 5;
const PICK_TIME_SECONDS = 5;
const ANSWER_TIME_SECONDS = 15;

const DEFAULT_POPULAR_TEAMS: Team[] = [
  { id: "cmtfrb40e00dtu6k4wklez572", name: "Real Madrid", country: "Spain", league: "La Liga" },
  { id: "cmtfrb40c003au6k4nfn56sus", name: "FC Barcelona", country: "Spain", league: "La Liga" },
  { id: "cmtfrb40c003lu6k4drdv5sfi", name: "Galatasaray", country: "Türkiye", league: "Süper Lig" },
  { id: "cmtfrb40e00bpu6k4hmbu9cbf", name: "Fenerbahçe", country: "Türkiye", league: "Süper Lig" },
  { id: "cmtfrb40b001xu6k47fc7n16j", name: "Beşiktaş", country: "Türkiye", league: "Süper Lig" },
  { id: "cmtfrb40f00f8u6k4sot14ojx", name: "AC Milan", country: "Italy", league: "Serie A" },
  { id: "cmtfrb40f00elu6k4tgttd211", name: "Inter Milan", country: "Italy", league: "Serie A" },
  { id: "cmtfrb40f00fdu6k4upvw15gj", name: "Juventus", country: "Italy", league: "Serie A" },
  { id: "cmtfrb40g00lxu6k4zyc9ngsw", name: "Manchester United", country: "England", league: "Premier League" },
  { id: "cmtfrb40d00a8u6k4m2d2ugpk", name: "Liverpool FC", country: "England", league: "Premier League" },
  { id: "cmtfrb40b001eu6k42089qg7e", name: "Arsenal FC", country: "England", league: "Premier League" },
  { id: "cmtfrb40f00hbu6k4ixa7ye8a", name: "Chelsea FC", country: "England", league: "Premier League" },
  { id: "cmtfrb40d008pu6k4jemghzq0", name: "Bayern München", country: "Germany", league: "Bundesliga" },
  { id: "cmtfrb40c004nu6k4gn075jtk", name: "Borussia Dortmund", country: "Germany", league: "Bundesliga" },
  { id: "cmtfrb40f00gfu6k40vcq2xkq", name: "Paris Saint-Germain", country: "France", league: "Ligue 1" },
  { id: "cmtfrb40c0036u6k463i99nss", name: "Atlético de Madrid", country: "Spain", league: "La Liga" },
];

interface Room {
  id: string;
  state: RoomState;
  clients: Map<WebSocket, { userId?: string; username?: string }>;
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
      clients: new Map(),
    };
    room.state.maxRounds = ROUNDS_PER_MATCH;
    rooms.set(roomId, room);
  }
  return room;
}

function broadcastToRoom(room: Room, message: object) {
  const payload = JSON.stringify(message);
  for (const [client] of room.clients) {
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
      broadcastToRoom(room, {
        type: "TIMER_TICK",
        secondsLeft: 0,
        serverTimestamp: Date.now(),
      });
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

// 5sn Takım Seçimi tamamlandığında takımları kilitleyip 15sn Cevaplama aşamasına geçiş
function transitionToAnsweringPhase(room: Room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = undefined;
  }

  // Oyuncular takım seçmediyse varsayılan popüler takımları ata
  if (!room.state.team1) {
    room.state.team1 = DEFAULT_POPULAR_TEAMS[0];
    if (room.state.player1) room.state.player1.selectedTeamId = room.state.team1.id;
  }

  if (!room.state.team2) {
    const available = DEFAULT_POPULAR_TEAMS.filter((t) => t.id !== room.state.team1?.id);
    room.state.team2 = available[0] || DEFAULT_POPULAR_TEAMS[1];
    if (room.state.player2) room.state.player2.selectedTeamId = room.state.team2.id;
  }

  room.state.roundStatus = "answering";
  room.state.roundStartTime = Date.now();
  broadcastRoomState(room);

  // 15 saniyelik cevap sayacını başlat
  startServerTimer(room, ANSWER_TIME_SECONDS, () => {
    // 15 sn içinde kimse bilemediğinde tur berabere biter
    handleRoundTimeout(room);
  });
}

// Zaman aşımı (Kimse bilemedi)
function handleRoundTimeout(room: Room) {
  if (room.state.roundStatus !== "answering") return;

  room.state.roundStatus = "round_finished";
  broadcastToRoom(room, {
    type: "ROUND_RESULT",
    winnerUserId: null,
    correctAnswer: "Süre Doldu!",
    isDraw: true,
    state: room.state,
  });

  scheduleNextRound(room);
}

// Tur sonrası 3sn bekleyip yeni tura veya maç sonuna geçiş
function scheduleNextRound(room: Room) {
  setTimeout(() => {
    if (room.state.currentRound >= (room.state.maxRounds || ROUNDS_PER_MATCH)) {
      room.state.status = "match_finished";
      broadcastRoomState(room);
    } else {
      room.state.currentRound += 1;
      room.state.roundStatus = "picking_teams";
      room.state.team1 = null;
      room.state.team2 = null;
      if (room.state.player1) room.state.player1.selectedTeamId = null;
      if (room.state.player2) room.state.player2.selectedTeamId = null;

      broadcastRoomState(room);

      // Yeni tur için 5sn takım seçimi sayacını başlat
      startServerTimer(room, PICK_TIME_SECONDS, () => {
        transitionToAnsweringPhase(room);
      });
    }
  }, 3000);
}

server.on("upgrade", (request, socket, head) => {
  const roomId = extractRoomId(request.url);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, roomId);
  });
});

wss.on("connection", (ws: WebSocket, request: any, roomId: string) => {
  const room = getOrCreateRoom(roomId);
  room.clients.set(ws, {});

  console.log(`[WebSocket] Client bağlandı. Oda: "${roomId}" (Toplam: ${room.clients.size})`);

  // İlk bağlantı senkronizasyonu
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

        case "PLAYER_JOIN": {
          const { userId, username } = data;
          const clientMeta = room.clients.get(ws);
          if (clientMeta) {
            clientMeta.userId = userId;
            clientMeta.username = username;
          }

          if (!room.state.player1 || room.state.player1.userId === userId) {
            room.state.player1 = { userId, username, score: room.state.player1?.score || 0, isReady: true };
          } else if (!room.state.player2 || room.state.player2.userId === userId) {
            room.state.player2 = { userId, username, score: room.state.player2?.score || 0, isReady: true };
          }

          // İki oyuncu da hazır olduğunda maçı ve 1. Turu başlat
          if (room.state.player1 && room.state.player2 && room.state.status === "waiting_for_players") {
            room.state.status = "in_round";
            room.state.roundStatus = "picking_teams";
            room.state.currentRound = 1;
            broadcastRoomState(room);

            startServerTimer(room, PICK_TIME_SECONDS, () => {
              transitionToAnsweringPhase(room);
            });
            break;
          }

          broadcastRoomState(room);
          break;
        }

        case "TEAM_PICKED": {
          const { userId, team } = data as { userId: string; team: Team };
          if (room.state.player1?.userId === userId) {
            room.state.player1.selectedTeamId = team.id;
            room.state.team1 = team;
          } else if (room.state.player2?.userId === userId) {
            room.state.player2.selectedTeamId = team.id;
            room.state.team2 = team;
          }

          // İki oyuncu da 5 sn dolmadan takım seçtiyse hemen cevaplama aşamasına geç
          if (room.state.team1 && room.state.team2 && room.state.roundStatus === "picking_teams") {
            transitionToAnsweringPhase(room);
            return;
          }

          broadcastRoomState(room);
          break;
        }

        case "ROUND_WINNER": {
          const { winnerUserId, correctAnswer } = data;
          if (room.state.roundStatus !== "answering") return;

          if (room.timer) {
            clearInterval(room.timer);
            room.timer = undefined;
          }

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

          scheduleNextRound(room);
          break;
        }

        case "ROUND_TIMEOUT": {
          handleRoundTimeout(room);
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
