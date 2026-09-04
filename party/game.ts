/**
 * PartyKit Cloud Canlı Oyun Odası Sunucusu (GameRoom Server).
 * - 1v1 Oyun Yönetimi
 * - Dinamik Süre Ayarı (5s, 10s, 15s, 20s - hem Takım Seçimi hem Cevaplama için)
 * - Server-Side Sayacı, Pas Mekanizması & Tur Senkronizasyonu
 */

import type * as Party from "partykit/server";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team } from "../types/game";
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
  resolveRoundDuration,
  prepareAnsweringPhase,
  recordRoundTimeout,
  evaluateAnswerSubmission,
  evaluatePassVote,
  prepareNextRound,
} from "../lib/realtime/roomEngine";
import { CompletedRoundData } from "../lib/db/matches";

const ROUNDS_PER_MATCH = 5;

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

    const isMatchActive = this.state.status === "in_round";
    const isPlayer1 = this.state.player1?.userId === disconnectedUserId;
    const isPlayer2 = this.state.player2?.userId === disconnectedUserId;

    if (isMatchActive && (isPlayer1 || isPlayer2) && disconnectedUserId && !disconnectedUserId.startsWith("bot_")) {
      const disconnectedPlayer = isPlayer1 ? this.state.player1! : this.state.player2!;
      const remainingPlayer = isPlayer1 ? this.state.player2 : this.state.player1;

      disconnectedPlayer.isDisconnected = true;
      disconnectedPlayer.disconnectedAt = Date.now();

      startGracePeriod(
        this.room.id,
        disconnectedUserId,
        disconnectedPlayer.username,
        (secondsLeft) => {
          this.state.disconnectGrace = {
            userId: disconnectedUserId,
            username: disconnectedPlayer.username,
            expiresAt: Date.now() + secondsLeft * 1000,
            secondsLeft,
          };
          this.broadcast({
            type: "DISCONNECT_TICK",
            userId: disconnectedUserId,
            secondsLeft,
          });
          this.broadcastState();
        },
        () => {
          this.clearServerTimer();
          const winnerUserId = remainingPlayer?.userId || "unknown";
          this.state.status = "match_finished";
          this.state.disconnectGrace = null;
          this.state.forfeitInfo = {
            forfeitUserId: disconnectedUserId,
            winnerUserId,
            reason: `${disconnectedPlayer.username} bağlantıyı kesti ve 10 saniye içinde dönmedi.`,
          };

          this.broadcast({
            type: "PLAYER_FORFEIT",
            forfeitUserId: disconnectedUserId,
            winnerUserId,
            reason: this.state.forfeitInfo.reason,
            state: this.state,
          });
          this.broadcastState();

          setTimeout(() => {
            clearRoomSessions(this.room.id);
          }, 30000);
        }
      );

      this.state.disconnectGrace = {
        userId: disconnectedUserId,
        username: disconnectedPlayer.username,
        expiresAt: Date.now() + 10000,
        secondsLeft: 10,
      };

      this.broadcast({
        type: "PLAYER_DISCONNECTED",
        userId: disconnectedUserId,
        graceSeconds: 10,
      });
      this.broadcastState();
      return;
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
          ranked: !p1Id.startsWith("bot_") && !p2Id.startsWith("bot_"),
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
        if (this.state.player2?.userId.startsWith("bot_")) {
          const botTeam = DEFAULT_POPULAR_TEAMS[Math.floor(Math.random() * DEFAULT_POPULAR_TEAMS.length)];
          this.state.player2.selectedTeamId = botTeam.id;
          this.state.team2 = botTeam;
        }

        this.broadcastState();
        const pickDuration = this.state.roundDuration || 15;
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

          sender.send(
            JSON.stringify({
              type: "SESSION_GRANTED",
              sessionToken,
              userId,
            })
          );

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
            const pickDuration = this.state.roundDuration || 15;
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
            sender.send(JSON.stringify({ type: "REJOIN_FAILED", reason: "Geçersiz veya süresi dolmuş oturum belirteci." }));
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

          sender.send(
            JSON.stringify({
              type: "REJOIN_SUCCESS",
              sessionToken,
              userId,
              state: this.state,
            })
          );

          this.broadcast({
            type: "PLAYER_RECONNECTED",
            userId,
          });
          this.broadcastState();
          break;
        }

        case "ADD_BOT":
        case "ADD_BOT_PLAYER": {
          if (!this.state.player2) {
            this.state.player2 = {
              userId: "bot_ai",
              username: "Yapay Zeka 🤖",
              score: 0,
              isReady: true,
            };
            this.state.status = "in_round";
            this.state.roundStatus = "picking_teams";
            this.state.passVotes = [];

            const botTeam = DEFAULT_POPULAR_TEAMS[Math.floor(Math.random() * DEFAULT_POPULAR_TEAMS.length)];
            this.state.player2.selectedTeamId = botTeam.id;
            this.state.team2 = botTeam;

            this.broadcastState();
            const pickDuration = this.state.roundDuration || 15;
            this.startServerTimer(pickDuration, () => {
              this.transitionToAnsweringPhase();
            });
          }
          break;
        }

        case "TEAM_PICKED": {
          const { userId, team } = data as { userId: string; team: Team };
          if (this.state.player1?.userId === userId) {
            this.state.player1.selectedTeamId = team.id;
            this.state.team1 = team;
          } else if (this.state.player2?.userId === userId) {
            this.state.player2.selectedTeamId = team.id;
            this.state.team2 = team;
          }

          if (this.state.team1 && this.state.team2 && this.state.roundStatus === "picking_teams") {
            this.state.passVotes = [];
            this.transitionToAnsweringPhase();
          } else {
            this.broadcastState();
          }
          break;
        }

        case "PASS_VOTE": {
          const { userId } = data;
          if (!this.state.passVotes) this.state.passVotes = [];
          if (!this.state.passVotes.includes(userId)) {
            this.state.passVotes.push(userId);
          }

          const isVsBot = Boolean(this.state.player2?.userId.startsWith("bot_"));
          const allVoted = this.state.passVotes.length >= 2 || (isVsBot && this.state.passVotes.length >= 1);

          if (allVoted && this.state.roundStatus === "answering") {
            this.clearServerTimer();
            this.state.roundStatus = "round_finished";
            this.broadcast({
              type: "ROUND_RESULT",
              winnerUserId: null,
              winnerUsername: null,
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
          if (this.state.roundStatus !== "answering") return;
          if (!this.state.team1 || !this.state.team2) return;

          // İstemciden gelen userId ile eşleşen oyuncuyu bul (veya connection fallback)
          const senderId = userId || (this.state.player1?.userId === sender.id ? this.state.player1.userId : this.state.player2?.userId);
          if (!senderId) return;

          const team1Id = this.state.team1.id;
          const team2Id = this.state.team2.id;
          const apiUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:5000";

          try {
            const res = await fetch(`${apiUrl}/api/game/verify-answer`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ team1Id, team2Id, submittedName: name }),
            });
            const verifyData = await res.json();

            // İstek sürerken başka oyuncu bilmiş veya süre dolmuşsa işlem yapma (Race condition koruması)
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

              const winnerUsername =
                this.state.player1?.userId === senderId
                  ? this.state.player1?.username
                  : this.state.player2?.username;

              this.broadcast({
                type: "ROUND_RESULT",
                winnerUserId: senderId,
                winnerUsername,
                correctAnswer: verifyData.player.fullName,
                isDraw: false,
                state: this.state,
              });

              this.scheduleNextRound();
            } else {
              sender.send(JSON.stringify({ type: "ANSWER_FEEDBACK", isCorrect: false }));
            }
          } catch (err) {
            console.error("[Party/Game] SUBMIT_ANSWER fetch error:", err);
          }
          break;
        }

        case "RESET_MATCH": {
          this.clearServerTimer();
          this.state.status = "in_round";
          this.state.roundStatus = "picking_teams";
          this.state.currentRound = 1;
          this.state.team1 = null;
          this.state.team2 = null;
          this.state.passVotes = [];
          if (this.state.player1) {
            this.state.player1.score = 0;
            this.state.player1.selectedTeamId = null;
          }
          if (this.state.player2) {
            this.state.player2.score = 0;
            this.state.player2.selectedTeamId = null;
          }
          this.broadcastState();
          const pickDuration = this.state.roundDuration || 15;
          this.startServerTimer(pickDuration, () => {
            this.transitionToAnsweringPhase();
          });
          break;
        }
      }
    } catch (err) {
      console.error("[GameRoomServer Error]:", err);
    }
  }
}
