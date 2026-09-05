/**
 * PartyKit Cloud Canlı Oyun Odası Sunucusu (GameRoom Server).
 * - 1v1 Oyun Yönetimi
 * - Dinamik Süre Ayarı (5s, 10s, 15s, 20s)
 * - Server-Side Sayacı, Pas Mekanizması, Bot ve Tur Senkronizasyonu
 */

import type * as Party from "partykit/server";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team } from "../types/game";
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
} from "../lib/realtime/roomEngine";
import { createBotPlayer, pickBotTeam, isBotPlayer } from "../lib/realtime/botSimulator";
import { handleMatchPlayerDisconnect } from "../lib/realtime/disconnectManager";
import { CompletedRoundData } from "../lib/db/matches";

const ROUNDS_PER_MATCH = DEFAULT_MAX_ROUNDS;

export default class GameRoomServer implements Party.Server {
  state: RoomState;
  timerInterval?: ReturnType<typeof setInterval>;
  timerSecondsLeft?: number;
  connectionMeta = new Map<string, { userId?: string; username?: string }>();
  completedRounds: CompletedRoundData[] = [];

  constructor(readonly room: Party.Room) {
    this.state = createInitialRoomState(this.room.id);
    this.state.maxRounds = ROUNDS_PER_MATCH;
    this.state.roundDuration = resolveRoundDuration(this.room.id, this.state.roundDuration);
  }

  onConnect(conn: Party.Connection) {
    conn.send(
      JSON.stringify({
        type: "ROOM_STATE_SYNC",
        state: this.state,
        serverTimestamp: Date.now(),
      })
    );
  }

  onClose(conn: Party.Connection) {
    const meta = this.connectionMeta.get(conn.id);
    const disconnectedUserId = meta?.userId;
    this.connectionMeta.delete(conn.id);

    if (disconnectedUserId) {
      const handled = handleMatchPlayerDisconnect(this.room.id, disconnectedUserId, this.state, {
        onNotifyDisconnect: (userId, graceSeconds) => {
          this.broadcast({ type: "PLAYER_DISCONNECTED", userId, graceSeconds });
          this.broadcastState();
        },
        onTick: (secondsLeft) => {
          this.broadcast({ type: "DISCONNECT_TICK", userId: disconnectedUserId, secondsLeft });
          this.broadcastState();
        },
        onForfeit: (forfeitInfo) => {
          this.clearServerTimer();
          this.broadcast({
            type: "PLAYER_FORFEIT",
            ...forfeitInfo,
            state: this.state,
          });
          this.broadcastState();

          // Hükmen maç sonucunu DB'ye işle
          if (this.state.player1 && this.state.player2) {
            const isP1Winner = forfeitInfo.winnerUserId === this.state.player1.userId;
            this.state.player1.score = isP1Winner ? 3 : 0;
            this.state.player2.score = isP1Winner ? 0 : 3;
            this.persistMatchResult();
          }

          setTimeout(() => {
            clearRoomSessions(this.room.id);
          }, 30000);
        },
      });

      if (handled) return;
    }

    const activeConnections = [...this.room.getConnections()];
    if (activeConnections.length === 0 && !getActiveGracePeriod(this.room.id)) {
      this.clearServerTimer();
      clearRoomSessions(this.room.id);
    }
  }

  broadcast(message: object) {
    this.room.broadcast(JSON.stringify(message));
  }

  broadcastState() {
    this.broadcast({
      type: "ROOM_STATE_SYNC",
      state: this.state,
      serverTimestamp: Date.now(),
    });
  }

  clearServerTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  startServerTimer(durationSeconds: number, onComplete: () => void) {
    this.clearServerTimer();
    this.timerSecondsLeft = durationSeconds;

    this.broadcast({
      type: "TIMER_START",
      durationSeconds,
      serverTimestamp: Date.now(),
    });

    this.timerInterval = setInterval(() => {
      if (this.timerSecondsLeft === undefined || this.timerSecondsLeft <= 1) {
        this.clearServerTimer();
        this.timerSecondsLeft = 0;
        onComplete();
      } else {
        this.timerSecondsLeft -= 1;
        this.broadcast({
          type: "TIMER_TICK",
          secondsLeft: this.timerSecondsLeft,
        });
      }
    }, 1000);
  }

  transitionToAnsweringPhase() {
    this.clearServerTimer();
    const { state, duration } = prepareAnsweringPhase(this.state, DEFAULT_POPULAR_TEAMS);
    this.state = state;
    this.broadcastState();

    this.startServerTimer(duration, () => {
      this.handleRoundTimeout();
    });
  }

