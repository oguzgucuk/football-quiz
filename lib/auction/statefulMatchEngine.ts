import {
  MatchEvent,
  MatchPhase,
  MatchZone,
  PitchCorridor,
  PlayerMatchStat,
  TeamLineup,
  TeamTactics,
} from "./auctionTypes";
import {
  calculateCorridorAttackPower,
  calculateCorridorDefensePower,
  calculateCorridorMidfieldScore,
  calculateMatchTempo,
  determineTeamAttackCorridor,
  mirrorCorridor,
  pickCorridorAssist,
  pickCorridorBlocker,
  pickCorridorDefender,
  pickCorridorShooter,
  pickLongRangeShooter,
} from "./corridorEngine";
import { DEFAULT_TACTICS } from "./corridorSetup";
import { ratingCurve } from "./matchWeights";
import { createSeededRandom, RandomSource } from "./simulationRandom";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface MutableMatch {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  playerStats: Record<string, PlayerMatchStat>;
}

interface SequenceState {
  attacking: TeamLineup;
  defending: TeamLineup;
  attackingUsername: string;
  defendingUsername: string;
  corridor: PitchCorridor;
  zone: MatchZone;
  phase: MatchPhase;
  isCounter: boolean;
  looseBallCount: number;
  actions: number;
}

export interface StatefulSimulationOutput extends MutableMatch {
  simulationSeed: string;
}

function tacticsOf(lineup: TeamLineup): Required<TeamTactics> {
  return {
    ...DEFAULT_TACTICS,
    ...(lineup.tactics || {}),
    transition: lineup.tactics?.transition || "balanced",
    chanceCreation: lineup.tactics?.chanceCreation || "balanced",
  } as Required<TeamTactics>;
}

function softShare(a: number, b: number, exponent = 0.72): number {
  const left = Math.pow(Math.max(0.01, a), exponent);
  const right = Math.pow(Math.max(0.01, b), exponent);
  return clamp(left / (left + right), 0.20, 0.80);
}

function averageMidfield(lineup: TeamLineup): number {
  return (["left", "center", "right"] as PitchCorridor[])
    .reduce((sum, corridor) => sum + calculateCorridorMidfieldScore(lineup, corridor), 0) / 3;
}

function minuteWithAction(baseMinute: number, actions: number, endMinute: number): number {
  return Math.min(endMinute, Math.max(1, baseMinute + Math.floor(actions / 2)));
}

function addEvent(
  match: MutableMatch,
  state: SequenceState,
  minute: number,
  type: MatchEvent["type"],
  description: string,
  playerName?: string,
  assistPlayerName?: string,
  teamUserId = state.attacking.userId
) {
  match.events.push({
    minute,
    type,
    teamUserId,
    playerName,
    assistPlayerName,
    phase: state.phase,
    zone: state.zone,
    corridor: state.corridor,
    description,
  });
}

function updateStat(
  match: MutableMatch,
  playerName: string,
  teamUserId: string,
  field: "goals" | "assists" | "saves"
) {
  const key = `${teamUserId}:${playerName}`;
  const stat = match.playerStats[key] ||= { playerName, teamUserId, goals: 0, assists: 0, saves: 0 };
  stat[field]++;
}

function swapState(state: SequenceState, counter: boolean): SequenceState {
  return {
    attacking: state.defending,
    defending: state.attacking,
    attackingUsername: state.defendingUsername,
    defendingUsername: state.attackingUsername,
    corridor: mirrorCorridor(state.corridor),
    zone: counter ? "middle_third" : "defensive_third",
    phase: counter ? "counter_attack" : "build_up",
    isCounter: counter,
    looseBallCount: 0,
    actions: state.actions + 1,
  };
}

function counterChance(state: SequenceState, minute: number): number {
  const attackingTactics = tacticsOf(state.attacking);
  const defendingTactics = tacticsOf(state.defending);
  let chance = defendingTactics.transition === "counter" ? 0.36 : defendingTactics.transition === "retain" ? 0.13 : 0.25;
  if (attackingTactics.pressing === "high_press") chance += 0.10;
  if (attackingTactics.tempo === "fast") chance += 0.03;
  if (minute > 65 && attackingTactics.pressing === "high_press") chance += 0.05;
  return clamp(chance, 0.08, 0.72);
}

