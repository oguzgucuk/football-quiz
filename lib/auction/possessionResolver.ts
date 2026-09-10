import { MatchEvent, PossessionResult, SquadSlot, TeamLineup } from "./auctionTypes";
import { ATK_WEIGHTS, DEF_WEIGHTS, MID_WEIGHTS, ratingCurve, sumScore } from "./matchWeights";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function weightedPlayer(slots: SquadSlot[], weightFor: (slot: SquadSlot) => number): string | undefined {
  const candidates = slots.filter((slot) => slot.placedPlayer && slot.targetPosition !== "GK")
    .map((slot) => ({ name: slot.placedPlayer!.fullName, weight: weightFor(slot) }))
    .filter((candidate) => candidate.weight > 0);
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  if (!total) return undefined;
  let roll = Math.random() * total;
  for (const candidate of candidates) {
    if (roll <= candidate.weight) return candidate.name;
    roll -= candidate.weight;
  }
  return candidates[0]?.name;
}

export function resolveMidfield(homeSlots: SquadSlot[], awaySlots: SquadSlot[]): "home" | "away" {
  const homeMid = sumScore(homeSlots, MID_WEIGHTS);
  const awayMid = sumScore(awaySlots, MID_WEIGHTS);
  return Math.random() < homeMid / Math.max(0.001, homeMid + awayMid) ? "home" : "away";
}

export function resolveDefense(atkSlots: SquadSlot[], defSlots: SquadSlot[]) {
  const atkScore = sumScore(atkSlots, ATK_WEIGHTS);
  const defScore = sumScore(defSlots, DEF_WEIGHTS);
  const breakthroughChance = clamp(atkScore / Math.max(0.001, atkScore + defScore), 0.05, 0.9);
  return { beaten: Math.random() < breakthroughChance, breakthroughChance };
}

export function resolveGoalkeeper(gkEffectiveRating: number, breakthroughChance: number) {
  const shotQuality = clamp((breakthroughChance - 0.5) * 2, 0, 1);
  const gkSaveChance = clamp(ratingCurve(gkEffectiveRating) * 0.88 * (1 - shotQuality * 0.4), 0.05, 0.85);
  return { isGoal: Math.random() > gkSaveChance, gkSaveChance };
}

export function pickGoalScorer(atkSlots: SquadSlot[]): string {
  return weightedPlayer(atkSlots, (slot) => ratingCurve(slot.effectiveRating) * ATK_WEIGHTS[slot.targetPosition]) || "Futbolcu";
}

export function pickMidfieldCarrier(atkSlots: SquadSlot[]): string | undefined {
  return weightedPlayer(atkSlots, (slot) => ratingCurve(slot.effectiveRating) * MID_WEIGHTS[slot.targetPosition]);
}

function pickDefender(defSlots: SquadSlot[]): string | undefined {
  return weightedPlayer(defSlots, (slot) => ratingCurve(slot.effectiveRating) * DEF_WEIGHTS[slot.targetPosition]);
}

export function resolvePossession(minute: number, home: TeamLineup, homeUsername: string, away: TeamLineup, awayUsername: string): PossessionResult {
  const homeAttacks = resolveMidfield(home.slots, away.slots) === "home";
  const attacking = homeAttacks ? home : away;
  const defending = homeAttacks ? away : home;
  const attackingUsername = homeAttacks ? homeUsername : awayUsername;
  const defendingUsername = homeAttacks ? awayUsername : homeUsername;
  const carrier = pickMidfieldCarrier(attacking.slots);
  const defense = resolveDefense(attacking.slots, defending.slots);

  if (!defense.beaten) {
    const defenderName = pickDefender(defending.slots);
    const event: MatchEvent = { minute, type: "chance", teamUserId: attacking.userId, playerName: defenderName,
      description: defenderName ? `🛡️ ${defenderName} son anda araya girdi, ${attackingUsername} hücumu sonuçsuz kaldı.` : `🛡️ ${defendingUsername} savunması sağlam durdu.` };
    return { attackingTeamUserId: attacking.userId, isGoal: false, gkSaved: false, defenseBlocked: true, defenderName, event };
  }

  const gkSlot = defending.slots.find((slot) => slot.targetPosition === "GK");
  const gkName = gkSlot?.placedPlayer?.fullName || "Kaleci";
  const goalkeeper = resolveGoalkeeper(gkSlot?.effectiveRating || 40, defense.breakthroughChance);
  if (!goalkeeper.isGoal) {
    const event: MatchEvent = { minute, type: "save", teamUserId: defending.userId, playerName: gkName, description: `🧤 ${gkName} muhteşem kurtarışla golü önledi!` };
    return { attackingTeamUserId: attacking.userId, isGoal: false, gkSaved: true, defenseBlocked: false, gkName, event };
  }

  const goalScorerName = pickGoalScorer(attacking.slots);
  const assistPlayerName = carrier && carrier !== goalScorerName ? carrier : undefined;
  const event: MatchEvent = { minute, type: "goal", teamUserId: attacking.userId, playerName: goalScorerName, assistPlayerName,
    description: `⚽ GOL! ${goalScorerName} (${attackingUsername}) ${assistPlayerName ? `— asist: ${assistPlayerName}!` : "müthiş bir bitirişle skoru güncelledi!"}` };
  return { attackingTeamUserId: attacking.userId, isGoal: true, gkSaved: false, defenseBlocked: false, goalScorerName, assistPlayerName, gkName, event };
}
