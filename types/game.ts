/**
 * Futbol Quiz oyunu için temel model ve state tipleri.
 */

export interface Player {
  id: string;
  fullName: string;
  birthDate?: string | null;
  nationality?: string | null;
  position?: string | null;
  externalRef?: string | null;
  kaggleId?: string | null;
  wikidataId?: string | null;
}

export interface Team {
  id: string;
  name: string;
  country: string;
  league: string;
  logoUrl?: string | null;
  aliases?: string[];
}

export interface PlayerTeamHistory {
  id: string;
  playerId: string;
  teamId: string;
  seasonStart?: number | null;
  seasonEnd?: number | null;
  isNationalTeam: boolean;
}

export type GameMode = "team_vs_team" | "country_vs_team" | "country_vs_country";

export type RoundStatus = "picking_teams" | "answering" | "round_finished";

export interface MatchRound {
  id: string;
  matchId: string;
  roundNumber: number;
  team1Id: string;
  team2Id: string;
  winnerUserId?: string | null;
  answerGiven?: string | null;
  timeTakenMs?: number | null;
  answeredAt?: string | null;
}

export interface PlayerSearchItem {
  id: string;
  name: string;
  nationality?: string | null;
  birthYear?: number | null;
  position?: string | null;
}