function progressionChance(state: SequenceState, minute: number): number {
  const attackingTactics = tacticsOf(state.attacking);
  const defendingTactics = tacticsOf(state.defending);
  const attackMid = calculateCorridorMidfieldScore(state.attacking, state.corridor);
  const defenseMid = calculateCorridorMidfieldScore(state.defending, mirrorCorridor(state.corridor));
  let chance = (state.phase === "build_up" ? 0.73 : 0.64) + (softShare(attackMid, defenseMid) - 0.5) * 0.65;

  if (attackingTactics.buildUp === "short_pass") chance += 0.03;
  if (attackingTactics.buildUp === "long_ball") chance -= 0.02;
  if (defendingTactics.pressing === "high_press" && attackingTactics.buildUp === "short_pass") chance -= 0.11;
  if (defendingTactics.pressing === "high_press" && attackingTactics.buildUp === "long_ball") chance += 0.08;
  if (attackingTactics.tempo === "fast") chance -= 0.02;
  if (!state.isCounter && attackingTactics.transition === "retain") chance += 0.065;
  if (!state.isCounter && attackingTactics.transition === "counter") chance -= 0.04;
  if (minute > 65 && defendingTactics.pressing === "high_press") chance += 0.06;
  if (state.isCounter) chance += 0.13;

  return clamp(chance, 0.28, 0.78);
}

function creationChance(state: SequenceState, minute: number, match: MutableMatch & { homeUserId: string }): number {
  const attackingTactics = tacticsOf(state.attacking);
  const atk = calculateCorridorAttackPower(state.attacking, state.corridor);
  const def = calculateCorridorDefensePower(state.defending, mirrorCorridor(state.corridor));
  let chance = 0.51 + (softShare(atk, def) - 0.5) * 0.75;
  if (attackingTactics.chanceCreation === "early_cross" && state.corridor !== "center") chance += 0.04;
  if (state.isCounter) chance += 0.08;
  const defendingTactics = tacticsOf(state.defending);
  if (defendingTactics.pressing === "park_bus") {
    if (attackingTactics.chanceCreation === "patient") chance -= 0.07;
    else if (attackingTactics.chanceCreation === "shoot_on_sight") chance += 0.05;
    else if (attackingTactics.chanceCreation === "early_cross" && state.corridor !== "center") chance += 0.04;
  }

  if (minute >= 70) {
    const attackingScore = state.attacking.userId === match.homeUserId ? match.homeScore : match.awayScore;
    const defendingScore = state.attacking.userId === match.homeUserId ? match.awayScore : match.homeScore;
    if (attackingScore < defendingScore) chance += 0.055;
    else if (attackingScore > defendingScore) chance -= 0.025;
  }
  return clamp(chance, 0.18, 0.68);
}

function shouldCounter(state: SequenceState, minute: number, random: RandomSource): boolean {
  return random() < counterChance(state, minute);
}

function resolveLooseBall(
  state: SequenceState,
  minute: number,
  random: RandomSource,
  match: MutableMatch & { homeUserId: string }
): { state: SequenceState; ended: boolean } {
  const attackScore = calculateCorridorMidfieldScore(state.attacking, state.corridor)
    + calculateCorridorAttackPower(state.attacking, state.corridor) * 0.35;
  const defenseScore = calculateCorridorMidfieldScore(state.defending, mirrorCorridor(state.corridor))
    + calculateCorridorDefensePower(state.defending, mirrorCorridor(state.corridor)) * 0.45;
  const attackRecovery = clamp(softShare(attackScore, defenseScore) - 0.08 - state.looseBallCount * 0.08, 0.20, 0.62);

  if (random() < attackRecovery) {
    addEvent(match, state, minute, "chance", `🔄 ${state.attackingUsername} seken topu kazanıp baskıyı sürdürüyor.`);
    return {
      state: {
        ...state,
        phase: state.zone === "penalty_area" ? "shot" : "chance_creation",
        looseBallCount: state.looseBallCount + 1,
        actions: state.actions + 1,
      },
      ended: false,
    };
  }

  const counter = shouldCounter(state, minute, random);
  const next = swapState(state, counter);
  addEvent(
    match,
    next,
    minute,
    "turnover",
    `🧹 ${next.attackingUsername} ikinci topu kontrol etti.`
  );
  return { state: next, ended: !counter };
}

