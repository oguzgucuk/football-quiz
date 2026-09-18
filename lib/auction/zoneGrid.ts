/**
 * 9 Bölgeli (3x3 Grid) Geometri ve Bölge Dağılım Motoru.
 * Saha koordinatları, ayna dönüşümleri ve mevkilerin 9 bölgedeki doğal etkinlik katsayıları.
 */

import { FormationName, PitchCorridor, PitchPosition, SquadSlot, TeamLineup, TeamTactics } from "./auctionTypes";
import { PitchThird, ZoneId } from "./zoneTypes";

export const DEFAULT_TACTICS: TeamTactics = {
  tempo: "balanced",
  buildUp: "balanced",
  pressing: "balanced",
  attackDirection: "balanced",
};

export function calculateMatchTempo(homeLineup: TeamLineup, awayLineup: TeamLineup): number {
  const homeOvr = Math.max(40, homeLineup.teamOvr || 70);
  const awayOvr = Math.max(40, awayLineup.teamOvr || 70);
  const homeTactics = homeLineup.tactics || DEFAULT_TACTICS;
  const awayTactics = awayLineup.tactics || DEFAULT_TACTICS;

  const deltaMap: Record<TeamTactics["tempo"], number> = { slow: -4, balanced: 0, fast: 4 };
  const weightedDelta =
    (homeOvr * (deltaMap[homeTactics.tempo] ?? 0) + awayOvr * (deltaMap[awayTactics.tempo] ?? 0)) /
    (homeOvr + awayOvr);

  return Math.round(Math.min(24, Math.max(16, 20 + weightedDelta)));
}

export const ALL_ZONES: ZoneId[] = [
  "def_left", "def_center", "def_right",
  "mid_left", "mid_center", "mid_right",
  "att_left", "att_center", "att_right",
];

export function parseZone(zone: ZoneId): { third: PitchThird; corridor: PitchCorridor } {
  const [third, corridor] = zone.split("_") as [PitchThird, PitchCorridor];
  return { third, corridor };
}

export function buildZoneId(third: PitchThird, corridor: PitchCorridor): ZoneId {
  return `${third}_${corridor}` as ZoneId;
}

/**
 * Hücum eden takımın bölgesi, savunan takımın sahasına göre aynalanır.
 * Örn: Hücum takımı "att_left" (sol hücum) bölgesindeyken, savunan takım için orası "def_right" (sağ savunma) bölgesidir.
 */
export function mirrorZone(zone: ZoneId): ZoneId {
  const { third, corridor } = parseZone(zone);
  const mirroredThird: PitchThird = third === "def" ? "att" : third === "att" ? "def" : "mid";
  const mirroredCorridor: PitchCorridor = corridor === "left" ? "right" : corridor === "right" ? "left" : "center";
  return buildZoneId(mirroredThird, mirroredCorridor);
}

/**
 * Bir mevkideki oyuncunun belirtilen 9 bölgedeki doğal etkinlik/bulunma katsayısını belirler.
 */
