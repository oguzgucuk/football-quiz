/**
 * Test: Aynı Oyun Oturumunda Takım ve Milletlerin Tekrarını Engelleme Doğrulaması
 */

import assert from "assert";
import {
  createInitialRoomState,
  RoomState,
} from "../lib/realtime/roomState";
import {
  registerTeamPick,
  registerNationPick,
  prepareAnsweringPhase,
  prepareNextRound,
} from "../lib/realtime/roomEngine";
import { pickBotTeam, pickBotNation } from "../lib/realtime/botSimulator";
import { Team, Nation } from "../types/game";
import { POPULAR_NATIONS } from "../lib/data/nations";

const mockTeams: Team[] = [
  { id: "tm_real_madrid", name: "Real Madrid", country: "Spain", league: "La Liga" },
  { id: "tm_barcelona", name: "Barcelona", country: "Spain", league: "La Liga" },
  { id: "tm_arsenal", name: "Arsenal", country: "England", league: "Premier League" },
  { id: "tm_chelsea", name: "Chelsea", country: "England", league: "Premier League" },
  { id: "tm_fenerbahce", name: "Fenerbahçe", country: "Turkey", league: "Süper Lig" },
  { id: "tm_galatasaray", name: "Galatasaray", country: "Turkey", league: "Süper Lig" },
];