function resolveCorner(
  state: SequenceState,
  minute: number,
  random: RandomSource,
  match: MutableMatch & { homeUserId: string }
): { state: SequenceState; ended: boolean } {
  state.phase = "set_piece";
  state.zone = "penalty_area";
  addEvent(match, state, minute, "corner", `🚩 ${state.attackingUsername} korner kullanıyor.`);

  const atk = calculateCorridorAttackPower(state.attacking, "center");
  const def = calculateCorridorDefensePower(state.defending, "center");
  const scorer = pickCorridorShooter(state.attacking, "center", random);
  const scorerName = scorer?.placedPlayer?.fullName || "Futbolcu";
  const goalChance = clamp(0.085 + (softShare(atk, def) - 0.5) * 0.16, 0.04, 0.16);
  const roll = random();
  if (roll < goalChance) {
    addEvent(match, state, minute, "goal", `⚽ KORNERDEN GOL! ${scorerName} yükselip topu ağlara gönderdi!`, scorerName);
    updateStat(match, scorerName, state.attacking.userId, "goals");
    scoreGoal(match, state);
    return { state: swapState(state, false), ended: true };
  }
  if (roll < goalChance + 0.22 && state.looseBallCount < 2) {
    return resolveLooseBall({ ...state, phase: "loose_ball", looseBallCount: state.looseBallCount + 1 }, minute, random, match);
  }
  const next = swapState(state, random() < 0.16);
  return { state: next, ended: !next.isCounter };
}

function scoreGoal(match: MutableMatch & { homeUserId: string }, state: SequenceState) {
  if (state.attacking.userId === match.homeUserId) match.homeScore++;
  else match.awayScore++;
}

