/**
 * PartyKit Realtime Oda Sunucusu (1v1 Eşleşme, 5sn Takım Seçimi, 15sn Cevap Sayacı ve Tur Yönetimi).
 */

import { RoomState, createInitialRoomState } from "../lib/realtime/roomState";
import { Team } from "../types/game";

export interface PartyConnection {
  id: string;
  send: (data: string) => void;
}

export interface PartyRoom {
  id: string;
  broadcast: (data: string) => void;
}

export default class GameRoomServer {
  private state: RoomState;

  constructor(readonly room: PartyRoom) {
    this.state = createInitialRoomState(this.room.id);
  }

  async onConnect(conn: PartyConnection) {
    conn.send(
      JSON.stringify({
        type: "ROOM_STATE_SYNC",
        state: this.state,
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onMessage(message: string, _sender: PartyConnection) {
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
          }
          this.broadcastState();
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

          if (this.state.team1 && this.state.team2) {
            this.state.roundStatus = "answering";
            this.state.roundStartTime = Date.now();
          }
          this.broadcastState();
          break;
        }

        case "ROUND_WINNER": {
          const { winnerUserId } = data;
          if (this.state.player1 && this.state.player1.userId === winnerUserId) {
            this.state.player1.score += 1;
          } else if (this.state.player2 && this.state.player2.userId === winnerUserId) {
            this.state.player2.score += 1;
          }

          this.state.roundStatus = "round_finished";
          this.broadcastState();

          setTimeout(() => {
            if (this.state.currentRound >= this.state.maxRounds) {
              this.state.status = "match_finished";
            } else {
              this.state.currentRound += 1;
              this.state.roundStatus = "picking_teams";
              this.state.team1 = null;
              this.state.team2 = null;
              if (this.state.player1) this.state.player1.selectedTeamId = null;
              if (this.state.player2) this.state.player2.selectedTeamId = null;
            }
            this.broadcastState();
          }, 3500);
          break;
        }
      }
    } catch (err) {
      console.error("[PartyKit Server Error]:", err);
    }
  }

  private broadcastState() {
    this.room.broadcast(
      JSON.stringify({
        type: "ROOM_STATE_SYNC",
        state: this.state,
      })
    );
  }
}
