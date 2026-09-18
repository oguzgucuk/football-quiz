/**
 * 9 Bölgeli Güç ve İkili Mücadele Hesaplama Motoru.
 * matchWeights.ts tablosundaki TEK DOĞRULUK KAYNAĞI katsayılarını 9 bölgeye bağlar.
 */

import { SquadSlot, TeamLineup, TeamTactics } from "./auctionTypes";
import { ATK_WEIGHTS, DEF_WEIGHTS, MID_WEIGHTS, LONG_SHOT_WEIGHTS, ratingCurve } from "./matchWeights";
import { getPositionZoneWeight, parseZone } from "./zoneGrid";
import { ZoneId } from "./zoneTypes";

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

/**
 * Topa sahip olan takımın ilgili bölgedeki topu tutma / pas dağıtma gücünü hesaplar.
 */
export function calculateZonePossessionPower(lineup: TeamLineup, zone: ZoneId): number {
  const { third, corridor } = parseZone(zone);
  const tactics = lineup.tactics;
  let total = 0;

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const zoneWeight = getPositionZoneWeight(slot.targetPosition, zone);

    // Bölgeye göre mevkisel taban ağırlığı
    let baseWeight = 0;
    if (third === "def") {
      // 1. bölgede savunma soğukkanlılığı ve pas: DEF ve MID melezlenir
      baseWeight = (DEF_WEIGHTS[slot.targetPosition] ?? 0.2) * 0.6 + (MID_WEIGHTS[slot.targetPosition] ?? 0.2) * 0.4;
    } else if (third === "mid") {
      // 2. bölgede orta saha pas ve dağıtım gücü
      baseWeight = MID_WEIGHTS[slot.targetPosition] ?? 0.2;
    } else {
      // 3. bölgede hücum top tutma ve yaratıcılık
      baseWeight = (ATK_WEIGHTS[slot.targetPosition] ?? 0.2) * 0.7 + (MID_WEIGHTS[slot.targetPosition] ?? 0.2) * 0.3;
    }

    let slotPower = curve * baseWeight * zoneWeight;

    // 3. bölgede oyun kurma taktiği çarpanları
    if (third === "att") {
      if (tactics?.buildUp === "short_pass") {
        if (["ST", "LW", "RW"].includes(slot.targetPosition)) slotPower *= 0.85;
        else if (["CM", "CAM", "CDM"].includes(slot.targetPosition)) slotPower *= 1.20;
      } else if (tactics?.buildUp === "long_ball") {
        if (["ST", "CF"].includes(slot.targetPosition)) {
          slotPower *= corridor === "center" ? 1.30 : 0.75;
        } else if (["LM", "RM", "CM", "CDM", "CAM"].includes(slot.targetPosition)) {
          slotPower *= 0.30;
        } else if (["LW", "RW"].includes(slot.targetPosition)) {
          slotPower *= 0.85;
        }
      }
    }

    total += slotPower;
  }

  // Taktik Çarpanları (Top Koruma)
  if (third === "def" && tactics?.buildUp === "short_pass") {
    total *= 1.08; // Kısa pasla çıkışta pas istasyonları
  }
  if (tactics?.tempo === "slow") {
    total *= 1.15; // Sabırlı yavaş paslaşma: top koruma artar
  } else if (tactics?.tempo === "fast") {
    total *= 0.92; // Hızlı dikine oynama: pas hatası riski
  }

  return Math.max(0.1, total);
}

/**
 * Savunan takımın ilgili bölgedeki top çalma / pres / araya girme gücünü hesaplar.
 */
