/**
 * Realtime WebSocket Oyun, Oda ve Matchmaking Sunucusu (PartyKit Protokolü Uyumlu).
 * - Canlı 1v1 Eşleştirme Havuzu (Matchmaking Queue)
 * - Özel Oda Yönetimi ve Server-Side Timer Senkronizasyonu
 * - 5sn Takım Seçimi ve 15sn Cevap Sayacı
 */

import { createServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team } from "../types/game";

const PORT = parseInt(process.env.PORT || "1999", 10);
const ROUNDS_PER_MATCH = 5;
const PICK_TIME_SECONDS = 5;
const ANSWER_TIME_SECONDS = 15;

const DEFAULT_POPULAR_TEAMS: Team[] = [
  { id: "cmtfrb40e00dtu6k4wklez572", name: "Real Madrid", country: "Spain", league: "La Liga", logoUrl: "/team-logos/cmtfrb40e00dtu6k4wklez572.svg" },
  { id: "cmtfrb40c003au6k4nfn56sus", name: "FC Barcelona", country: "Spain", league: "La Liga", logoUrl: "/team-logos/cmtfrb40c003au6k4nfn56sus.png" },
  { id: "cmtfrb40c003lu6k4drdv5sfi", name: "Galatasaray", country: "Türkiye", league: "Süper Lig", logoUrl: "/team-logos/cmtfrb40c003lu6k4drdv5sfi.svg" },
  { id: "cmtfrb40e00bpu6k4hmbu9cbf", name: "Fenerbahçe", country: "Türkiye", league: "Süper Lig", logoUrl: "/team-logos/cmtfrb40e00bpu6k4hmbu9cbf.png" },
  { id: "cmtfrb40b001xu6k47fc7n16j", name: "Beşiktaş", country: "Türkiye", league: "Süper Lig", logoUrl: "/team-logos/cmtfrb40b001xu6k47fc7n16j.svg" },
  { id: "cmtfrb40f00f8u6k4sot14ojx", name: "AC Milan", country: "Italy", league: "Serie A", logoUrl: "/team-logos/cmtfrb40f00f8u6k4sot14ojx.svg" },
  { id: "cmtfrb40f00elu6k4tgttd211", name: "Inter Milan", country: "Italy", league: "Serie A", logoUrl: "/team-logos/cmtfrb40f00elu6k4tgttd211.svg" },
  { id: "cmtfrb40f00fdu6k4upvw15gj", name: "Juventus", country: "Italy", league: "Serie A", logoUrl: "/team-logos/cmtfrb40f00fdu6k4upvw15gj.svg" },
  { id: "cmtfrb40g00lxu6k4zyc9ngsw", name: "Manchester United", country: "England", league: "Premier League", logoUrl: "/team-logos/cmtfrb40g00lxu6k4zyc9ngsw.png" },
  { id: "cmtfrb40f00hbu6k4ixa7ye8a", name: "Chelsea FC", country: "England", league: "Premier League", logoUrl: "/team-logos/cmtfrb40f00hbu6k4ixa7ye8a.png" },
  { id: "cmtfrb40d008pu6k4jemghzq0", name: "Bayern München", country: "Germany", league: "Bundesliga", logoUrl: "/team-logos/cmtfrb40d008pu6k4jemghzq0.svg" },
  { id: "cmtfrb40c004nu6k4gn075jtk", name: "Borussia Dortmund", country: "Germany", league: "Bundesliga", logoUrl: "/team-logos/cmtfrb40c004nu6k4gn075jtk.svg" },
  { id: "cmtfrb40c0036u6k463i99nss", name: "Atlético de Madrid", country: "Spain", league: "La Liga", logoUrl: "/team-logos/cmtfrb40c0036u6k463i99nss.png" },
  { id: "cmtfrj6ve000pu6t8gspq4v3h", name: "Boca Juniors", country: "Argentina", league: "Primera División", logoUrl: "/team-logos/cmtfrj6ve000pu6t8gspq4v3h.svg" },
  { id: "cmtfrb40c0064u6k4rd98tz21", name: "River Plate", country: "Argentina", league: "Primera División", logoUrl: "/team-logos/cmtfrb40c0064u6k4rd98tz21.svg" },
  { id: "cmtfrj0ul000cu6t8j88ybi62", name: "Flamengo", country: "Brazil", league: "Serie A", logoUrl: "/team-logos/cmtfrj0ul000cu6t8j88ybi62.svg" },
  { id: "cmtfrb40c006eu6k4xv2lg93k", name: "Santos FC", country: "Brazil", league: "Serie A", logoUrl: "/team-logos/cmtfrb40c006eu6k4xv2lg93k.png" },
  { id: "cmtfrb40f00ggu6k4ck93hvci", name: "São Paulo FC", country: "Brazil", league: "Serie A", logoUrl: "/team-logos/cmtfrb40f00ggu6k4ck93hvci.svg" },
];

