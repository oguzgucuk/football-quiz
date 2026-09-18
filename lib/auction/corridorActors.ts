/**
 * Koridor Tabanlı Oyuncu ve Aktör Seçici Modülü.
 * matchWeights.ts tablosundaki TEK DOĞRULUK KAYNAĞI ağırlıkları referans alarak
 * pozisyon içindeki şutör, asistçi ve savunmacıyı belirler.
 */

import { PitchCorridor, SquadSlot, TeamLineup } from "./auctionTypes";
import { DEFAULT_TACTICS, getSlotCorridor } from "./corridorEngine";
import { ASSIST_WEIGHTS, ATK_WEIGHTS, DEF_WEIGHTS, LONG_SHOT_WEIGHTS, ratingCurve } from "./matchWeights";
import { pickWeighted, RandomSource } from "./simulationRandom";

/**
 * Atak koridoruna göre şut çekecek oyuncuyu seçer.
 * ATK_WEIGHTS taban gücü ve koridor yakınlığına göre ağırlıklandırılır.
 */
export function pickCorridorShooter(lineup: TeamLineup, corridor: PitchCorridor, random: RandomSource = Math.random): SquadSlot | undefined {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const candidates: { item: SquadSlot; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const baseAtk = ATK_WEIGHTS[slot.targetPosition] ?? 0.2;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let corridorFit = slotCorridor === corridor ? 1.4 : 0;
    if (["ST", "CF"].includes(slot.targetPosition)) corridorFit = corridor === "center" ? 1.6 : 0.65;
    else if (["CAM", "CM"].includes(slot.targetPosition) && corridor !== "center") corridorFit = 0.35;
    if (corridorFit <= 0) continue;
    let weight = curve * baseAtk * corridorFit;
    // Uzun pas taktiğinde forvetin şutör olma şansı katlanır
    if (tactics.buildUp === "long_ball" && ["ST", "CF"].includes(slot.targetPosition)) {
      weight *= 1.8;
    }

    if (weight > 0) {
      candidates.push({ item: slot, weight });
    }
  }

  return pickWeighted(candidates, random) || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK");
}

/**
 * Gol pozisyonunu hazırlayan asistçiyi seçer.
 * ASSIST_WEIGHTS taban gücü ve koridor yakınlığına göre belirlenir.
 */
export function pickCorridorAssist(
  lineup: TeamLineup,
  corridor: PitchCorridor,
  scorerName: string,
  random: RandomSource = Math.random
): string | undefined {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const candidates: { item: string; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    if (slot.placedPlayer.fullName === scorerName) continue;

    const curve = ratingCurve(slot.effectiveRating);
    const baseAssist = ASSIST_WEIGHTS[slot.targetPosition] ?? 0.5;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let corridorFit = slotCorridor === corridor ? 1.35 : 0.15;
    if (["CM", "CAM", "CDM"].includes(slot.targetPosition)) corridorFit = Math.max(corridorFit, 0.55);
    let weight = curve * baseAssist * corridorFit;
    // Uzun pasta stoperin defans arkasına uzun top atarak asist yapma şansı
    if (tactics.buildUp === "long_ball" && slot.targetPosition === "CB") {
      weight *= 2.0;
    }

    if (weight > 0) {
      candidates.push({ item: slot.placedPlayer.fullName, weight });
    }
  }

  return pickWeighted(candidates, random);
}

/**
 * Atağı kesen savunmacıyı seçer (DEF_WEIGHTS taban ağırlıklarına göre).
 */
export function pickCorridorDefender(lineup: TeamLineup, defendingCorridor: PitchCorridor, random: RandomSource = Math.random): string | undefined {
  const candidates: { item: string; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const baseDef = DEF_WEIGHTS[slot.targetPosition] ?? 0.2;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let corridorFit = slotCorridor === defendingCorridor ? 1.5 : 0;
    if (slot.targetPosition === "CB") corridorFit = defendingCorridor === "center" ? 1.5 : Math.max(corridorFit, 0.55);
    else if (["CDM", "CM"].includes(slot.targetPosition)) corridorFit = Math.max(corridorFit, 0.35);
    if (corridorFit <= 0) continue;
    const weight = curve * baseDef * corridorFit;

    if (weight > 0) {
      candidates.push({ item: slot.placedPlayer.fullName, weight });
    }
  }

  return pickWeighted(candidates, random);
}

/**
 * Ceza sahası dışından uzaktan şut çekecek oyuncuyu seçer.
 * LONG_SHOT_WEIGHTS taban gücü ve atağın koridoruna göre ağırlıklandırılır.
 */
export function pickLongRangeShooter(lineup: TeamLineup, corridor: PitchCorridor, random: RandomSource = Math.random): SquadSlot {
  const candidates: { item: SquadSlot; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const baseShot = LONG_SHOT_WEIGHTS[slot.targetPosition] ?? 0.5;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let weight = curve * baseShot;

    if (corridor === "center") {
      // Merkezde CAM, CM, CDM, ST tam önceliklidir
      if (["CAM", "CM", "CDM", "ST", "CF"].includes(slot.targetPosition)) {
        weight *= 1.4;
      } else {
        weight *= 0.5;
      }
    } else {
      // Kanat koridorlarında (left/right) kendi kanadındaki kanat forvetler ve bekler
      if (slotCorridor === corridor) {
        if (["LW", "RW"].includes(slot.targetPosition)) weight *= 1.6;
        else if (["LM", "RM", "LWB", "RWB"].includes(slot.targetPosition)) weight *= 1.3;
        else weight *= 1.1;
      } else if (["CAM", "CM"].includes(slot.targetPosition)) {
        // İç orta saha kanat çaprazına destek verir
        weight *= 1.0;
      } else {
        weight *= 0.1;
      }
    }

    if (weight > 0) {
      candidates.push({ item: slot, weight });
    }
  }

  return pickWeighted(candidates, random) || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK")!;
}

/**
 * Uzaktan şutun önüne siper olup blokaj yapmaya çalışacak savunmacıyı seçer.
 * DEF_WEIGHTS taban gücü ve atağın geldiği koridora göre belirlenir.
 */
export function pickCorridorBlocker(lineup: TeamLineup, defendingCorridor: PitchCorridor, random: RandomSource = Math.random): SquadSlot {
  const candidates: { item: SquadSlot; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const baseDef = DEF_WEIGHTS[slot.targetPosition] ?? 0.3;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let weight = curve * baseDef;

    if (defendingCorridor === "center") {
      // Merkezde yay önündeki CDM ve stoperler asıl blokajcılardır
      if (slot.targetPosition === "CDM") weight *= 1.8;
      else if (slot.targetPosition === "CB") weight *= 1.4;
      else if (slot.targetPosition === "CM") weight *= 1.1;
      else weight *= 0.3;
    } else {
      // Kanatta o kanadın beki ve kademeye kayan stoper bloklar
      if (slotCorridor === defendingCorridor) {
        if (["LB", "RB", "LWB", "RWB"].includes(slot.targetPosition)) weight *= 1.8;
        else if (slot.targetPosition === "CB") weight *= 1.4;
        else weight *= 1.1;
      } else {
        weight *= 0.2;
      }
    }

    if (weight > 0) {
      candidates.push({ item: slot, weight });
    }
  }

  return pickWeighted(candidates, random) || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK")!;
}


