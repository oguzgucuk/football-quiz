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
  generatePenaltyAwardedCommentary,
  generatePenaltyScoredCommentary,
  generatePenaltySavedCommentary,
  generatePenaltyWoodworkCommentary,
  generateFreeKickAwardedCommentary,
  generateFreeKickGoalCommentary,
  generateFreeKickSavedCommentary,
  generateFreeKickWallCommentary,
  generateFoulCommentary,
} from "./matchCommentary";
import {
  pickGoalkeeper,
  pickZoneAssister,
  pickZoneDefender,
  pickZonePasser,
  pickZoneShooter,
  pickZoneStealer,
  pickPenaltyTaker,
  pickFreeKickTaker,
  pickCornerTaker,
  pickCornerAerialThreat,
} from "./zoneActors";
import { buildZoneId, determineNextProgressionZone, mirrorZone, parseZone } from "./zoneGrid";
import {
  resolveBoxPenetration,
  calculateZonePossessionPower,
  calculateZoneStealPower,
  resolveShooterVsGk,
  resolveZoneTurnoverChance,
  resolveFoulCheck,
  resolvePenaltyDuel,
  resolveFreeKickDuel,
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
      // Uzun top: Rakibin savunma çizgisiyle kapışır
      // Rakip Önde Pres yapıyorsa arkada boşluk geniştir (%68 forvete ulaşır).
      // Rakip Otobüsü Çek yapmışsa ceza sahası kalabalıktır (%38 forvete ulaşır).
      // Rakip Dengeli ise %54 forvete ulaşır.
      const isOpponentHighPress = def.tactics?.pressing === "high_press";
      const isOpponentParkBus = def.tactics?.pressing === "park_bus";
      const successChance = isOpponentHighPress ? 0.68 : isOpponentParkBus ? 0.38 : 0.54;

      if (Math.random() < successChance) {
        const targetZone: ZoneId = "att_center";
        return {
          nextState: { possessingTeamUserId: atk.userId, zone: targetZone, phase: "chance_creation", actionCount: (state.actionCount || 0) + 1 },
          isGoal: false, isSave: false,
        };
      } else {
        // Savunma veya kaleci havada karşıladı -> Dönen top orta alana düşer
        const defPlayer = pickZoneDefender(def, "def_center");
        const event: MatchEvent = {
          minute,
          type: "chance",
          teamUserId: def.userId,
          playerName: defPlayer,
          zone: "def_center",
          description: `🛡️ ${atkName} uzun top denedi, ancak ${defPlayer} (${defName}) hava topunu kafayla uzaklaştırdı.`,
        };
        return {
          nextState: { possessingTeamUserId: def.userId, zone: "mid_center", phase: "transition", actionCount: (state.actionCount || 0) + 1 },
          event, isGoal: false, isSave: false, defenderName: defPlayer,
        };
      }
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
      // Top çalınırken faul olup olmadığını kontrol et
      const foulCheck = resolveFoulCheck(
        currentZone,
        def.tactics?.pressing === "high_press",
        def.tactics?.tempo === "fast"
      );

      if (foulCheck.isFoul) {
        const stealer = pickZoneStealer(def, defZone);
        const stealerName = stealer?.placedPlayer?.fullName || "Orta Saha";
        const passer = pickZonePasser(atk, currentZone);
        const passerName = passer?.placedPlayer?.fullName || "Orta Saha";

        if (foulCheck.isDangerousFreeKick) {
          const event: MatchEvent = {
            minute,
            type: "free_kick",
            teamUserId: atk.userId,
            playerName: passerName,
            zone: currentZone,
            description: generateFreeKickAwardedCommentary(passerName, stealerName, foulCheck.isYellowCard),
          };
          return {
            nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "free_kick", actionCount: (state.actionCount || 0) + 1 },
            event, isGoal: false, isSave: false, defenderName: stealerName,
          };
        }

        const event: MatchEvent = {
          minute,
          type: "foul",
          teamUserId: atk.userId,
          playerName: passerName,
          zone: currentZone,
          description: generateFoulCommentary(passerName, stealerName),
        };
        return {
          nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "transition", actionCount: (state.actionCount || 0) + 1 },
          event, isGoal: false, isSave: false, defenderName: stealerName,
        };
      }

      // Temiz top çalma -> Rakip atağa kalkar
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
    const kicker = pickCornerTaker(atk);
    const kickerName = kicker?.placedPlayer?.fullName || "Kanat";

    // Ceza sahasında kafa vurmaya ileri çıkan kule stoper veya santrafor
    const threat = pickCornerAerialThreat(atk, kickerName);
    const targetName = threat.slot?.placedPlayer?.fullName || "Forvet";

    const event: MatchEvent = {
      minute,
      type: "corner",
      teamUserId: atk.userId,
      playerName: kickerName,
      zone: currentZone,
      description: generateCornerCommentary(kickerName, targetName, threat.isDefenderThreat),
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
  // 6. PENALTI VURUŞU (Penalty Kick)
  // ---------------------------------------------------------------------------
  if (phase === "penalty") {
    const penaltyTakerSlot = pickPenaltyTaker(atk);
    const penaltyTaker = penaltyTakerSlot?.placedPlayer?.fullName || "Forvet";
    const penaltyRating = penaltyTakerSlot?.effectiveRating || 75;

    const gk = pickGoalkeeper(def);
    const duel = resolvePenaltyDuel(penaltyRating, gk.rating);

    if (duel.isGoal) {
      const event: MatchEvent = {
        minute,
        type: "goal",
        teamUserId: atk.userId,
        playerName: penaltyTaker,
        zone: "att_center",
        description: generatePenaltyScoredCommentary(penaltyTaker, atkName),
      };
      return {
        nextState: { possessingTeamUserId: def.userId, zone: "mid_center", phase: "kick_off", actionCount: (state.actionCount || 0) + 1 },
        event, isGoal: true, isSave: false, goalScorerName: penaltyTaker, gkName: gk.name,
      };
    }

    if (duel.isSave) {
      const event: MatchEvent = {
        minute,
        type: "save",
        teamUserId: def.userId,
        playerName: gk.name,
        zone: "def_center",
        description: generatePenaltySavedCommentary(gk.name, penaltyTaker),
      };
      const isCorner = Math.random() < 0.60;
      return {
        nextState: {
          possessingTeamUserId: isCorner ? atk.userId : def.userId,
          zone: isCorner ? "att_center" : "def_center",
          phase: isCorner ? "corner" : "goal_kick",
          actionCount: (state.actionCount || 0) + 1,
        },
        event, isGoal: false, isSave: true, gkName: gk.name,
      };
    }

    // Direkten döndü!
    const event: MatchEvent = {
      minute,
      type: "chance",
      teamUserId: atk.userId,
      playerName: penaltyTaker,
      zone: "att_center",
      description: generatePenaltyWoodworkCommentary(penaltyTaker),
    };
    return {
      nextState: { possessingTeamUserId: def.userId, zone: "def_center", phase: "goal_kick", actionCount: (state.actionCount || 0) + 1 },
      event, isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 7. TEHLİKELİ FRİKİK / SERBEST VURUŞ (Direct Free Kick)
  // ---------------------------------------------------------------------------
  if (phase === "free_kick") {
    const fkTakerSlot = pickFreeKickTaker(atk);
    const fkTaker = fkTakerSlot?.placedPlayer?.fullName || "Frikikçi";
    const fkRating = fkTakerSlot?.effectiveRating || 75;

    const gk = pickGoalkeeper(def);
    const duel = resolveFreeKickDuel(fkRating, gk.rating);

    if (duel.isGoal) {
      const event: MatchEvent = {
        minute,
        type: "goal",
        teamUserId: atk.userId,
        playerName: fkTaker,
        zone: currentZone,
        description: generateFreeKickGoalCommentary(fkTaker, atkName),
      };
      return {
        nextState: { possessingTeamUserId: def.userId, zone: "mid_center", phase: "kick_off", actionCount: (state.actionCount || 0) + 1 },
        event, isGoal: true, isSave: false, goalScorerName: fkTaker, gkName: gk.name,
      };
    }

    if (duel.isSave) {
      const event: MatchEvent = {
        minute,
        type: "save",
        teamUserId: def.userId,
        playerName: gk.name,
        zone: defZone,
        description: generateFreeKickSavedCommentary(gk.name, fkTaker, duel.isCorner),
      };
      return {
        nextState: {
          possessingTeamUserId: duel.isCorner ? atk.userId : def.userId,
          zone: duel.isCorner ? currentZone : "def_center",
          phase: duel.isCorner ? "corner" : "goal_kick",
          actionCount: (state.actionCount || 0) + 1,
        },
        event, isGoal: false, isSave: true, gkName: gk.name,
      };
    }

    if (duel.isWallBlock) {
      const event: MatchEvent = {
        minute,
        type: "chance",
        teamUserId: atk.userId,
        playerName: fkTaker,
        zone: currentZone,
        description: generateFreeKickWallCommentary(fkTaker),
      };
      return {
        nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "rebound", actionCount: (state.actionCount || 0) + 1 },
        event, isGoal: false, isSave: false,
      };
    }

    // Aut / dışarı
    return {
      nextState: { possessingTeamUserId: def.userId, zone: "def_center", phase: "goal_kick", actionCount: (state.actionCount || 0) + 1 },
      isGoal: false, isSave: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 8. FIRSAT YARATMA (Chance Creation)
  // ---------------------------------------------------------------------------
  if (phase === "chance_creation") {
    // Mücadelede faul kontrolü
    const foulCheck = resolveFoulCheck(
      currentZone,
      def.tactics?.pressing === "high_press",
      atk.tactics?.tempo === "fast" || def.tactics?.tempo === "fast"
    );

    if (foulCheck.isFoul) {
      const defPlayer = pickZoneDefender(def, defZone);
      const atkPlayer = pickZoneShooter(atk, currentZone)?.placedPlayer?.fullName || "Forvet";

      if (foulCheck.isPenalty) {
        // 🚨 PENALTI! Ceza sahasında müdahale faul
        const event: MatchEvent = {
          minute,
          type: "penalty",
          teamUserId: atk.userId,
          playerName: atkPlayer,
          zone: currentZone,
          description: generatePenaltyAwardedCommentary(atkPlayer, defPlayer, foulCheck.isYellowCard),
        };
        return {
          nextState: { possessingTeamUserId: atk.userId, zone: "att_center", phase: "penalty", actionCount: (state.actionCount || 0) + 1 },
          event, isGoal: false, isSave: false, defenderName: defPlayer,
        };
      } else if (foulCheck.isDangerousFreeKick) {
        // ⚠️ TEHLİKELİ FRİKİK! Ceza sahası yayında faul
        const event: MatchEvent = {
          minute,
          type: "free_kick",
          teamUserId: atk.userId,
          playerName: atkPlayer,
          zone: currentZone,
          description: generateFreeKickAwardedCommentary(atkPlayer, defPlayer, foulCheck.isYellowCard),
        };
        return {
          nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "free_kick", actionCount: (state.actionCount || 0) + 1 },
          event, isGoal: false, isSave: false, defenderName: defPlayer,
        };
      } else {
        // Normal serbest vuruş
        const event: MatchEvent = {
          minute,
          type: "foul",
          teamUserId: atk.userId,
          playerName: atkPlayer,
          zone: currentZone,
          description: generateFoulCommentary(atkPlayer, defPlayer),
        };
        return {
          nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "chance_creation", actionCount: (state.actionCount || 0) + 1 },
          event, isGoal: false, isSave: false, defenderName: defPlayer,
        };
      }
    }

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
  const tempoBonus = atk.tactics?.tempo === "fast" ? 0.07 : atk.tactics?.tempo === "slow" ? -0.04 : 0;
  const baseOpportunity = isLongShot ? 0.42 : 0.55;
  const duel = resolveShooterVsGk(shooterRating, gk.rating, baseOpportunity + tempoBonus);

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
  const isCorner = roll < 0.50;
  const isRebound = !isCorner && roll < 0.78;
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

  if (isRebound) {
    return {
      nextState: { possessingTeamUserId: atk.userId, zone: currentZone, phase: "rebound", actionCount: (state.actionCount || 0) + 1 },
      event, isGoal: false, isSave: true, gkName: gk.name,
    };
  }

  // Kaleci kontrol etti: defanstan çıkış
  return {
    nextState: { possessingTeamUserId: def.userId, zone: "def_center", phase: "goal_kick", actionCount: (state.actionCount || 0) + 1 },
    event, isGoal: false, isSave: true, gkName: gk.name,
  };
}
