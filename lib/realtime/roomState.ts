/**
 * Sunucu ve istemci tarafında kullanılan merkezi oda state modeli ve başlangıç durumu.
 */

import { Team, RoundStatus } from "@/types/game";

export interface RoomPlayer {
  userId: string;
  username: string;
  score: number;
  isReady: boolean;
  selectedTeamId?: string | null;
  isDisconnected?: boolean;
  disconnectedAt?: number | null;
}

export interface DisconnectGraceInfo {
  userId: string;
  username: string;
  expiresAt: number;
  secondsLeft: number;
}

export interface ForfeitInfo {
  forfeitUserId: string;
  winnerUserId: string;
  reason: string;
}

export interface RoomState {
  roomId: string;
  status: "waiting_for_players" | "in_round" | "match_finished";
  roundStatus: RoundStatus;
  currentRound: number;
  maxRounds: number;
  player1: RoomPlayer | null;
  player2: RoomPlayer | null;
  team1: Team | null;
  team2: Team | null;
  roundStartTime: number | null;
  passVotes: string[];
  roundDuration: number;
  disconnectGrace?: DisconnectGraceInfo | null;
  forfeitInfo?: ForfeitInfo | null;
}

export function createInitialRoomState(roomId: string): RoomState {
  return {
    roomId,
    status: "waiting_for_players",
    roundStatus: "picking_teams",
    currentRound: 1,
    maxRounds: 5,
    player1: null,
    player2: null,
    team1: null,
    team2: null,
    roundStartTime: null,
    passVotes: [],
    roundDuration: 15,
    disconnectGrace: null,
    forfeitInfo: null,
  };
}
