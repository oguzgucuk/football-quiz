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
import { verifyPlayerAnswerInServer } from "../lib/realtime/verifyPlayerAnswerInServer";
import { finalizeMatchAndPersistElo, CompletedRoundData } from "../lib/db/matches";
import {
  createSession,
  validateSession,
  startGracePeriod,
  clearGracePeriod,
  getActiveGracePeriod,
  clearRoomSessions,
} from "../lib/realtime/sessionManager";

import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_ROUND_DURATION,
  DEFAULT_PICK_DURATION,
  DEFAULT_MAX_ROUNDS,
  resolveRoundDuration,
  prepareAnsweringPhase,
  recordRoundTimeout,
  evaluateAnswerSubmission,
  evaluatePassVote,
  prepareNextRound,
  registerTeamPick,
} from "../lib/realtime/roomEngine";

const PORT = parseInt(process.env.PORT || "1999", 10);
const ROUNDS_PER_MATCH = DEFAULT_MAX_ROUNDS;
const PICK_TIME_SECONDS = DEFAULT_PICK_DURATION;
const ANSWER_TIME_SECONDS = DEFAULT_ROUND_DURATION;

interface Room {
  id: string;
  state: RoomState;
  clients: Map<WebSocket, { userId?: string; username?: string }>;
  timer?: NodeJS.Timeout;
  timerSecondsLeft?: number;
  completedRounds: CompletedRoundData[];
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
      completedRounds: [],
    };
    room.state.maxRounds = ROUNDS_PER_MATCH;
    room.state.roundDuration = resolveRoundDuration(roomId, room.state.roundDuration);
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

  const { state, duration } = prepareAnsweringPhase(room.state, DEFAULT_POPULAR_TEAMS);
  room.state = state;
  broadcastRoomState(room);

  startServerTimer(room, duration, () => {
    handleRoundTimeout(room);
  });
}

