/**
 * Koridor Tabanlı Güç ve Taktik Katsayıları Motoru.
 * Orta saha kapışması, ceza sahası delme ve savunma güçlerini hesaplar.
 */

import { FormationName, PitchCorridor, PitchPosition, SquadSlot, TeamLineup, TeamTactics } from "./auctionTypes";
import { DEFAULT_TACTICS, getSlotCorridor } from "./corridorSetup";
import { ratingCurve } from "./matchWeights";

const MID_POSITIONS: PitchPosition[] = ["CDM", "CM", "CAM", "LM", "RM"];
const DEF_POSITIONS: PitchPosition[] = ["CB", "LB", "RB", "LWB", "RWB"];

function getMidfieldMultiplier(pos: PitchPosition, slotC: PitchCorridor, c: PitchCorridor, multiMid: boolean): number {
  if (c === "center") return ["CM", "CDM", "CAM"].includes(pos) ? 1.0 : 0.5;
  if (pos === "LM" || pos === "RM") return slotC === c ? 1.0 : 0;
  if (["CM", "CDM", "CAM"].includes(pos) && slotC === c) return multiMid ? 0.60 : 0.20;
  return 0;
}

export function calculateCorridorMidfieldScore(lineup: TeamLineup, corridor: PitchCorridor): number {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  let totalScore = 0;
  let hasPlayer = false;
  const isMultiMid = lineup.slots.filter((s) => s.placedPlayer && ["CM", "CDM", "CAM"].includes(s.targetPosition)).length >= 3;

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK" || !MID_POSITIONS.includes(slot.targetPosition)) continue;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);
    const mult = getMidfieldMultiplier(slot.targetPosition, slotCorridor, corridor, isMultiMid);
    if (mult > 0) {
      totalScore += ratingCurve(slot.effectiveRating) * mult;
      hasPlayer = true;
    }
  }

  if (!hasPlayer) {
    const fallback = lineup.slots.find((s) => s.placedPlayer && MID_POSITIONS.includes(s.targetPosition));
    if (fallback) totalScore += ratingCurve(fallback.effectiveRating) * 0.2;
  }

  if (tactics.pressing === "high_press") totalScore *= 1.25;
  else if (tactics.pressing === "park_bus") totalScore *= 0.85;

  return Math.max(0.01, totalScore);
}

function calculateSlotAttack(slot: SquadSlot, c: PitchCorridor, f: FormationName, singleSt: boolean, multiMid: boolean, tac: TeamTactics): number {
  const curve = ratingCurve(slot.effectiveRating);
  const slotC = getSlotCorridor(slot.slotId, slot.targetPosition, f);

  if (slot.targetPosition === "ST" || slot.targetPosition === "CF") {
    if (c === "center") return curve * 1.5;
    if (singleSt) return curve * 1.5 * 0.30;
    return slotC === c ? curve * 1.5 * 0.60 : curve * 1.5 * 0.15;
  }
  if ((slot.targetPosition === "LW" || slot.targetPosition === "RW") && slotC === c) return curve * 1.4;

  if (MID_POSITIONS.includes(slot.targetPosition)) {
    let ratio = 0;
    if (c === "center" && (slotC === "center" || ["CM", "CDM", "CAM"].includes(slot.targetPosition))) ratio = 0.8;
    else if (slotC === c) ratio = ["LM", "RM"].includes(slot.targetPosition) ? 0.8 : (multiMid ? 0.48 : 0.16);
    if (ratio > 0) {
      if (tac.buildUp === "short_pass") ratio *= 1.25;
      else if (tac.buildUp === "long_ball") ratio *= 0.20;
      return curve * ratio;
    }
  }

  if (DEF_POSITIONS.includes(slot.targetPosition) && slotC === c && ["LB", "RB", "LWB", "RWB"].includes(slot.targetPosition)) {
    return curve * 0.5 * (tac.buildUp === "short_pass" ? 1.25 : 1.0);
  }
  return 0;
}

export function calculateCorridorAttackPower(lineup: TeamLineup, corridor: PitchCorridor): number {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const isSingleSt = lineup.slots.filter((s) => s.placedPlayer && ["ST", "CF"].includes(s.targetPosition)).length === 1;
  const isMultiMid = lineup.slots.filter((s) => s.placedPlayer && ["CM", "CDM", "CAM"].includes(s.targetPosition)).length >= 3;

  let power = 0;
  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    power += calculateSlotAttack(slot, corridor, lineup.formation, isSingleSt, isMultiMid, tactics);
  }
  if (tactics.pressing === "park_bus") power *= 0.85;
  return Math.max(0.01, power);
}

function calculateSlotDefense(slot: SquadSlot, defC: PitchCorridor, f: FormationName, back3: boolean, multiMid: boolean, tac: TeamTactics): number {
  const curve = ratingCurve(slot.effectiveRating);
  const slotC = getSlotCorridor(slot.slotId, slot.targetPosition, f);

  if (slot.targetPosition === "CB") {
    if (defC === "center") return curve * 1.5;
    return slotC === defC ? curve * 1.5 * (back3 ? 0.70 : 0.35) : curve * 0.30;
  }
  if (DEF_POSITIONS.includes(slot.targetPosition) && slotC === defC) {
    return curve * 1.4 * (tac.buildUp === "short_pass" ? 0.75 : 1.0);
  }
  if (MID_POSITIONS.includes(slot.targetPosition)) {
    let support = 0;
    if (defC === "center" && (slotC === "center" || ["CM", "CDM", "CAM"].includes(slot.targetPosition))) support = 0.6;
    else if (slotC === defC) support = ["LM", "RM"].includes(slot.targetPosition) ? 0.6 : (multiMid ? 0.36 : 0.12);
    if (support > 0) {
      if (tac.buildUp === "short_pass") support *= 0.75;
      else if (tac.buildUp === "long_ball") support *= 0.20;
      return curve * support;
    }
  }
  return 0;
}

export function calculateCorridorDefensePower(lineup: TeamLineup, defendingCorridor: PitchCorridor): number {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const is3or5Back = lineup.slots.filter((s) => s.placedPlayer && s.targetPosition === "CB").length >= 3;
  const isMultiMid = lineup.slots.filter((s) => s.placedPlayer && ["CM", "CDM", "CAM"].includes(s.targetPosition)).length >= 3;

  let power = 0;
  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    power += calculateSlotDefense(slot, defendingCorridor, lineup.formation, is3or5Back, isMultiMid, tactics);
  }
  if (tactics.pressing === "high_press") power *= 0.75;
  else if (tactics.pressing === "park_bus") power *= 1.30;
  return Math.max(0.01, power);
}