function resolveShot(
  state: SequenceState,
  minute: number,
  gameplayRandom: RandomSource,
  narrationRandom: RandomSource,
  match: MutableMatch & { homeUserId: string }
): { state: SequenceState; ended: boolean } {
  const tactics = tacticsOf(state.attacking);
  const longRange = tactics.chanceCreation === "shoot_on_sight"
    ? gameplayRandom() < 0.40
    : tactics.chanceCreation === "patient"
      ? gameplayRandom() < 0.08
      : gameplayRandom() < 0.18;
  state.zone = longRange ? "final_third" : "penalty_area";
  const shooter = longRange
    ? pickLongRangeShooter(state.attacking, state.corridor, gameplayRandom)
    : pickCorridorShooter(state.attacking, state.corridor, gameplayRandom);
  const shooterName = shooter?.placedPlayer?.fullName || "Futbolcu";
  const shooterCurve = ratingCurve(shooter?.effectiveRating || 70);
  const blocker = pickCorridorBlocker(state.defending, mirrorCorridor(state.corridor), gameplayRandom);
  const blockerCurve = ratingCurve(blocker?.effectiveRating || 70);
  const blockerName = blocker?.placedPlayer?.fullName || "Savunmacı";

  let blockChance = longRange ? 0.25 : 0.16;
  blockChance += (blockerCurve - shooterCurve) * 0.16;
  if (state.isCounter) blockChance -= 0.07;
  if (tactics.chanceCreation === "early_cross") blockChance += 0.03;

  if (gameplayRandom() < clamp(blockChance, 0.08, 0.38)) {
    addEvent(match, state, minute, "chance", `🛡️ ${blockerName}, ${shooterName}'in şutuna zamanında blok koydu!`, blockerName, undefined, state.defending.userId);
    const blockRoll = gameplayRandom();
    if (blockRoll < 0.24) return resolveCorner(state, minute, gameplayRandom, match);
    if (blockRoll < 0.64 && state.looseBallCount < 2) {
      return resolveLooseBall({ ...state, phase: "loose_ball", zone: "penalty_area" }, minute, gameplayRandom, match);
    }
    const next = swapState(state, shouldCounter(state, minute, gameplayRandom));
    return { state: next, ended: !next.isCounter };
  }

  const gk = state.defending.slots.find((slot) => slot.targetPosition === "GK");
  const gkName = gk?.placedPlayer?.fullName || "Kaleci";
  const gkCurve = ratingCurve(gk?.effectiveRating || 40);
  const baseXg = longRange ? 0.21 : tactics.chanceCreation === "patient" ? 0.33 : tactics.chanceCreation === "early_cross" ? 0.32 : 0.33;
  let goalChance = baseXg + (shooterCurve - gkCurve) * 0.23;
  if (state.isCounter) goalChance += 0.055;
  goalChance = clamp(goalChance, 0.035, 0.52);

  const roll = gameplayRandom();
  if (roll < goalChance) {
    const assist = longRange || gameplayRandom() > 0.78
      ? undefined
      : pickCorridorAssist(state.attacking, state.corridor, shooterName, gameplayRandom);
    const descriptions = assist
      ? [`⚽ GOL! ${assist}'in pasında ${shooterName} bitirdi!`, `⚽ GOL! ${shooterName} ağları buldu. Asist: ${assist}.`]
      : longRange
        ? [`🚀 GOL! ${shooterName} uzaktan ağları buldu!`, `🚀 GOL! ${shooterName}'den ceza sahası dışından müthiş vuruş!`]
        : [`⚽ GOL! ${shooterName} fırsatı gole çevirdi!`, `⚽ GOL! ${shooterName} kaleciyi geçip ağları buldu!`];
    const description = descriptions[Math.floor(narrationRandom() * descriptions.length)];
    addEvent(match, state, minute, "goal", description, shooterName, assist);
    scoreGoal(match, state);
    updateStat(match, shooterName, state.attacking.userId, "goals");
    if (assist) updateStat(match, assist, state.attacking.userId, "assists");
    return { state: swapState(state, false), ended: true };
  }

  const missShare = longRange ? 0.52 : tactics.chanceCreation === "patient" ? 0.31 : 0.39;
  if (gameplayRandom() < missShare) {
    const hitPost = gameplayRandom() < 0.08;
    addEvent(
      match,
      state,
      minute,
      "miss",
      hitPost ? `🥅 ${shooterName}'in vuruşu direkten döndü!` : `💨 ${shooterName} vurdu, top auta gitti.`,
      shooterName
    );
    if (hitPost && state.looseBallCount < 2) {
      return resolveLooseBall({ ...state, phase: "loose_ball", zone: "penalty_area" }, minute, gameplayRandom, match);
    }
    return { state: swapState(state, false), ended: true };
  }

  updateStat(match, gkName, state.defending.userId, "saves");
  const handling = clamp(0.57 + gkCurve * 0.17 - (longRange ? 0.07 : 0), 0.46, 0.76);
  const saveRoll = gameplayRandom();
  if (saveRoll < handling) {
    addEvent(match, state, minute, "save", `🧤 ${gkName}, ${shooterName}'in şutunu güvenle kontrol etti.`, gkName, undefined, state.defending.userId);
    const next = swapState(state, tacticsOf(state.defending).transition === "counter" && gameplayRandom() < 0.32);
    return { state: next, ended: !next.isCounter };
  }
  if (saveRoll < handling + 0.16) {
    addEvent(match, state, minute, "save", `🧤 ${gkName} şutu kornere çeldi!`, gkName, undefined, state.defending.userId);
    return resolveCorner(state, minute, gameplayRandom, match);
  }
  addEvent(match, state, minute, "save", `🧤 ${gkName} şutu çıkardı ancak top ceza sahasında kaldı!`, gkName, undefined, state.defending.userId);
  return resolveLooseBall({ ...state, phase: "loose_ball", zone: "penalty_area" }, minute, gameplayRandom, match);
}