// Zaman aşımı (Kimse bilemedi)
function handleRoundTimeout(room: Room) {
  if (room.state.roundStatus !== "answering") return;

  const { state, completedRound } = recordRoundTimeout(room.state);
  room.state = state;
  room.completedRounds.push(completedRound);

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
    const { isMatchFinished, state } = prepareNextRound(room.state, ROUNDS_PER_MATCH);
    room.state = state;

    if (isMatchFinished) {
      broadcastRoomState(room);

      // P1-8: Maç bittiğinde ELO hesapla ve DB'ye atomik transaction ile kaydet
      const p1Id = room.state.player1?.userId;
      const p2Id = room.state.player2?.userId;

      if (p1Id && p2Id) {
        finalizeMatchAndPersistElo({
          matchId: room.id,
          player1Id: p1Id,
          player2Id: p2Id,
          player1Score: room.state.player1?.score || 0,
          player2Score: room.state.player2?.score || 0,
          ranked: !p2Id.startsWith("bot_") && !p1Id.startsWith("bot_"),
          rounds: room.completedRounds,
        })
          .then((result) => {
            console.log(`🏆 [Party/Server] Maç ${room.id} başarıyla DB'ye işlendi:`, result);
            broadcastToRoom(room, {
              type: "MATCH_PERSISTED",
              result,
              state: room.state,
            });
          })
          .catch((err) => {
            console.error("[Party/Server] finalizeMatchAndPersistElo Hatası:", err);
          });
      }
    } else {
      if (room.state.player2?.userId.startsWith("bot_")) {
        const botTeam = DEFAULT_POPULAR_TEAMS[Math.floor(Math.random() * DEFAULT_POPULAR_TEAMS.length)];
        room.state.player2.selectedTeamId = botTeam.id;
        room.state.team2 = botTeam;
      }

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

  ws.on("message", async (rawMessage: string) => {
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

          const slot = (!room.state.player1 || room.state.player1.userId === userId) ? "player1" : "player2";
          const sessionToken = createSession(roomId, userId, slot);

          ws.send(
            JSON.stringify({
              type: "SESSION_GRANTED",
              sessionToken,
              userId,
            })
          );

          if (!room.state.player1 || room.state.player1.userId === userId) {
            room.state.player1 = {
              userId,
              username,
              score: room.state.player1?.score || 0,
              isReady: true,
              isDisconnected: false,
              disconnectedAt: null,
            };
          } else if (!room.state.player2 || room.state.player2.userId === userId) {
            room.state.player2 = {
              userId,
              username,
              score: room.state.player2?.score || 0,
              isReady: true,
              isDisconnected: false,
              disconnectedAt: null,
            };
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

        case "REJOIN": {
          const { roomId: reqRoomId, sessionToken, userId } = data;
          const targetRoomId = reqRoomId || roomId;
          const targetRoom = rooms.get(targetRoomId);

          if (!targetRoom) {
            ws.send(JSON.stringify({ type: "REJOIN_FAILED", reason: "Oda bulunamadı veya kapandı." }));
            break;
          }

          const validSession = validateSession(targetRoomId, userId, sessionToken);
          if (!validSession) {
            ws.send(JSON.stringify({ type: "REJOIN_FAILED", reason: "Geçersiz veya süresi dolmuş oturum belirteci." }));
            break;
          }

          // Grace period'u temizle
          clearGracePeriod(targetRoomId);
          targetRoom.state.disconnectGrace = null;

          // Yeni bağlantıyı odaya bağla
          targetRoom.clients.set(ws, { userId, username: data.username });

          if (targetRoom.state.player1 && targetRoom.state.player1.userId === userId) {
            targetRoom.state.player1.isDisconnected = false;
            targetRoom.state.player1.disconnectedAt = null;
          } else if (targetRoom.state.player2 && targetRoom.state.player2.userId === userId) {
            targetRoom.state.player2.isDisconnected = false;
            targetRoom.state.player2.disconnectedAt = null;
          }

          console.log(`🔄 [REJOIN] ${userId} odaya başarıyla geri bağlandı (${targetRoomId}).`);

          ws.send(
            JSON.stringify({
              type: "REJOIN_SUCCESS",
              sessionToken,
              userId,
              state: targetRoom.state,
            })
          );

          broadcastToRoom(targetRoom, {
            type: "PLAYER_RECONNECTED",
            userId,
          });
          broadcastRoomState(targetRoom);
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
          if (!effectiveUserId || !team) break;

          const pickResult = registerTeamPick(room.state, effectiveUserId, team);
          room.state = pickResult.state;

          if (pickResult.bothPicked && room.state.roundStatus === "picking_teams") {
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
          if (room.state.roundStatus !== "answering" || !effectiveUserId) return;

          const isVsBot = Boolean(room.state.player2?.userId.startsWith("bot_"));
          const passResult = evaluatePassVote(room.state, effectiveUserId);
          room.state = passResult.state;

          const allVoted = passResult.bothPassed || (isVsBot && room.state.passVotes.includes(effectiveUserId));

          if (allVoted) {
            if (room.timer) {
              clearInterval(room.timer);
              room.timer = undefined;
            }

            room.state.roundStatus = "round_finished";
            if (passResult.completedRound) {
              room.completedRounds.push(passResult.completedRound);
            }

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

        case "SUBMIT_ANSWER": {
          const { name, userId } = data;
          if (room.state.roundStatus !== "answering") return;
          if (!room.state.team1 || !room.state.team2) return;

          const clientMeta = room.clients.get(ws);
          const senderId = clientMeta?.userId || userId;
          if (!senderId) return;

          const team1Id = room.state.team1.id;
          const team2Id = room.state.team2.id;

          try {
            const result = await verifyPlayerAnswerInServer(name, team1Id, team2Id);

            if (room.state.roundStatus !== "answering") return;

            if (result.isCorrect && result.playerName) {
              if (room.timer) {
                clearInterval(room.timer);
                room.timer = undefined;
              }

              const outcome = evaluateAnswerSubmission(
                room.state,
                senderId,
                result,
                room.state.roundStartTime ? Date.now() - room.state.roundStartTime : undefined
              );

              if (!outcome.accepted) return;

              room.state = outcome.state;
              if (outcome.completedRound) {
                room.completedRounds.push(outcome.completedRound);
              }

              broadcastToRoom(room, {
                type: "ROUND_RESULT",
                winnerUserId: senderId,
                correctAnswer: result.playerName,
                state: room.state,
              });

              scheduleNextRound(room);
            } else {
              ws.send(JSON.stringify({ type: "ANSWER_FEEDBACK", isCorrect: false }));
            }
          } catch (err) {
            console.error("[Party/Server] SUBMIT_ANSWER verification error:", err);
          }
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
    const clientMeta = room.clients.get(ws);
    const disconnectedUserId = clientMeta?.userId;
    room.clients.delete(ws);
    console.log(`[WebSocket] Client ayrıldı. Oda: "${roomId}" (Kalan: ${room.clients.size})`);

    const isMatchActive = room.state.status === "in_round";
    const isPlayer1 = room.state.player1?.userId === disconnectedUserId;
    const isPlayer2 = room.state.player2?.userId === disconnectedUserId;

    if (isMatchActive && (isPlayer1 || isPlayer2) && disconnectedUserId && !disconnectedUserId.startsWith("bot_")) {
      const disconnectedPlayer = isPlayer1 ? room.state.player1! : room.state.player2!;
      const remainingPlayer = isPlayer1 ? room.state.player2 : room.state.player1;

      disconnectedPlayer.isDisconnected = true;
      disconnectedPlayer.disconnectedAt = Date.now();

      startGracePeriod(
        roomId,
        disconnectedUserId,
        disconnectedPlayer.username,
        (secondsLeft) => {
          room.state.disconnectGrace = {
            userId: disconnectedUserId,
            username: disconnectedPlayer.username,
            expiresAt: Date.now() + secondsLeft * 1000,
            secondsLeft,
          };
          broadcastToRoom(room, {
            type: "DISCONNECT_TICK",
            userId: disconnectedUserId,
            secondsLeft,
          });
          broadcastRoomState(room);
        },
        () => {
          console.log(`⏱️ [Grace Period Doldu] ${disconnectedPlayer.username} 10sn içinde dönmedi. Hükmen galibiyet!`);
          if (room.timer) {
            clearInterval(room.timer);
            room.timer = undefined;
          }

          const winnerUserId = remainingPlayer?.userId || "unknown";
          room.state.status = "match_finished";
          room.state.disconnectGrace = null;
          room.state.forfeitInfo = {
            forfeitUserId: disconnectedUserId,
            winnerUserId,
            reason: `${disconnectedPlayer.username} bağlantıyı kesti ve 10 saniye içinde dönmedi.`,
          };

          broadcastToRoom(room, {
            type: "PLAYER_FORFEIT",
            forfeitUserId: disconnectedUserId,
            winnerUserId,
            reason: room.state.forfeitInfo.reason,
            state: room.state,
          });
          broadcastRoomState(room);

          setTimeout(() => {
            clearRoomSessions(roomId);
            rooms.delete(roomId);
          }, 30000);
        }
      );

      room.state.disconnectGrace = {
        userId: disconnectedUserId,
        username: disconnectedPlayer.username,
        expiresAt: Date.now() + 10000,
        secondsLeft: 10,
      };

      broadcastToRoom(room, {
        type: "PLAYER_DISCONNECTED",
        userId: disconnectedUserId,
        graceSeconds: 10,
      });
      broadcastRoomState(room);
      return;
    }

    if (room.clients.size === 0 && !getActiveGracePeriod(roomId)) {
      if (room.timer) clearInterval(room.timer);
      clearRoomSessions(roomId);
      rooms.delete(roomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Realtime Server] WebSocket sunucusu port ${PORT} üzerinde hazır! (ws://localhost:${PORT})`);
});
