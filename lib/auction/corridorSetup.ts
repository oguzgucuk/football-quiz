/**
 * Koridor Eşleşmesi, Yön Zarı ve Maç Temposu Modülü.
 * Slotların xPercent geometrisini, takım GEN ağırlıklı maç temposunu ve
 * atak koridoru zarını yönetir.
 */

import {
  FormationName,
  PitchCorridor,
  PitchPosition,
  TeamLineup,
  TeamTactics,
} from "./auctionTypes";
import { FORMATION_CONFIGS } from "./formationTemplates";
import { RandomSource } from "./simulationRandom";

export const DEFAULT_TACTICS: TeamTactics = {
  tempo: "balanced",
  buildUp: "balanced",
  pressing: "balanced",
  attackDirection: "balanced",
  transition: "balanced",
  chanceCreation: "balanced",
};

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

/**
 * Slotun geometrik koordinatına (xPercent) göre koridorunu belirler.
 */
export function getSlotCorridor(
  slotId: string,
  targetPosition: PitchPosition,
  formation: FormationName
): PitchCorridor {
  const def = FORMATION_CONFIGS[formation]?.find((d) => d.slotId === slotId);
  if (def) {
    if (def.xPercent < 42) return "left";
    if (def.xPercent > 58) return "right";
    return "center";
  }
  if (["LB", "LWB", "LM", "LW"].includes(targetPosition)) return "left";
  if (["RB", "RWB", "RM", "RW"].includes(targetPosition)) return "right";
  return "center";
}

/**
 * İki takımın tempo tercihlerini eşit ağırlıkla birleştirerek
 * maçtaki toplam pozisyon sayısını belirler (16 ile 24 arası, taban 20).
 */
export function calculateMatchTempo(homeLineup: TeamLineup, awayLineup: TeamLineup): number {
  const homeTactics = homeLineup.tactics || DEFAULT_TACTICS;
  const awayTactics = awayLineup.tactics || DEFAULT_TACTICS;

  const deltaMap: Record<TeamTactics["tempo"], number> = { slow: -4, balanced: 0, fast: 4 };
  const weightedDelta = (
    (deltaMap[homeTactics.tempo] ?? 0) + (deltaMap[awayTactics.tempo] ?? 0)
  ) / 2;

  return Math.round(clamp(20 + weightedDelta, 16, 24));
}

/**
 * Yalnızca topa sahip takımın yön tercihine göre koridor zarı atar.
 */
export function determineTeamAttackCorridor(
  lineup: TeamLineup,
  random: RandomSource = Math.random
): PitchCorridor {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  let left = 100, center = 100, right = 100;

  if (tactics.attackDirection === "left") { left += 105; center -= 25; right -= 45; }
  else if (tactics.attackDirection === "right") { right += 105; center -= 25; left -= 45; }
  else if (tactics.attackDirection === "center") { center += 105; left -= 35; right -= 35; }
  else if (tactics.attackDirection === "wings") { left += 65; right += 65; center -= 60; }

  left = Math.max(15, left);
  center = Math.max(15, center);
  right = Math.max(15, right);

  const roll = random() * (left + center + right);
  if (roll <= left) return "left";
  if (roll <= left + center) return "center";
  return "right";
}

export function determineAttackCorridor(
  attackingLineup: TeamLineup,
  _defendingLineup?: TeamLineup,
  random: RandomSource = Math.random
): PitchCorridor {
  return determineTeamAttackCorridor(attackingLineup, random);
}

export function mirrorCorridor(corridor: PitchCorridor): PitchCorridor {
  if (corridor === "left") return "right";
  if (corridor === "right") return "left";
  return "center";
}
