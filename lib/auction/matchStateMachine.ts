/**
 * 9 Bölgeli Durum Makinesi (Match State Machine).
 * Topun sahada 9 bölgedeki hareketini, auttan çıkış presini, orta saha geçişlerini,
 * ceza sahası penetrasyonunu, şutları, kurtarışları ve kornerleri yönetir.
 */

import { MatchEvent, TeamLineup } from "./auctionTypes";
import {
  generateCornerCommentary,
  generateDefenseBlockCommentary,
  generateGoalCommentary,
  generateReboundCommentary,
  generateSaveCommentary,
  generateTurnoverCommentary,
} from "./matchCommentary";
import {
  pickGoalkeeper,
  pickZoneAssister,
  pickZoneDefender,
  pickZonePasser,
  pickZoneShooter,
  pickZoneStealer,
} from "./zoneActors";
import { buildZoneId, determineNextProgressionZone, mirrorZone, parseZone } from "./zoneGrid";
import {
  resolveBoxPenetration,
  calculateZonePossessionPower,
  calculateZoneStealPower,
  resolveShooterVsGk,
  resolveZoneTurnoverChance,
} from "./zonePowers";
import { BallState, ZoneId } from "./zoneTypes";

export interface StateResolutionResult {
  nextState: BallState;
  event?: MatchEvent;
  isGoal: boolean;
  isSave: boolean;
  goalScorerName?: string;
  assistPlayerName?: string;
  gkName?: string;
  defenderName?: string;
}

export function createInitialBallState(homeUserId: string, awayUserId: string): BallState {
  const kickoffTeam = Math.random() < 0.5 ? homeUserId : awayUserId;
  return {
    possessingTeamUserId: kickoffTeam,
    zone: "mid_center",
    phase: "kick_off",
    actionCount: 0,
  };
}

