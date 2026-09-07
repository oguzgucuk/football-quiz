/**
 * Futbol Maç Simülatörü Motoru.
 * 15 pozisyonluk dinamik maç döngüsü, hat güçleri olasılığı ve
 * ağırlıklı golcü belirleme algoritması (Forvet 7x, Orta saha 4x, Bek 2x, Stoper 1x).
 */

import { MatchSimulationResult, MatchEvent, TeamLineup, PitchPosition } from "./auctionTypes";

const DEF_FULLBACKS: PitchPosition[] = ["LB", "RB", "LWB", "RWB"];
const DEF_CENTERBACKS: PitchPosition[] = ["CB"];
const MID_POSITIONS: PitchPosition[] = ["CDM", "CM", "CAM", "LM", "RM"];
const FWD_POSITIONS: PitchPosition[] = ["ST", "CF", "LW", "RW"];

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

  const totalPositions = 15;
  const minutes = [6, 12, 19, 26, 33, 40, 45, 52, 58, 64, 71, 77, 83, 88, 90];

  for (let i = 0; i < totalPositions; i++) {
    const minute = minutes[i] || (i + 1) * 6;

    // 1. Pozisyonu Kimin Oynayacağını Belirle (Orta Saha Hakimiyeti)
    const midA = Math.max(10, homeLineup.rawMidPower);
    const midB = Math.max(10, awayLineup.rawMidPower);
    const midDiff = midA - midB;
    // Eşit orta sahalar için %50, her +1 orta saha farkı %0.7 topa sahip olma üstünlüğü getirir (Aralık: %15 - %85)
    const probHomeAttacks = Math.min(0.85, Math.max(0.15, 0.5 + midDiff * 0.007));

    const isHomeAttacking = Math.random() < probHomeAttacks;
    const attackingLineup = isHomeAttacking ? homeLineup : awayLineup;
    const defendingLineup = isHomeAttacking ? awayLineup : homeLineup;
    const attackingUsername = isHomeAttacking ? homeUsername : awayUsername;
    const defendingUsername = isHomeAttacking ? awayUsername : homeUsername;

    // 2. Atağın Gole Dönüşme Şansı (Efektif Atak vs Efektif Defans Güç Farkı)
    const atkPower = Math.max(10, attackingLineup.effectiveAtkPower);
    const defPower = Math.max(10, defendingLineup.effectiveDefPower);
    const powerDiff = atkPower - defPower;

    // Temel gol şansı %20 (dengeli maçlar için), her +1 güç farkı %0.7 ekler
    // Zayıf atak güçlü defansa karşı: min %4 (kale duvarı)
    // Ezici atak zayıf defansa karşı: max %55 (4-0, 5-1, 6-0 gibi net hezimetler; 10+ aşırı uçlar önlenir)
    const goalProbability = Math.min(0.55, Math.max(0.04, 0.20 + powerDiff * 0.007));
    const isGoal = Math.random() < goalProbability;

    if (isGoal) {
      if (isHomeAttacking) homeScore++;
      else awayScore++;

      const scorer = pickGoalScorer(attackingLineup);
      events.push({
        minute,
        type: "goal",
        teamUserId: attackingLineup.userId,
        playerName: scorer,
        description: `GOOOOL! ${scorer} (${attackingUsername}) mükemmel bir bitiricilikle topu ağlara yolladı!`,
      });
    } else {
      // Kalecinin gücüne bağlı kurtarış ihtimali
      const gkSlot = defendingLineup.slots.find((s) => s.targetPosition === "GK");
      const gkRating = gkSlot?.effectiveRating || 40;
      const saveThreshold = Math.min(0.70, Math.max(0.35, 0.35 + (gkRating - 40) * 0.006));
      const isGoalkeeperSave = Math.random() < saveThreshold;
      const gkName = gkSlot?.placedPlayer?.fullName || "Kaleci";

      if (isGoalkeeperSave) {
        events.push({
          minute,
          type: "save",
          teamUserId: defendingLineup.userId,
          playerName: gkName,
          description: `${gkName} (${defendingUsername}) kalesinde devleşerek net golü önledi!`,
        });
      } else {
        events.push({
          minute,
          type: "chance",
          teamUserId: attackingLineup.userId,
          description: `${attackingUsername} tehlikeli geldi, ancak savunma son anda ayak koydu!`,
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
