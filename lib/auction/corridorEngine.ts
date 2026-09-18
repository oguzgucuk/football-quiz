/**
 * 9 Bölge Motoruna Köprü (Facade / Adapter).
 * Geriye dönük uyum için eski fonksiyon isimlerini 9 bölgeli yeni motora yönlendirir.
 */

import { PitchCorridor, TeamLineup } from "./auctionTypes";
import { buildZoneId, calculateMatchTempo, DEFAULT_TACTICS, getPositionZoneWeight, mirrorZone } from "./zoneGrid";
import { calculateZonePossessionPower, calculateZoneStealPower } from "./zonePowers";
import { pickZoneAssister, pickZoneDefender, pickZoneShooter } from "./zoneActors";

export { DEFAULT_TACTICS, calculateMatchTempo };

export function calculateCorridorMidfieldScore(lineup: TeamLineup, corridor: PitchCorridor): number {
  return calculateZoneStealPower(lineup, buildZoneId("mid", corridor));
}

export function calculateCorridorAttackPower(lineup: TeamLineup, corridor: PitchCorridor): number {
  return calculateZonePossessionPower(lineup, buildZoneId("att", corridor));
}

export function calculateCorridorDefensePower(lineup: TeamLineup, corridor: PitchCorridor): number {
  return calculateZoneStealPower(lineup, buildZoneId("def", corridor));
}

export function mirrorCorridor(corridor: PitchCorridor): PitchCorridor {
  return corridor === "left" ? "right" : corridor === "right" ? "left" : "center";
}

export function determineAttackCorridor(home: TeamLineup, away: TeamLineup): PitchCorridor {
  const dir = home.tactics?.attackDirection || "balanced";
  if (dir === "left") return Math.random() < 0.55 ? "left" : Math.random() < 0.5 ? "center" : "right";
  if (dir === "right") return Math.random() < 0.55 ? "right" : Math.random() < 0.5 ? "center" : "left";
  if (dir === "center") return Math.random() < 0.55 ? "center" : Math.random() < 0.5 ? "left" : "right";
  if (dir === "wings") return Math.random() < 0.45 ? "left" : Math.random() < 0.82 ? "right" : "center";
  return Math.random() < 0.35 ? "left" : Math.random() < 0.70 ? "right" : "center";
}

export function getSlotCorridor(slotId: string, pos: string, formation: string): PitchCorridor {
  if (["LB", "LWB", "LM", "LW"].includes(pos)) return "left";
  if (["RB", "RWB", "RM", "RW"].includes(pos)) return "right";
  return "center";
}

export function pickCorridorShooter(lineup: TeamLineup, corridor: PitchCorridor) {
  return pickZoneShooter(lineup, buildZoneId("att", corridor));
}

export function pickCorridorDefender(lineup: TeamLineup, corridor: PitchCorridor) {
  return pickZoneDefender(lineup, buildZoneId("def", corridor));
}

export function pickLongRangeShooter(lineup: TeamLineup, corridor: PitchCorridor) {
  return pickZoneShooter(lineup, buildZoneId("att", corridor), true);
}

export function pickCorridorBlocker(lineup: TeamLineup, corridor: PitchCorridor) {
  const def = lineup.slots.find((s) => s.placedPlayer && ["CB", "CDM"].includes(s.targetPosition));
  return def || lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK")!;
}

export function pickCorridorAssist(lineup: TeamLineup, corridor: PitchCorridor, shooterName?: string) {
  return pickZoneAssister(lineup, buildZoneId("att", corridor), shooterName);
}
