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

export const DEFAULT_TACTICS: TeamTactics = {
  tempo: "balanced",
  buildUp: "balanced",
  pressing: "balanced",
  attackDirection: "balanced",
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
 * İki takımın tempo tercihlerini GEN güçlerine göre ağırlıklandırarak
 * maçtaki toplam pozisyon sayısını belirler (10 ile 18 arası, taban 14).
 */
export function calculateMatchTempo(homeLineup: TeamLineup, awayLineup: TeamLineup): number {
  const homeOvr = Math.max(40, homeLineup.teamOvr || 70);
  const awayOvr = Math.max(40, awayLineup.teamOvr || 70);
  const homeTactics = homeLineup.tactics || DEFAULT_TACTICS;
  const awayTactics = awayLineup.tactics || DEFAULT_TACTICS;

  const deltaMap: Record<TeamTactics["tempo"], number> = { slow: -4, balanced: 0, fast: 4 };
  const weightedDelta =
    (homeOvr * (deltaMap[homeTactics.tempo] ?? 0) + awayOvr * (deltaMap[awayTactics.tempo] ?? 0)) /
    (homeOvr + awayOvr);

  return Math.round(clamp(14 + weightedDelta, 10, 18));
}

/**
 * İki takımın yön tercihlerini ve GEN güçlerini çarpıştırarak koridor zarı atar.
 */
export function determineAttackCorridor(
  homeLineup: TeamLineup,
  awayLineup: TeamLineup
): PitchCorridor {
  const homeOvr = Math.max(40, homeLineup.teamOvr || 70);
  const awayOvr = Math.max(40, awayLineup.teamOvr || 70);
  const homeTactics = homeLineup.tactics || DEFAULT_TACTICS;
  const awayTactics = awayLineup.tactics || DEFAULT_TACTICS;

  let left = 100, center = 100, right = 100;

  // Ev sahibi tercihi baskısı
  if (homeTactics.attackDirection === "left") { left += homeOvr * 0.75; center -= homeOvr * 0.2; right -= homeOvr * 0.35; }
  else if (homeTactics.attackDirection === "right") { right += homeOvr * 0.75; center -= homeOvr * 0.2; left -= homeOvr * 0.35; }
  else if (homeTactics.attackDirection === "center") { center += homeOvr * 0.75; left -= homeOvr * 0.25; right -= homeOvr * 0.25; }

  // Deplasman tercihi baskısı (Ayna kuralı: Deplasmanın solu = Ev sahibinin sağı)
  if (awayTactics.attackDirection === "left") { right += awayOvr * 0.75; center -= awayOvr * 0.2; left -= awayOvr * 0.35; }
  else if (awayTactics.attackDirection === "right") { left += awayOvr * 0.75; center -= awayOvr * 0.2; right -= awayOvr * 0.35; }
  else if (awayTactics.attackDirection === "center") { center += awayOvr * 0.75; left -= awayOvr * 0.25; right -= awayOvr * 0.25; }

  left = Math.max(15, left);
  center = Math.max(15, center);
  right = Math.max(15, right);

  const roll = Math.random() * (left + center + right);
  if (roll <= left) return "left";
  if (roll <= left + center) return "center";
  return "right";
}

export function mirrorCorridor(corridor: PitchCorridor): PitchCorridor {
  if (corridor === "left") return "right";
  if (corridor === "right") return "left";
  return "center";
}
