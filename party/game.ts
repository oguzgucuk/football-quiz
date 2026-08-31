/**
 * PartyKit Cloud Canlı Oyun Odası Sunucusu (GameRoom Server).
 * - 1v1 Oyun Yönetimi
 * - Server-Side 5sn Takım Seçimi & 15sn Cevap Sayacı
 * - Tur ve Maç Bitimi Senkronizasyonu
 */

import type * as Party from "partykit/server";
import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team } from "../types/game";

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
];

export default class GameRoomServer implements Party.Server {
  state: RoomState;
  timerInterval?: ReturnType<typeof setInterval>;
  timerSecondsLeft?: number;

  constructor(readonly room: Party.Room) {
    this.state = createInitialRoomState(this.room.id);
    this.state.maxRounds = ROUNDS_PER_MATCH;
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

  onClose() {
    const activeConnections = [...this.room.getConnections()];
    if (activeConnections.length === 0) {
      this.clearServerTimer();
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

    if (!this.state.team1) {
      this.state.team1 = DEFAULT_POPULAR_TEAMS[0];
      if (this.state.player1) this.state.player1.selectedTeamId = this.state.team1.id;
    }

    if (!this.state.team2) {
      const available = DEFAULT_POPULAR_TEAMS.filter((t) => t.id !== this.state.team1?.id);
      this.state.team2 = available[0] || DEFAULT_POPULAR_TEAMS[1];
      if (this.state.player2) this.state.player2.selectedTeamId = this.state.team2.id;
    }

    this.state.roundStatus = "answering";
    this.state.roundStartTime = Date.now();
    this.broadcastState();

    this.startServerTimer(ANSWER_TIME_SECONDS, () => {
      this.handleRoundTimeout();
    });
  }

  handleRoundTimeout() {
    if (this.state.roundStatus !== "answering") return;

    this.state.roundStatus = "round_finished";
    this.broadcast({
      type: "ROUND_RESULT",
      winnerUserId: null,
      correctAnswer: "Süre Doldu!",
      isDraw: true,
      state: this.state,
    });

    this.scheduleNextRound();
  }

  scheduleNextRound() {
    setTimeout(() => {
      if (this.state.currentRound >= (this.state.maxRounds || ROUNDS_PER_MATCH)) {
        this.state.status = "match_finished";
        this.broadcastState();
      } else {
        this.state.currentRound += 1;
        this.state.roundStatus = "picking_teams";
        this.state.team1 = null;
        this.state.team2 = null;
        if (this.state.player1) this.state.player1.selectedTeamId = null;
        if (this.state.player2) {
          if (this.state.player2.userId.startsWith("bot_")) {
            const botTeam = DEFAULT_POPULAR_TEAMS[Math.floor(Math.random() * DEFAULT_POPULAR_TEAMS.length)];
            this.state.player2.selectedTeamId = botTeam.id;
            this.state.team2 = botTeam;
          } else {
            this.state.player2.selectedTeamId = null;
          }
        }

        this.state.passVotes = [];
        this.broadcastState();
        this.startServerTimer(PICK_TIME_SECONDS, () => {
          this.transitionToAnsweringPhase();
        });
      }
    }, 3000);
  }

  onMessage(message: string) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "PLAYER_JOIN": {
          const { userId, username } = data;
          if (!this.state.player1) {
            this.state.player1 = { userId, username, score: 0, isReady: true };
          } else if (!this.state.player2 && this.state.player1.userId !== userId) {
            this.state.player2 = { userId, username, score: 0, isReady: true };
            this.state.status = "in_round";
            this.state.roundStatus = "picking_teams";
            this.state.passVotes = [];
            this.startServerTimer(PICK_TIME_SECONDS, () => {
              this.transitionToAnsweringPhase();
            });
          }
          this.broadcastState();
          break;
        }

        case "ADD_BOT": {
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
            this.startServerTimer(PICK_TIME_SECONDS, () => {
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

        case "ROUND_WINNER": {
          const { winnerUserId, correctAnswer } = data;
          this.clearServerTimer();

          let winnerUsername: string | null = null;
          if (this.state.player1 && this.state.player1.userId === winnerUserId) {
            this.state.player1.score += 1;
            winnerUsername = this.state.player1.username;
          } else if (this.state.player2 && this.state.player2.userId === winnerUserId) {
            this.state.player2.score += 1;
            winnerUsername = this.state.player2.username;
          }

          this.state.roundStatus = "round_finished";
          this.broadcast({
            type: "ROUND_RESULT",
            winnerUserId,
            winnerUsername,
            correctAnswer: correctAnswer || "Doğru Cevap!",
            isDraw: !winnerUserId,
            state: this.state,
          });

          this.scheduleNextRound();
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
          this.startServerTimer(PICK_TIME_SECONDS, () => {
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
