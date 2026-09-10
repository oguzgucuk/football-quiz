/**
 * Saha Mevki Uyumu, Ceza Puanları ve Hat Güçleri Hesaplama Modülü.
 * Kullanıcı tanımlı formüller:
 * - Doğal: 0 ceza
 * - Çok yakın: -2 reyting
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

/** Birbirinin doğrudan alternatifi olan mevkiler. */
const VERY_NEAR_POSITIONS: Partial<Record<PitchPosition, PitchPosition[]>> = {
  RB: ["RWB"],
  RWB: ["RB"],
  LB: ["LWB"],
  LWB: ["LB"],
  LM: ["LW"],
  LW: ["LM"],
  RM: ["RW"],
  RW: ["RM"],
  CF: ["ST"],
  ST: ["CF"],
};

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

  // 3. Çok Yakın Mevki Kontrolü (-2 Reyting)
  const isVeryNear = playerPositions.some((position) =>
    VERY_NEAR_POSITIONS[position as PitchPosition]?.includes(targetPosition)
  );
  if (isVeryNear) {
    const penalized = Math.max(40, baseRating - 2);
    return { effectiveRating: penalized, penalty: 2 };
  }

  // 4. Yakın Mevki Kontrolü (-5 Reyting)
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

  // 5. Uzak Mevki Kontrolü (-20 Reyting)
  const penalized = Math.max(40, baseRating - 20);
  return { effectiveRating: penalized, penalty: 20 };
}

/** Diziliş slotlarını ve takım ortalamasını hesaplar. Hat etkileri maç içinde çözülür. */
export function calculateLineupPowers(
  userId: string,
  formation: FormationName,
  slots: SquadSlot[]
): TeamLineup {
  const allRatingSum = slots.reduce((total, slot) => total + slot.effectiveRating, 0);
  const teamOvr = Math.round(allRatingSum / Math.max(1, slots.length));

  return {
    userId,
    formation,
    slots,
    teamOvr,
    isConfirmed: slots.every((s) => s.placedPlayer !== null),
  };
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
    } else if (penalty === 2 || penalty === 5) {
      nearby.push({ position: pos, effectiveRating, penalty, category: "nearby" });
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
