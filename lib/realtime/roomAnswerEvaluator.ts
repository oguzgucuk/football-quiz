/**
 * Realtime Cevap Değerlendiricisi (Room Answer Evaluator).
 * Gönderilen cevabın doğruluğunu işler, race-condition koruması uygular
 * ve maç persistence için CompletedRoundData oluşturur.
 */

import { RoomState } from "./roomState";
import { CompletedRoundData } from "../db/matches";
import { DEFAULT_ROUND_DURATION } from "./roomDefaults";

/**
 * Gönderilen cevabı işler; doğruysa turu sonlandırır ve skor artırır (Race-condition kilitli).
 */
export function evaluateAnswerSubmission(
  state: RoomState,
  senderUserId: string,
  result: { isCorrect: boolean; playerName?: string },
  timeTakenMs?: number
): {
  accepted: boolean;
  isCorrect: boolean;
  winnerUserId?: string;
  playerName?: string;
  state: RoomState;
  completedRound?: CompletedRoundData;
} {
  if (state.roundStatus !== "answering") {
    return { accepted: false, isCorrect: false, state };
  }

  if (!result.isCorrect) {
    return { accepted: true, isCorrect: false, state };
  }

  const next: RoomState = { ...state };
  next.roundStatus = "round_finished";
  next.lastRoundWasDraw = false;

  if (next.player1?.userId === senderUserId) {
    next.player1 = { ...next.player1, score: (next.player1.score || 0) + 1 };
  } else if (next.player2?.userId === senderUserId) {
    next.player2 = { ...next.player2, score: (next.player2.score || 0) + 1 };
  }

  const duration = next.roundDuration || DEFAULT_ROUND_DURATION;
  const takenMs = timeTakenMs ?? (next.roundStartTime ? Date.now() - next.roundStartTime : duration * 1000);

  const completedRound: CompletedRoundData = {
    roundNumber: next.currentRound,
    entity1Id: next.gameMode === "country_vs_team" ? (next.nation?.id || "nation") : (next.team1?.id || ""),
    entity2Id: next.team1?.id || "",
    winnerUserId: senderUserId,
    answerGiven: result.playerName || "Doğru Cevap",
    timeTakenMs: Math.min(takenMs, duration * 1000),
  };

  return {
    accepted: true,
    isCorrect: true,
    winnerUserId: senderUserId,
    playerName: result.playerName,
    state: next,
    completedRound,
  };
}
