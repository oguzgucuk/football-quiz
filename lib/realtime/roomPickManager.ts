/**
 * Realtime Takım ve Millet Seçim Yöneticisi (Room Pick Manager).
 * Oyuncuların odaya atanması, takım ve millet seçimlerinin doğrulanması
 * ve aynı oturumda mükerrer seçimlerin engellenmesi mantığını yürütür.
 */

import { Team, Nation } from "@/types/game";
import { RoomState } from "./roomState";

/**
 * Kullanıcıyı oda oyuncusu olarak atar veya mevcut oyuncu slotunu günceller.
 */
export function assignPlayerToRoom(
  state: RoomState,
  player: { userId: string; username: string }
): { slot: "player1" | "player2" | null; state: RoomState; isRoomFull: boolean } {
  const next: RoomState = { ...state };

  if (next.player1?.userId === player.userId) {
    next.player1.username = player.username;
    next.player1.isDisconnected = false;
    return { slot: "player1", state: next, isRoomFull: Boolean(next.player2) };
  }

  if (next.player2?.userId === player.userId) {
    next.player2.username = player.username;
    next.player2.isDisconnected = false;
    return { slot: "player2", state: next, isRoomFull: Boolean(next.player1) };
  }

  if (!next.player1) {
    next.player1 = {
      userId: player.userId,
      username: player.username,
      score: 0,
      fouls: 0,
      isReady: true,
    };
    return { slot: "player1", state: next, isRoomFull: false };
  }

  if (!next.player2) {
    next.player2 = {
      userId: player.userId,
      username: player.username,
      score: 0,
      fouls: 0,
      isReady: true,
    };
    next.status = "in_round";

    // Millet-Takım modunda ilk tur için adil ve rastgele (50/50) rol dağıtımı
    if (next.gameMode === "country_vs_team" && !next.initialNationPickerUserId) {
      const startWithP1 = Math.random() < 0.5;
      next.initialNationPickerUserId = startWithP1 ? next.player1.userId : player.userId;
      next.currentNationPickerUserId = next.initialNationPickerUserId;
      next.currentTeamPickerUserId = startWithP1 ? player.userId : next.player1.userId;
    }

    return { slot: "player2", state: next, isRoomFull: true };
  }

  return { slot: null, state: next, isRoomFull: true };
}

/**
 * Oyuncu için takım seçimi kaydeder.
 * Oturum boyunca daha önce seçilmiş takımların tekrar seçilmesini engeller.
 */
export function registerTeamPick(
  state: RoomState,
  userId: string,
  team: Team
): { state: RoomState; bothPicked: boolean; rejected?: boolean; reason?: string } {
  const next: RoomState = { ...state };
  if (!team || !team.id) {
    return {
      state: next,
      bothPicked: false,
      rejected: true,
      reason: "INVALID_TEAM",
    };
  }
  next.usedTeamIds = [...(next.usedTeamIds || [])];
  next.usedNationIds = [...(next.usedNationIds || [])];

  // 1. Oturum boyu kontrol: Daha önce bu maç oturumunda seçildiyse reddet
  if (next.usedTeamIds.includes(team.id)) {
    return {
      state: next,
      bothPicked: Boolean(next.gameMode === "country_vs_team" ? (next.nation && next.team1) : (next.team1 && next.team2)),
      rejected: true,
      reason: "ALREADY_USED",
    };
  }

  if (next.gameMode === "country_vs_team") {
    if (next.currentTeamPickerUserId === userId) {
      next.team1 = team;
      if (next.player1?.userId === userId) next.player1 = { ...next.player1, selectedTeamId: team.id };
      if (next.player2?.userId === userId) next.player2 = { ...next.player2, selectedTeamId: team.id };
    }
    const bothPicked = Boolean(next.nation && next.team1);
    return { state: next, bothPicked };
  }

  // 2. Takım vs Takım modunda kontrol: Aynı turda diğer oyuncu aynı takımı seçtiyse reddet
  if (next.player1?.userId === userId) {
    if (next.team2 && next.team2.id === team.id) {
      return {
        state: next,
        bothPicked: Boolean(next.team1 && next.team2),
        rejected: true,
        reason: "OPPONENT_CHOSE_SAME",
      };
    }
    next.team1 = team;
    next.player1 = { ...next.player1, selectedTeamId: team.id };
  } else if (next.player2?.userId === userId) {
    if (next.team1 && next.team1.id === team.id) {
      return {
        state: next,
        bothPicked: Boolean(next.team1 && next.team2),
        rejected: true,
        reason: "OPPONENT_CHOSE_SAME",
      };
    }
    next.team2 = team;
    next.player2 = { ...next.player2, selectedTeamId: team.id };
  }

  const bothPicked = Boolean(next.team1 && next.team2);
  return { state: next, bothPicked };
}

/**
 * Oyuncu için millet seçimi kaydeder (Millet-Takım modu).
 * Oturum boyunca daha önce seçilmiş milletlerin tekrar seçilmesini engeller.
 */
export function registerNationPick(
  state: RoomState,
  userId: string,
  nation: Nation
): { state: RoomState; bothPicked: boolean; rejected?: boolean; reason?: string } {
  const next: RoomState = { ...state };
  if (!nation || !nation.id) {
    return {
      state: next,
      bothPicked: false,
      rejected: true,
      reason: "INVALID_NATION",
    };
  }
  next.usedTeamIds = [...(next.usedTeamIds || [])];
  next.usedNationIds = [...(next.usedNationIds || [])];

  // Oturum boyu kontrol: Daha önce bu maç oturumunda seçildiyse reddet
  if (next.usedNationIds.includes(nation.id)) {
    return {
      state: next,
      bothPicked: Boolean(next.nation && next.team1),
      rejected: true,
      reason: "ALREADY_USED",
    };
  }

  if (next.gameMode === "country_vs_team") {
    if (next.currentNationPickerUserId === userId) {
      next.nation = nation;
      if (next.player1?.userId === userId) next.player1 = { ...next.player1, selectedNationId: nation.id };
      if (next.player2?.userId === userId) next.player2 = { ...next.player2, selectedNationId: nation.id };
    }
  }

  const bothPicked = Boolean(next.nation && next.team1);
  return { state: next, bothPicked };
}
