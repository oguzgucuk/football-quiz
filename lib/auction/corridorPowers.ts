/**
 * Koridor Tabanlı Güç ve Taktik Katsayıları Motoru.
 * matchWeights.ts tablosundaki TEK DOĞRULUK KAYNAĞI mevkisel güçleri alır,
 * koridor konumu ve taktik çarpanlarıyla harmanlar.
 */

import { FormationName, PitchCorridor, PitchPosition, SquadSlot, TeamLineup, TeamTactics } from "./auctionTypes";
import { DEFAULT_TACTICS, getSlotCorridor } from "./corridorSetup";
import { ATK_WEIGHTS, DEF_WEIGHTS, MID_WEIGHTS, ratingCurve } from "./matchWeights";

const WIDE_POSITIONS: PitchPosition[] = ["LB", "RB", "LWB", "RWB", "LM", "RM", "LW", "RW"];
const CENTRAL_POSITIONS: PitchPosition[] = ["CB", "CDM", "CM", "CAM", "ST", "CF"];

/**
 * Bir oyuncunun belirtilen koridordaki orta saha/top kapma çarpanını belirler.
 */
function getMidfieldCorridorMultiplier(pos: PitchPosition, slotC: PitchCorridor, c: PitchCorridor, multiMid: boolean): number {
  if (c === "center") {
    // Merkez koridorda merkez oyuncuları tam güç, kanatlar merkeze daralarak %30 destek verir
    if (CENTRAL_POSITIONS.includes(pos)) return 1.0;
    if (WIDE_POSITIONS.includes(pos)) return 0.30;
    return 0.30;
  }

  // Kanat koridorları ("left" veya "right")
  if (slotC === c) {
    // Kendi kanadındaki oyuncular (bekler, kanat orta sahalar, kanat forvetler) tam güç
    if (WIDE_POSITIONS.includes(pos)) return 1.0;
    // Çoklu iç orta saha varsa o kanada yakın olan CM/CDM kademeye kayar
    if (["CM", "CDM"].includes(pos)) return multiMid ? 0.60 : 0.20;
    if (pos === "CAM") return 0.35;
    if (["CB", "ST", "CF"].includes(pos)) return 0.15;
    return 0.30;
  }

  // Ters kanat: o kanadın mücadelesine yetişemez
  return 0;
}

export function calculateCorridorMidfieldScore(lineup: TeamLineup, corridor: PitchCorridor): number {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  let totalScore = 0;
  let hasPlayer = false;
  const isMultiMid = lineup.slots.filter((s) => s.placedPlayer && ["CM", "CDM", "CAM"].includes(s.targetPosition)).length >= 3;

  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    const baseWeight = MID_WEIGHTS[slot.targetPosition] ?? 0;
    if (baseWeight <= 0) continue;

    const slotCorridor = getSlotCorridor(slot.slotId, slot.targetPosition, lineup.formation);
    const mult = getMidfieldCorridorMultiplier(slot.targetPosition, slotCorridor, corridor, isMultiMid);
    if (mult > 0) {
      totalScore += ratingCurve(slot.effectiveRating) * baseWeight * mult;
      hasPlayer = true;
    }
  }

  if (!hasPlayer) {
    const fallback = lineup.slots.find((s) => s.placedPlayer && s.targetPosition !== "GK");
    if (fallback) totalScore += ratingCurve(fallback.effectiveRating) * 0.10;
  }

  // Takım Presi Taktik Çarpanları
  if (tactics.pressing === "high_press") totalScore *= 1.25;
  else if (tactics.pressing === "park_bus") totalScore *= 0.70; // Park the bus: tüm takımın orta saha gücü %30 düşer

  return Math.max(0.01, totalScore);
}

