/**
 * Saha Mevki Uyumu, Ceza Puanları ve Hat Güçleri Hesaplama Modülü.
 * Kullanıcı tanımlı formüller:
 * - Doğal: 0 ceza
 * - Yakın: -5 reyting
 * - Uzak: -20 reyting
 * - Kaleci harici kaleye geçerse: direkt 40 reyting
 * - Forvet gücü = sum / 4
 * - Orta saha gücü = sum / 5
 * - Defans gücü = sum / 6
 * - CAM: %70 atak, %30 defans; CM: %50/%50; CDM: %70 defans, %30 atak
 */

import { AuctionPlayerCard, PitchPosition, SquadSlot, TeamLineup, FormationName } from "./auctionTypes";

const DEF_POSITIONS: PitchPosition[] = ["CB", "LB", "RB", "LWB", "RWB"];
const MID_POSITIONS: PitchPosition[] = ["CDM", "CM", "CAM", "LM", "RM"];
const FWD_POSITIONS: PitchPosition[] = ["ST", "CF", "LW", "RW"];

/**
 * Oyuncunun bir mevkideki ceza miktarını ve efektif reytingini hesaplar.
 */
export function calculateSlotRating(
  player: AuctionPlayerCard | null,
  targetPosition: PitchPosition
): { effectiveRating: number; penalty: number } {
  if (!player) return { effectiveRating: 0, penalty: 0 };

  const baseRating = player.overallPrime;
  const playerPositions = player.positions.length > 0 ? player.positions : [player.primaryPosition || "CM"];

  // 1. Kaleci Kontrolü (Kaleci harici biri kaleye geçerse direkt 40 reyting)
  if (targetPosition === "GK") {
    const isNaturalGK = playerPositions.includes("GK");
    if (isNaturalGK) return { effectiveRating: baseRating, penalty: 0 };
    return { effectiveRating: 40, penalty: Math.max(0, baseRating - 40) };
  }

  // Kaleci sahaya geçerse direkt 40 reyting
  if (playerPositions.includes("GK")) {
    return { effectiveRating: 40, penalty: Math.max(0, baseRating - 40) };
  }

  // 2. Doğal Mevki (Ceza yok)
  if (playerPositions.includes(targetPosition)) {
    return { effectiveRating: baseRating, penalty: 0 };
  }

  // 3. Yakın Mevki Kontrolü (-5 Reyting)
  const isTargetDef = DEF_POSITIONS.includes(targetPosition);
  const isTargetMid = MID_POSITIONS.includes(targetPosition);
  const isTargetFwd = FWD_POSITIONS.includes(targetPosition);

  const hasPlayerDef = playerPositions.some((p) => DEF_POSITIONS.includes(p as PitchPosition));
  const hasPlayerMid = playerPositions.some((p) => MID_POSITIONS.includes(p as PitchPosition));
  const hasPlayerFwd = playerPositions.some((p) => FWD_POSITIONS.includes(p as PitchPosition));

  const isSameZone =
    (isTargetDef && hasPlayerDef) ||
    (isTargetMid && hasPlayerMid) ||
    (isTargetFwd && hasPlayerFwd);

  if (isSameZone) {
    const penalized = Math.max(40, baseRating - 5);
    return { effectiveRating: penalized, penalty: 5 };
  }

  // 4. Uzak Mevki Kontrolü (-20 Reyting)
  const penalized = Math.max(40, baseRating - 20);
  return { effectiveRating: penalized, penalty: 20 };
}

/**
 * Dizilişteki tüm slotların ve hat güçlerinin hesaplanması.
 * effectiveAtkPower: En iyi forvet %45, geri kalan forvetlerin ortalaması %55 ağırlıklı
 * hesaplanır — böylece yıldız oyuncu düz ortalamaya gömülmez, gerçek etkisini gösterir.
 *
 * Örnek: Ronaldo (96) + iki 72 OVR forvet
 *   Eski (düz ortalama): (96+72+72)/3 = 80
 *   Yeni (star-weighted): 96*0.45 + 72*0.55 = 43.2 + 39.6 = 82.8
 */
