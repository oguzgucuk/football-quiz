import { MatchEvent, PitchCorridor, PossessionResult, SquadSlot, TeamLineup } from "./auctionTypes";
import {
  calculateCorridorAttackPower,
  calculateCorridorDefensePower,
  calculateCorridorMidfieldScore,
  determineAttackCorridor,
  mirrorCorridor,
  pickCorridorAssist,
  pickCorridorDefender,
  pickCorridorShooter,
  pickLongRangeShooter,
  pickCorridorBlocker,
} from "./corridorEngine";
import { ratingCurve } from "./matchWeights";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function resolveMidfield(homeSlots: SquadSlot[], awaySlots: SquadSlot[]): "home" | "away" {
  // Geriye dönük uyum için fallback
  const homeScore = homeSlots.reduce((sum, s) => s.placedPlayer ? sum + ratingCurve(s.effectiveRating) : sum, 0);
  const awayScore = awaySlots.reduce((sum, s) => s.placedPlayer ? sum + ratingCurve(s.effectiveRating) : sum, 0);
  const chance = clamp(homeScore / Math.max(0.001, homeScore + awayScore), 0.15, 0.85);
  return Math.random() < chance ? "home" : "away";
}

export function resolveDefense(atkSlots: SquadSlot[], defSlots: SquadSlot[]) {
  const atkScore = atkSlots.reduce((sum, s) => s.placedPlayer ? sum + ratingCurve(s.effectiveRating) : sum, 0);
  const defScore = defSlots.reduce((sum, s) => s.placedPlayer ? sum + ratingCurve(s.effectiveRating) : sum, 0);
  const breakthroughChance = clamp(atkScore / Math.max(0.001, atkScore + defScore), 0.05, 0.9);
  return { beaten: Math.random() < breakthroughChance, breakthroughChance };
}

export function resolveShooterVsGoalkeeper(
  shooterRating: number,
  gkEffectiveRating: number,
  breakthroughChance: number
) {
  const shotQuality = clamp((breakthroughChance - 0.5) * 2, 0, 1);
  const shooterCurve = ratingCurve(shooterRating);
  const gkCurve = ratingCurve(gkEffectiveRating);
  // Kalecileri devleştiren dengeli gol/kurtarış formülü:
  // Taban gol şansı %33 (kaleciler şutların %67-%75'ini çıkarır, kalede devleşir).
  const goalChance = clamp(0.33 + (shooterCurve - gkCurve) * 0.45 + shotQuality * 0.12, 0.05, 0.75);
  const isGoal = Math.random() < goalChance;
  return { isGoal, goalChance, gkSaveChance: 1 - goalChance };
}

function corridorNameTr(corridor: PitchCorridor): string {
  if (corridor === "left") return "sol kanattan";
  if (corridor === "right") return "sağ kanattan";
  return "merkezden";
}

