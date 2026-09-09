/**
 * Futbol Maç Simülatörü Motoru — v2.
 *
 * İyileştirmeler:
 * 1. Değişken atak sayısı: Ortalama atak gücüne göre maç başına 10-20 atak arasında değişir.
 *    Güçlü hücum hatları hem daha çok pozisyon bulur hem daha iyi değerlendirir.
 * 2. Bireysel parlama mekaniği: 85+ OVR yıldız oyuncular normal gol formülünü bypass eder.
 *    96 OVR → %16.5 tek atakta parlama şansı. İsimli, görünür bir anlatı üretir.
 * 3. Şans kalitesi katmanları: Her atak "büyük fırsat" veya "yarım fırsat" olarak sınıflandırılır.
 *    Büyük fırsat: %42 gol dönüşümü — Yarım fırsat: %10 gol dönüşümü.
 */

import { MatchSimulationResult, MatchEvent, TeamLineup, PitchPosition } from "./auctionTypes";

const DEF_FULLBACKS: PitchPosition[] = ["LB", "RB", "LWB", "RWB"];
const DEF_CENTERBACKS: PitchPosition[] = ["CB"];
const MID_POSITIONS: PitchPosition[] = ["CDM", "CM", "CAM", "LM", "RM"];
const FWD_POSITIONS: PitchPosition[] = ["ST", "CF", "LW", "RW"];

type ChanceQuality = "big" | "half";