interface Room {
  id: string;
  state: RoomState;
  clients: Map<WebSocket, { userId?: string; username?: string }>;
  timer?: NodeJS.Timeout;
  timerSecondsLeft?: number;
}

interface QueuedPlayer {
  ws: WebSocket;
  userId: string;
  username: string;
  eloRating?: number;
  roundDuration: number;
  joinedAt: number;
}

const rooms = new Map<string, Room>();
let matchmakingQueue: QueuedPlayer[] = [];

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", activeRooms: rooms.size, queueSize: matchmakingQueue.length, timestamp: Date.now() }));
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
    const match = roomId.match(/_(\d+)s_/);
    if (match && match[1]) {
      room.state.roundDuration = parseInt(match[1], 10);
    }
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
    durationSeconds,
    serverTimestamp: Date.now(),
  });

  room.timer = setInterval(() => {
    if (room.timerSecondsLeft === undefined || room.timerSecondsLeft <= 1) {
      if (room.timer) {
        clearInterval(room.timer);
        room.timer = undefined;
      }
      room.timerSecondsLeft = 0;
      onComplete();
    } else {
      room.timerSecondsLeft -= 1;
      broadcastToRoom(room, {
        type: "TIMER_TICK",
        secondsLeft: room.timerSecondsLeft,
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

  // Dinamik cevap sayacını başlat (5, 10, 15, 20 sn)
  const duration = room.state.roundDuration || ANSWER_TIME_SECONDS;
  startServerTimer(room, duration, () => {
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
      if (room.state.player2) {
        if (room.state.player2.userId.startsWith("bot_")) {
          const botTeam = DEFAULT_POPULAR_TEAMS[Math.floor(Math.random() * DEFAULT_POPULAR_TEAMS.length)];
          room.state.player2.selectedTeamId = botTeam.id;
          room.state.team2 = botTeam;
        } else {
          room.state.player2.selectedTeamId = null;
        }
      }

      room.state.passVotes = [];
      broadcastRoomState(room);

      const pickDuration = room.state.roundDuration || PICK_TIME_SECONDS;
      startServerTimer(room, pickDuration, () => {
        transitionToAnsweringPhase(room);
      });
    }
  }, 3000);
}

// MATCHMAKING İŞLEYİCİSİ
function handleMatchmakingConnection(ws: WebSocket) {
  let playerInfo: { userId?: string; username?: string; eloRating?: number } = {};

  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      if (data.type === "MATCHMAKING_JOIN") {
        const { userId, username, eloRating } = data;
        const roundDuration = [5, 10, 15, 20].includes(Number(data.roundDuration))
          ? Number(data.roundDuration)
          : 15;
        playerInfo = { userId, username, eloRating };

        // Kuyruktaki ölü bağlantıları temizle
        matchmakingQueue = matchmakingQueue.filter(
          (p) => p.ws.readyState === WebSocket.OPEN && p.userId !== userId
        );

        // Kuyrukta AYNI SÜREYİ seçmiş başka bir oyuncu var mı?
        const opponentIndex = matchmakingQueue.findIndex((p) => p.roundDuration === roundDuration);

        if (opponentIndex !== -1) {
          const opponent = matchmakingQueue.splice(opponentIndex, 1)[0];
          const matchId = `match_${roundDuration}s_${Math.random().toString(36).substring(2, 8)}`;

          console.log(`🎉 [Matchmaking] Eşleşme bulundu (${roundDuration}s): ${username} vs ${opponent.username} -> Oda: ${matchId}`);

          // Her iki oyuncuya bildirim gönder
          opponent.ws.send(
            JSON.stringify({
              type: "MATCH_FOUND",
              matchId,
              roundDuration,
              opponent: { userId, username, eloRating },
            })
          );

          ws.send(
            JSON.stringify({
              type: "MATCH_FOUND",
              matchId,
              roundDuration,
              opponent: { userId: opponent.userId, username: opponent.username, eloRating: opponent.eloRating },
            })
          );
        } else {
          // Kuyruğa ekle
          matchmakingQueue.push({
            ws,
            userId,
            username,
            eloRating,
            roundDuration,
            joinedAt: Date.now(),
          });

          console.log(`⏱️ [Matchmaking] Kuyruğa katıldı (${roundDuration}s): ${username} (Kuyruk boyutu: ${matchmakingQueue.length})`);
          ws.send(JSON.stringify({ type: "QUEUE_STATUS", queueSize: matchmakingQueue.filter((p) => p.roundDuration === roundDuration).length }));
        }
      } else if (data.type === "MATCHMAKING_LEAVE") {
        matchmakingQueue = matchmakingQueue.filter((p) => p.ws !== ws);
        console.log(`👋 [Matchmaking] Kuyruktan ayrıldı (Kalan: ${matchmakingQueue.length})`);
      } else if (data.type === "REQUEST_BOT_MATCH") {
        const roundDuration = [5, 10, 15, 20].includes(Number(data.roundDuration))
          ? Number(data.roundDuration)
          : 15;
        matchmakingQueue = matchmakingQueue.filter((p) => p.ws !== ws);
        const matchId = `match_bot_${roundDuration}s_${Math.random().toString(36).substring(2, 8)}`;
        ws.send(
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
      console.error("[Matchmaking Parse Error]:", err);
    }
  });

  ws.on("close", () => {
    matchmakingQueue = matchmakingQueue.filter((p) => p.ws !== ws);
    if (playerInfo.username) {
      console.log(`👋 [Matchmaking] ${playerInfo.username} ayrıldı (Kalan: ${matchmakingQueue.length})`);
    }
  });
}

server.on("upgrade", (request, socket, head) => {
  const roomId = extractRoomId(request.url);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, roomId);
  });
});

