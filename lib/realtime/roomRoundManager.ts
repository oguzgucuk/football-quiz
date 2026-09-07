/**
 * Realtime Tur Yaşam Döngüsü Yöneticisi (Room Round Manager).
 * Cevaplama fazına geçiş, zaman aşımı ve karşılıklı pas oylamaları
 * ve sonraki tura geçiş / tur tekrarı kurallarını yürütür.
 */

import { RoomState } from "./roomState";
import { CompletedRoundData } from "../db/matches";
import { DEFAULT_ROUND_DURATION, DEFAULT_MAX_ROUNDS } from "./roomDefaults";

/**
 * Her iki oyuncu da seçimini tamamladığında cevaplama aşamasını başlatır.
 */
export function prepareAnsweringPhase(
  state: RoomState
): { state: RoomState; duration: number } {
  const next: RoomState = { ...state };
  next.usedTeamIds = [...(next.usedTeamIds || [])];
  next.usedNationIds = [...(next.usedNationIds || [])];

  if (next.gameMode === "country_vs_team") {
    // Hem millet hem takım seçilmeden cevaplama aşamasına geçilemez
    if (!next.nation || !next.team1) {
      return { state: next, duration: next.roundDuration || DEFAULT_ROUND_DURATION };
    }

    if (!next.usedTeamIds.includes(next.team1.id)) {
      next.usedTeamIds.push(next.team1.id);
    }
    if (!next.usedNationIds.includes(next.nation.id)) {
      next.usedNationIds.push(next.nation.id);
    }

    next.roundStatus = "answering";
    next.roundStartTime = Date.now();
    next.passVotes = [];

    const duration = next.roundDuration || DEFAULT_ROUND_DURATION;
    return { state: next, duration };
  }

  // Takım vs Takım Modu: Her iki takım da oyuncular tarafından seçilmiş olmalı
  if (!next.team1 || !next.team2) {
    return { state: next, duration: next.roundDuration || DEFAULT_ROUND_DURATION };
  }

  if (!next.usedTeamIds.includes(next.team1.id)) {
    next.usedTeamIds.push(next.team1.id);
  }
  if (!next.usedTeamIds.includes(next.team2.id)) {
    next.usedTeamIds.push(next.team2.id);
  }

  next.roundStatus = "answering";
  next.roundStartTime = Date.now();
  next.passVotes = [];

  const duration = next.roundDuration || DEFAULT_ROUND_DURATION;
  return { state: next, duration };
}

/**
 * Süre dolduğunda turu berabere olarak kapatır ve tur kaydı oluşturur.
 */
export function recordRoundTimeout(
  state: RoomState
): { state: RoomState; completedRound: CompletedRoundData } {
  const next: RoomState = { ...state };
  next.roundStatus = "round_finished";
  next.lastRoundWasDraw = true;

  const completedRound: CompletedRoundData = {
    roundNumber: next.currentRound,
    entity1Id: next.gameMode === "country_vs_team" ? (next.nation?.id || "nation") : (next.team1?.id || ""),
    entity2Id: next.team1?.id || "",
    winnerUserId: null,
    answerGiven: "Süre Doldu",
    timeTakenMs: (next.roundDuration || DEFAULT_ROUND_DURATION) * 1000,
  };

  return { state: next, completedRound };
}

/**
 * Pas oylamasını işler. Her iki oyuncu da pas verirse tur berabere biter.
 */
export function evaluatePassVote(
  state: RoomState,
  userId: string
): {
  bothPassed: boolean;
  state: RoomState;
  completedRound?: CompletedRoundData;
} {
  const next: RoomState = { ...state };
  if (!next.passVotes.includes(userId)) {
    next.passVotes = [...next.passVotes, userId];
  }

  const p1Id = next.player1?.userId;
  const p2Id = next.player2?.userId;
  const bothPassed = Boolean(p1Id && p2Id && next.passVotes.includes(p1Id) && next.passVotes.includes(p2Id));

  if (bothPassed) {
    next.roundStatus = "round_finished";
    next.lastRoundWasDraw = true;
    const completedRound: CompletedRoundData = {
      roundNumber: next.currentRound,
      entity1Id: next.gameMode === "country_vs_team" ? (next.nation?.id || "nation") : (next.team1?.id || ""),
      entity2Id: next.team1?.id || "",
      winnerUserId: null,
      answerGiven: "Pas Geçildi (Berabere)",
      timeTakenMs: next.roundStartTime ? Date.now() - next.roundStartTime : 0,
    };
    return { bothPassed: true, state: next, completedRound };
  }

  return { bothPassed: false, state: next };
}

/**
 * Tur bitiminde bir sonraki tura geçer veya maçı sonlandırır.
 * Kural:
 * 1. İlk 3 puana (targetScore = 3) ulaşan oyuncu maçı kazanır.
 * 2. Eğer tur berabere bittiyse (süre doldu veya karşılıklı pas), tur numarası artmaz ve tur yeniden başlar.
 */
export function prepareNextRound(
  state: RoomState,
  maxRounds = DEFAULT_MAX_ROUNDS
): { isMatchFinished: boolean; state: RoomState; isReplay: boolean } {
  const next: RoomState = { ...state };
  const targetScore = next.targetScore || 3;
  const p1Score = next.player1?.score || 0;
  const p2Score = next.player2?.score || 0;

  // 1. Kazanma kontrolü: İlk 3 puana ulaşan maçı kazanır
  if (p1Score >= targetScore || p2Score >= targetScore) {
    next.status = "match_finished";
    return { isMatchFinished: true, state: next, isReplay: false };
  }

  // 2. Beraberlik/Pas kontrolü: Tur berabere bittiyse tur tekrarlanır
  const isReplay = Boolean(next.lastRoundWasDraw);
  next.isReplayRound = isReplay;
  if (!isReplay) {
    next.currentRound += 1;
  }

  next.roundStatus = "picking_teams";
  next.team1 = null;
  next.team2 = null;
  next.nation = null;
  next.usedTeamIds = [...(state.usedTeamIds || [])];
  next.usedNationIds = [...(state.usedNationIds || [])];
  next.passVotes = [];
  next.roundStartTime = null;
  next.lastRoundWasDraw = false;
  next.lastFoulEvent = null;

  if (next.player1) {
    next.player1 = { ...next.player1, selectedTeamId: null, selectedNationId: null };
  }
  if (next.player2) {
    next.player2 = { ...next.player2, selectedTeamId: null, selectedNationId: null };
  }

  // Millet-Takım modunda roller her tur takas edilir (Role Alternation)
  if (next.gameMode === "country_vs_team") {
    const prevNationPicker = state.currentNationPickerUserId;
    const prevTeamPicker = state.currentTeamPickerUserId;
    next.currentNationPickerUserId = prevTeamPicker;
    next.currentTeamPickerUserId = prevNationPicker;
  }

  return { isMatchFinished: false, state: next, isReplay };
}