/** Büyük fırsat: %42, Yarım fırsat: %10 gol dönüşüm oranı */
const CONVERSION_RATES: Record<ChanceQuality, number> = { big: 0.42, half: 0.10 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Toplam atak sayısını ortalama hücum gücüne göre hesaplar.
 * 65 OVR takımlar: ~12 atak — 85 OVR: ~16 — 95 OVR: ~18
 */
function calculateTotalAttacks(homeAtkPower: number, awayAtkPower: number): number {
  const avgAtkPower = (homeAtkPower + awayAtkPower) / 2;
  return Math.round(clamp(12 + (avgAtkPower - 65) * 0.18, 10, 20));
}

/**
 * Toplam atak sayısına göre dakikaları 1-90 arasına eşit aralıklarla dağıtır.
 */
function spreadMinutes(count: number): number[] {
  if (count <= 1) return [45];
  return Array.from({ length: count }, (_, i) =>
    Math.round(1 + (i / (count - 1)) * 89)
  );
}

type BrillianceResult =
  | { triggered: false }
  | { triggered: true; isSuperstar: boolean };

/**
 * Bireysel parlama anını iki eşikle kontrol eder:
 *
 * Yıldız (85-90):
 *   85 → %0 | 88 → %4.5 | 90 → %7.5
 *   Her +1 OVR: %1.5 ek şans
 *
 * Süper Yıldız (91+): Mbappé, De Bruyne vb.
 *   91 → %15 | 95 → %25 | 99 → %35
 *   Her +1 OVR: %2.5 ek şans — 90'dan 91'e geçişte belirgin sıçrama
 */
function checkIndividualBrilliance(starRating: number): BrillianceResult {
  if (starRating < 85) return { triggered: false };

  let brillianceChance: number;
  let isSuperstar: boolean;

  if (starRating >= 91) {
    // Süper Yıldız eşiği: 91 → %15, 99 → %35
    brillianceChance = 0.15 + (starRating - 91) * 0.025;
    isSuperstar = true;
  } else {
    // Yıldız eşiği: 85 → %0, 90 → %7.5
    brillianceChance = (starRating - 85) * 0.015;
    isSuperstar = false;
  }

  return Math.random() < brillianceChance
    ? { triggered: true, isSuperstar }
    : { triggered: false };
}

/**
 * Kaleci parlama anını kontrol eder (sadece 90+ OVR kalecilar tetikler).
 * Tetiklenirse gol “gibiydi” atağı dahi kurtarabilir — mücizevi müdahale.
 *
 * 90 → %5 | 93 → %12.5 | 95 → %17.5 | 99 → %27.5
 * Her +1 OVR: %2.5 ek şans
 */
function checkGoalkeeperBrilliance(gkRating: number): boolean {
  if (gkRating < 90) return false;
  const brillianceChance = 0.05 + (gkRating - 90) * 0.025;
  return Math.random() < brillianceChance;
}

/**
 * Atağın kalitesini belirler: "büyük fırsat" mı, "yarım fırsat" mı.
 * Güçlü atak + zayıf defans → büyük fırsat olasılığı artar.
 */
function determineChanceQuality(atkPower: number, defPower: number): ChanceQuality {
  const bigChanceProb = clamp(0.25 + (atkPower - defPower) * 0.012, 0.10, 0.55);
  return Math.random() < bigChanceProb ? "big" : "half";
}

export function simulateMatch(
  matchId: string,
  homeLineup: TeamLineup,
  homeUsername: string,
  awayLineup: TeamLineup,
  awayUsername: string
): MatchSimulationResult {
  let homeScore = 0;
  let awayScore = 0;
  const events: MatchEvent[] = [];

  const totalAttacks = calculateTotalAttacks(
    homeLineup.effectiveAtkPower,
    awayLineup.effectiveAtkPower
  );
  const minutes = spreadMinutes(totalAttacks);

  for (let i = 0; i < totalAttacks; i++) {
    const minute = minutes[i] ?? (i + 1) * 6;

    // 1. Topu kimin oynayacağını belirle — orta saha hakimiyeti
    const midA = Math.max(10, homeLineup.rawMidPower);
    const midB = Math.max(10, awayLineup.rawMidPower);
    const midDiff = midA - midB;
    const probHomeAttacks = clamp(0.5 + midDiff * 0.007, 0.15, 0.85);

    const isHomeAttacking = Math.random() < probHomeAttacks;
    const attackingLineup = isHomeAttacking ? homeLineup : awayLineup;
    const defendingLineup = isHomeAttacking ? awayLineup : homeLineup;
    const attackingUsername = isHomeAttacking ? homeUsername : awayUsername;
    const defendingUsername = isHomeAttacking ? awayUsername : homeUsername;

    const atkPower = Math.max(10, attackingLineup.effectiveAtkPower);
    const defPower = Math.max(10, defendingLineup.effectiveDefPower);

    // 2. Bireysel parlama kontrolü (normal gol formülünden önce)
    const starRating = attackingLineup.starAttackerRating;
    const starName = attackingLineup.starAttackerName;
    const brilliance = checkIndividualBrilliance(starRating);

    if (brilliance.triggered) {
      if (isHomeAttacking) homeScore++;
      else awayScore++;

      const description = brilliance.isSuperstar
        ? `🌟 ${starName} FARKLI SINIFTA — defansı hiçe saydı, kaleci de çaresiz kaldı!`
        : `✨ ${starName} rakip defansı tek başına dağıttı ve kaleciyi de geçti — sınıf fark!`;

      events.push({
        minute,
        type: "goal",
        teamUserId: attackingLineup.userId,
        playerName: starName,
        brilliance: true,
        description,
      });
      continue;
    }

    // 3. Şans kalitesi belirleme
    const quality = determineChanceQuality(atkPower, defPower);
    const isGoal = Math.random() < CONVERSION_RATES[quality];
    const gkSlot = defendingLineup.slots.find((s) => s.targetPosition === "GK");
    const gkRating = gkSlot?.effectiveRating ?? 40;
    const gkName = gkSlot?.placedPlayer?.fullName ?? "Kaleci";

    if (isGoal) {
      // Kaleci parlama: gol “gibiydi” ama kaleci mücizevi kurtardı
      if (checkGoalkeeperBrilliance(gkRating)) {
        const gkDescription = gkRating >= 94
          ? `🧤🌟 ${gkName} DÜNYA SINIFI KURTARIŞ — bu golden kaçılınmaz, ama kaleci mücize yaptı!`
          : `🧤✨ ${gkName} OLASİLIKDIŞ GOLÜ ÖNLEDi! Mühthem refleks!`;

        events.push({
          minute,
          type: "save",
          teamUserId: defendingLineup.userId,
          playerName: gkName,
          description: gkDescription,
        });
      } else {
        if (isHomeAttacking) homeScore++;
        else awayScore++;

        const scorer = pickGoalScorer(attackingLineup);
        const description =
          quality === "big"
            ? `⚽ BÜYÜK FİRSAT → GOL! ${scorer} (${attackingUsername}) muhteşem pozisyonu değlendirdi!`
            : `⚽ GOL! ${scorer} (${attackingUsername}) doğru yerde doğru zamanda!`;

        events.push({
          minute,
          type: "goal",
          teamUserId: attackingLineup.userId,
          playerName: scorer,
          brilliance: false,
          description,
        });
      }
    } else {
      // 4. Kalecinin kurtarma şansı (normal gol olmayan ataklar)
      const saveThreshold = clamp(0.35 + (gkRating - 40) * 0.006, 0.35, 0.70);
      const isGoalkeeperSave = Math.random() < saveThreshold;

      if (isGoalkeeperSave) {
        const description =
          quality === "big"
            ? `🧤 ${gkName} (${defendingUsername}) inanılmaz kurtarışla büyük golü önledi!`
            : `🧤 ${gkName} (${defendingUsername}) yerinde çıkış yaparak pozisyonu bitirdi!`;

        events.push({
          minute,
          type: "save",
          teamUserId: defendingLineup.userId,
          playerName: gkName,
          description,
        });
      } else {
        const description =
          quality === "big"
            ? `${attackingUsername} harika bir pozisyon buldu ama direkten döndü!`
            : `${attackingUsername} girişim yaptı, savunma son anda ayak koydu.`;

        events.push({
          minute,
          type: "chance",
          teamUserId: attackingLineup.userId,
          description,
        });
      }
    }
  }

  const winnerUserId =
    homeScore > awayScore
      ? homeLineup.userId
      : awayScore > homeScore
      ? awayLineup.userId
      : null;

  return {
    matchId,
    homeUserId: homeLineup.userId,
    homeUsername,
    awayUserId: awayLineup.userId,
    awayUsername,
    homeScore,
    awayScore,
    events,
    winnerUserId,
    isFinished: true,
  };
}

/**
 * Ağırlıklı şans ile golü atan oyuncuyu seçer.
 * Forvet: 7x, Orta saha: 4x, Bek: 2x, Stoper: 1x
 */
function pickGoalScorer(lineup: TeamLineup): string {
  const candidates: { name: string; weight: number }[] = [];

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;

    const eff = Math.max(10, slot.effectiveRating);
    const pos = slot.targetPosition;
    let multiplier = 1;

    if (FWD_POSITIONS.includes(pos)) multiplier = 7;
    else if (MID_POSITIONS.includes(pos)) multiplier = 4;
    else if (DEF_FULLBACKS.includes(pos)) multiplier = 2;
    else if (DEF_CENTERBACKS.includes(pos)) multiplier = 1;

    candidates.push({
      name: slot.placedPlayer.fullName,
      weight: eff * multiplier,
    });
  }

  if (candidates.length === 0) return "Futbolcu";

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let randomRoll = Math.random() * totalWeight;

  for (const c of candidates) {
    if (randomRoll <= c.weight) return c.name;
    randomRoll -= c.weight;
  }

  return candidates[0].name;
}
