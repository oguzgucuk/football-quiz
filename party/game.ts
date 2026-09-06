/**
 * PartyKit Cloud Canlı Oyun Odası Sunucusu (GameRoom Server).
 * - 1v1 Oyun Yönetimi (Klasik Kulüp vs Kulüp ve Millet vs Kulüp Modları)
 * - Dinamik Süre Ayarı (5s, 10s, 15s, 20s)
 * - Kesintisiz Server-Side Sayacı, Faul Sistemi ve Otomatik Takım Seçimi İptali
 * - Canlı Origin Tespiti ile Hatasız API Cevap Doğrulaması
 */

import type * as Party from "partykit/server";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team, Nation } from "../types/game";
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
  checkSelectionTimeoutsAndApplyFouls,
} from "../lib/realtime/roomEngine";
import {
  createBotPlayer,
  pickBotTeam,
  pickBotNation,
  isBotPlayer,
} from "../lib/realtime/botSimulator";
import { handleMatchPlayerDisconnect } from "../lib/realtime/disconnectManager";
import { CompletedRoundData } from "../lib/db/matches";

const ROUNDS_PER_MATCH = DEFAULT_MAX_ROUNDS;

export default class GameRoomServer implements Party.Server {
  state: RoomState;
  siteUrl?: string;
  timerInterval?: ReturnType<typeof setInterval>;
  timerSecondsLeft?: number;
  connectionMeta = new Map<string, { userId?: string; username?: string }>();
  completedRounds: CompletedRoundData[] = [];

  constructor(readonly room: Party.Room) {
    this.state = createInitialRoomState(this.room.id);
    this.state.maxRounds = ROUNDS_PER_MATCH;
    this.state.roundDuration = resolveRoundDuration(this.room.id, this.state.roundDuration);
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.extractSiteUrl(ctx);
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

  private extractSiteUrl(ctx: Party.ConnectionContext) {
    const origin = ctx.request.headers.get("origin") || ctx.request.headers.get("referer");
    let queryOrigin = "";
    try {
      const url = new URL(ctx.request.url);
      queryOrigin = url.searchParams.get("origin") || "";
    } catch {
      // ignore
    }
    const detected = origin || queryOrigin;
    if (detected && detected.startsWith("http")) {
      this.siteUrl = detected.replace(/\/$/, "");
    }
  }

  private getApiUrl(): string {
    return this.siteUrl || (this.room.env?.NEXT_PUBLIC_SITE_URL as string) || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:5000";
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

  handlePickTimeout() {
    if (this.state.roundStatus !== "picking_teams") return;
    this.clearServerTimer();

    const { state: foulState, foulsApplied, isMatchFinished } = checkSelectionTimeoutsAndApplyFouls(this.state);
    this.state = foulState;

    if (foulsApplied.length > 0) {
      this.broadcast({
        type: "FOUL_APPLIED",
        foulsApplied,
        state: this.state,
      });
    }

    if (isMatchFinished) {
      this.broadcastState();
      this.persistMatchResult();
      return;
    }

    // 3 faule ulaşıp ceza puanı verildiyse tur biter, yeni tura geçilir (Sonsuz loop engellendi!)
    const penaltyAwardedEvent = foulsApplied.find((f) => f.penaltyAwarded);
    if (penaltyAwardedEvent) {
      const isP1Victim = penaltyAwardedEvent.userId !== this.state.player1?.userId;
      const winnerUserId = isP1Victim ? this.state.player1?.userId : this.state.player2?.userId;

      this.state.roundStatus = "round_finished";
      this.state.lastRoundWasDraw = false;

      this.broadcast({
        type: "ROUND_RESULT",
        winnerUserId,
        correctAnswer: penaltyAwardedEvent.message,
        isDraw: false,
        isReplay: false,
        state: this.state,
      });

      this.scheduleNextRound();
      return;
    }

    this.broadcastState();
    const pickDuration = this.state.roundDuration || DEFAULT_ROUND_DURATION;
    this.startServerTimer(pickDuration, () => {
      this.handlePickTimeout();
    });
  }

  transitionToAnsweringPhase() {
    this.clearServerTimer();
    const { state, duration } = prepareAnsweringPhase(this.state);
    this.state = state;
    this.broadcastState();

    this.startServerTimer(duration, () => {
      this.handleRoundTimeout();
    });
  }

  handleRoundTimeout() {
    if (this.state.roundStatus !== "answering") return;

    this.state.lastRoundWasDraw = true;
    const { state, completedRound } = recordRoundTimeout(this.state);
    this.state = state;
    this.completedRounds.push(completedRound);

    this.broadcast({
      type: "ROUND_RESULT",
      winnerUserId: null,
      correctAnswer: "Süre Doldu!",
      isDraw: true,
      isReplay: true,
      state: this.state,
    });

    this.scheduleNextRound();
  }

  async persistMatchResult() {
    const p1Id = this.state.player1?.userId;
    const p2Id = this.state.player2?.userId;
    if (!p1Id || !p2Id) return;

    const apiUrl = this.getApiUrl();
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
        return;
      }

      if (isBotPlayer(this.state.player2?.userId)) {
        const botUserId = this.state.player2!.userId;
        if (this.state.gameMode === "country_vs_team") {
          if (this.state.currentNationPickerUserId === botUserId) {
            const botNation = pickBotNation(undefined, this.state.usedNationIds);
            registerNationPick(this.state, botUserId, botNation);
          } else if (this.state.currentTeamPickerUserId === botUserId) {
            const botTeam = pickBotTeam(DEFAULT_POPULAR_TEAMS, this.state.usedTeamIds);
            registerTeamPick(this.state, botUserId, botTeam);
          }
        } else {
          const botTeam = pickBotTeam(DEFAULT_POPULAR_TEAMS, this.state.usedTeamIds);
          registerTeamPick(this.state, botUserId, botTeam);
        }
      }

      this.broadcastState();
      const pickDuration = this.state.roundDuration || DEFAULT_ROUND_DURATION;
      this.startServerTimer(pickDuration, () => {
        this.handlePickTimeout();
      });
    }, 3000);
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      if (data.siteUrl && typeof data.siteUrl === "string" && data.siteUrl.startsWith("http")) {
        this.siteUrl = data.siteUrl.replace(/\/$/, "");
      }

