/**
 * Realtime oda iletişimi için event tipleri ve mesaj tanımları.
 */

import { Team } from "@/types/game";

export type RoomEventType =
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "ROUND_START_PICKING"
  | "TEAM_PICKED"
  | "ROUND_START_ANSWERING"
  | "ANSWER_ATTEMPT"
  | "ROUND_ENDED"
  | "MATCH_ENDED";

export interface PlayerJoinedPayload {
  userId: string;
  username: string;
  isHost: boolean;
}

export interface RoundStartPickingPayload {
  roundNumber: number;
  pickingDurationSeconds: number;
  availableTeams: Team[];
}

export interface RoundStartAnsweringPayload {
  roundNumber: number;
  team1: Team;
  team2: Team;
  startedAtServerTimestamp: number;
}

export interface AnswerAttemptPayload {
  userId: string;
  isCorrect: boolean;
  playerNameSubmitted: string;
  roundNumber: number;
}

export interface RoundEndedPayload {
  roundNumber: number;
  winnerUserId: string | null;
  correctAnswer: string | null;
  scores: Record<string, number>;
}

export interface MatchEndedPayload {
  winnerUserId: string | null;
  isDraw: boolean;
  finalScores: Record<string, number>;
  eloChanges?: Record<string, number>;
}