export function resolveNextState(
  state: BallState,
  minute: number,
  homeLineup: TeamLineup,
  homeUsername: string,
  awayLineup: TeamLineup,
  awayUsername: string
): StateResolutionResult {
  const isHomeAttacking = state.possessingTeamUserId === homeLineup.userId;
  const atk = isHomeAttacking ? homeLineup : awayLineup;
  const def = isHomeAttacking ? awayLineup : homeLineup;
  const atkName = isHomeAttacking ? homeUsername : awayUsername;
  const defName = isHomeAttacking ? awayUsername : homeUsername;

  const currentZone = state.zone;
  const defZone = mirrorZone(currentZone);
  const phase = state.phase;

  // ---------------------------------------------------------------------------
  // 1. SANTRA (Kick-off)
  // ---------------------------------------------------------------------------
  if (phase === "kick_off") {
    const nextZone = determineNextProgressionZone("mid_center", atk.tactics);
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: nextZone, phase: "transition", actionCount: (state.actionCount || 0) + 1 },
      isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. AUT / GERİDEN OYUN KURMA (Goal Kick / Def Exit)
  // ---------------------------------------------------------------------------
  if (phase === "goal_kick" || (parseZone(currentZone).third === "def" && phase === "build_up")) {
    const isLongBall = atk.tactics?.buildUp === "long_ball";

    if (isLongBall) {
      // Uzun top: Önde pres tamamen baypas edilir, top havadan rakip 3. bölgeye uçar
      const targetZone: ZoneId = "att_center";
      return {
        nextState: { possessingTeamUserId: atk.userId, zone: targetZone, phase: "chance_creation", actionCount: (state.actionCount || 0) + 1 },
        isGoal: false, isSave: false,
      };
    }

    // Kısa pas veya dengeli çıkış: Rakip presiyle düello
    const retention = calculateZonePossessionPower(atk, currentZone);
    const steal = calculateZoneStealPower(def, defZone);
    const turnover = resolveZoneTurnoverChance(retention, steal);

    if (turnover.isStolen) {
      // ⚡ SAVUNMADA TOP KAYBI! Rakip anında 3. bölgede topu kaptı!
      const stealer = pickZoneStealer(def, defZone);
      const stealerName = stealer?.placedPlayer?.fullName || "Hücumcu";
      const isHighPress = def.tactics?.pressing === "high_press";

      const event: MatchEvent = {
        minute,
        type: "turnover",
        teamUserId: def.userId,
        playerName: stealerName,
        zone: defZone,
        description: generateTurnoverCommentary(stealerName, defName, currentZone, isHighPress),
      };

      // Top artık savunan takımda ve rakip 3. bölgede (yüksek xG şut fırsatı!)
      return {
        nextState: { possessingTeamUserId: def.userId, zone: defZone, phase: "finishing", actionCount: (state.actionCount || 0) + 1 },
        event, isGoal: false, isSave: false,
      };
    }

    // Pres başarıyla kırıldı: Top orta sahaya aktı
    const nextZone = determineNextProgressionZone(currentZone, atk.tactics);
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: nextZone, phase: "transition", actionCount: (state.actionCount || 0) + 1 },
      isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 3. ORTA SAHA GEÇİŞİ (Transition)
  // ---------------------------------------------------------------------------
  if (phase === "transition" || parseZone(currentZone).third === "mid") {
    const retention = calculateZonePossessionPower(atk, currentZone);
    const steal = calculateZoneStealPower(def, defZone);
    const turnover = resolveZoneTurnoverChance(retention, steal);

    if (turnover.isStolen) {
      // Orta alanda top kaybı -> Rakip atağa kalkar
      const stealer = pickZoneStealer(def, defZone);
      const stealerName = stealer?.placedPlayer?.fullName || "Orta Saha";
      const event: MatchEvent = {
        minute,
        type: "chance",
        teamUserId: def.userId,
        playerName: stealerName,
        zone: defZone,
        description: generateTurnoverCommentary(stealerName, defName, currentZone, false),
      };
      return {
        nextState: { possessingTeamUserId: def.userId, zone: defZone, phase: "transition", actionCount: (state.actionCount || 0) + 1 },
        event, isGoal: false, isSave: false,
      };
    }

    // Kaleyi görünce vur taktiği kontrolü
    if (atk.tactics?.buildUp === "shoot_on_sight" && currentZone === "mid_center" && Math.random() < 0.60) {
      return {
        nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "finishing", actionCount: (state.actionCount || 0) + 1 },
        isGoal: false, isSave: false,
      };
    }

    // 3. bölgeye geçiş
    const nextZone = determineNextProgressionZone(currentZone, atk.tactics);
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: nextZone, phase: "chance_creation", actionCount: (state.actionCount || 0) + 1 },
      isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. KORNER (Corner Kick)
  // ---------------------------------------------------------------------------
  if (phase === "corner") {
    const kicker = pickZonePasser(atk, currentZone);
    const target = pickZoneShooter(atk, currentZone);
    const kickerName = kicker?.placedPlayer?.fullName || "Kanat";
    const targetName = target?.placedPlayer?.fullName || "Forvet";

    const event: MatchEvent = {
      minute,
      type: "corner",
      teamUserId: atk.userId,
      playerName: kickerName,
      zone: currentZone,
      description: generateCornerCommentary(kickerName, targetName),
    };

    // Korner doğrudan kafa vuruşuna / şuta bağlanır
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "finishing", actionCount: (state.actionCount || 0) + 1 },
      event, isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. DÖNEN TOP (Rebound)
  // ---------------------------------------------------------------------------
  if (phase === "rebound") {
    const passer = pickZonePasser(atk, currentZone);
    const pName = passer?.placedPlayer?.fullName || "Orta Saha";
    const event: MatchEvent = {
      minute,
      type: "chance",
      teamUserId: atk.userId,
      playerName: pName,
      zone: currentZone,
      description: generateReboundCommentary(pName),
    };

    // Dönen topu kazanan takım anında şuta yönelir
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "finishing", actionCount: (state.actionCount || 0) + 1 },
      event, isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. FIRSAT YARATMA (Chance Creation)
  // ---------------------------------------------------------------------------
  if (phase === "chance_creation") {
    const penetration = resolveBoxPenetration(atk, def, currentZone, defZone);

    if (!penetration.defenseBeaten) {
      // Savunma geçit vermedi
      const defPlayer = pickZoneDefender(def, defZone);
      const event: MatchEvent = {
        minute,
        type: "chance",
        teamUserId: def.userId,
        playerName: defPlayer,
        zone: defZone,
        description: generateDefenseBlockCommentary(defPlayer, currentZone),
      };

      // %35 kornere çelindi, %20 seken dönen top, %45 kaleci aldı / aut
      const roll = Math.random();
      if (roll < 0.35) {
        return {
          nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "corner", actionCount: (state.actionCount || 0) + 1 },
          event, isGoal: false, isSave: false, defenderName: defPlayer,
        };
      }
      if (roll < 0.55) {
        return {
          nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "rebound", actionCount: (state.actionCount || 0) + 1 },
          event, isGoal: false, isSave: false, defenderName: defPlayer,
        };
      }

      // Top kalecide: diğer takım auttan başlar
      return {
        nextState: { possessingTeamUserId: def.userId, zone: "def_center", phase: "goal_kick", actionCount: (state.actionCount || 0) + 1 },
        event, isGoal: false, isSave: false, defenderName: defPlayer,
      };
    }

    // Ceza sahası delindi: Şut fazına geç
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "finishing", actionCount: (state.actionCount || 0) + 1 },
      isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 7. BİTİRİCİLİK & KALECİ DÜELLOSU (Finishing)
  // ---------------------------------------------------------------------------
  const isLongShot = parseZone(currentZone).third !== "att";
  const shooterSlot = pickZoneShooter(atk, currentZone, isLongShot);
  const shooterName = shooterSlot?.placedPlayer?.fullName || "Forvet";
  const shooterRating = shooterSlot?.effectiveRating || 75;

  const gk = pickGoalkeeper(def);
  const duel = resolveShooterVsGk(shooterRating, gk.rating, 0.55);

  if (duel.isGoal) {
    const assistName = pickZoneAssister(atk, currentZone, shooterName);
    const event: MatchEvent = {
      minute,
      type: "goal",
      teamUserId: atk.userId,
      playerName: shooterName,
      assistPlayerName: assistName,
      zone: currentZone,
      description: generateGoalCommentary(shooterName, atkName, currentZone, assistName, isLongShot),
    };

    // Gol oldu: Santra diğer takımda
    return {
      nextState: { possessingTeamUserId: def.userId, zone: "mid_center", phase: "kick_off", actionCount: (state.actionCount || 0) + 1 },
      event, isGoal: true, isSave: false, goalScorerName: shooterName, assistPlayerName: assistName, gkName: gk.name,
    };
  }

  // Kaleci kurtardı!
  const roll = Math.random();
  const isCorner = roll < 0.60;
  const event: MatchEvent = {
    minute,
    type: "save",
    teamUserId: def.userId,
    playerName: gk.name,
    zone: defZone,
    description: generateSaveCommentary(gk.name, shooterName, isCorner),
  };

  if (isCorner) {
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "corner", actionCount: (state.actionCount || 0) + 1 },
      event, isGoal: false, isSave: true, gkName: gk.name,
    };
  }

  // Kaleci kontrol etti: defanstan çıkış
  return {
    nextState: { possessingTeamUserId: def.userId, zone: "def_center", phase: "goal_kick", actionCount: (state.actionCount || 0) + 1 },
    event, isGoal: false, isSave: true, gkName: gk.name,
  };
}
