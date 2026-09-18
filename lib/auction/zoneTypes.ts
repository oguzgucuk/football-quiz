/**
 * 9 Bölgeli (3x3 Saha Grid'i) Simülasyon Motoru Tip Tanımları.
 * Saha 3 yatay hat (defans, orta saha, hücum) ve 3 dikey koridordan (sol, merkez, sağ) oluşur.
 */

import { PitchPosition, TeamTactics } from "./auctionTypes";

export type PitchThird = "def" | "mid" | "att";
export type PitchCorridor = "left" | "center" | "right";

export type ZoneId =
  | "def_left"
  | "def_center"
  | "def_right"
  | "mid_left"
  | "mid_center"
  | "mid_right"
  | "att_left"
  | "att_center"
  | "att_right";

export type BallPhase =
  | "kick_off"
  | "goal_kick"
  | "build_up"
  | "transition"
  | "chance_creation"
  | "finishing"
  | "corner"
  | "rebound";

export interface BallState {
  possessingTeamUserId: string;
  zone: ZoneId;
  phase: BallPhase;
  actionCount?: number;
  lastDefenderName?: string;
  lastPasserName?: string;
}

export interface ZoneParticipation {
  zone: ZoneId;
  weight: number;
}

export interface SubstitutionAction {
  userId: string;
  outPlayerId: string;
  inPlayerId: string;
  minute?: number;
}

export interface HalftimeTacticsAction {
  userId: string;
  tactics: TeamTactics;
}