wss.on("connection", (ws: WebSocket, request: IncomingMessage, roomId: string) => {
  if (roomId === "matchmaking" || request.url?.includes("/parties/matchmaking")) {
    handleMatchmakingConnection(ws);
    return;
  }

  const room = getOrCreateRoom(roomId);
  room.clients.set(ws, {});

  console.log(`[WebSocket] Client bağlandı. Oda: "${roomId}" (Toplam: ${room.clients.size})`);

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

        case "ADD_BOT":
        case "ADD_BOT_PLAYER": {
          if (room.state.status !== "waiting_for_players" || room.state.player2) break;

          const botUserId = "bot_" + Math.random().toString(36).substring(2, 7);
          const botNames = ["Yapay Zeka 🤖", "Hızlı Forvet ⚡", "Taktik Dehası 🧠", "Gol Makinesi ⚽"];
          const randomBotName = botNames[Math.floor(Math.random() * botNames.length)];

          room.state.player2 = {
            userId: botUserId,
            username: randomBotName,
            score: 0,
            isReady: true,
          };

          const botTeam = DEFAULT_POPULAR_TEAMS[Math.floor(Math.random() * DEFAULT_POPULAR_TEAMS.length)];
          room.state.player2.selectedTeamId = botTeam.id;
          room.state.team2 = botTeam;

          room.state.status = "in_round";
          room.state.roundStatus = "picking_teams";
          room.state.currentRound = 1;
          broadcastRoomState(room);

          startServerTimer(room, PICK_TIME_SECONDS, () => {
            transitionToAnsweringPhase(room);
          });
          break;
        }

        case "TEAM_PICKED": {
          const { userId, team } = data as { userId: string; team: Team };
          const clientMeta = room.clients.get(ws);
          const effectiveUserId = userId || clientMeta?.userId;

          if (room.state.player1 && (room.state.player1.userId === effectiveUserId || clientMeta?.userId === room.state.player1.userId)) {
            room.state.player1.selectedTeamId = team.id;
            room.state.team1 = team;
            console.log(`[TEAM_PICKED] Player 1 (${room.state.player1.username}) takım seçti: ${team.name}`);
          } else if (room.state.player2 && (room.state.player2.userId === effectiveUserId || clientMeta?.userId === room.state.player2.userId)) {
            room.state.player2.selectedTeamId = team.id;
            room.state.team2 = team;
            console.log(`[TEAM_PICKED] Player 2 (${room.state.player2.username}) takım seçti: ${team.name}`);
          } else {
            console.warn(`[TEAM_PICKED] Eşleşmeyen userId: ${userId}, clientMeta: ${clientMeta?.userId}`);
          }

          if (room.state.team1 && room.state.team2 && room.state.roundStatus === "picking_teams") {
            room.state.passVotes = [];
            transitionToAnsweringPhase(room);
            return;
          }

          broadcastRoomState(room);
          break;
        }

        case "PASS_VOTE": {
          const { userId } = data;
          const clientMeta = room.clients.get(ws);
          const effectiveUserId = userId || clientMeta?.userId;

          if (!room.state.passVotes) room.state.passVotes = [];
          if (effectiveUserId && !room.state.passVotes.includes(effectiveUserId)) {
            room.state.passVotes.push(effectiveUserId);
          }

          const isVsBot = Boolean(room.state.player2?.userId.startsWith("bot_"));
          const allVoted = room.state.passVotes.length >= 2 || (isVsBot && room.state.passVotes.length >= 1);

          if (allVoted && room.state.roundStatus === "answering") {
            if (room.timer) {
              clearInterval(room.timer);
              room.timer = undefined;
            }

            room.state.roundStatus = "round_finished";
            broadcastToRoom(room, {
              type: "ROUND_RESULT",
              winnerUserId: null,
              correctAnswer: "Tur Karşılıklı Pas Geçildi ⏩",
              isDraw: true,
              state: room.state,
            });

            scheduleNextRound(room);
          } else {
            broadcastRoomState(room);
          }
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