export function calculateZoneStealPower(lineup: TeamLineup, defendingZone: ZoneId): number {
  const { third } = parseZone(defendingZone);
  const tactics = lineup.tactics;
  let total = 0;

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const curve = ratingCurve(slot.effectiveRating);
    const zoneWeight = getPositionZoneWeight(slot.targetPosition, defendingZone);

    let baseWeight = 0;
    if (third === "def") {
      // Kendi ceza sahasında stoper ve bek direnci
      baseWeight = DEF_WEIGHTS[slot.targetPosition] ?? 0.3;
    } else if (third === "mid") {
      // Orta alanda CDM ve CM top kapması
      baseWeight = MID_WEIGHTS[slot.targetPosition] ?? 0.3;
    } else {
      // Rakip yarı alanda forvet ve kanat presi
      baseWeight = (MID_WEIGHTS[slot.targetPosition] ?? 0.1) * 0.6 + (ATK_WEIGHTS[slot.targetPosition] ?? 0.1) * 0.4;
    }

    total += curve * baseWeight * zoneWeight;
  }

  // Taktiksel Pres Çarpanları
  if (tactics?.pressing === "high_press") {
    if (third === "att") total *= 1.45; // Rakip ceza sahası önünde boğucu pres
    else if (third === "mid") total *= 1.25;
    else if (third === "def") total *= 0.75; // Önde basan takım arkada boşluk bırakır (-%25)
  } else if (tactics?.pressing === "park_bus") {
    if (third === "def") total *= 1.40;
    else if (third === "mid") total *= 0.70;
    else if (third === "att") total *= 0.60;
  }

  // Kısa pas taktiği: Takım öne açıldığı için kendi ceza sahası savunmasında %5 nerf
  if (third === "def" && tactics?.buildUp === "short_pass") {
    total *= 0.95;
  }

  return Math.max(0.1, total);
}

/**
 * İki takımın bölgedeki ikili mücadelesinden topun çalınma ihtimalini çözer.
 * clamp(0.10, 0.85) ile hiçbir zaman %0 veya %100 olmaz.
 */
export function resolveZoneTurnoverChance(
  retentionPower: number,
  stealPower: number,
  isLongBallBypass: boolean = false
): { isStolen: boolean; stealChance: number } {
  if (isLongBallBypass) {
    // Uzun top atıldığında önde pres tamamen baypas edilir
    return { isStolen: false, stealChance: 0.10 };
  }

  const chance = clamp(stealPower / Math.max(0.001, stealPower + retentionPower), 0.10, 0.85);
  const isStolen = Math.random() < chance;
  return { isStolen, stealChance: chance };
}

/**
 * 3. bölgede ceza sahası delme ve şut kalitesi kapışması.
 */
export function resolveBoxPenetration(
  atkLineup: TeamLineup,
  defLineup: TeamLineup,
  atkZone: ZoneId,
  defZone: ZoneId
): { defenseBeaten: boolean; quality: number } {
  let atkPower = 0;
  for (const s of atkLineup.slots) {
    if (!s.placedPlayer || s.targetPosition === "GK") continue;
    const curve = ratingCurve(s.effectiveRating);
    const zw = getPositionZoneWeight(s.targetPosition, atkZone);
    atkPower += curve * (ATK_WEIGHTS[s.targetPosition] ?? 0.2) * zw;
  }

  let defPower = 0;
  for (const s of defLineup.slots) {
    if (!s.placedPlayer || s.targetPosition === "GK") continue;
    const curve = ratingCurve(s.effectiveRating);
    const zw = getPositionZoneWeight(s.targetPosition, defZone);
    defPower += curve * (DEF_WEIGHTS[s.targetPosition] ?? 0.3) * zw;
  }

  if (defLineup.tactics?.pressing === "park_bus") defPower *= 1.35;

  // Hızlı Tempo: Savunma yerleşmeye fırsat bulamaz, hücum delici olur (+%18)
  if (atkLineup.tactics?.tempo === "fast") {
    atkPower *= 1.18;
  } else if (atkLineup.tactics?.tempo === "slow") {
    // Yavaş Tempo: Savunma yerleşip blok kurar
    defPower *= 1.10;
  }

  // Atakların ~%55-%60'ı stoperlerce kesilir
  const breakthroughChance = clamp(atkPower / Math.max(0.001, atkPower + defPower * 1.35), 0.10, 0.80);
  const defenseBeaten = Math.random() < breakthroughChance;

  return { defenseBeaten, quality: breakthroughChance };
}

/**
 * Şutör vs Kaleci Kapışması (Taban gol şansı %33; kaleciler kalede devleşir).
 */