export function calculateLineupPowers(
  userId: string,
  formation: FormationName,
  slots: SquadSlot[]
): TeamLineup {
  let midSum = 0;
  let defSum = 0;
  let allRatingSum = 0;

  let midAtkContributionSum = 0;
  let midDefContributionSum = 0;

  const fwdSlots: SquadSlot[] = [];

  for (const slot of slots) {
    const eff = slot.effectiveRating;
    allRatingSum += eff;
    const pos = slot.targetPosition;

    if (FWD_POSITIONS.includes(pos)) {
      fwdSlots.push(slot);
    } else if (MID_POSITIONS.includes(pos)) {
      midSum += eff;
      const { atkWeight, defWeight } = getMidfieldWeights(pos);
      midAtkContributionSum += eff * atkWeight;
      midDefContributionSum += eff * defWeight;
    } else {
      // GK ve Defans
      defSum += eff;
    }
  }

  const fwdCount = Math.max(1, fwdSlots.length);
  const fwdSum = fwdSlots.reduce((s, sl) => s + sl.effectiveRating, 0);
  const rawFwdPower = Math.round((fwdSum / fwdCount) * 10) / 10;
  const rawMidPower = Math.round((midSum / 5) * 10) / 10;
  const rawDefPower = Math.round((defSum / 6) * 10) / 10;

  // Star-weighted forvet gücü hesabı
  const sortedFwdSlots = [...fwdSlots].sort((a, b) => b.effectiveRating - a.effectiveRating);
  const starSlot = sortedFwdSlots[0] ?? null;

  let starAttackerRating = 0;
  let starAttackerName = "Futbolcu";
  let starWeightedFwdPower = rawFwdPower;

  if (starSlot) {
    starAttackerRating = starSlot.effectiveRating;
    starAttackerName = starSlot.placedPlayer?.fullName ?? "Futbolcu";

    if (fwdSlots.length === 1) {
      starWeightedFwdPower = starSlot.effectiveRating;
    } else {
      const restSlots = sortedFwdSlots.slice(1);
      const restAvg = restSlots.reduce((s, sl) => s + sl.effectiveRating, 0) / restSlots.length;
      starWeightedFwdPower = starSlot.effectiveRating * 0.45 + restAvg * 0.55;
    }
  }

  const effectiveAtkPower = Math.round((starWeightedFwdPower + midAtkContributionSum / 5) * 10) / 10;
  const effectiveDefPower = Math.round((rawDefPower + midDefContributionSum / 5) * 10) / 10;
  const teamOvr = Math.round(allRatingSum / 11);

  return {
    userId,
    formation,
    slots,
    teamOvr,
    rawDefPower,
    rawMidPower,
    rawFwdPower,
    effectiveAtkPower,
    effectiveDefPower,
    starAttackerRating,
    starAttackerName,
    isConfirmed: slots.every((s) => s.placedPlayer !== null),
  };
}


function getMidfieldWeights(pos: PitchPosition): { atkWeight: number; defWeight: number } {
  if (pos === "CAM") return { atkWeight: 0.7, defWeight: 0.3 };
  if (pos === "CDM") return { atkWeight: 0.3, defWeight: 0.7 };
  return { atkWeight: 0.5, defWeight: 0.5 }; // CM, LM, RM
}

export interface PlayerPositionDetail {
  position: PitchPosition;
  effectiveRating: number;
  penalty: number;
  category: "natural" | "nearby" | "distant" | "goalkeeper";
}

export interface PlayerPositionBreakdown {
  natural: PlayerPositionDetail[];
  nearby: PlayerPositionDetail[];
  distant: PlayerPositionDetail[];
  isGoalkeeper: boolean;
}

/**
 * Oyuncunun oynayabildiği tüm mevkileri ve reyting cezalarını listeler.
 */
export function getPlayerPositionBreakdown(
  player: AuctionPlayerCard | null
): PlayerPositionBreakdown {
  if (!player) {
    return { natural: [], nearby: [], distant: [], isGoalkeeper: false };
  }

  const allPositions: PitchPosition[] = [
    "GK",
    "CB", "LB", "RB", "LWB", "RWB",
    "CDM", "CM", "CAM", "LM", "RM",
    "ST", "CF", "LW", "RW",
  ];

  const natural: PlayerPositionDetail[] = [];
  const nearby: PlayerPositionDetail[] = [];
  const distant: PlayerPositionDetail[] = [];

  for (const pos of allPositions) {
    const { effectiveRating, penalty } = calculateSlotRating(player, pos);
    if (penalty === 0) {
      natural.push({ position: pos, effectiveRating, penalty: 0, category: "natural" });
    } else if (penalty === 5) {
      nearby.push({ position: pos, effectiveRating, penalty: 5, category: "nearby" });
    } else {
      distant.push({
        position: pos,
        effectiveRating,
        penalty,
        category: pos === "GK" ? "goalkeeper" : "distant",
      });
    }
  }

  const isGoalkeeper = player.positions.some((p) => p.toUpperCase() === "GK");

  return { natural, nearby, distant, isGoalkeeper };
}