  handleRoundTimeout() {
    if (this.state.roundStatus !== "answering") return;

    const { state, completedRound } = recordRoundTimeout(this.state);
    this.state = state;
    this.completedRounds.push(completedRound);

    this.broadcast({
      type: "ROUND_RESULT",
      winnerUserId: null,
      correctAnswer: "Süre Doldu!",
      isDraw: true,
      state: this.state,
    });

    this.scheduleNextRound();
  }

  async persistMatchResult() {
    const p1Id = this.state.player1?.userId;
    const p2Id = this.state.player2?.userId;
    if (!p1Id || !p2Id) return;

    const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:5000";
    const secret = process.env.INTERNAL_API_SECRET || "";

    const isCasual = this.room.id.includes("_casual_");
    const isCustom = this.room.id.startsWith("oda_");
    const mode = isCustom ? "custom" : isCasual ? "casual" : "ranked";
    const isRanked = !isCasual && !isCustom && !isBotPlayer(p1Id) && !isBotPlayer(p2Id);

    try {
      const res = await fetch(`${apiUrl}/api/game/finalize-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": secret,
        },
        body: JSON.stringify({
          matchId: this.room.id,
          player1Id: p1Id,
          player2Id: p2Id,
          player1Score: this.state.player1?.score || 0,
          player2Score: this.state.player2?.score || 0,
          mode,
          ranked: isRanked,
          rounds: this.completedRounds,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        console.log(`🏆 [Party/Game] Maç ${this.room.id} DB'ye işlendi:`, data.result);
        this.broadcast({
          type: "MATCH_PERSISTED",
          result: data.result,
          state: this.state,
        });
      }
    } catch (err) {
      console.error("[Party/Game] persistMatchResult Hatası:", err);
    }
  }

