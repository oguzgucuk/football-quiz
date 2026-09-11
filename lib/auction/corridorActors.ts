/**
 * Koridor Tabanlı Oyuncu ve Aktör Seçici Modülü.
 * Pozisyon içindeki şutör, asistçi ve savunmacıyı koridor ağırlıklarına göre belirler.
 */

import { PitchCorridor, SquadSlot, TeamLineup } from "./auctionTypes";
import { DEFAULT_TACTICS, getSlotCorridor } from "./corridorEngine";
import { ratingCurve } from "./matchWeights";

function weightedPick<T>(candidates: { item: T; weight: number }[]): T | undefined {
  const valid = candidates.filter((c) => c.weight > 0);
  const total = valid.reduce((sum, c) => sum + c.weight, 0);
  if (!total) return undefined;
  let roll = Math.random() * total;
  for (const c of valid) {
    if (roll <= c.weight) return c.item;
    roll -= c.weight;
  }
  return valid[0]?.item;
}

/**
 * Atak koridoruna göre şut çekecek oyuncuyu seçer.
 * Santrfor (ST/CF) her koridorda bitiricidir; kanat forvetler kendi koridorlarında şutör olur.
 */
export function pickCorridorShooter(lineup: TeamLineup, corridor: PitchCorridor): SquadSlot | undefined {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const candidates: { item: SquadSlot; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let weight = 0;
    if (slot.targetPosition === "ST" || slot.targetPosition === "CF") {
      weight = curve * 2.0;
      // Uzun pas taktiğinde forvetin şutör olma şansı iki katına çıkar
      if (tactics.buildUp === "long_ball") weight *= 2.0;
    } else if ((slot.targetPosition === "LW" || slot.targetPosition === "RW") && slotCorridor === corridor) {
      weight = curve * 1.8;
    } else if (slot.targetPosition === "CAM" && (corridor === "center" || slotCorridor === corridor)) {
      weight = curve * 1.3;
    } else if ((slot.targetPosition === "LM" || slot.targetPosition === "RM") && slotCorridor === corridor) {
      weight = curve * 0.9;
    } else if (slotCorridor === corridor) {
      weight = curve * 0.3;
    }

    if (weight > 0) {
      candidates.push({ item: slot, weight });
    }
  }

  return weightedPick(candidates) || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK");
}

/**
 * Gol pozisyonunu hazırlayan asistçiyi seçer.
 * Uzun pasta stoper (CB) de doğrudan savunma arkasına uzun topla asist yapabilir!
 */
export function pickCorridorAssist(
  lineup: TeamLineup,
  corridor: PitchCorridor,
  scorerName: string
): string | undefined {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const candidates: { item: string; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    if (slot.placedPlayer.fullName === scorerName) continue;

    const curve = ratingCurve(slot.effectiveRating);
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);
    let weight = 0;

    // Kanatlar ve orta sahalar
    if (slotCorridor === corridor && ["LM", "RM", "LW", "RW"].includes(slot.targetPosition)) {
      weight = curve * 2.0;
    } else if (slot.targetPosition === "CAM" || slot.targetPosition === "CM") {
      weight = curve * 1.6;
    } else if (slotCorridor === corridor && ["LB", "RB", "LWB", "RWB"].includes(slot.targetPosition)) {
      // Bek bindirmesinden gelen orta
      weight = curve * 1.2;
    } else if (tactics.buildUp === "long_ball" && slot.targetPosition === "CB") {
      // Uzun pasta stoperin defans arkasına uzun pası
      weight = curve * 1.5;
    } else if (slot.targetPosition === "ST" || slot.targetPosition === "CF") {
      // Çift forvette forvet arkadaşına indirme
      weight = curve * 1.0;
    }

    if (weight > 0) {
      candidates.push({ item: slot.placedPlayer.fullName, weight });
    }
  }

  return weightedPick(candidates);
}

/**
 * Atağı kesen savunmacıyı seçer (kademeye giren stoper veya kanadı kapatan bek).
 */
export function pickCorridorDefender(lineup: TeamLineup, defendingCorridor: PitchCorridor): string | undefined {
  const candidates: { item: string; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);
    let weight = 0;

    if (slot.targetPosition === "CB") {
      weight = curve * 1.8;
    } else if (slotCorridor === defendingCorridor && ["LB", "RB", "LWB", "RWB"].includes(slot.targetPosition)) {
      weight = curve * 1.7;
    } else if (slotCorridor === defendingCorridor && ["CDM", "CM", "LM", "RM"].includes(slot.targetPosition)) {
      weight = curve * 0.9;
    }

    if (weight > 0) {
      candidates.push({ item: slot.placedPlayer.fullName, weight });
    }
  }

  return weightedPick(candidates);
}
