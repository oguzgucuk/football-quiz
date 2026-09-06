/**
 * Faul Sistemi, Beraberlikte Tur Tekrarı ve İlk 3 Puanı Alan Kazanır Kurallarını Test Eden Script.
 * Doğrulanan Kurallar:
 * 1. Süre boyunca takım seçilmezse faul verilir (1, 2, 3 faul).
 * 2. 3 faul yapıldığında fauller sıfırlanır ve rakibe +1 ceza puanı verilir.
 * 3. İki oyuncu da bilemezse (süre doldu) veya pas geçerse tur berabere biter ve tur yeniden başlar (round numarası artmaz).
 * 4. İlk 3 puana ulaşan maçı kazanır (ister normal cevapla, ister rakibin faul cezasıyla).
 */

import { createInitialRoomState, RoomState } from "../lib/realtime/roomState";
import {
  assignPlayerToRoom,
  registerTeamPick,
  checkSelectionTimeoutsAndApplyFouls,
  prepareAnsweringPhase,
  recordRoundTimeout,
  evaluatePassVote,
  evaluateAnswerSubmission,
  prepareNextRound,
} from "../lib/realtime/roomEngine";
import { Team } from "../types/game";

const REAL_MADRID: Team = { id: "real_madrid", name: "Real Madrid" };
const BARCELONA: Team = { id: "barcelona", name: "FC Barcelona" };
const ARSENAL: Team = { id: "arsenal", name: "Arsenal" };
const CHELSEA: Team = { id: "chelsea", name: "Chelsea" };

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ BAŞARISIZ: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ BAŞARILI: ${message}`);
  }
}

async function runTests() {
  console.log("=== FUTBOL QUIZ: FAUL, TUR TEKRARI & 3 PUAN KURALI TESTLERİ ===\n");

  // TEST 1: Faul Sistemi (1, 2, 3 Faul ve Rakibe +1 Ceza Puanı)
  console.log("--- TEST 1: Takım Seçiminde Faul Sistemi ---");
  let room = createInitialRoomState("test_room_1");
  room = assignPlayerToRoom(room, { userId: "p1", username: "Ahmet" }).state;
  room = assignPlayerToRoom(room, { userId: "p2", username: "Mehmet" }).state;
  room.status = "in_round";
  room.roundStatus = "picking_teams";

  // Mehmet Barcelona'yı seçti, Ahmet hiç seçmedi
  room = registerTeamPick(room, "p2", BARCELONA).state;
  assert(room.team2?.id === "barcelona", "P2 Barcelona'yı seçti");
  assert(!room.team1, "P1 seçim yapmadı");

  // Süre bitti -> checkSelectionTimeoutsAndApplyFouls çağrılır
  let foulResult = checkSelectionTimeoutsAndApplyFouls(room);
  room = foulResult.state;
  assert(room.player1?.fouls === 1, "P1 ilk faulünü aldı (1/3)");
  assert(room.player2?.fouls === 0, "P2 zamanında seçtiği için faul almadı (0/3)");
  assert(room.player2?.score === 0, "Henüz 3 faul olmadığı için ceza puanı verilmedi");
  assert(foulResult.foulsApplied.length === 1, "1 adet faul olayı üretildi");

  // Otomatik takım seçilmediğini ve cevaplama aşamasına geçilmediğini doğrula
  const noAutoAns = prepareAnsweringPhase(room);
  assert(noAutoAns.state.roundStatus === "picking_teams", "Otomatik takım seçilmedi, answering aşamasına geçilmedi");
  assert(noAutoAns.state.team1 === null, "P1 için sahte/otomatik takım atanmadı (seçim null kaldı)");

  // 2. Turda P1 yine seçmedi
  room.team1 = null;
  room.team2 = null;
  room = registerTeamPick(room, "p2", ARSENAL).state;
  foulResult = checkSelectionTimeoutsAndApplyFouls(room);
  room = foulResult.state;
  assert(room.player1?.fouls === 2, "P1 ikinci faulünü aldı (2/3)");
  assert(room.player2?.score === 0, "P2 skoru hala 0");

  // 3. Turda P1 üçüncü kez seçmedi -> 3 Faul!
  room.team1 = null;
  room.team2 = null;
  room = registerTeamPick(room, "p2", CHELSEA).state;
  foulResult = checkSelectionTimeoutsAndApplyFouls(room);
  room = foulResult.state;
  assert(room.player1?.fouls === 0, "P1 3 faule ulaştıktan sonra faul sayacı 0'a sıfırlandı");
  assert(room.player2?.score === 1, "P1 3 faul yaptığı için rakip P2'ye +1 ceza puanı verildi!");
  assert(foulResult.foulsApplied[0].penaltyAwarded === true, "Ceza puanı bayrağı true oldu");
  console.log("");

  // TEST 2: Beraberlik / Süre Dolması Durumunda Turun Yeniden Başlaması (Replay)
  console.log("--- TEST 2: Bilememe / Süre Dolması Durumunda Tur Tekrarı ---");
  let room2 = createInitialRoomState("test_room_2");
  room2 = assignPlayerToRoom(room2, { userId: "p1", username: "Ahmet" }).state;
  room2 = assignPlayerToRoom(room2, { userId: "p2", username: "Mehmet" }).state;
  room2.currentRound = 2;
  room2.roundStatus = "answering";
  room2.team1 = REAL_MADRID;
  room2.team2 = BARCELONA;

  // Answering süresi doldu (kimse bilemedi)
  const timeoutRes = recordRoundTimeout(room2);
  room2 = timeoutRes.state;
  assert(room2.roundStatus === "round_finished", "Tur bitti");
  assert(room2.lastRoundWasDraw === true, "lastRoundWasDraw bayrağı true oldu");

  // scheduleNextRound -> prepareNextRound çağrılır
  const nextRoundRes = prepareNextRound(room2);
  room2 = nextRoundRes.state;
  assert(nextRoundRes.isReplay === true, "isReplay bayrağı true döndü");
  assert(room2.currentRound === 2, "Tur numarası artmadı (Tur 2 tekrar oynanacak!)");
  assert(room2.roundStatus === "picking_teams", "Yeniden takım seçme aşamasına dönüldü");
  assert(room2.team1 === null && room2.team2 === null, "Seçimler sıfırlandı");
  console.log("");

  // TEST 3: Karşılıklı Pas Geçildiğinde Turun Yeniden Başlaması
  console.log("--- TEST 3: Karşılıklı Pas Geçildiğinde Tur Tekrarı ---");
  let room3 = createInitialRoomState("test_room_3");
  room3 = assignPlayerToRoom(room3, { userId: "p1", username: "Ahmet" }).state;
  room3 = assignPlayerToRoom(room3, { userId: "p2", username: "Mehmet" }).state;
  room3.player1!.score = 1;
  room3.player2!.score = 1;
  room3.currentRound = 3;
  room3.roundStatus = "answering";

  // Her iki oyuncu da pas verdi
  let passRes = evaluatePassVote(room3, "p1");
  assert(!passRes.bothPassed, "Sadece P1 pas verdiğinde henüz tur bitmedi");
  passRes = evaluatePassVote(passRes.state, "p2");
  assert(passRes.bothPassed, "Her iki oyuncu da pas verdiğinde tur berabere kapandı");
  assert(passRes.state.lastRoundWasDraw === true, "lastRoundWasDraw bayrağı true");

  const replayAfterPass = prepareNextRound(passRes.state);
  assert(replayAfterPass.isReplay === true, "Pas sonrası tur tekrarı tetiklendi");
  assert(replayAfterPass.state.currentRound === 3, "Tur 3 olarak kaldı (artmadı)");
  console.log("");

  // TEST 4: İlk 3 Puanı Alan Kazanır (Doğru Cevapla)
  console.log("--- TEST 4: İlk 3 Puanı Alan Kazanır (Doğru Cevapla) ---");
  let room4 = createInitialRoomState("test_room_4");
  room4 = assignPlayerToRoom(room4, { userId: "p1", username: "Ahmet" }).state;
  room4 = assignPlayerToRoom(room4, { userId: "p2", username: "Mehmet" }).state;
  room4.player1!.score = 2;
  room4.player2!.score = 1;
  room4.currentRound = 4;
  room4.roundStatus = "answering";

  // P1 doğru cevap verdi ve 3. puanını aldı
  const answerOutcome = evaluateAnswerSubmission(room4, "p1", { isCorrect: true, playerName: "Ronaldo" });
  room4 = answerOutcome.state;
  assert(room4.player1?.score === 3, "P1 skoru 3'e yükseldi");

  const finishRes = prepareNextRound(room4);
  assert(finishRes.isMatchFinished === true, "3 puana ulaşıldığı için isMatchFinished true oldu");
  assert(finishRes.state.status === "match_finished", "Maç durumu match_finished oldu");
  console.log("");

  // TEST 5: İlk 3 Puanı Alan Kazanır (Faul Ceza Puanıyla)
  console.log("--- TEST 5: Faul Cezası ile 3 Puana Ulaşma ve Maçın Bitmesi ---");
  let room5 = createInitialRoomState("test_room_5");
  room5 = assignPlayerToRoom(room5, { userId: "p1", username: "Ahmet" }).state;
  room5 = assignPlayerToRoom(room5, { userId: "p2", username: "Mehmet" }).state;
  room5.player1!.fouls = 2;
  room5.player2!.score = 2;
  room5.status = "in_round";
  room5.roundStatus = "picking_teams";

  // P2 takımını seçti, P1 yine seçmedi (3. faulü olacak)
  room5 = registerTeamPick(room5, "p2", REAL_MADRID).state;
  const foulFinishRes = checkSelectionTimeoutsAndApplyFouls(room5);
  assert(foulFinishRes.state.player1?.fouls === 0, "P1 faulleri sıfırlandı");
  assert(foulFinishRes.state.player2?.score === 3, "P2 ceza puanı ile 3 puana ulaştı");
  assert(foulFinishRes.isMatchFinished === true, "Ceza puanı ile 3 puana ulaşıldığı için maç anında bitti!");
  assert(foulFinishRes.state.status === "match_finished", "Oda durumu match_finished olarak güncellendi");
  console.log("");

  console.log("🎉 BÜTÜN TESTLER BAŞARIYLA GEÇTİ! FAUL, TUR TEKRARI VE 3 PUAN KURALI EKSİKSİZ ÇALIŞIYOR.");
}

runTests();