function simulateSequence(
  initial: SequenceState,
  baseMinute: number,
  endMinute: number,
  gameplayRandom: RandomSource,
  narrationRandom: RandomSource,
  match: MutableMatch & { homeUserId: string }
): TeamLineup {
  let state = initial;
  for (let guard = 0; guard < 9; guard++) {
    state.actions++;
    const minute = minuteWithAction(baseMinute, state.actions, endMinute);

    if (state.phase === "counter_attack") {
      addEvent(match, state, minute, "counter", `⚡ ${state.attackingUsername} rakibini dengesiz yakaladı ve kontraya çıkıyor!`);
      state.phase = "progression";
      state.zone = "middle_third";
      continue;
    }

    if (state.phase === "build_up" || state.phase === "progression") {
      if (gameplayRandom() < progressionChance(state, minute)) {
        state.phase = state.phase === "build_up" ? "progression" : "chance_creation";
        state.zone = state.phase === "progression" ? "middle_third" : "final_third";
        continue;
      }

      const defender = pickCorridorDefender(state.defending, mirrorCorridor(state.corridor), gameplayRandom);
      addEvent(match, state, minute, "turnover", `🔀 ${defender || state.defendingUsername} pas arasına girerek topu kazandı.`, defender, undefined, state.defending.userId);
      const counter = shouldCounter(state, minute, gameplayRandom);
      state = swapState(state, counter);
      if (!counter) return state.attacking;
      continue;
    }

    if (state.phase === "chance_creation") {
      if (gameplayRandom() < creationChance(state, minute, match)) {
        state.phase = "shot";
        state.zone = "penalty_area";
        continue;
      }

      const outcome = gameplayRandom();
      const defender = pickCorridorDefender(state.defending, mirrorCorridor(state.corridor), gameplayRandom);
      addEvent(match, state, minute, "chance", `🛡️ ${defender || state.defendingUsername} tehlikeli hücumu bozdu.`, defender, undefined, state.defending.userId);
      if (outcome < 0.16) {
        const corner = resolveCorner(state, minute, gameplayRandom, match);
        state = corner.state;
        if (corner.ended) return state.attacking;
        continue;
      }
      if (outcome < 0.42 && state.looseBallCount < 2) {
        const loose = resolveLooseBall({ ...state, phase: "loose_ball", zone: "final_third" }, minute, gameplayRandom, match);
        state = loose.state;
        if (loose.ended) return state.attacking;
        continue;
      }
      state = swapState(state, shouldCounter(state, minute, gameplayRandom));
      if (!state.isCounter) return state.attacking;
      continue;
    }

    if (state.phase === "shot") {
      const shot = resolveShot(state, minute, gameplayRandom, narrationRandom, match);
      state = shot.state;
      if (shot.ended) return state.attacking;
      continue;
    }

    if (state.phase === "loose_ball") {
      const loose = resolveLooseBall(state, minute, gameplayRandom, match);
      state = loose.state;
      if (loose.ended) return state.attacking;
      continue;
    }
  }

  // A computational action limit is not a successful tackle. The side currently
  // in possession recycles the ball into the next passage of play.
  return state.attacking;
}

export function simulateStatefulMatch(
  matchId: string,
  home: TeamLineup,
  homeUsername: string,
  away: TeamLineup,
  awayUsername: string,
  seed?: string
): StatefulSimulationOutput {
  const simulationSeed = seed || `${matchId}:${home.userId}:${away.userId}:${JSON.stringify(home.tactics)}:${JSON.stringify(away.tactics)}`;
  const gameplayRandom = createSeededRandom(`${simulationSeed}:gameplay`);
  const narrationRandom = createSeededRandom(`${simulationSeed}:narration`);
  const match: MutableMatch & { homeUserId: string } = {
    homeUserId: home.userId,
    homeScore: 0,
    awayScore: 0,
    events: [],
    playerStats: {},
  };

  const sequenceCount = calculateMatchTempo(home, away);
  let nextTeam: TeamLineup | null = null;
  for (let index = 0; index < sequenceCount; index++) {
    // Each passage occupies a disjoint time window; later attacks cannot appear
    // before the shot/rebound that gave them possession.
    const startMinute = Math.floor(index * 90 / sequenceCount) + 1;
    const endMinute = Math.floor((index + 1) * 90 / sequenceCount);
    const baseMinute = Math.min(endMinute, startMinute + Math.floor(gameplayRandom() * 2));
    let attacking: TeamLineup;
    if (nextTeam) {
      attacking = nextTeam;
    } else {
      const homeShare = softShare(averageMidfield(home), averageMidfield(away));
      attacking = gameplayRandom() < homeShare ? home : away;
    }
    const defending = attacking.userId === home.userId ? away : home;
    const attackingUsername = attacking.userId === home.userId ? homeUsername : awayUsername;
    const defendingUsername = defending.userId === home.userId ? homeUsername : awayUsername;
    const corridor = determineTeamAttackCorridor(attacking, gameplayRandom);
    nextTeam = simulateSequence({
      attacking,
      defending,
      attackingUsername,
      defendingUsername,
      corridor,
      zone: "defensive_third",
      phase: "build_up",
      isCounter: false,
      looseBallCount: 0,
      actions: 0,
    }, baseMinute, endMinute, gameplayRandom, narrationRandom, match);
  }

  // Events are chronological at creation time; sorting must not conceal overlap.
  return { ...match, simulationSeed };
}