      switch (data.type) {
        case "PLAYER_JOIN":
          this.handlePlayerJoin(sender, data);
          break;
        case "REJOIN":
          this.handleRejoin(sender, data);
          break;
        case "ADD_BOT":
        case "ADD_BOT_PLAYER":
          this.handleAddBot();
          break;
        case "NATION_PICKED":
          this.handleNationPicked(sender, data);
          break;
        case "TEAM_PICKED":
          this.handleTeamPicked(sender, data);
          break;
        case "TEAM_UNPICKED":
          this.handleTeamUnpicked(sender, data);
          break;
        case "NATION_UNPICKED":
          this.handleNationUnpicked(sender, data);
          break;
        case "PASS_VOTE":
          this.handlePassVote(sender, data);
          break;
        case "PICK_TIMEOUT":
          if (this.state.roundStatus === "picking_teams") this.handlePickTimeout();
          break;
        case "SUBMIT_ANSWER":
          await this.handleSubmitAnswer(sender, data);
          break;
      }
    } catch (err) {
      console.error("[GameRoomServer Error]:", err);
    }
  }

  private handlePlayerJoin(sender: Party.Connection, data: { userId: string; username: string; roundDuration?: number }) {
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
        fouls: this.state.player1?.fouls || 0,
        isReady: true,
        isDisconnected: false,
        disconnectedAt: null,
      };
    } else if (!this.state.player2 || this.state.player2.userId === userId) {
      this.state.player2 = {
        userId,
        username,
        score: this.state.player2?.score || 0,
        fouls: this.state.player2?.fouls || 0,
        isReady: true,
        isDisconnected: false,
        disconnectedAt: null,
      };
      this.state.status = "in_round";
      this.state.roundStatus = "picking_teams";
      this.state.currentRound = 1;
      this.state.passVotes = [];

      if (this.state.gameMode === "country_vs_team" && !this.state.initialNationPickerUserId) {
        const startWithP1 = Math.random() < 0.5;
        this.state.initialNationPickerUserId = startWithP1 ? this.state.player1.userId : this.state.player2.userId;
        this.state.currentNationPickerUserId = this.state.initialNationPickerUserId;
        this.state.currentTeamPickerUserId = startWithP1 ? this.state.player2.userId : this.state.player1.userId;
      }

      const pickDuration = this.state.roundDuration || DEFAULT_ROUND_DURATION;
      this.startServerTimer(pickDuration, () => {
        this.handlePickTimeout();
      });
    }
    this.broadcastState();
  }

  private handleRejoin(sender: Party.Connection, data: { sessionToken: string; userId: string; username?: string }) {
    const { sessionToken, userId, username } = data;
    const validSession = validateSession(this.room.id, userId, sessionToken);
    if (!validSession) {
      sender.send(JSON.stringify({ type: "REJOIN_FAILED", reason: "Geçersiz oturum belirteci." }));
      return;
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
  }

  private handleAddBot() {
    if (this.state.status !== "waiting_for_players" || this.state.player2) return;

    const { player: botPlayer, team: botTeam } = createBotPlayer(DEFAULT_POPULAR_TEAMS);
    this.state.player2 = botPlayer;
    this.state.status = "in_round";
    this.state.roundStatus = "picking_teams";
    this.state.currentRound = 1;
    this.state.passVotes = [];

    if (this.state.gameMode === "country_vs_team") {
      const startWithP1 = Math.random() < 0.5;
      this.state.initialNationPickerUserId = startWithP1 ? this.state.player1!.userId : botPlayer.userId;
      this.state.currentNationPickerUserId = this.state.initialNationPickerUserId;
      this.state.currentTeamPickerUserId = startWithP1 ? botPlayer.userId : this.state.player1!.userId;

      if (this.state.currentNationPickerUserId === botPlayer.userId) {
        const botNation = pickBotNation();
        registerNationPick(this.state, botPlayer.userId, botNation);
      } else {
        registerTeamPick(this.state, botPlayer.userId, botTeam);
      }
    } else {
      this.state.team2 = botTeam;
    }

    this.broadcastState();
    const pickDuration = this.state.roundDuration || DEFAULT_ROUND_DURATION;
    this.startServerTimer(pickDuration, () => {
      this.handlePickTimeout();
    });
  }

  private handleNationPicked(sender: Party.Connection, data: { userId: string; nation: Nation }) {
    const clientMeta = this.connectionMeta.get(sender.id);
    const effectiveUserId = data.userId || clientMeta?.userId;
    if (!effectiveUserId || !data.nation) return;

    const pickResult = registerNationPick(this.state, effectiveUserId, data.nation);
    if (pickResult.rejected) {
      sender.send(JSON.stringify({
        type: "PICK_REJECTED",
        reason: "Bu millet bu maç oturumunda daha önce kullanıldı! Lütfen farklı bir millet seç.",
      }));
      return;
    }

    this.state = pickResult.state;

    if (pickResult.bothPicked && this.state.roundStatus === "picking_teams") {
      this.transitionToAnsweringPhase();
      return;
    }
    this.broadcastState();
  }

  private handleTeamPicked(sender: Party.Connection, data: { userId: string; team: Team }) {
    const clientMeta = this.connectionMeta.get(sender.id);
    const effectiveUserId = data.userId || clientMeta?.userId;
    if (!effectiveUserId || !data.team) return;

    const pickResult = registerTeamPick(this.state, effectiveUserId, data.team);
    if (pickResult.rejected) {
      const reasonMsg = pickResult.reason === "OPPONENT_CHOSE_SAME"
        ? "Bu takımı rakibin seçti! Lütfen farklı bir takım seç."
        : "Bu takım bu maç oturumunda daha önce kullanıldı! Lütfen farklı bir takım seç.";
      sender.send(JSON.stringify({
        type: "PICK_REJECTED",
        reason: reasonMsg,
      }));
      return;
    }

    this.state = pickResult.state;

    if (pickResult.bothPicked && this.state.roundStatus === "picking_teams") {
      this.transitionToAnsweringPhase();
      return;
    }
    this.broadcastState();
  }

  private handleTeamUnpicked(sender: Party.Connection, data: { userId?: string }) {
    if (this.state.roundStatus !== "picking_teams") return;
    const clientMeta = this.connectionMeta.get(sender.id);
    const effectiveUserId = data?.userId || clientMeta?.userId;
    if (!effectiveUserId) return;

    if (this.state.player1?.userId === effectiveUserId) {
      this.state.team1 = null;
      this.state.player1.selectedTeamId = null;
    } else if (this.state.player2?.userId === effectiveUserId) {
      this.state.team2 = null;
      this.state.player2.selectedTeamId = null;
    }
    this.broadcastState();
  }

  private handleNationUnpicked(sender: Party.Connection, data: { userId?: string }) {
    if (this.state.roundStatus !== "picking_teams") return;
    const clientMeta = this.connectionMeta.get(sender.id);
    const effectiveUserId = data?.userId || clientMeta?.userId;
    if (!effectiveUserId) return;

    if (this.state.currentNationPickerUserId === effectiveUserId) {
      this.state.nation = null;
      if (this.state.player1?.userId === effectiveUserId) this.state.player1.selectedNationId = null;
      if (this.state.player2?.userId === effectiveUserId) this.state.player2.selectedNationId = null;
    }
    this.broadcastState();
  }

  private handlePassVote(sender: Party.Connection, data: { userId: string }) {
    const clientMeta = this.connectionMeta.get(sender.id);
    const effectiveUserId = data.userId || clientMeta?.userId;
    if (this.state.roundStatus !== "answering" || !effectiveUserId) return;

    const isVsBot = isBotPlayer(this.state.player2?.userId);
    const passResult = evaluatePassVote(this.state, effectiveUserId);
    this.state = passResult.state;

    const allVoted = passResult.bothPassed || (isVsBot && this.state.passVotes.includes(effectiveUserId));

    if (allVoted) {
      this.clearServerTimer();
      this.state.roundStatus = "round_finished";
      this.state.lastRoundWasDraw = true;
      if (passResult.completedRound) {
        this.completedRounds.push(passResult.completedRound);
      }

      this.broadcast({
        type: "ROUND_RESULT",
        winnerUserId: null,
        correctAnswer: "Tur Karşılıklı Pas Geçildi ⏩",
        isDraw: true,
        isReplay: true,
        state: this.state,
      });

      this.scheduleNextRound();
    } else {
      this.broadcastState();
    }
  }

  private async handleSubmitAnswer(sender: Party.Connection, data: { name: string; userId: string }) {
    const { name, userId } = data;
    if (this.state.roundStatus !== "answering" || !this.state.team1) return;
    if (this.state.gameMode === "country_vs_team") {
      if (!this.state.nation) return;
    } else {
      if (!this.state.team2) return;
    }

    const clientMeta = this.connectionMeta.get(sender.id);
    const senderId = clientMeta?.userId || userId;
    if (!senderId) return;

    const apiUrl = this.getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/game/verify-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1Id: this.state.team1.id,
          team2Id: this.state.team2?.id,
          nation: this.state.nation || undefined,
          submittedName: name,
        }),
      });
      const verifyData = await res.json();
      if (this.state.roundStatus !== "answering") return;

      const playerName = verifyData.player?.fullName || verifyData.playerName;
      if (verifyData.isCorrect && playerName) {
        this.clearServerTimer();

        const outcome = evaluateAnswerSubmission(
          this.state,
          senderId,
          { isCorrect: true, playerName },
          this.state.roundStartTime ? Date.now() - this.state.roundStartTime : undefined
        );

        if (!outcome.accepted) return;

        this.state = outcome.state;
        this.state.lastRoundWasDraw = false;
        if (outcome.completedRound) {
          this.completedRounds.push(outcome.completedRound);
        }

        this.broadcast({
          type: "ROUND_RESULT",
          winnerUserId: senderId,
          correctAnswer: playerName,
          isDraw: false,
          state: this.state,
        });

        this.scheduleNextRound();
      } else {
        sender.send(JSON.stringify({ type: "ANSWER_FEEDBACK", isCorrect: false }));
      }
    } catch (err) {
      console.error("[Party/Game] SUBMIT_ANSWER fetch error:", err);
      sender.send(JSON.stringify({ type: "ANSWER_FEEDBACK", isCorrect: false }));
    }
  }
}
