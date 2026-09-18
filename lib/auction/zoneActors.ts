/**
 * 9 Bölge Aktör Seçim Motoru.
 * Aktif bölgede pası veren, topu çalan, araya giren, şutu çeken ve asist yapan oyuncuyu
 * mevkisel ağırlıklarına ve reytinglerine göre seçer.
 */

import { SquadSlot, TeamLineup } from "./auctionTypes";
import { ASSIST_WEIGHTS, ATK_WEIGHTS, DEF_WEIGHTS, LONG_SHOT_WEIGHTS, MID_WEIGHTS, ratingCurve } from "./matchWeights";
import { getPositionZoneWeight } from "./zoneGrid";
import { ZoneId } from "./zoneTypes";

interface WeightedCandidate<T> {
  item: T;
  weight: number;
}

function weightedPick<T>(candidates: WeightedCandidate<T>[]): T | null {
  const totalWeight = candidates.reduce((sum, c) => sum + Math.max(0, c.weight), 0);
  if (totalWeight <= 0) return candidates[0]?.item ?? null;

  let randomVal = Math.random() * totalWeight;
  for (const c of candidates) {
    randomVal -= Math.max(0, c.weight);
    if (randomVal <= 0) return c.item;
  }
  return candidates[candidates.length - 1]?.item ?? null;
}

/**
 * Belirtilen bölgede pası dağıtan / atağı yönlendiren oyuncuyu seçer.
 */
export function pickZonePasser(lineup: TeamLineup, zone: ZoneId): SquadSlot {
  const candidates: WeightedCandidate<SquadSlot>[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const zw = getPositionZoneWeight(slot.targetPosition, zone);
    const basePass = ASSIST_WEIGHTS[slot.targetPosition] ?? 0.5;
    const weight = curve * basePass * zw;
    if (weight > 0) candidates.push({ item: slot, weight });
  }

  return weightedPick(candidates) || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK")!;
}

/**
 * Belirtilen bölgede topu çalan / presle kapan savunmacıyı seçer.
 */
export function pickZoneStealer(lineup: TeamLineup, defendingZone: ZoneId): SquadSlot {
  const candidates: WeightedCandidate<SquadSlot>[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const zw = getPositionZoneWeight(slot.targetPosition, defendingZone);
    const baseDef = (DEF_WEIGHTS[slot.targetPosition] ?? 0.3) * 0.7 + (MID_WEIGHTS[slot.targetPosition] ?? 0.3) * 0.3;
    const weight = curve * baseDef * zw;
    if (weight > 0) candidates.push({ item: slot, weight });
  }

  return weightedPick(candidates) || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK")!;
}

/**
 * Ceza sahasında veya yay çevresinde şutu çeken forveti seçer.
 */
export function pickZoneShooter(lineup: TeamLineup, zone: ZoneId, isLongRange: boolean = false): SquadSlot {
  const candidates: WeightedCandidate<SquadSlot>[] = [];
  const weightsTable = isLongRange ? LONG_SHOT_WEIGHTS : ATK_WEIGHTS;

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const zw = getPositionZoneWeight(slot.targetPosition, zone);
    const baseAtk = weightsTable[slot.targetPosition] ?? 0.2;
    const weight = curve * baseAtk * (zw + 0.2); // Forvetler şutta önceliklidir
    if (weight > 0) candidates.push({ item: slot, weight });
  }

  return weightedPick(candidates) || lineup.slots.find((s) => s.placedPlayer && ["ST", "CF", "LW", "RW", "CAM"].includes(s.targetPosition))!;
}

/**
 * Gol veya şut pozisyonunu hazırlayan asistçiyi seçer.
 */
export function pickZoneAssister(lineup: TeamLineup, zone: ZoneId, shooterName?: string): string | undefined {
  const candidates: WeightedCandidate<SquadSlot>[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    if (shooterName && slot.placedPlayer.fullName === shooterName) continue; // Kendine asist yapamaz
    const curve = ratingCurve(slot.effectiveRating);
    const zw = getPositionZoneWeight(slot.targetPosition, zone);
    const baseAssist = ASSIST_WEIGHTS[slot.targetPosition] ?? 0.3;
    const weight = curve * baseAssist * zw;
    if (weight > 0) candidates.push({ item: slot, weight });
  }

  // %80 ihtimalle asistli gol, %20 solo aksiyon
  if (Math.random() < 0.80) {
    const picked = weightedPick(candidates);
    return picked?.placedPlayer?.fullName;
  }
  return undefined;
}

/**
 * Şutu bloklayan veya kademeye giren stoperi seçer.
 */
export function pickZoneDefender(lineup: TeamLineup, defendingZone: ZoneId): string {
  const candidates: WeightedCandidate<SquadSlot>[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const zw = getPositionZoneWeight(slot.targetPosition, defendingZone);
    const baseDef = DEF_WEIGHTS[slot.targetPosition] ?? 0.3;
    const weight = curve * baseDef * zw;
    if (weight > 0) candidates.push({ item: slot, weight });
  }

  const picked = weightedPick(candidates) || lineup.slots.find((s) => s.placedPlayer && ["CB", "LB", "RB", "CDM"].includes(s.targetPosition));
  return picked?.placedPlayer?.fullName || "Savunma";
}

/**
 * Kaleciyi seçer.
 */
export function pickGoalkeeper(lineup: TeamLineup): { name: string; rating: number } {
  const gkSlot = lineup.slots.find((s) => s.targetPosition === "GK");
  return {
    name: gkSlot?.placedPlayer?.fullName || "Kaleci",
    rating: gkSlot?.effectiveRating || 40,
  };
}
