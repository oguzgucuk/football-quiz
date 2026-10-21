import assert from "assert";
import { createInitialRoomState } from "../lib/realtime/roomState";
import { prepareNextRound } from "../lib/realtime/roomRoundManager";
import { evaluateAnswerSubmission } from "../lib/realtime/roomAnswerEvaluator";
import { requestRematch, resetRoomForRematch } from "../lib/realtime/roomRematchManager";

console.log("=== 1. Test: 5 Tur Sonunda Maçın Otomatik Bitmesi (3 Puana Ulaşılmasa Bile) ===");
{
  let state = createInitialRoomState("test_room_5_rounds");
  state.player1 = { userId: "p1", username: "P1", score: 0, fouls: 0, isReady: true };
  state.player2 = { userId: "p2", username: "P2", score: 0, fouls: 0, isReady: true };
  state.status = "in_round";

  // Tur 1: P1 puan alır (1 - 0)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p1", { isCorrect: true, playerName: "Player A" }).state;
  let res1 = prepareNextRound(state, 5);
  state = res1.state;
  assert(res1.isMatchFinished === false, "Tur 1 bitti, maç bitmedi");
  assert(state.currentRound === 2, "Tur 2'ye geçildi");

  // Tur 2: P2 puan alır (1 - 1)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p2", { isCorrect: true, playerName: "Player B" }).state;
  let res2 = prepareNextRound(state, 5);
  state = res2.state;
  assert(res2.isMatchFinished === false, "Tur 2 bitti, maç bitmedi");
  assert(state.currentRound === 3, "Tur 3'e geçildi");

  // Tur 3: P1 puan alır (2 - 1)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p1", { isCorrect: true, playerName: "Player C" }).state;
  let res3 = prepareNextRound(state, 5);
  state = res3.state;
  assert(res3.isMatchFinished === false, "Tur 3 bitti, maç bitmedi");
  assert(state.currentRound === 4, "Tur 4'e geçildi");

  // Tur 4: P2 puan alır (2 - 2)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p2", { isCorrect: true, playerName: "Player D" }).state;
  let res4 = prepareNextRound(state, 5);
  state = res4.state;
  assert(res4.isMatchFinished === false, "Tur 4 bitti, maç bitmedi");
  assert(state.currentRound === 5, "Tur 5'e geçildi");

  // Tur 5: P1 puan alır (3 - 2) -> 3 puana ulaşıldı
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p1", { isCorrect: true, playerName: "Player E" }).state;
  let res5 = prepareNextRound(state, 5);
  state = res5.state;
  assert(res5.isMatchFinished === true, "5. tur sonunda maç bitti");
  assert(state.status === "match_finished", "State status 'match_finished' oldu");
  console.log("✅ 5 Tur normal akış testi başarılı!");
}

console.log("\n=== 2. Test: 5 Tur Boyunca Kimse 3 Puana Ulaşamadığında (örn: 2 - 1) Maçın Bitmesi ===");
{
  let state = createInitialRoomState("test_room_low_scores");
  state.player1 = { userId: "p1", username: "P1", score: 0, fouls: 0, isReady: true };
  state.player2 = { userId: "p2", username: "P2", score: 0, fouls: 0, isReady: true };
  state.status = "in_round";

  // Tur 1: P1 (1 - 0)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p1", { isCorrect: true, playerName: "A" }).state;
  state = prepareNextRound(state, 5).state;

  // Tur 2: P1 (2 - 0)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p1", { isCorrect: true, playerName: "B" }).state;
  state = prepareNextRound(state, 5).state;

  // Tur 3: P2 (2 - 1)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p2", { isCorrect: true, playerName: "C" }).state;
  state = prepareNextRound(state, 5).state;

  // Tur 4: Timeout/Draw (2 - 1)
  state.roundStatus = "answering";
  state.lastRoundWasDraw = true;
  state = prepareNextRound(state, 5).state;

  // Tur 4 replay: kimse alamadı, timeout yerine P2 aldı (2 - 2)
  state.roundStatus = "answering";
  state = evaluateAnswerSubmission(state, "p2", { isCorrect: true, playerName: "D" }).state;
  state = prepareNextRound(state, 5).state;
  assert(state.currentRound === 5, "Tur 5'e geçildi");

  // Tur 5: P1 doğru cevap veremedi, berabere bitti (veya timeout)
  state.roundStatus = "answering";
  // Diyelim bir oyuncu cevap verdi ama skor 2 - 1 kaldı (3'e ulaşılmadı)
  state = evaluateAnswerSubmission(state, "p1", { isCorrect: false }).state;
  // Tur normal tamamlandı (süre doldu vs)
  state.lastRoundWasDraw = false; // Tur tamamlandı
  let finishRes = prepareNextRound(state, 5);
  assert(finishRes.isMatchFinished === true, "Skor 3'e ulaşmasa bile 5 tur dolduğunda maç biter!");
  assert(finishRes.state.status === "match_finished", "Durum match_finished oldu");
  console.log("✅ Düşük skorlu 5 tur sonlanma testi başarılı!");
}

console.log("\n=== 3. Test: Millet-Takım Modunda Rövanş ve Tur Rol Değişimi ===");
{
  let state = createInitialRoomState("oda_millet_123");
  state.player1 = { userId: "p1", username: "P1", score: 3, fouls: 0, isReady: true };
  state.player2 = { userId: "p2", username: "P2", score: 1, fouls: 0, isReady: true };
  state.status = "match_finished";

  let req = requestRematch(state, "p1");
  assert(req.state.rematch?.status === "pending", "Rövanş isteği pending");

  let reset = resetRoomForRematch(req.state);
  assert(reset.status === "in_round", "Rövanş kabul edilince maç başladı");
  assert(reset.currentRound === 1, "Rövanşta Tur 1'e dönüldü");
  assert(reset.player1?.score === 0, "Skorlar sıfırlandı");
  assert(reset.gameMode === "country_vs_team", "Millet-takım modu korundu");
  console.log("✅ Millet-Takım rövanş testi başarılı!");
}

console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