async function runTests() {
  console.log("============================================================");
  console.log("🔒 TEST: MAÇ OTURUMUNDA KULLANILMIŞ TAKIM VE MİLLET KİLİDİ");
  console.log("============================================================\n");

  // TEST 1: Takım vs Takım Modu
  console.log("--- TEST 1: Takım vs Takım Oturum Boyu Tekillik ---");
  let state = createInitialRoomState("test_room_tvt");
  state.player1 = { userId: "p1", username: "Oyuncu 1", score: 0, isReady: true };
  state.player2 = { userId: "p2", username: "Oyuncu 2", score: 0, isReady: true };

  assert.deepStrictEqual(state.usedTeamIds, [], "Başlangıçta usedTeamIds boş olmalı");
  assert.deepStrictEqual(state.usedNationIds, [], "Başlangıçta usedNationIds boş olmalı");

  // Tur 1: P1 Real Madrid seçer
  const p1Pick1 = registerTeamPick(state, "p1", mockTeams[0]);
  assert(!p1Pick1.rejected, "P1 Real Madrid seçebilmeli");
  state = p1Pick1.state;

  // Tur 1: P2 de aynı takımı (Real Madrid) seçer -> Kabul edilmeli!
  const p2SamePick = registerTeamPick(state, "p2", mockTeams[0]);
  assert(!p2SamePick.rejected, "Aynı turda iki oyuncu da aynı takımı seçebilmeli");
  assert.strictEqual(p2SamePick.bothPicked, true, "İki oyuncu da seçtiğinde bothPicked true olmalı");
  state = p2SamePick.state;
  console.log("✅ Aynı turda iki oyuncunun da aynı takımı seçebilmesi başarıyla doğrulandı");

  // Tur 1: Cevaplama fazına geçiş -> usedTeamIds listesine kilitlenmeli
  const ansPhase1 = prepareAnsweringPhase(state, mockTeams);
  state = ansPhase1.state;
  assert(state.usedTeamIds.includes("tm_real_madrid"), "Real Madrid usedTeamIds'e eklenmeli");
  assert.strictEqual(state.usedTeamIds.length, 1, "Aynı takım seçildiğinde usedTeamIds'de mükerrer olmamalı (tek kayıt)");
  console.log("✅ 1. Turda seçilen kulüp kilitlendi:", state.usedTeamIds);

  // Tur 2'ye geçiş
  const nextRound1 = prepareNextRound(state, 5);
  state = nextRound1.state;
  assert.strictEqual(state.currentRound, 2, "Tur 2'ye geçildi");
  assert(state.usedTeamIds.includes("tm_real_madrid"), "Tur 2'de usedTeamIds korunmalı");

  // Tur 2: P1 tekrar Real Madrid seçmeye çalışır -> Reddedilmeli
  const p1Repeat = registerTeamPick(state, "p1", mockTeams[0]);
  assert(p1Repeat.rejected === true, "Önceki turda seçilen Real Madrid tekrar seçilememeli");
  assert.strictEqual(p1Repeat.reason, "ALREADY_USED");
  console.log("✅ 2. Turda P1'in daha önce kullanılmış takımı seçmesi engellendi (ALREADY_USED)");

  // Tur 2: P2 tekrar Real Madrid'i seçmeye çalışır -> Reddedilmeli
  const p2Repeat = registerTeamPick(state, "p2", mockTeams[0]);
  assert(p2Repeat.rejected === true, "Önceki turda seçilen Real Madrid P2 için de tekrar seçilememeli");
  assert.strictEqual(p2Repeat.reason, "ALREADY_USED");
  console.log("✅ 2. Turda P2'nin daha önce kullanılmış takımı seçmesi engellendi (ALREADY_USED)");

  // Tur 2: Yeni kulüpler seçilir (Arsenal & Chelsea)
  const p1Pick2 = registerTeamPick(state, "p1", mockTeams[2]);
  const p2Pick2 = registerTeamPick(p1Pick2.state, "p2", mockTeams[3]);
  assert(!p1Pick2.rejected && !p2Pick2.rejected, "Henüz seçilmemiş takımlar başarıyla seçilebilmeli");
  state = p2Pick2.state;

  const ansPhase2 = prepareAnsweringPhase(state, mockTeams);
  state = ansPhase2.state;
  assert.strictEqual(state.usedTeamIds.length, 3, "usedTeamIds artık 3 takım içermeli (1. tur 1 tekil takım, 2. tur 2 takım)");
  console.log("✅ 2. Tur sonunda kilitli takımlar:", state.usedTeamIds);

  // TEST 2: Millet vs Takım Modu
  console.log("\n--- TEST 2: Millet vs Takım Oturum Boyu Tekillik ---");
  let natState = createInitialRoomState("test_room_country_vs_team_123");
  natState.player1 = { userId: "p1", username: "Oyuncu 1", score: 0, isReady: true };
  natState.player2 = { userId: "p2", username: "Oyuncu 2", score: 0, isReady: true };
  natState.currentNationPickerUserId = "p1";
  natState.currentTeamPickerUserId = "p2";

  const argNation = POPULAR_NATIONS.find((n) => n.id === "argentina")!;
  const brNation = POPULAR_NATIONS.find((n) => n.id === "brazil")!;

  // 1. Tur: P1 Arjantin seçer
  const natPick1 = registerNationPick(natState, "p1", argNation);
  assert(!natPick1.rejected, "Arjantin ilk seçimde kabul edilmeli");
  natState = natPick1.state;

  // P2 Fenerbahçe seçer
  const teamPick1 = registerTeamPick(natState, "p2", mockTeams[4]);
  assert(!teamPick1.rejected, "Fenerbahçe ilk seçimde kabul edilmeli");
  natState = teamPick1.state;

  const natAns1 = prepareAnsweringPhase(natState, mockTeams);
  natState = natAns1.state;
  assert(natState.usedNationIds.includes("argentina"), "Arjantin usedNationIds'e eklenmeli");
  assert(natState.usedTeamIds.includes("tm_fenerbahce"), "Fenerbahçe usedTeamIds'e eklenmeli");
  console.log("✅ 1. Turda seçilen millet ve kulüp kilitlendi:", {
    nations: natState.usedNationIds,
    teams: natState.usedTeamIds,
  });

  // 2. Tur: Roller değişir (P2 millet, P1 kulüp seçer)
  const natNext1 = prepareNextRound(natState, 5);
  natState = natNext1.state;
  assert.strictEqual(natState.currentNationPickerUserId, "p2");
  assert.strictEqual(natState.currentTeamPickerUserId, "p1");

  // 2. Tur: P2 Arjantin'i tekrar seçmeye çalışır -> Reddedilmeli
  const natRepeat = registerNationPick(natState, "p2", argNation);
  assert(natRepeat.rejected === true, "Daha önce seçilen Arjantin tekrar seçilememeli");
  assert.strictEqual(natRepeat.reason, "ALREADY_USED");
  console.log("✅ 2. Turda daha önce seçilen Arjantin engellendi (ALREADY_USED)");

  // P2 Brezilya seçer -> Kabul edilmeli
  const natPick2 = registerNationPick(natState, "p2", brNation);
  assert(!natPick2.rejected, "Brezilya başarıyla seçilebilmeli");
  natState = natPick2.state;

  // P1 daha önce seçilen Fenerbahçe'yi seçmeye çalışır -> Reddedilmeli
  const teamRepeat = registerTeamPick(natState, "p1", mockTeams[4]);
  assert(teamRepeat.rejected === true, "Daha önce seçilen Fenerbahçe tekrar seçilememeli");
  assert.strictEqual(teamRepeat.reason, "ALREADY_USED");
  console.log("✅ 2. Turda daha önce seçilen Fenerbahçe engellendi (ALREADY_USED)");

  // TEST 3: Bot ve Rastgele Zaman Aşımı Havuz Filtrelemesi
  console.log("\n--- TEST 3: Bot ve Rastgele Seçim Havuz Filtrelemesi ---");
  const excludedTeamIds = ["tm_real_madrid", "tm_barcelona", "tm_arsenal", "tm_chelsea"];
  for (let i = 0; i < 20; i++) {
    const botPicked = pickBotTeam(mockTeams, excludedTeamIds);
    assert(
      !excludedTeamIds.includes(botPicked.id),
      `Bot asla kilitli takımı seçmemeli (Seçilen: ${botPicked.name})`
    );
  }
  console.log("✅ Bot 20 iterasyonda kilitli hiçbir takımı seçmedi");

  const excludedNations = ["argentina", "brazil", "france", "germany"];
  for (let i = 0; i < 20; i++) {
    const botNat = pickBotNation(POPULAR_NATIONS, excludedNations);
    assert(
      !excludedNations.includes(botNat.id),
      `Bot asla kilitli milleti seçmemeli (Seçilen: ${botNat.name})`
    );
  }
  console.log("✅ Bot 20 iterasyonda kilitli hiçbir milleti seçmedi");

  console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
}

runTests().catch((err) => {
  console.error("❌ Test Başarısız Oldu:", err);
  process.exit(1);
});
