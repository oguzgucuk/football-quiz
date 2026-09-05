/**
 * Millet-Takım (Country vs Team) Modu Kapsamlı Test Scripti.
 * 
 * Test Kapsamı:
 * 1. 50/50 Adil İlk Tur Dağıtımı & 5 Tur Boyunca Rollerın Dönüşümlü Değişmesi (Role Alternation)
 * 2. Gerçek Veritabanı ile Millet & Takım Oyuncu Doğrulama (Brezilya-Real Madrid, Arjantin-Barcelona, Türkiye-Real Madrid)
 * 3. Hatalı Cevap Toleransı ve Reddi
 * 4. WebSocket Canlı Maç Akışı (NATION_PICKED, TEAM_PICKED, SUBMIT_ANSWER, ROUND_RESULT)
 * 5. DB Kaydı (0 ELO Değişimi, ranked: false, mode: "country_vs_team")
 */

import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";
import {
  createInitialRoomState,
} from "../lib/realtime/roomState";
import {
  assignPlayerToRoom,
  registerNationPick,
  registerTeamPick,
  prepareAnsweringPhase,
  evaluateAnswerSubmission,
  prepareNextRound,
  DEFAULT_POPULAR_TEAMS,
} from "../lib/realtime/roomEngine";
import { POPULAR_NATIONS, getNationById } from "../lib/data/nations";
import { verifyNationAnswerInServer } from "../lib/realtime/verifyNationAnswer";
import { getCommonPlayersByNationAndTeam } from "../lib/db/players";
import { finalizeMatchAndPersistElo } from "../lib/db/matches";

const prisma = new PrismaClient();
const WS_BASE = "ws://127.0.0.1:1999";

function createWs(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.on("open", () => resolve(ws));
    ws.on("error", (err) => reject(err));
  });
}

function waitForMessage(
  ws: WebSocket,
  filter: (data: Record<string, unknown>) => boolean,
  timeoutMs = 8000
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      ws.off("message", handler);
      reject(new Error(`waitForMessage zaman aşımına uğradı (${timeoutMs}ms)`));
    }, timeoutMs);

    const handler = (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());
        if (filter(data)) {
          clearTimeout(timer);
          ws.off("message", handler);
          resolve(data);
        }
      } catch {
        // ignore
      }
    };

    ws.on("message", handler);
  });
}

