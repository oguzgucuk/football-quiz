/**
 * Sunucu ve istemci tarafında kullanılan merkezi oda state modeli ve başlangıç durumu.
 */

import { Team, Nation, GameMode, RoundStatus } from "@/types/game";

export interface RoomPlayer {
  userId: string;
  username: string;
  score: number;
  isReady: boolean;
  selectedTeamId?: string | null;
  selectedNationId?: string | null;
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
  gameMode?: GameMode;
  status: "waiting_for_players" | "in_round" | "match_finished";
  roundStatus: RoundStatus;
  currentRound: number;
  maxRounds: number;
  player1: RoomPlayer | null;
  player2: RoomPlayer | null;
  team1: Team | null;
  team2: Team | null;
  nation?: Nation | null;
  currentNationPickerUserId?: string | null;
  currentTeamPickerUserId?: string | null;
  initialNationPickerUserId?: string | null;
  roundStartTime: number | null;
  passVotes: string[];
  roundDuration: number;
  disconnectGrace?: DisconnectGraceInfo | null;
  forfeitInfo?: ForfeitInfo | null;
}

export function createInitialRoomState(roomId: string): RoomState {
  const isNationTeam = roomId.includes("_country_vs_team_") || roomId.includes("_millet_");

  return {
    roomId,
    gameMode: isNationTeam ? "country_vs_team" : "team_vs_team",
    status: "waiting_for_players",
    roundStatus: "picking_teams",
    currentRound: 1,
    maxRounds: 5,
    player1: null,
    player2: null,
    team1: null,
    team2: null,
    nation: null,
    currentNationPickerUserId: null,
    currentTeamPickerUserId: null,
    initialNationPickerUserId: null,
    roundStartTime: null,
    passVotes: [],
    roundDuration: 15,
    disconnectGrace: null,
    forfeitInfo: null,
  };
}