export function resolveShooterVsGk(
  shooterRating: number,
  gkRating: number,
  opportunityQuality: number
): { isGoal: boolean; goalChance: number } {
  const shooterCurve = ratingCurve(shooterRating);
  const gkCurve = ratingCurve(gkRating);
  const qualityFactor = clamp((opportunityQuality - 0.45) * 1.5, -0.15, 0.35);

  const goalChance = clamp(0.33 + (shooterCurve - gkCurve) * 0.45 + qualityFactor, 0.05, 0.80);
  const isGoal = Math.random() < goalChance;
  return { isGoal, goalChance };
}

/**
 * Mücadele esnasında faul olup olmadığını ve faulün türünü (Penaltı, Tehlikeli Frikik, Normal Faul) belirler.
 */
export function resolveFoulCheck(
  zone: ZoneId,
  isHighPress: boolean = false,
  isFastTempo: boolean = false
): {
  isFoul: boolean;
  isPenalty: boolean;
  isDangerousFreeKick: boolean;
  isYellowCard: boolean;
} {
  // Taban faul olasılığı: ~%12
  let foulChance = 0.12;
  if (isHighPress) foulChance += 0.06; // Önde agresif pres faul riskini artırır
  if (isFastTempo) foulChance += 0.03; // Hızlı tempo sert ikili mücadeleleri artırır

  const isFoul = Math.random() < foulChance;
  if (!isFoul) {
    return { isFoul: false, isPenalty: false, isDangerousFreeKick: false, isYellowCard: false };
  }

  // Faul düştü: Bölgeye göre ciddiyet
  const isPenalty = zone === "att_center"; // Ceza sahası içi
  const isDangerousFreeKick = !isPenalty && (zone === "mid_center" || zone === "att_left" || zone === "att_right");

  // Sarı kart olasılığı: Penaltıda %30, tehlikeli frikikte %20, diğerlerinde %8
  const cardChance = isPenalty ? 0.30 : isDangerousFreeKick ? 0.20 : 0.08;
  const isYellowCard = Math.random() < cardChance;

  return { isFoul: true, isPenalty, isDangerousFreeKick, isYellowCard };
}

/**
 * Penaltı Düellosu (Penaltıcı vs Kaleci).
 * Taban gol şansı %76 (Modern futbol standardı).
 */
export function resolvePenaltyDuel(
  shooterRating: number,
  gkRating: number
): { isGoal: boolean; isSave: boolean; isWoodwork: boolean; goalChance: number } {
  const shooterCurve = ratingCurve(shooterRating);
  const gkCurve = ratingCurve(gkRating);

  const goalChance = clamp(0.76 + (shooterCurve - gkCurve) * 0.20, 0.55, 0.92);
  const roll = Math.random();

  if (roll < goalChance) {
    return { isGoal: true, isSave: false, isWoodwork: false, goalChance };
  }

  // Kaçan penaltı: %75 kaleci kurtardı, %25 direk/aut
  const isSave = Math.random() < 0.75;
  return { isGoal: false, isSave, isWoodwork: !isSave, goalChance };
}

/**
 * Baraj Üstü / Doğrudan Frikik Düellosu.
 * Taban gol şansı %22.
 */
export function resolveFreeKickDuel(
  shooterRating: number,
  gkRating: number
): { isGoal: boolean; isSave: boolean; isCorner: boolean; isRebound: boolean; isWallBlock: boolean } {
  const shooterCurve = ratingCurve(shooterRating);
  const gkCurve = ratingCurve(gkRating);

  const goalChance = clamp(0.22 + (shooterCurve - gkCurve) * 0.28, 0.08, 0.45);
  const roll = Math.random();

  if (roll < goalChance) {
    return { isGoal: true, isSave: false, isCorner: false, isRebound: false, isWallBlock: false };
  }

  // Gol olmadıysa:
  // %35 kaleci kornere çeldi
  // %25 barajdan sekti (karambol / rebound)
  // %40 kaleci kontrol etti / aut
  const nonGoalRoll = Math.random();
  if (nonGoalRoll < 0.35) {
    return { isGoal: false, isSave: true, isCorner: true, isRebound: false, isWallBlock: false };
  }
  if (nonGoalRoll < 0.60) {
    return { isGoal: false, isSave: false, isCorner: false, isRebound: true, isWallBlock: true };
  }

  return { isGoal: false, isSave: true, isCorner: false, isRebound: false, isWallBlock: false };
}
