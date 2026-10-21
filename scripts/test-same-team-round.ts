import assert from "assert";
import {
  createInitialRoomState,
} from "../lib/realtime/roomState";
import {
  registerTeamPick,
  prepareAnsweringPhase,
  evaluateAnswerSubmission,
} from "../lib/realtime/roomEngine";
import { Team } from "../types/game";

async function testSameTeamRound() {
  console.log("=== TEST: İKİ OYUNCU AYNI TAKIMI SEÇTİĞİNDE OYUN AKIŞI ===");

  let state = createInitialRoomState("room_same_team_test");
  state.player1 = { userId: "p1", username: "Oyuncu 1", score: 0, isReady: true };
  state.player2 = { userId: "p2", username: "Oyuncu 2", score: 0, isReady: true };
  state.status = "in_round";
  state.roundStatus = "picking_teams";

  const realMadrid: Team = {
    id: "tm_real_madrid",
    name: "Real Madrid",
    country: "Spain",
    league: "La Liga",
  };

  // 1. Her iki oyuncu da Real Madrid seçer
  const p1Pick = registerTeamPick(state, "p1", realMadrid);
  assert(!p1Pick.rejected, "P1 Real Madrid seçebilmeli");
  state = p1Pick.state;

  const p2Pick = registerTeamPick(state, "p2", realMadrid);
  assert(!p2Pick.rejected, "P2 de Real Madrid seçebilmeli");
  assert.strictEqual(p2Pick.bothPicked, true, "İkisi de seçince bothPicked true olmalı");
  state = p2Pick.state;

  // 2. Cevaplama fazına geçiş
  const ansPhase = prepareAnsweringPhase(state);
  state = ansPhase.state;
  assert.strictEqual(state.roundStatus, "answering", "Cevaplama fazına geçilmeli");
  assert.strictEqual(state.team1?.id, state.team2?.id, "İki takım da aynı olmalı");
  console.log("✅ İki oyuncunun da aynı takımı seçmesiyle cevaplama aşaması başladı.");

  // 3. İlk doğru cevabı yazan oyuncu (P1) puanı alır
  const answerResult = evaluateAnswerSubmission(
    state,
    "p1",
    { isCorrect: true, playerName: "Cristiano Ronaldo" },
    2500
  );

  assert(answerResult.accepted, "Cevap kabul edilmeli");
  assert(answerResult.isCorrect, "Cevap doğru olmalı");
  assert.strictEqual(answerResult.winnerUserId, "p1", "Kazanan p1 olmalı");
  assert.strictEqual(answerResult.state.player1?.score, 1, "P1 skoru 1 artmalı");
  assert.strictEqual(answerResult.state.player2?.score, 0, "P2 skoru değişmemeli");
  assert.strictEqual(answerResult.state.roundStatus, "round_finished", "Tur tamamlanmalı");

  console.log("✅ O takımdan ilk doğru futbolcuyu yazan oyuncu (P1) puanı kazandı ve tur bitti!");
  console.log("🎉 Test başarıyla tamamlandı.");
}

testSameTeamRound().catch((err) => {
  console.error("❌ Test hatası:", err);
  process.exit(1);
});
