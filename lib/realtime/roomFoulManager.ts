/**
 * Realtime Faul ve Ceza Yöneticisi (Room Foul Manager).
 * Takım/Millet seçimi zaman aşımına uğradığında faul verme,
 * 3 faulde ceza puanı atama ve seçimleri sıfırlama (kilit açma) mantığını yürütür.
 */

import { RoomState, FoulEventInfo, RoomPlayer } from "./roomState";

/**
 * Seçim süresi dolduğunda seçim yapmamış oyuncuları tespit eder ve faul yazar.
 * 3 faule ulaşan oyuncunun faulleri sıfırlanır ve rakibine +1 puan verilir.
 * Eğer ceza puanı ile rakip targetScore'a (3) ulaşırsa maç tamamlanır.
 */
export function checkSelectionTimeoutsAndApplyFouls(
  state: RoomState
): {
  state: RoomState;
  foulsApplied: FoulEventInfo[];
  isMatchFinished: boolean;
} {
  const next: RoomState = { ...state };
  if (!next.player1 || !next.player2) {
    return { state: next, foulsApplied: [], isMatchFinished: false };
  }

  next.player1 = { ...next.player1, fouls: next.player1.fouls || 0, score: next.player1.score || 0 };
  next.player2 = { ...next.player2, fouls: next.player2.fouls || 0, score: next.player2.score || 0 };

  const foulsApplied: FoulEventInfo[] = [];
  const targetScore = next.targetScore || 3;

  const applyFoul = (offender: RoomPlayer, victim: RoomPlayer) => {
    offender.fouls += 1;
    let penaltyAwarded = false;
    let message = `${offender.username} seçim yapmadığı için 1 Faul aldı (${offender.fouls}/3).`;

    if (offender.fouls >= 3) {
      offender.fouls = 0;
      victim.score += 1;
      penaltyAwarded = true;
      message = `⚠️ ${offender.username} 3 faule ulaştı! Ceza puanı: ${victim.username} +1 puan kazandı!`;
    }

    const event: FoulEventInfo = {
      userId: offender.userId,
      username: offender.username,
      totalFouls: offender.fouls,
      penaltyAwarded,
      message,
    };
    foulsApplied.push(event);
  };

  if (next.gameMode === "country_vs_team") {
    // 1. Millet seçicisi seçmedi mi?
    if (!next.nation && next.currentNationPickerUserId) {
      const isP1 = next.player1.userId === next.currentNationPickerUserId;
      const offender = isP1 ? next.player1 : next.player2;
      const victim = isP1 ? next.player2 : next.player1;
      applyFoul(offender, victim);
    }
    // 2. Kulüp seçicisi seçmedi mi?
    if (!next.team1 && next.currentTeamPickerUserId) {
      const isP1 = next.player1.userId === next.currentTeamPickerUserId;
      const offender = isP1 ? next.player1 : next.player2;
      const victim = isP1 ? next.player2 : next.player1;
      applyFoul(offender, victim);
    }
  } else {
    // Takım vs Takım: Seçim yapmayan oyuncu(lar)
    if (!next.team1) {
      applyFoul(next.player1, next.player2);
    }
    if (!next.team2) {
      applyFoul(next.player2, next.player1);
    }
  }

  const isMatchFinished = next.player1.score >= targetScore || next.player2.score >= targetScore;
  if (isMatchFinished) {
    next.status = "match_finished";
  }

  if (foulsApplied.length > 0) {
    next.lastFoulEvent = foulsApplied[foulsApplied.length - 1];
    // Faul uygulandığında seçimler sıfırlanır, böylece önceden seçmiş oyuncunun seçimi kilitli kalmaz
    if (!isMatchFinished) {
      next.team1 = null;
      next.team2 = null;
      next.nation = null;
      if (next.player1) {
        next.player1 = { ...next.player1, selectedTeamId: null, selectedNationId: null };
      }
      if (next.player2) {
        next.player2 = { ...next.player2, selectedTeamId: null, selectedNationId: null };
      }
    }
  }

  return { state: next, foulsApplied, isMatchFinished };
}