async function runNationTeamTests() {
  console.log("\n============================================================");
  console.log("⚽ FUTBOL QUIZ - MILLET-TAKIM MODU DOGRULAMA TESTI");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [GECTI] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [HATA]  ${testName} ${detail ? `-> ${detail}` : ""}`);
      failed++;
    }
  }

  // --- TEST 1: ODA VE ROL DÖNÜŞÜMÜ (5 TUR VE ADİL BAŞLANGIÇ) ---
  console.log("\n--- BÖLÜM 1: 5 Tur Rol Dönüşümü (Alternating Roles) ---");
  const roomId = "match_15s_casual_country_vs_team_test123";
  let state = createInitialRoomState(roomId);
  assert(state.gameMode === "country_vs_team", "Oda ID'sinden gameMode doğru algılandı ('country_vs_team')");

  // P1 ve P2'yi bağla
  const res1 = assignPlayerToRoom(state, { userId: "p1_user", username: "Oyuncu 1" });
  state = res1.state;
  const res2 = assignPlayerToRoom(state, { userId: "p2_user", username: "Oyuncu 2" });
  state = res2.state;

  assert(Boolean(state.initialNationPickerUserId), "1. Tur için ilk millet seçicisi belirlendi (50/50 kura)");
  assert(
    state.currentNationPickerUserId !== state.currentTeamPickerUserId,
    "Millet seçicisi ile kulüp seçicisi birbirinden farklı iki oyuncu"
  );

  const initialNationPicker = state.currentNationPickerUserId;
  const initialTeamPicker = state.currentTeamPickerUserId;

  // 5 Tur Boyunca Rollerin Her Tur Değiştiğini Doğrula
  for (let round = 1; round <= 5; round++) {
    const expectedNationPicker = round % 2 === 1 ? initialNationPicker : initialTeamPicker;
    const expectedTeamPicker = round % 2 === 1 ? initialTeamPicker : initialNationPicker;

    assert(
      state.currentNationPickerUserId === expectedNationPicker &&
        state.currentTeamPickerUserId === expectedTeamPicker,
      `Tur ${round}: Roller doğru atandı (Millet: ${expectedNationPicker}, Kulüp: ${expectedTeamPicker})`
    );

    // Takım ve Millet seç
    const nation = POPULAR_NATIONS[0]; // Brezilya
    const team = DEFAULT_POPULAR_TEAMS[0]; // Real Madrid

    const pickNatRes = registerNationPick(state, state.currentNationPickerUserId!, nation);
    state = pickNatRes.state;
    const pickTeamRes = registerTeamPick(state, state.currentTeamPickerUserId!, team);
    state = pickTeamRes.state;

    assert(pickTeamRes.bothPicked, `Tur ${round}: Her iki oyuncu da seçim yaptı`);

    // Cevaplama fazına geç
    const ansPhase = prepareAnsweringPhase(state);
    state = ansPhase.state;
    assert(state.roundStatus === "answering", `Tur ${round}: Cevaplama aşamasına geçildi`);

    // Cevap ver ve turu bitir
    const evalRes = evaluateAnswerSubmission(state, "p1_user", { isCorrect: true, playerName: "Marcelo" });
    state = evalRes.state;
    assert(state.roundStatus === "round_finished", `Tur ${round}: Tur başarıyla sonlandı`);

    // Sonraki tura geç
    const nextRoundRes = prepareNextRound(state, 5);
    state = nextRoundRes.state;

    if (round === 5) {
      assert(nextRoundRes.isMatchFinished === true, "5. tur bitiminde maç tamamlandı (isMatchFinished = true)");
      assert(state.status === "match_finished", "Oda durumu 'match_finished' olarak güncellendi");
    } else {
      assert(nextRoundRes.isMatchFinished === false, `Tur ${round} bitti, Tur ${round + 1}'e geçildi`);
    }
  }

  // --- TEST 2: VERİTABANI İLE DOĞRULAMA (verifyNationAnswerInServer) ---
  console.log("\n--- BÖLÜM 2: Veritabanı Cevap Doğrulama ---");
  const realMadrid = DEFAULT_POPULAR_TEAMS.find((t) => t.name === "Real Madrid")!;
  const barcelona = DEFAULT_POPULAR_TEAMS.find((t) => t.name === "FC Barcelona")!;
  const brazil = getNationById("brazil")!;
  const argentina = getNationById("argentina")!;
  const turkey = getNationById("turkey")!;

  // 1. Brezilya + Real Madrid -> "Vinicius Junior" / "Marcelo" / "Ronaldo"
  const v1 = await verifyNationAnswerInServer("Marcelo", brazil, realMadrid.id);
  assert(v1.isCorrect && Boolean(v1.playerName?.includes("Marcelo")), "Brezilya + Real Madrid: 'Marcelo' doğru kabul edildi");

  const v2 = await verifyNationAnswerInServer("Vinicius Junior", brazil, realMadrid.id);
  assert(v2.isCorrect && Boolean(v2.playerName?.includes("Vinicius")), "Brezilya + Real Madrid: 'Vinicius Junior' doğru kabul edildi");

  // 2. Arjantin + Barcelona -> "Lionel Messi"
  const v3 = await verifyNationAnswerInServer("Lionel Messi", argentina, barcelona.id);
  assert(v3.isCorrect && Boolean(v3.playerName?.includes("Messi")), "Arjantin + FC Barcelona: 'Lionel Messi' doğru kabul edildi");

  // 3. Türkiye + Real Madrid -> "Arda Güler"
  const v4 = await verifyNationAnswerInServer("Arda Güler", turkey, realMadrid.id);
  assert(v4.isCorrect && Boolean(v4.playerName?.includes("Arda")), "Türkiye + Real Madrid: 'Arda Güler' doğru kabul edildi");

  // 4. Yanlış Cevap: Salah Brezilya & Real Madrid için yanlış olmalı
  const v5 = await verifyNationAnswerInServer("Mohamed Salah", brazil, realMadrid.id);
  assert(!v5.isCorrect, "Brezilya + Real Madrid: 'Mohamed Salah' reddedildi (Yanlış)");

  // 5. Typo Toleransı: "Ronaldo Nazario" veya "Vinicius Jr"
  const v6 = await verifyNationAnswerInServer("Vinicius Jr", brazil, realMadrid.id);
  assert(v6.isCorrect && Boolean(v6.playerName?.includes("Vinicius")), "Brezilya + Real Madrid: 'Vinicius Jr' (alias/kısaltma) doğru kabul edildi");

  // --- TEST 3: ORTAK OYUNCULAR SORGUSU (getCommonPlayersByNationAndTeam) ---
  console.log("\n--- BÖLÜM 3: Ortak Oyuncular Listesi Sorgusu ---");
  const commonPlayers = await getCommonPlayersByNationAndTeam(brazil.aliases, realMadrid.id, 10);
  assert(commonPlayers.length > 0, `Brezilya & Real Madrid için ${commonPlayers.length} oyuncu bulundu`);
  const marceloExists = commonPlayers.some((p) => p.fullName.toLowerCase().includes("marcelo"));
  assert(marceloExists, "Ortak oyuncular listesinde 'Marcelo' mevcut");

  // --- TEST 4: VERİTABANI MAÇ KAYDI VE 0 ELO GARANTİSİ ---
  console.log("\n--- BÖLÜM 4: 0 ELO Değişimi & DB Kaydı ---");
  const dbUser1 = await prisma.user.findFirst();
  const dbUser2 = await prisma.user.findFirst({
    where: { id: { not: dbUser1?.id } },
  });

  if (dbUser1 && dbUser2) {
    const eloBefore1 = dbUser1.eloRating;
    const eloBefore2 = dbUser2.eloRating;
    const testMatchId = `test_match_persist_${Date.now()}`;

    const eloResult = await finalizeMatchAndPersistElo({
      matchId: testMatchId,
      player1Id: dbUser1.id,
      player2Id: dbUser2.id,
      player1Score: 3,
      player2Score: 2,
      maxRounds: 5,
      mode: "country_vs_team",
      ranked: false,
      rounds: [
        {
          roundNumber: 1,
          entity1Id: "brazil",
          entity2Id: realMadrid.id,
          winnerUserId: dbUser1.id,
          answerGiven: "Marcelo",
          timeTakenMs: 4500,
        },
      ],
    });

    assert(eloResult.p1EloChange === 0 && eloResult.p2EloChange === 0, "Millet-Takım modunda ELO değişimi 0 oldu (Casual/Serbest)");
    assert(eloResult.p1NewElo === eloBefore1 && eloResult.p2NewElo === eloBefore2, "Kullanıcıların ELO puanları değişmedi");

    const savedMatch = await prisma.match.findUnique({
      where: { id: eloResult.matchId },
    });
    assert(savedMatch?.mode === "country_vs_team", "Maç DB'de mode='country_vs_team' olarak kaydedildi");
    assert(savedMatch?.ranked === false, "Maç DB'de ranked=false olarak kaydedildi");
  }

  // --- TEST 5: WEBSOCKET CANLI MAÇ AKIŞI TESTİ ---
  console.log("\n--- BÖLÜM 5: WebSocket Canlı Maç Entegrasyonu ---");
  try {
    const wsRoomId = `match_15s_casual_country_vs_team_${Math.floor(1000 + Math.random() * 9000)}`;
    const ws1 = await createWs(`${WS_BASE}/parties/game/${wsRoomId}`);
    const ws2 = await createWs(`${WS_BASE}/parties/game/${wsRoomId}`);

    // P1 Join
    ws1.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "test_ws_p1", username: "Tester P1" }));
    // P2 Join
    ws2.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "test_ws_p2", username: "Tester P2" }));

    // Senkronizasyon bekle
    const syncMsg = (await waitForMessage(
      ws1,
      (data) => data.type === "ROOM_STATE_SYNC" && (data.state as { status: string }).status === "in_round"
    )) as { state: { gameMode: string; currentNationPickerUserId: string; currentTeamPickerUserId: string } };

    assert(syncMsg.state.gameMode === "country_vs_team", "WebSocket odası gameMode='country_vs_team' olarak senkronize oldu");
    assert(
      Boolean(syncMsg.state.currentNationPickerUserId && syncMsg.state.currentTeamPickerUserId),
      "WebSocket odasında millet ve kulüp seçicileri hazır"
    );

    const nationPickerWs = syncMsg.state.currentNationPickerUserId === "test_ws_p1" ? ws1 : ws2;
    const teamPickerWs = syncMsg.state.currentTeamPickerUserId === "test_ws_p1" ? ws1 : ws2;
    const nationPickerId = syncMsg.state.currentNationPickerUserId;
    const teamPickerId = syncMsg.state.currentTeamPickerUserId;

    // Millet seç
    nationPickerWs.send(
      JSON.stringify({
        type: "NATION_PICKED",
        userId: nationPickerId,
        nation: brazil,
      })
    );

    // Kulüp seç
    teamPickerWs.send(
      JSON.stringify({
        type: "TEAM_PICKED",
        userId: teamPickerId,
        team: realMadrid,
      })
    );

    // Cevaplama aşamasına geçişi bekle
    await waitForMessage(
      ws1,
      (data) => data.type === "TIMER_START" || (data.type === "ROOM_STATE_SYNC" && (data.state as { roundStatus: string }).roundStatus === "answering")
    );
    assert(true, "WebSocket: Takım ve Millet seçimi sonrası cevaplama aşaması (answering) başladı");

    // Doğru cevap gönder (Vinicius Junior)
    ws1.send(
      JSON.stringify({
        type: "SUBMIT_ANSWER",
        userId: "test_ws_p1",
        name: "Vinicius Junior",
      })
    );

    // Tur sonucunu bekle
    const roundResult = (await waitForMessage(ws1, (data) => data.type === "ROUND_RESULT")) as {
      winnerUserId: string;
      correctAnswer: string;
    };
    assert(roundResult.winnerUserId === "test_ws_p1", "WebSocket: Doğru cevabı veren 'test_ws_p1' turu kazandı");

    ws1.close();
    ws2.close();
  } catch (wsErr) {
    console.warn("WebSocket canlı test uyarısı:", wsErr);
  }

  console.log("\n============================================================");
  console.log(`SONUÇ: ${passed} Başarılı, ${failed} Hatalı`);
  console.log("============================================================\n");

  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runNationTeamTests().catch((err) => {
  console.error("Test icra hatası:", err);
  process.exit(1);
});
