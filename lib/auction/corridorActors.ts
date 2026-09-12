/**
 * Koridor Tabanlı Oyuncu ve Aktör Seçici Modülü.
 * matchWeights.ts tablosundaki TEK DOĞRULUK KAYNAĞI ağırlıkları referans alarak
 * pozisyon içindeki şutör, asistçi ve savunmacıyı belirler.
 */

import { PitchCorridor, SquadSlot, TeamLineup } from "./auctionTypes";
import { DEFAULT_TACTICS, getSlotCorridor } from "./corridorEngine";
import { ASSIST_WEIGHTS, ATK_WEIGHTS, DEF_WEIGHTS, ratingCurve } from "./matchWeights";

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
 * ATK_WEIGHTS taban gücü ve koridor yakınlığına göre ağırlıklandırılır.
 */
export function pickCorridorShooter(lineup: TeamLineup, corridor: PitchCorridor): SquadSlot | undefined {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const candidates: { item: SquadSlot; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const baseAtk = ATK_WEIGHTS[slot.targetPosition] ?? 0.2;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let weight = curve * baseAtk;
    // Kendi koridorunda veya santrfor merkezdeyse şutör olma şansı yükselir
    if (slotCorridor === corridor || (corridor === "center" && ["ST", "CF"].includes(slot.targetPosition))) {
      weight *= 1.4;
    }
    // Uzun pas taktiğinde forvetin şutör olma şansı katlanır
    if (tactics.buildUp === "long_ball" && ["ST", "CF"].includes(slot.targetPosition)) {
      weight *= 1.8;
    }

    if (weight > 0) {
      candidates.push({ item: slot, weight });
    }
  }

  return weightedPick(candidates) || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK");
}

/**
 * Gol pozisyonunu hazırlayan asistçiyi seçer.
 * ASSIST_WEIGHTS taban gücü ve koridor yakınlığına göre belirlenir.
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
    const baseAssist = ASSIST_WEIGHTS[slot.targetPosition] ?? 0.5;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let weight = curve * baseAssist;
    if (slotCorridor === corridor) {
      weight *= 1.35;
    }
    // Uzun pasta stoperin defans arkasına uzun top atarak asist yapma şansı
    if (tactics.buildUp === "long_ball" && slot.targetPosition === "CB") {
      weight *= 2.0;
    }

    if (weight > 0) {
      candidates.push({ item: slot.placedPlayer.fullName, weight });
    }
  }

  return weightedPick(candidates);
}

/**
 * Atağı kesen savunmacıyı seçer (DEF_WEIGHTS taban ağırlıklarına göre).
 */
export function pickCorridorDefender(lineup: TeamLineup, defendingCorridor: PitchCorridor): string | undefined {
  const candidates: { item: string; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const baseDef = DEF_WEIGHTS[slot.targetPosition] ?? 0.2;
    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);

    let weight = curve * baseDef;
    if (slotCorridor === defendingCorridor) {
      weight *= 1.4;
    }

    if (weight > 0) {
      candidates.push({ item: slot.placedPlayer.fullName, weight });
    }
  }

  return weightedPick(candidates);
}