function calculateSlotAttack(slot: SquadSlot, c: PitchCorridor, f: FormationName, singleSt: boolean, multiMid: boolean, tac: TeamTactics): number {
  const baseWeight = ATK_WEIGHTS[slot.targetPosition] ?? 0;
  if (baseWeight <= 0) return 0;

  const curve = ratingCurve(slot.effectiveRating);
  const slotC = getSlotCorridor(slot.slotId, slot.targetPosition, f);

  let corridorMult = 0;
  if (c === "center") {
    if (CENTRAL_POSITIONS.includes(slot.targetPosition)) corridorMult = 1.0;
    else if (["LW", "RW"].includes(slot.targetPosition)) corridorMult = 0.70; // kanat forvet içeri kat eder
    else corridorMult = 0.30; // kanat oyuncusu merkeze %30 destek
  } else {
    // Kanat koridoru
    if (slotC === c) {
      if (WIDE_POSITIONS.includes(slot.targetPosition)) corridorMult = 1.0;
      else if (["ST", "CF"].includes(slot.targetPosition)) corridorMult = singleSt ? 0.35 : 0.60;
      else if (["CAM", "CM"].includes(slot.targetPosition)) corridorMult = 0.40;
      else corridorMult = 0.15;
    }
  }

  if (corridorMult <= 0) return 0;

  let power = curve * baseWeight * corridorMult;

  // Oyun kurma taktiği çarpanları (Hücum)
  if (tac.buildUp === "short_pass") {
    // Kısa pas: Orta sahalar ve pasör bekler bufflanır (+%20), hücumcular/forvetler direkt hızlı vuruş yapamadığı için hafif nerf yer (-%15)
    if (["CM", "CAM", "CDM", "LM", "RM", "LB", "RB"].includes(slot.targetPosition)) power *= 1.20;
    else if (["ST", "CF", "LW", "RW"].includes(slot.targetPosition)) power *= 0.85;
  } else if (tac.buildUp === "long_ball") {
    // Uzun top: Santrforlar hava hakimiyetiyle bufflanır (+%30), tüm orta sahalar (LM, CM, CDM, CAM, RM) baypas edildiği için nerf yer (%70 düşüş: 0.30x)
    if (["ST", "CF"].includes(slot.targetPosition)) power *= 1.30;
    else if (["LM", "RM", "CM", "CDM", "CAM"].includes(slot.targetPosition)) power *= 0.30;
  }

  return power;
}

export function calculateCorridorAttackPower(lineup: TeamLineup, corridor: PitchCorridor): number {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const isSingleSt = lineup.slots.filter((s) => s.placedPlayer && ["ST", "CF"].includes(s.targetPosition)).length === 1;
  const isMultiMid = lineup.slots.filter((s) => s.placedPlayer && ["CM", "CDM", "CAM"].includes(s.targetPosition)).length >= 3;

  let power = 0;
  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    power += calculateSlotAttack(slot, corridor, lineup.formation, isSingleSt, isMultiMid, tactics);
  }
  // Park the bus: tüm takımın hücum gücü %10 düşer
  if (tactics.pressing === "park_bus") power *= 0.90;
  return Math.max(0.01, power);
}

function calculateSlotDefense(slot: SquadSlot, defC: PitchCorridor, f: FormationName, back3: boolean, multiMid: boolean, tac: TeamTactics): number {
  const baseWeight = DEF_WEIGHTS[slot.targetPosition] ?? 0;
  if (baseWeight <= 0) return 0;

  const curve = ratingCurve(slot.effectiveRating);
  const slotC = getSlotCorridor(slot.slotId, slot.targetPosition, f);

  let corridorMult = 0;
  if (defC === "center") {
    if (CENTRAL_POSITIONS.includes(slot.targetPosition)) corridorMult = 1.0;
    else if (["LB", "RB", "LWB", "RWB"].includes(slot.targetPosition)) corridorMult = 0.30; // bek merkeze daralma %30
    else corridorMult = 0.20;
  } else {
    // Kanat savunması
    if (slotC === defC) {
      if (["LB", "RB", "LWB", "RWB"].includes(slot.targetPosition)) corridorMult = 1.0;
      else if (["LM", "RM"].includes(slot.targetPosition)) corridorMult = 1.0;
      else if (slot.targetPosition === "CB") corridorMult = back3 ? 0.60 : 0.40;
      else if (["CDM", "CM"].includes(slot.targetPosition)) corridorMult = multiMid ? 0.50 : 0.25;
      else if (["LW", "RW"].includes(slot.targetPosition)) corridorMult = 0.50;
      else corridorMult = 0.15;
    } else if (slot.targetPosition === "CB") {
      corridorMult = 0.25;
    }
  }

  if (corridorMult <= 0) return 0;

  // Savunmada oyun kurma (buildUp) taktiği savunmaya nerf vermez! Savunma direnci tam korunur.
  return curve * baseWeight * corridorMult;
}

export function calculateCorridorDefensePower(lineup: TeamLineup, defendingCorridor: PitchCorridor): number {
  const tactics = lineup.tactics || DEFAULT_TACTICS;
  const is3or5Back = lineup.slots.filter((s) => s.placedPlayer && s.targetPosition === "CB").length >= 3;
  const isMultiMid = lineup.slots.filter((s) => s.placedPlayer && ["CM", "CDM", "CAM"].includes(s.targetPosition)).length >= 3;

  let power = 0;
  for (const slot of lineup.slots) {
    if (!slot.placedPlayer || slot.targetPosition === "GK") continue;
    power += calculateSlotDefense(slot, defendingCorridor, lineup.formation, is3or5Back, isMultiMid, tactics);
  }
  if (tactics.pressing === "high_press") power *= 0.75;
  // Park the bus: tüm takımın defans gücü %40 artar
  else if (tactics.pressing === "park_bus") power *= 1.40;

  // Kısa pas taktiği: takım öne açılıp pas istasyonu kurduğu için tüm takımın defans gücüne %5 nerf (0.95x)
  if (tactics.buildUp === "short_pass") power *= 0.95;

  return Math.max(0.01, power);
}