export function getPositionZoneWeight(pos: PitchPosition, zone: ZoneId): number {
  const { third, corridor } = parseZone(zone);

  switch (pos) {
    case "GK":
      return third === "def" && corridor === "center" ? 1.0 : 0.05;

    case "CB":
      if (third === "def") return corridor === "center" ? 1.0 : 0.40;
      if (third === "mid" && corridor === "center") return 0.15;
      return 0.05;

    case "LB":
      if (third === "def" && corridor === "left") return 1.0;
      if (third === "mid" && corridor === "left") return 0.60;
      if (third === "def" && corridor === "center") return 0.30;
      if (third === "att" && corridor === "left") return 0.25;
      return 0.05;

    case "RB":
      if (third === "def" && corridor === "right") return 1.0;
      if (third === "mid" && corridor === "right") return 0.60;
      if (third === "def" && corridor === "center") return 0.30;
      if (third === "att" && corridor === "right") return 0.25;
      return 0.05;

    case "LWB":
      if (third === "mid" && corridor === "left") return 0.90;
      if (third === "def" && corridor === "left") return 0.80;
      if (third === "att" && corridor === "left") return 0.45;
      return 0.05;

    case "RWB":
      if (third === "mid" && corridor === "right") return 0.90;
      if (third === "def" && corridor === "right") return 0.80;
      if (third === "att" && corridor === "right") return 0.45;
      return 0.05;

    case "CDM":
      if (third === "mid" && corridor === "center") return 1.0;
      if (third === "def" && corridor === "center") return 0.75;
      if (third === "mid") return 0.40;
      return 0.10;

    case "CM":
      if (third === "mid") return corridor === "center" ? 1.0 : 0.65;
      if (third === "att" && corridor === "center") return 0.45;
      if (third === "def" && corridor === "center") return 0.35;
      return 0.10;

    case "CAM":
      if (third === "mid" && corridor === "center") return 0.90;
      if (third === "att" && corridor === "center") return 0.95;
      if (third === "att") return 0.50;
      return 0.10;

    case "LM":
      if (third === "mid" && corridor === "left") return 1.0;
      if (third === "att" && corridor === "left") return 0.65;
      if (third === "def" && corridor === "left") return 0.40;
      return 0.05;

    case "RM":
      if (third === "mid" && corridor === "right") return 1.0;
      if (third === "att" && corridor === "right") return 0.65;
      if (third === "def" && corridor === "right") return 0.40;
      return 0.05;

    case "LW":
      if (third === "att" && corridor === "left") return 1.0;
      if (third === "att" && corridor === "center") return 0.65; // içeri kat etme
      if (third === "mid" && corridor === "left") return 0.35;
      return 0.05;

    case "RW":
      if (third === "att" && corridor === "right") return 1.0;
      if (third === "att" && corridor === "center") return 0.65;
      if (third === "mid" && corridor === "right") return 0.35;
      return 0.05;

    case "ST":
    case "CF":
      if (third === "att" && corridor === "center") return 1.0;
      if (third === "att") return 0.50;
      if (third === "mid" && corridor === "center") return 0.20; // derine inme
      return 0.05;

    default:
      return 0.10;
  }
}

/**
 * Taktiklere göre topun bir sonraki gideceği mantıklı koridoru seçer.
 */
export function pickNextCorridor(
  currentCorridor: PitchCorridor,
  tactics: TeamTactics | undefined
): PitchCorridor {
  const dir = tactics?.attackDirection || "balanced";

  if (dir === "left") return Math.random() < 0.70 ? "left" : "center";
  if (dir === "right") return Math.random() < 0.70 ? "right" : "center";
  if (dir === "center") return Math.random() < 0.65 ? "center" : Math.random() < 0.5 ? "left" : "right";
  if (dir === "wings") {
    if (currentCorridor === "center") return Math.random() < 0.5 ? "left" : "right";
    return currentCorridor;
  }

  // Dengeli dağılım
  const roll = Math.random();
  if (roll < 0.35) return "left";
  if (roll < 0.70) return "right";
  return "center";
}

/**
 * Topun bulunduğu bölgeden bir sonraki bölgeye geçiş rotasını belirler.
 */
export function determineNextProgressionZone(
  currentZone: ZoneId,
  tactics: TeamTactics | undefined
): ZoneId {
  const { third, corridor } = parseZone(currentZone);
  const nextCorridor = pickNextCorridor(corridor, tactics);

  // 1. Bölgeden Çıkış
  if (third === "def") {
    // Uzun top taktiği doğrudan 3. bölgeye şişirir
    if (tactics?.buildUp === "long_ball") {
      return buildZoneId("att", "center");
    }
    // Kısa pas veya dengeli: 2. bölgeye geçer
    return buildZoneId("mid", nextCorridor);
  }

  // 2. Bölgeden Çıkış
  if (third === "mid") {
    return buildZoneId("att", nextCorridor);
  }

  // 3. Bölgedeyse zaten hücum hattındadır
  return currentZone;
}
