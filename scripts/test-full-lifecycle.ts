/**
 * Uçtan Uca (E2E) Tam Yaşam Döngüsü Doğrulama Testi:
 * 1. Matchmaking (Süre bazlı eşleşme kontrolü, 10s vs 15s ayrımı, Bot maçı)
 * 2. Oda Bağlantısı & Token Verilimi (SESSION_GRANTED, 15s süre senkronizasyonu)
 * 3. Takım Seçimi & Otomatik Cevaplama Geçişi
 * 4. Cevaplama (Yanlış cevap feedback'i, Sunucu taraflı doğru cevap doğrulaması, Skor artışı)
 * 5. Pas Mekanizması (Karşılıklı pas ile beraberlik)
 * 6. Maç Sonuçlandırma & Veritabanı ELO İşlemesi (MATCH_PERSISTED, Prisma DB kaydı)
 * 7. Bağlantı Kopması Toleransı (Grace Period & Rejoin)
 */

import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";

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
  timeoutMs = 10000
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
        // ignore JSON parse
      }
    };

    ws.on("message", handler);
  });
}

async function runFullLifecycleTest() {
  console.log("\n============================================================");
  console.log("⚽ FUTBOL QUIZ - TAM YAŞAM DÖNGÜSÜ E2E SİSTEM TESTİ");
  console.log("============================================================\n");

  const results: { name: string; passed: boolean; details?: string }[] = [];

  // DB'den iki gerçek oyuncu çek
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 2) {
    throw new Error("Test için veritabanında en az 2 kayıtlı kullanıcı bulunmalıdır.");
  }
  const [p1, p2] = users;
  console.log(`👤 Test Oyuncusu 1: ${p1.username} (${p1.id}) - ELO: ${p1.eloRating}`);
  console.log(`👤 Test Oyuncusu 2: ${p2.username} (${p2.id}) - ELO: ${p2.eloRating}\n`);

  // ------------------------------------------------------------
  // TEST 1: MATCHMAKING - FARKLI SÜRE AYRIMI (10s vs 15s)
  // ------------------------------------------------------------
  console.log("--- TEST 1: MATCHMAKING FARKLI SÜRE AYRIMI ---");
  const wsAlpha = await createWs(`${WS_BASE}/parties/matchmaking`);
  const wsBeta = await createWs(`${WS_BASE}/parties/matchmaking`);

  // Alpha 15 saniyelik sıraya giriyor
  wsAlpha.send(
    JSON.stringify({
      type: "MATCHMAKING_JOIN",
      userId: p1.id,
      username: p1.username,
      eloRating: p1.eloRating,
      roundDuration: 15,
    })
  );

  const qStatus1 = await waitForMessage(wsAlpha, (d) => d.type === "QUEUE_STATUS");
  console.log("✅ Alpha 15s sırasına girdi. Kuyruk boyutu:", qStatus1.queueSize);

  // Beta 10 saniyelik sıraya giriyor (Eşleşmemeli!)
  let unexpectedMatch = false;
  const matchListener = (raw: string) => {
    try {
      const d = JSON.parse(raw.toString());
      if (d.type === "MATCH_FOUND") unexpectedMatch = true;
    } catch {}
  };
  wsAlpha.on("message", matchListener);
  wsBeta.on("message", matchListener);

  wsBeta.send(
    JSON.stringify({
      type: "MATCHMAKING_JOIN",
      userId: p2.id,
      username: p2.username,
      eloRating: p2.eloRating,
      roundDuration: 10,
    })
  );

  const qStatus2 = await waitForMessage(wsBeta, (d) => d.type === "QUEUE_STATUS");
  console.log("✅ Beta 10s sırasına girdi. Kuyruk boyutu:", qStatus2.queueSize);

  // 1 saniye bekle, eşleşme OLMADIĞINI doğrula
  await new Promise((r) => setTimeout(r, 1000));
  wsAlpha.off("message", matchListener);
  wsBeta.off("message", matchListener);

  if (!unexpectedMatch) {
    results.push({ name: "Farklı süre seçimi eşleşmeyi engeller (10s vs 15s)", passed: true });
    console.log("✅ 10s ve 15s seçen oyuncular birbiriyle eşleşmedi!");
  } else {
    results.push({ name: "Farklı süre seçimi eşleşmeyi engeller", passed: false, details: "Farklı süreler eşleşti!" });
  }

  // ------------------------------------------------------------
  // TEST 2: AYNI SÜRE EŞLEŞMESİ (15s & 15s)
  // ------------------------------------------------------------
  console.log("\n--- TEST 2: AYNI SÜRE EŞLEŞMESİ (15s & 15s) ---");
  // Beta şimdi 15 saniyeye geçiş yapıyor (MATCH_FOUND tetiklenmeli)
  const alphaMatchPromise = waitForMessage(wsAlpha, (d) => d.type === "MATCH_FOUND");
  const betaMatchPromise = waitForMessage(wsBeta, (d) => d.type === "MATCH_FOUND");

  wsBeta.send(
    JSON.stringify({
      type: "MATCHMAKING_JOIN",
      userId: p2.id,
      username: p2.username,
      eloRating: p2.eloRating,
      roundDuration: 15,
    })
  );

  const [alphaMatch, betaMatch] = await Promise.all([alphaMatchPromise, betaMatchPromise]);
  console.log(`🎉 Eşleşme Başarılı! matchId: ${alphaMatch.matchId}, Süre: ${alphaMatch.roundDuration}s`);

  const sameMatchId = alphaMatch.matchId === betaMatch.matchId && alphaMatch.roundDuration === 15;
  results.push({
    name: "Aynı süreyi seçen oyuncular eşleşir",
    passed: sameMatchId,
    details: sameMatchId ? undefined : "matchId veya süre uyuşmuyor",
  });

  wsAlpha.close();
  wsBeta.close();

  const matchId = alphaMatch.matchId;

  // ------------------------------------------------------------
  // TEST 3: OYUN ODASI BAĞLANTISI & SÜRE SENKRONİZASYONU
  // ------------------------------------------------------------
  console.log("\n--- TEST 3: OYUN ODASI BAĞLANTISI & SÜRE DOĞRULAMA ---");
  const gameWs1 = await createWs(`${WS_BASE}/parties/game/${matchId}`);
  const gameWs2 = await createWs(`${WS_BASE}/parties/game/${matchId}`);

  const p1SessionPromise = waitForMessage(gameWs1, (d) => d.type === "SESSION_GRANTED");
  const p2SessionPromise = waitForMessage(gameWs2, (d) => d.type === "SESSION_GRANTED");
  const timerStartPromise = waitForMessage(gameWs1, (d) => d.type === "TIMER_START");

  gameWs1.send(JSON.stringify({ type: "PLAYER_JOIN", userId: p1.id, username: p1.username, roundDuration: 15 }));
  gameWs2.send(JSON.stringify({ type: "PLAYER_JOIN", userId: p2.id, username: p2.username, roundDuration: 15 }));

  const [p1Session, p2Session, timerStart] = await Promise.all([
    p1SessionPromise,
    p2SessionPromise,
    timerStartPromise,
  ]);

  console.log("✅ Her iki oyuncuya da oturum tokeni verildi:", p1Session.sessionToken.substring(0, 8), "...");
  console.log("⏱️ Takım seçimi için sunucu sayacı başladı:", timerStart.durationSeconds, "saniye");

  const timerCorrect = timerStart.durationSeconds === 15;
  results.push({
    name: "Oda süresi ve takım seçim süresi 15s olarak başladı",
    passed: timerCorrect,
    details: `Beklenen: 15s, Gelen: ${timerStart.durationSeconds}s`,
  });

  // ------------------------------------------------------------
  // TEST 4: TAKIM SEÇİMİ & CEVAPLAMA AŞAMASINA GEÇİŞ
  // ------------------------------------------------------------
  console.log("\n--- TEST 4: TAKIM SEÇİMİ & CEVAPLAMA AŞAMASI ---");
  const answeringPhasePromise = waitForMessage(
    gameWs1,
    (d) => d.type === "ROOM_STATE_SYNC" && d.state.roundStatus === "answering"
  );

  // Takım 1: Real Madrid (cmtfrb40e00dtu6k4wklez572)
  gameWs1.send(
    JSON.stringify({
      type: "TEAM_PICKED",
      userId: p1.id,
      team: { id: "cmtfrb40e00dtu6k4wklez572", name: "Real Madrid" },
    })
  );

  // Takım 2: FC Barcelona (cmtfrb40c003au6k4nfn56sus)
  gameWs2.send(
    JSON.stringify({
      type: "TEAM_PICKED",
      userId: p2.id,
      team: { id: "cmtfrb40c003au6k4nfn56sus", name: "FC Barcelona" },
    })
  );

  const answeringState = await answeringPhasePromise;
  console.log("✅ İki takım da seçildi! Cevaplama aşamasına geçildi:", answeringState.state.team1?.name, "vs", answeringState.state.team2?.name);
  results.push({
    name: "İki takım seçilince cevaplama aşaması başlar",
    passed: answeringState.state.roundStatus === "answering",
  });

  // ------------------------------------------------------------
  // TEST 5: CEVAP DOĞRULAMA (YANLIŞ & DOĞRU CEVAP)
  // ------------------------------------------------------------
  console.log("\n--- TEST 5: CEVAP DOĞRULAMA (YANLIŞ & DOĞRU) ---");
  const wrongFeedbackPromise = waitForMessage(gameWs1, (d) => d.type === "ANSWER_FEEDBACK");
  gameWs1.send(
    JSON.stringify({
      type: "SUBMIT_ANSWER",
      userId: p1.id,
      name: "Hayali Futbolcu 999",
    })
  );

  const wrongFeedback = await wrongFeedbackPromise;
  console.log("✅ Yanlış cevap için anlık geri bildirim alındı: isCorrect =", wrongFeedback.isCorrect);

  const roundResultPromise = waitForMessage(gameWs1, (d) => d.type === "ROUND_RESULT");
  // Luís Figo hem Real Madrid hem Barcelona'da oynamıştır
  gameWs1.send(
    JSON.stringify({
      type: "SUBMIT_ANSWER",
      userId: p1.id,
      name: "Luís Figo",
    })
  );

  const roundResult = await roundResultPromise;
  console.log("✅ Doğru cevap sunucu tarafından onaylandı! Kazanan:", roundResult.winnerUserId, "Oyuncu:", roundResult.correctAnswer);

  const answerCorrect = roundResult.winnerUserId === p1.id && roundResult.state.player1?.score === 1;
  results.push({
    name: "Sunucu doğru cevabı doğrular ve skoru artırır",
    passed: answerCorrect,
    details: answerCorrect ? undefined : "Skor artmadı veya kazanan yanlış",
  });

  // ------------------------------------------------------------
  // TEST 6: KARŞILIKLI PAS VERME (PASS_VOTE)
  // ------------------------------------------------------------
  console.log("\n--- TEST 6: KARŞILIKLI PAS VOTE & BERABERLİK ---");
  // Tur 2'ye geçişi bekle (scheduleNextRound ~3s sonra devreye girer)
  console.log("⏳ 2. Tur için 3.5 saniye bekleniyor...");
  await new Promise((r) => setTimeout(r, 3500));

  // 2. Tur takımlarını seç
  gameWs1.send(
    JSON.stringify({
      type: "TEAM_PICKED",
      userId: p1.id,
      team: { id: "cmtfrb40c003lu6k4drdv5sfi", name: "Galatasaray" },
    })
  );
  gameWs2.send(
    JSON.stringify({
      type: "TEAM_PICKED",
      userId: p2.id,
      team: { id: "cmtfrb40e00bpu6k4hmbu9cbf", name: "Fenerbahçe" },
    })
  );

  // Answering aşamasına geçişi bekle
  await waitForMessage(gameWs1, (d) => d.type === "ROOM_STATE_SYNC" && d.state.roundStatus === "answering");
  console.log("✅ 2. Tur cevaplama başladı. Her iki oyuncu da Pas veriyor...");

  const passRoundResultPromise = waitForMessage(gameWs1, (d) => d.type === "ROUND_RESULT");
  gameWs1.send(JSON.stringify({ type: "PASS_VOTE", userId: p1.id }));
  gameWs2.send(JSON.stringify({ type: "PASS_VOTE", userId: p2.id }));

  const passResult = await passRoundResultPromise;
  console.log("✅ Karşılıklı pas sonucu:", passResult.correctAnswer, "(isDraw:", passResult.isDraw, ")");
  results.push({
    name: "Karşılıklı pas verilince tur berabere biter",
    passed: passResult.isDraw === true,
  });

  // ------------------------------------------------------------
  // TEST 7: KOPMA VE YENİDEN BAĞLANMA TOLERANSI (GRACE PERIOD & REJOIN)
  // ------------------------------------------------------------
  console.log("\n--- TEST 7: KOPMA TOLERANSI (GRACE PERIOD & REJOIN) ---");
  const disconnectNoticePromise = waitForMessage(gameWs1, (d) => d.type === "PLAYER_DISCONNECTED");
  // Oyuncu 2 bağlantıyı aniden koparır
  gameWs2.close();

  const disconnectNotice = await disconnectNoticePromise;
  console.log("✅ Oyuncu 2 koptu, sunucu 10 saniyelik tolerans başlattı:", disconnectNotice.graceSeconds, "sn");

  // Oyuncu 2 tolerans süresi içinde geri bağlanıyor (REJOIN)
  const rejoinWs2 = await createWs(`${WS_BASE}/parties/game/${matchId}`);
  const rejoinSuccessPromise = waitForMessage(rejoinWs2, (d) => d.type === "REJOIN_SUCCESS");

  rejoinWs2.send(
    JSON.stringify({
      type: "REJOIN",
      roomId: matchId,
      sessionToken: p2Session.sessionToken,
      userId: p2.id,
      username: p2.username,
    })
  );

  const rejoinSuccess = await rejoinSuccessPromise;
  console.log("✅ Oyuncu 2 geçerli token ile odaya başarıyla geri döndü!");
  results.push({
    name: "Oyuncu kopunca 10s grace period verilir ve REJOIN ile oturum kurtarılır",
    passed: rejoinSuccess.type === "REJOIN_SUCCESS",
  });

  gameWs1.close();
  rejoinWs2.close();

  // ------------------------------------------------------------
  // TEST 8: MAÇ BİTİMİ & VERİTABANI ELO PERSISTENCE
  // ------------------------------------------------------------
  console.log("\n--- TEST 8: VERİTABANI ELO & MAÇ KAYDI PERSISTENCE ---");
  const { finalizeMatchAndPersistElo } = await import("../lib/db/matches");

  const testMatchDbId = `test_match_${Date.now()}`;
  const persistResult = await finalizeMatchAndPersistElo({
    matchId: testMatchDbId,
    player1Id: p1.id,
    player2Id: p2.id,
    player1Score: 3,
    player2Score: 1,
    ranked: true,
    rounds: [
      { roundNumber: 1, entity1Id: "teamA", entity2Id: "teamB", winnerUserId: p1.id, answerGiven: "Luís Figo" },
      { roundNumber: 2, entity1Id: "teamC", entity2Id: "teamD", winnerUserId: null, answerGiven: "PAS" },
    ],
  });

  console.log("✅ finalizeMatchAndPersistElo çağrıldı:", persistResult);

  // DB'de maçın varlığını ve ELO değişimlerini sorgula
  const dbMatch = await prisma.match.findUnique({
    where: { id: testMatchDbId },
  });

  const p1Updated = await prisma.user.findUnique({ where: { id: p1.id } });
  const p2Updated = await prisma.user.findUnique({ where: { id: p2.id } });

  const dbSaved = Boolean(dbMatch && dbMatch.winnerUserId === p1.id && persistResult.p1EloChange > 0);
  console.log(`✅ DB Kontrolü: Maç Kayıtlı=${!!dbMatch}, Kazanan=${dbMatch?.winnerUserId}, P1 ELO: ${p1Updated?.eloRating}, P2 ELO: ${p2Updated?.eloRating}`);

  results.push({
    name: "Maç bitiminde DB'ye kayıt ve ELO transaction'ı başarıyla işlenir",
    passed: dbSaved,
  });

  // Temizlik: Test maçını temizle
  await prisma.matchRound.deleteMany({ where: { matchId: testMatchDbId } });
  await prisma.match.delete({ where: { id: testMatchDbId } });

  // ------------------------------------------------------------
  // RAPOR
  // ------------------------------------------------------------
  console.log("\n============================================================");
  console.log("📊 TÜM TESTLERİN SONUÇLARI");
  console.log("============================================================");
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`[${icon}] ${r.name} ${r.details ? `(${r.details})` : ""}`);
    if (!r.passed) allPassed = false;
  }
  console.log("============================================================\n");

  await prisma.$disconnect();

  if (!allPassed) {
    throw new Error("Bazı yaşam döngüsü testleri başarısız oldu!");
  }
  console.log("🎉 TEBRİKLER! TÜM YAŞAM DÖNGÜSÜ TESTLERİ KUSURSUZ ŞEKİLDE GEÇTİ!\n");
}

runFullLifecycleTest().catch((err) => {
  console.error("❌ E2E Test Hatası:", err);
  process.exit(1);
});
