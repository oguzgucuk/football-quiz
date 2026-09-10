import { PitchPosition, SquadSlot } from "./auctionTypes";

export const MID_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0, CB: 0.1, LB: 0.2, RB: 0.2, LWB: 0.35, RWB: 0.35,
  CDM: 1.1, CM: 0.9, LM: 0.8, RM: 0.8, CAM: 0.4,
  LW: 0.15, RW: 0.15, ST: 0.05, CF: 0.05,
};

export const ATK_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0, CB: 0.05, LB: 0.25, RB: 0.25, LWB: 0.45, RWB: 0.45,
  CDM: 0.1, CM: 0.45, LM: 0.65, RM: 0.65, CAM: 1.4,
  LW: 1.6, RW: 1.6, ST: 1.85, CF: 1.85,
};

export const DEF_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0, CB: 1.85, LB: 1.55, RB: 1.55, LWB: 1.2, RWB: 1.2,
  CDM: 0.8, CM: 0.65, LM: 0.55, RM: 0.55, CAM: 0.2,
  LW: 0.25, RW: 0.25, ST: 0.1, CF: 0.1,
};

/** Gol pasını kimin hazırlayacağını belirler: hücum ve orta saha katkısının toplamı. */
export const ASSIST_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0, CB: 0.15, LB: 0.45, RB: 0.45, LWB: 0.8, RWB: 0.8,
  CDM: 1.2, CM: 1.35, LM: 1.45, RM: 1.45, CAM: 1.8,
  LW: 1.75, RW: 1.75, ST: 1.9, CF: 1.9,
};

export function ratingCurve(rating: number): number {
  return Math.pow(Math.max(0, (rating - 40) / 59), 2.5);
}

export function sumScore(slots: SquadSlot[], weights: Record<PitchPosition, number>): number {
  return slots.reduce((total, slot) => (
    slot.placedPlayer ? total + ratingCurve(slot.effectiveRating) * weights[slot.targetPosition] : total
  ), 0);
}
