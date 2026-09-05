/**
 * Realtime WebSocket Oyun ve Oda Sunucusu (PartyKit Protokolü Uyumlu).
 * - 1v1 Oyun ve Özel Oda Yönetimi
 * - Dinamik Tur Süresi (5s, 10s, 15s, 20s)
 * - Server-Side Doğrulama, Timer ve Kesinti (Grace Period) Yönetimi
 */

import { createServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team, Nation } from "../types/game";
import { verifyPlayerAnswerInServer } from "../lib/realtime/verifyPlayerAnswerInServer";
import { verifyNationAnswerInServer } from "../lib/realtime/verifyNationAnswer";
import { finalizeMatchAndPersistElo, CompletedRoundData } from "../lib/db/matches";
import {
  createSession,
  validateSession,
  clearGracePeriod,
  getActiveGracePeriod,
  clearRoomSessions,
} from "../lib/realtime/sessionManager";

import {
  DEFAULT_POPULAR_TEAMS,
  DEFAULT_ROUND_DURATION,
  DEFAULT_MAX_ROUNDS,
  resolveRoundDuration,
  prepareAnsweringPhase,
  recordRoundTimeout,
  evaluateAnswerSubmission,
  evaluatePassVote,
  prepareNextRound,
  registerTeamPick,
  registerNationPick,
} from "../lib/realtime/roomEngine";
import { createBotPlayer, pickBotTeam, pickBotNation, isBotPlayer } from "../lib/realtime/botSimulator";
import { handleMatchPlayerDisconnect } from "../lib/realtime/disconnectManager";
import { handleLocalMatchmakingSocket, getMatchmakingQueueCount } from "./localMatchmaking";

const PORT = parseInt(process.env.PORT || "1999", 10);
const ROUNDS_PER_MATCH = DEFAULT_MAX_ROUNDS;

interface Room {
  id: string;
  state: RoomState;
  clients: Map<WebSocket, { userId?: string; username?: string }>;
  timer?: NodeJS.Timeout;
  timerSecondsLeft?: number;
  completedRounds: CompletedRoundData[];
}

const rooms = new Map<string, Room>();

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        activeRooms: rooms.size,
        queueSize: getMatchmakingQueueCount(),
        timestamp: Date.now(),
      })
    );
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

function clearRoomTimer(room: Room) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = undefined;
  }
}