function generateDefenseCommentary(defenderName: string | undefined, attackingUsername: string, corridor: PitchCorridor): string {
  const cName = corridorNameTr(corridor);
  if (defenderName) {
    const variations = [
      `🛡️ ${defenderName} ${cName} gelişen tehlikeyi sezdi ve kritik bir müdahaleyle topu kornere yolladı!`,
      `🛡️ ${attackingUsername} ${cName} yüklendi ancak ${defenderName} geçit vermedi, topu uzaklaştırdı.`,
      `🛡️ ${defenderName} kademeye harika girdi! ${cName} ceza sahasına sarkan topu süpürdü.`,
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }
  return `🛡️ ${attackingUsername} ${cName} bindirme yaptı ancak savunma duvarı sağlam durdu.`;
}

function generateSaveCommentary(gkName: string, shooterName: string, corridor: PitchCorridor): string {
  const cName = corridorNameTr(corridor);
  const variations = [
    `🧤 ${gkName}, ${cName} kaleciyle karşı karşıya kalan ${shooterName}'in sert şutunu muazzam bir refleksle çeldi!`,
    `🧤 ${shooterName} ${cName} vurdu ama ${gkName} kalesinde devleşti!`,
    `🧤 ${shooterName}'in köşeye giden tehlikeli vuruşunu ${gkName} son anda uzanarak kurtardı!`,
    `🧤 Net fırsat! ${shooterName} ceza sahasında vurdu, ${gkName} gole izin vermedi!`,
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}

function generateGoalCommentary(shooterName: string, attackingUsername: string, corridor: PitchCorridor, assistPlayerName?: string, isLongBall?: boolean): string {
  const cName = corridorNameTr(corridor);
  if (isLongBall && assistPlayerName) {
    return `⚽ GOL! ${assistPlayerName}'in savunma arkasına yolladığı enfes uzun topta ${shooterName} (${attackingUsername}) kaleciyi avladı!`;
  }
  if (assistPlayerName) {
    const withAssist = [
      `⚽ GOL! ${assistPlayerName} ${cName} kesti, ${shooterName} (${attackingUsername}) tek vuruşla topu ağlara yolladı!`,
      `⚽ GOL! ${assistPlayerName}'in harika ara pasında ${shooterName} (${attackingUsername}) ceza sahasında affetmedi!`,
      `⚽ GOL! ${assistPlayerName} şık gördü, ${cName} içeri sokulan ${shooterName} (${attackingUsername}) skoru değiştirdi!`,
    ];
    return withAssist[Math.floor(Math.random() * withAssist.length)];
  }
  const solo = [
    `⚽ GOL! ${shooterName} (${attackingUsername}) ${cName} ceza sahasına daldı, nefis bir vuruşla kaleciyi çaresiz bıraktı!`,
    `⚽ GOL! ${shooterName} (${attackingUsername}) kaleciyle karşı karşıya kaldı ve köşeye bıraktı!`,
    `⚽ GOL! ${shooterName} (${attackingUsername}) klasını konuşturdu ve harika bir gole imza attı!`,
  ];
  return solo[Math.floor(Math.random() * solo.length)];
}

function generateLongShotGoalCommentary(shooterName: string, attackingUsername: string, corridor: PitchCorridor): string {
  const cName = corridorNameTr(corridor);
  if (corridor === "center") {
    const centerVariants = [
      `🚀 FÜZE! ${shooterName} (${attackingUsername}) yaklaşık 28 metreden kaleye müthiş bir füze yolladı, top çatala asıldı!`,
      `💥 İNANILMAZ GOL! ${shooterName} (${attackingUsername}) kaleyi görür görmez çok uzaklardan mermi gibi vurdu, top 90'a gitti!`,
      `⚡ MERMİ! ${shooterName} (${attackingUsername}) ceza sahası yayının gerisinden nefis vurdu, kaleci çaresiz kaldı!`,
    ];
    return centerVariants[Math.floor(Math.random() * centerVariants.length)];
  } else {
    const wideVariants = [
      `🚀 FÜZE! ${shooterName} (${attackingUsername}) ${cName} içeri kat etti, uzak köşeye akıl almaz bir plase yolladı ve top ağlarda!`,
      `💥 MUHTEŞEM VURUŞ! ${shooterName} (${attackingUsername}) ${cName} ceza sahası çaprazından kaleyi düşündü, top 90'a takıldı!`,
      `⚡ HARİKA GOL! ${shooterName} (${attackingUsername}) ${cName} kaleyi cepheye aldı, müthiş bir vuruşla kaleciyi avladı!`,
    ];
    return wideVariants[Math.floor(Math.random() * wideVariants.length)];
  }
}

function generateLongShotSaveCommentary(gkName: string, shooterName: string, corridor: PitchCorridor): string {
  const cName = corridorNameTr(corridor);
  const variations = [
    `🧤 ${gkName}, ${shooterName}'in ${cName} yaklaşık 28 metreden 90'a giden füzesini parmaklarının ucuyla kornere çeldi!`,
    `🧤 UZAKTAN TEHLİKE! ${shooterName} ${cName} çok sert vurdu, ${gkName} muazzam uzanarak golü önledi!`,
    `🧤 ${gkName} devleşti! ${shooterName}'in ceza sahası dışından sert şutunu son anda köşeden tokatladı!`,
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}

function generateLongShotBlockCommentary(blockerName: string, shooterName: string, attackingUsername: string, corridor: PitchCorridor): string {
  const cName = corridorNameTr(corridor);
  const variations = [
    `🛡️ ${blockerName}, ${shooterName}'in (${attackingUsername}) ${cName} kaleye gönderdiği sert füzenin önüne adeta siper oldu!`,
    `🛡️ ${shooterName} (${attackingUsername}) ${cName} kaleyi görür görmez denedi ancak ${blockerName} şuta ayak koydu!`,
    `🛡️ ${attackingUsername} uzaktan kaleyi yokladı ancak ${blockerName} ceza sahası önünde geçit vermedi, top kornere çıktı.`,
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}

/**
 * Uzaktan şut denemesini çözen fonksiyon.
 * 1. Blokaj testi (savunma şutun önüne siper olabildi mi?)
 * 2. Blokaj aşıldıysa: Kaleci vs Uzaktan Şut düellosu.
 */
export function resolveLongRangeShot(
  minute: number,
  attacking: TeamLineup,
  attackingUsername: string,
  defending: TeamLineup,
  defendingUsername: string,
  corridor: PitchCorridor
): PossessionResult {
  const shooterSlot = pickLongRangeShooter(attacking, corridor);
  const shooterName = shooterSlot?.placedPlayer?.fullName || "Futbolcu";
  const shooterCurve = ratingCurve(shooterSlot?.effectiveRating || 75);

  const defenseCorridor = mirrorCorridor(corridor);
  const blockerSlot = pickCorridorBlocker(defending, defenseCorridor);
  const blockerName = blockerSlot?.placedPlayer?.fullName || "Savunmacı";
  const blockerCurve = ratingCurve(blockerSlot?.effectiveRating || 75);

  // 1. Blokaj Testi (Stoperler ve ön liberolar şutun önüne siper olur; ~%50 blokaj)
  const blockChance = clamp(
    (blockerCurve * 1.10) / Math.max(0.001, shooterCurve + blockerCurve * 1.10),
    0.25,
    0.55
  );
  const isBlocked = Math.random() < blockChance;

  if (isBlocked) {
    const event: MatchEvent = {
      minute,
      type: "chance",
      teamUserId: attacking.userId,
      playerName: blockerName,
      description: generateLongShotBlockCommentary(blockerName, shooterName, attackingUsername, corridor),
    };
    return {
      attackingTeamUserId: attacking.userId,
      isGoal: false,
      gkSaved: false,
      defenseBlocked: true,
      isLongRangeShot: true,
      defenderName: blockerName,
      event,
    };
  }

  // 2. Blokaj Aşıldı -> Kaleci vs Uzaktan Şut
  const gkSlot = defending.slots.find((slot) => slot.targetPosition === "GK");
  const gkName = gkSlot?.placedPlayer?.fullName || "Kaleci";
  const gkCurve = ratingCurve(gkSlot?.effectiveRating || 40);

  const baseRateMap: Record<string, number> = {
    shoot_on_sight: 0.20,
    balanced: 0.16,
    long_ball: 0.14,
    short_pass: 0.12,
  };
  const baseRate = baseRateMap[attacking.tactics?.buildUp || "balanced"] ?? 0.16;
  const goalChance = clamp(baseRate + (shooterCurve - gkCurve) * 0.35, 0.05, 0.40);
  const isGoal = Math.random() < goalChance;

  if (isGoal) {
    const event: MatchEvent = {
      minute,
      type: "goal",
      teamUserId: attacking.userId,
      playerName: shooterName,
      description: generateLongShotGoalCommentary(shooterName, attackingUsername, corridor),
    };
    return {
      attackingTeamUserId: attacking.userId,
      isGoal: true,
      gkSaved: false,
      defenseBlocked: false,
      isLongRangeShot: true,
      goalScorerName: shooterName,
      gkName,
      event,
    };
  }

  const event: MatchEvent = {
    minute,
    type: "save",
    teamUserId: defending.userId,
    playerName: gkName,
    description: generateLongShotSaveCommentary(gkName, shooterName, corridor),
  };
  return {
    attackingTeamUserId: attacking.userId,
    isGoal: false,
    gkSaved: true,
    defenseBlocked: false,
    isLongRangeShot: true,
    gkName,
    event,
  };
}

export function resolvePossession(
  minute: number,
  home: TeamLineup,
  homeUsername: string,
  away: TeamLineup,
  awayUsername: string
): PossessionResult {
  // 1. O pozisyon için atak koridoru belirlenir (Sol, Merkez, Sağ)
  const initialCorridor = determineAttackCorridor(home, away);

  // 2. SAFHA 1: Koridorda Top Kapma (Orta Saha Geçişi)
  const homeMidScore = calculateCorridorMidfieldScore(home, initialCorridor);
  const awayCorridor = mirrorCorridor(initialCorridor);
  const awayMidScore = calculateCorridorMidfieldScore(away, awayCorridor);

  // Taban %15, Tavan %85 kuralı
  const homeWinChance = clamp(homeMidScore / Math.max(0.001, homeMidScore + awayMidScore), 0.15, 0.85);
  const homeAttacks = Math.random() < homeWinChance;

  const attacking = homeAttacks ? home : away;
  const defending = homeAttacks ? away : home;
  const attackingUsername = homeAttacks ? homeUsername : awayUsername;
  const defendingUsername = homeAttacks ? awayUsername : homeUsername;

  // Hücum eden ve savunan tarafın koridorları
  const attackCorridor = homeAttacks ? initialCorridor : awayCorridor;
  const defenseCorridor = mirrorCorridor(attackCorridor);

  // 3. UZAKTAN ŞUT İHTİMALİ KONTROLÜ (Taktik Tercihine Göre)
  // shoot_on_sight %70, balanced %15, long_ball %10, short_pass %5
  const longShotChanceMap: Record<string, number> = {
    shoot_on_sight: 0.70,
    balanced: 0.15,
    long_ball: 0.10,
    short_pass: 0.05,
  };
  const longShotChance = longShotChanceMap[attacking.tactics?.buildUp || "balanced"] ?? 0.15;
  if (Math.random() < longShotChance) {
    return resolveLongRangeShot(minute, attacking, attackingUsername, defending, defendingUsername, attackCorridor);
  }

  // 4. SAFHA 2: Ceza Sahasını Delme (Hücumcular vs Savunmacılar)
  const atkPower = calculateCorridorAttackPower(attacking, attackCorridor);
  const defPower = calculateCorridorDefensePower(defending, defenseCorridor);
  // Savunma direnci dengelendi: atakların ~%55-%60'ı stoperler ve bekler tarafından kesilir
  const breakthroughChance = clamp(atkPower / Math.max(0.001, atkPower + defPower * 1.40), 0.05, 0.75);
  const defenseBeaten = Math.random() < breakthroughChance;

  if (!defenseBeaten) {
    const defenderName = pickCorridorDefender(defending, defenseCorridor);
    const event: MatchEvent = {
      minute,
      type: "chance",
      teamUserId: attacking.userId,
      playerName: defenderName,
      description: generateDefenseCommentary(defenderName, attackingUsername, attackCorridor),
    };
    return {
      attackingTeamUserId: attacking.userId,
      isGoal: false,
      gkSaved: false,
      defenseBlocked: true,
      defenderName,
      event,
    };
  }

  // 4. SAFHA 3: Şutör vs Kaleci Kapışması
  const shooterSlot = pickCorridorShooter(attacking, attackCorridor);
  const shooterName = shooterSlot?.placedPlayer?.fullName || "Futbolcu";
  const shooterRating = shooterSlot?.effectiveRating || 75;

  const gkSlot = defending.slots.find((slot) => slot.targetPosition === "GK");
  const gkName = gkSlot?.placedPlayer?.fullName || "Kaleci";
  const gkRating = gkSlot?.effectiveRating || 40;

  const duel = resolveShooterVsGoalkeeper(shooterRating, gkRating, breakthroughChance);

  if (!duel.isGoal) {
    const event: MatchEvent = {
      minute,
      type: "save",
      teamUserId: defending.userId,
      playerName: gkName,
      description: generateSaveCommentary(gkName, shooterName, attackCorridor),
    };
    return {
      attackingTeamUserId: attacking.userId,
      isGoal: false,
      gkSaved: true,
      defenseBlocked: false,
      gkName,
      event,
    };
  }

  // 5. Gol oldu! Asistçi ve dinamik spiker anlatımı
  const isLongBall = attacking.tactics?.buildUp === "long_ball";
  const assistPlayerName = pickCorridorAssist(attacking, attackCorridor, shooterName);
  const event: MatchEvent = {
    minute,
    type: "goal",
    teamUserId: attacking.userId,
    playerName: shooterName,
    assistPlayerName,
    description: generateGoalCommentary(shooterName, attackingUsername, attackCorridor, assistPlayerName, isLongBall),
  };

  return {
    attackingTeamUserId: attacking.userId,
    isGoal: true,
    gkSaved: false,
    defenseBlocked: false,
    goalScorerName: shooterName,
    assistPlayerName,
    gkName,
    event,
  };
}