  scheduleNextRound() {
    setTimeout(() => {
      const { isMatchFinished, state } = prepareNextRound(this.state, ROUNDS_PER_MATCH);
      this.state = state;

      if (isMatchFinished) {
        this.broadcastState();
        this.persistMatchResult();
      } else {
        if (isBotPlayer(this.state.player2?.userId)) {
          const botTeam = pickBotTeam(DEFAULT_POPULAR_TEAMS);
          if (this.state.player2) {
            this.state.player2.selectedTeamId = botTeam.id;
          }
          this.state.team2 = botTeam;
        }

        this.broadcastState();
        const pickDuration = this.state.roundDuration || DEFAULT_ROUND_DURATION;
        this.startServerTimer(pickDuration, () => {
          this.transitionToAnsweringPhase();
        });
      }
    }, 3000);
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "PLAYER_JOIN": {
          const { userId, username, roundDuration } = data;
          this.connectionMeta.set(sender.id, { userId, username });

          if (roundDuration && [5, 10, 15, 20].includes(Number(roundDuration))) {
            this.state.roundDuration = Number(roundDuration);
          }

          const slot = (!this.state.player1 || this.state.player1.userId === userId) ? "player1" : "player2";
          const sessionToken = createSession(this.room.id, userId, slot);

          sender.send(JSON.stringify({ type: "SESSION_GRANTED", sessionToken, userId }));

          if (!this.state.player1 || this.state.player1.userId === userId) {
            this.state.player1 = {
              userId,
              username,
              score: this.state.player1?.score || 0,
              isReady: true,
              isDisconnected: false,
              disconnectedAt: null,
            };
          } else if (!this.state.player2 || this.state.player2.userId === userId) {
            this.state.player2 = {
              userId,
              username,
              score: this.state.player2?.score || 0,
              isReady: true,
              isDisconnected: false,
              disconnectedAt: null,
            };
            this.state.status = "in_round";
            this.state.roundStatus = "picking_teams";
            this.state.passVotes = [];
            const pickDuration = this.state.roundDuration || DEFAULT_ROUND_DURATION;
            this.startServerTimer(pickDuration, () => {
              this.transitionToAnsweringPhase();
            });
          }
          this.broadcastState();
          break;
        }

        case "REJOIN": {
          const { sessionToken, userId, username } = data;
          const validSession = validateSession(this.room.id, userId, sessionToken);
          if (!validSession) {
            sender.send(JSON.stringify({ type: "REJOIN_FAILED", reason: "Geçersiz oturum belirteci." }));
            break;
          }

          clearGracePeriod(this.room.id);
          this.state.disconnectGrace = null;
          this.connectionMeta.set(sender.id, { userId, username });

          if (this.state.player1 && this.state.player1.userId === userId) {
            this.state.player1.isDisconnected = false;
            this.state.player1.disconnectedAt = null;
          } else if (this.state.player2 && this.state.player2.userId === userId) {
            this.state.player2.isDisconnected = false;
            this.state.player2.disconnectedAt = null;
          }

          sender.send(JSON.stringify({ type: "REJOIN_SUCCESS", sessionToken, userId, state: this.state }));
          this.broadcast({ type: "PLAYER_RECONNECTED", userId });
          this.broadcastState();
          break;
        }

        case "ADD_BOT":
        case "ADD_BOT_PLAYER": {
          if (this.state.status !== "waiting_for_players" || this.state.player2) break;

          const { player: botPlayer, team: botTeam } = createBotPlayer(DEFAULT_POPULAR_TEAMS);
          this.state.player2 = botPlayer;
          this.state.team2 = botTeam;
          this.state.status = "in_round";
          this.state.roundStatus = "picking_teams";
          this.state.passVotes = [];
          this.broadcastState();

          const pickDuration = this.state.roundDuration || DEFAULT_ROUND_DURATION;
          this.startServerTimer(pickDuration, () => {
            this.transitionToAnsweringPhase();
          });
          break;
        }

        case "TEAM_PICKED": {
          const { userId, team } = data as { userId: string; team: Team };
          const clientMeta = this.connectionMeta.get(sender.id);
          const effectiveUserId = userId || clientMeta?.userId;
          if (!effectiveUserId || !team) break;

          const pickResult = registerTeamPick(this.state, effectiveUserId, team);
          this.state = pickResult.state;

          if (pickResult.bothPicked && this.state.roundStatus === "picking_teams") {
            this.transitionToAnsweringPhase();
            return;
          }

          this.broadcastState();
          break;
        }

        case "PASS_VOTE": {
          const { userId } = data;
          const clientMeta = this.connectionMeta.get(sender.id);
          const effectiveUserId = userId || clientMeta?.userId;
          if (this.state.roundStatus !== "answering" || !effectiveUserId) return;

          const isVsBot = isBotPlayer(this.state.player2?.userId);
          const passResult = evaluatePassVote(this.state, effectiveUserId);
          this.state = passResult.state;

          const allVoted = passResult.bothPassed || (isVsBot && this.state.passVotes.includes(effectiveUserId));

          if (allVoted) {
            this.clearServerTimer();
            this.state.roundStatus = "round_finished";
            if (passResult.completedRound) {
              this.completedRounds.push(passResult.completedRound);
            }

            this.broadcast({
              type: "ROUND_RESULT",
              winnerUserId: null,
              correctAnswer: "Tur Karşılıklı Pas Geçildi ⏩",
              isDraw: true,
              state: this.state,
            });

            this.scheduleNextRound();
          } else {
            this.broadcastState();
          }
          break;
        }

        case "SUBMIT_ANSWER": {
          const { name, userId } = data;
          if (this.state.roundStatus !== "answering" || !this.state.team1 || !this.state.team2) return;

          const clientMeta = this.connectionMeta.get(sender.id);
          const senderId = clientMeta?.userId || userId;
          if (!senderId) return;

          const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:5000";
          try {
            const res = await fetch(`${apiUrl}/api/game/verify-answer`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                team1Id: this.state.team1.id,
                team2Id: this.state.team2.id,
                submittedName: name,
              }),
            });
            const verifyData = await res.json();

            if (this.state.roundStatus !== "answering") return;

            if (verifyData.isCorrect && verifyData.player) {
              this.clearServerTimer();

              const outcome = evaluateAnswerSubmission(
                this.state,
                senderId,
                { isCorrect: true, playerName: verifyData.player.fullName },
                this.state.roundStartTime ? Date.now() - this.state.roundStartTime : undefined
              );

              if (!outcome.accepted) return;

              this.state = outcome.state;
              if (outcome.completedRound) {
                this.completedRounds.push(outcome.completedRound);
              }

              this.broadcast({
                type: "ROUND_RESULT",
                winnerUserId: senderId,
                correctAnswer: verifyData.player.fullName,
                state: this.state,
              });

              this.scheduleNextRound();
            } else {
              sender.send(JSON.stringify({ type: "ANSWER_FEEDBACK", isCorrect: false }));
            }
          } catch (err) {
            console.error("[Party/Game] SUBMIT_ANSWER fetch error:", err);
            try {
              sender.send(JSON.stringify({ type: "ANSWER_FEEDBACK", isCorrect: false }));
            } catch {
              // ignore
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error("[GameRoomServer Error]:", err);
    }
  }
}