function startServerTimer(room: Room, durationSeconds: number, onComplete: () => void) {
  clearRoomTimer(room);
  room.timerSecondsLeft = durationSeconds;

  broadcastToRoom(room, {
    type: "TIMER_START",
    durationSeconds,
    serverTimestamp: Date.now(),
  });

  room.timer = setInterval(() => {
    if (room.timerSecondsLeft === undefined || room.timerSecondsLeft <= 1) {
      clearRoomTimer(room);
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

function transitionToAnsweringPhase(room: Room) {
  clearRoomTimer(room);
  const { state, duration } = prepareAnsweringPhase(room.state, DEFAULT_POPULAR_TEAMS);
  room.state = state;
  broadcastRoomState(room);

  startServerTimer(room, duration, () => {
    handleRoundTimeout(room);
  });
}

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

function scheduleNextRound(room: Room) {
  setTimeout(() => {
    const { isMatchFinished, state } = prepareNextRound(room.state, ROUNDS_PER_MATCH);
    room.state = state;

    if (isMatchFinished) {
      broadcastRoomState(room);
      const p1Id = room.state.player1?.userId;
      const p2Id = room.state.player2?.userId;

      if (p1Id && p2Id) {
        const isCasual = room.id.includes("_casual_");
        const isCustom = room.id.startsWith("oda_");
        const isNationTeam = room.state.gameMode === "country_vs_team" || room.id.includes("_country_vs_team_") || room.id.includes("_millet_");
        const mode = isNationTeam ? "country_vs_team" : isCustom ? "custom" : isCasual ? "casual" : "ranked";
        const isRanked = isNationTeam ? false : (!isCasual && !isCustom && !isBotPlayer(p1Id) && !isBotPlayer(p2Id));

        finalizeMatchAndPersistElo({
          matchId: room.id,
          player1Id: p1Id,
          player2Id: p2Id,
          player1Score: room.state.player1?.score || 0,
          player2Score: room.state.player2?.score || 0,
          mode,
          ranked: isRanked,
          rounds: room.completedRounds,
        })
          .then((result) => {
            console.log(`🏆 [Party/Server] Maç ${room.id} DB'ye işlendi:`, result);
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
      if (room.state.player2 && isBotPlayer(room.state.player2.userId)) {
        const botUserId = room.state.player2.userId;
        if (room.state.gameMode === "country_vs_team") {
          if (room.state.currentNationPickerUserId === botUserId) {
            const botNation = pickBotNation();
            registerNationPick(room.state, botUserId, botNation);
          } else if (room.state.currentTeamPickerUserId === botUserId) {
            const botTeam = pickBotTeam(DEFAULT_POPULAR_TEAMS);
            registerTeamPick(room.state, botUserId, botTeam);
          }
        } else {
          const botTeam = pickBotTeam(DEFAULT_POPULAR_TEAMS);
          room.state.player2.selectedTeamId = botTeam.id;
          room.state.team2 = botTeam;
        }
      }

      broadcastRoomState(room);
      const pickDuration = room.state.roundDuration || DEFAULT_ROUND_DURATION;
      startServerTimer(room, pickDuration, () => {
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

wss.on("connection", (ws: WebSocket, request: IncomingMessage, roomId: string) => {
  if (roomId === "matchmaking" || request.url?.includes("/parties/matchmaking")) {
    handleLocalMatchmakingSocket(ws);
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
          const { userId, username, roundDuration } = data;
          if (roundDuration && [5, 10, 15, 20].includes(Number(roundDuration))) {
            room.state.roundDuration = Number(roundDuration);
          }
          const clientMeta = room.clients.get(ws);
          if (clientMeta) {
            clientMeta.userId = userId;
            clientMeta.username = username;
          }

          const slot = (!room.state.player1 || room.state.player1.userId === userId) ? "player1" : "player2";
          const sessionToken = createSession(roomId, userId, slot);

          ws.send(JSON.stringify({ type: "SESSION_GRANTED", sessionToken, userId }));

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

            if (room.state.gameMode === "country_vs_team" && !room.state.initialNationPickerUserId) {
              const startWithP1 = Math.random() < 0.5;
              room.state.initialNationPickerUserId = startWithP1 ? room.state.player1.userId : room.state.player2.userId;
              room.state.currentNationPickerUserId = room.state.initialNationPickerUserId;
              room.state.currentTeamPickerUserId = startWithP1 ? room.state.player2.userId : room.state.player1.userId;
            }

            broadcastRoomState(room);

            const pickDuration = room.state.roundDuration || DEFAULT_ROUND_DURATION;
            startServerTimer(room, pickDuration, () => {
              transitionToAnsweringPhase(room);
            });
            break;
          }

          broadcastRoomState(room);
          break;
        }

        case "REJOIN": {
          const { roomId: reqRoomId, sessionToken, userId } = data;
          const targetRoom = rooms.get(reqRoomId || roomId);

          if (!targetRoom) {
            ws.send(JSON.stringify({ type: "REJOIN_FAILED", reason: "Oda bulunamadı veya kapandı." }));
            break;
          }

          const validSession = validateSession(reqRoomId || roomId, userId, sessionToken);
          if (!validSession) {
            ws.send(JSON.stringify({ type: "REJOIN_FAILED", reason: "Geçersiz oturum belirteci." }));
            break;
          }

          clearGracePeriod(reqRoomId || roomId);
          targetRoom.state.disconnectGrace = null;
          targetRoom.clients.set(ws, { userId, username: data.username });

          if (targetRoom.state.player1 && targetRoom.state.player1.userId === userId) {
            targetRoom.state.player1.isDisconnected = false;
            targetRoom.state.player1.disconnectedAt = null;
          } else if (targetRoom.state.player2 && targetRoom.state.player2.userId === userId) {
            targetRoom.state.player2.isDisconnected = false;
            targetRoom.state.player2.disconnectedAt = null;
          }

          ws.send(JSON.stringify({ type: "REJOIN_SUCCESS", sessionToken, userId, state: targetRoom.state }));
          broadcastToRoom(targetRoom, { type: "PLAYER_RECONNECTED", userId });
          broadcastRoomState(targetRoom);
          break;
        }

        case "ADD_BOT":
        case "ADD_BOT_PLAYER": {
          if (room.state.status !== "waiting_for_players" || room.state.player2) break;

          const { player: botPlayer, team: botTeam } = createBotPlayer(DEFAULT_POPULAR_TEAMS);
          room.state.player2 = botPlayer;
          room.state.status = "in_round";
          room.state.roundStatus = "picking_teams";
          room.state.currentRound = 1;

          if (room.state.gameMode === "country_vs_team") {
            const startWithP1 = Math.random() < 0.5;
            room.state.initialNationPickerUserId = startWithP1 ? room.state.player1!.userId : botPlayer.userId;
            room.state.currentNationPickerUserId = room.state.initialNationPickerUserId;
            room.state.currentTeamPickerUserId = startWithP1 ? botPlayer.userId : room.state.player1!.userId;

            if (room.state.currentNationPickerUserId === botPlayer.userId) {
              const botNation = pickBotNation();
              registerNationPick(room.state, botPlayer.userId, botNation);
            } else {
              registerTeamPick(room.state, botPlayer.userId, botTeam);
            }
          } else {
            room.state.team2 = botTeam;
          }

          broadcastRoomState(room);

          const pickDuration = room.state.roundDuration || DEFAULT_ROUND_DURATION;
          startServerTimer(room, pickDuration, () => {
            transitionToAnsweringPhase(room);
          });
          break;
        }

        case "NATION_PICKED": {
          const { userId, nation } = data as { userId: string; nation: Nation };
          const clientMeta = room.clients.get(ws);
          const effectiveUserId = userId || clientMeta?.userId;
          if (!effectiveUserId || !nation) break;

          const pickResult = registerNationPick(room.state, effectiveUserId, nation);
          room.state = pickResult.state;

          if (pickResult.bothPicked && room.state.roundStatus === "picking_teams") {
            transitionToAnsweringPhase(room);
            return;
          }

          broadcastRoomState(room);
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

          const isVsBot = isBotPlayer(room.state.player2?.userId);
          const passResult = evaluatePassVote(room.state, effectiveUserId);
          room.state = passResult.state;

          const allVoted = passResult.bothPassed || (isVsBot && room.state.passVotes.includes(effectiveUserId));

          if (allVoted) {
            clearRoomTimer(room);
            room.state.roundStatus = "round_finished";
            if (passResult.completedRound) {
              room.completedRounds.push(passResult.completedRound);
            }

            broadcastToRoom(room, {
              type: "ROUND_RESULT",
              winnerUserId: null,
              correctAnswer: "Tur Karşılıklı Pas Geçildi",
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
          if (room.state.gameMode === "country_vs_team") {
            if (!room.state.nation || !room.state.team1) return;
          } else {
            if (!room.state.team1 || !room.state.team2) return;
          }

          const clientMeta = room.clients.get(ws);
          const senderId = clientMeta?.userId || userId;
          if (!senderId) return;

          try {
            const result = room.state.gameMode === "country_vs_team"
              ? await verifyNationAnswerInServer(name, room.state.nation!, room.state.team1!.id)
              : await verifyPlayerAnswerInServer(name, room.state.team1!.id, room.state.team2!.id);
            if (room.state.roundStatus !== "answering") return;

            if (result.isCorrect && result.playerName) {
              clearRoomTimer(room);
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

    if (disconnectedUserId) {
      const handled = handleMatchPlayerDisconnect(roomId, disconnectedUserId, room.state, {
        onNotifyDisconnect: (userId, graceSeconds) => {
          broadcastToRoom(room, { type: "PLAYER_DISCONNECTED", userId, graceSeconds });
          broadcastRoomState(room);
        },
        onTick: (secondsLeft) => {
          broadcastToRoom(room, { type: "DISCONNECT_TICK", userId: disconnectedUserId, secondsLeft });
          broadcastRoomState(room);
        },
        onForfeit: (forfeitInfo) => {
          clearRoomTimer(room);
          broadcastToRoom(room, {
            type: "PLAYER_FORFEIT",
            ...forfeitInfo,
            state: room.state,
          });
          broadcastRoomState(room);

          const p1Id = room.state.player1?.userId;
          const p2Id = room.state.player2?.userId;
          if (p1Id && p2Id) {
            const isCasual = room.id.includes("_casual_");
            const isCustom = room.id.startsWith("oda_");
            const mode = isCustom ? "custom" : isCasual ? "casual" : "ranked";
            const isRanked = !isCasual && !isCustom && !isBotPlayer(p1Id) && !isBotPlayer(p2Id);
            const isP1Winner = forfeitInfo.winnerUserId === p1Id;
            finalizeMatchAndPersistElo({
              matchId: room.id,
              player1Id: p1Id,
              player2Id: p2Id,
              player1Score: isP1Winner ? 3 : 0,
              player2Score: isP1Winner ? 0 : 3,
              mode,
              ranked: isRanked,
              rounds: room.completedRounds,
            })
              .then((result) => {
                console.log(`🏆 [Party/Server] Hükmen Maç ${room.id} DB'ye işlendi:`, result);
                broadcastToRoom(room, {
                  type: "MATCH_PERSISTED",
                  result,
                  state: room.state,
                });
              })
              .catch((err) => {
                console.error("[Party/Server] Forfeit finalizeMatchAndPersistElo Hatası:", err);
              });
          }

          setTimeout(() => {
            clearRoomSessions(roomId);
            rooms.delete(roomId);
          }, 30000);
        },
      });

      if (handled) return;
    }

    if (room.clients.size === 0 && !getActiveGracePeriod(roomId)) {
      clearRoomTimer(room);
      clearRoomSessions(roomId);
      rooms.delete(roomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Realtime Server] WebSocket sunucusu port ${PORT} üzerinde hazır! (ws://localhost:${PORT})`);
});
