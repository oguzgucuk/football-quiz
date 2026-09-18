/**
 * Müzayede Modu Motoru Test ve Doğrulama Scripti.
 * Havuz oluşturma, mevki cezaları, hat güçleri, maç simülasyonu ve lig puan durumunu test eder.
 */

import { generateAuctionPool } from "../lib/auction/generateAuctionPool";
import { calculateSlotRating, calculateLineupPowers } from "../lib/auction/positionSuitability";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { simulateMatch } from "../lib/auction/simulateMatch";
import { generateLeagueFixtures, simulateEntireTournament } from "../lib/auction/auctionTournament";
import { AuctionPlayerCard, TeamLineup, AuctionRoomState } from "../lib/auction/auctionTypes";
import { startAuctionStage, applyBid, advanceAuctionCard, finishSoldCelebration } from "../lib/auction/auctionRoomEngine";

async function runTests() {
  console.log("==========================================");
  console.log("🧪 1. HAVUZ OLUŞTURMA TESTİ (generateAuctionPool)");
  console.log("==========================================");

  const pool = await generateAuctionPool({
    playerCount: 2,
    ratingMin: 70,
    ratingMax: 99,
  });

  console.log(`✅ 2 Kişilik Havuz Boyutu: ${pool.length} (Beklenen: 28)`);
  if (pool.length !== 28) throw new Error("Havuz boyutu 28 olmalıydı!");

  const gks = pool.filter((p) => p.positions.includes("GK"));
  console.log(`✅ Kaleci Sayısı: ${gks.length} (En az 4 olmalı - kişi başı 2 kaleci)`);
  if (gks.length < 4) throw new Error("Yetersiz kaleci!");

  const diamonds = pool.filter((p) => p.overallPrime >= 90);
  console.log(`✅ Elmas Oyuncu Sayısı (90+): ${diamonds.length} / ${pool.length} (Kişi başı 3 elmas -> Beklenen: 6 adet)`);
  if (diamonds.length !== 6) throw new Error(`2 kişilik odada tam 6 elmas olmalıydı! (Çıkan: ${diamonds.length})`);

  console.log("Örnek Havuz Oyuncuları:");
  pool.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.fullName} (${p.overallPrime} OVR) - [${p.positions.join(", ")}]`);
  });

  console.log("\n==========================================");
  console.log("🧪 2. MEVKİ CEZALARI & HAT GÜÇLERİ TESTİ");
  console.log("==========================================");

  const ronaldo: AuctionPlayerCard = {
    id: "cr7",
    fullName: "Cristiano Ronaldo",
    overallPrime: 96,
    positions: ["LW", "ST", "RW"],
  };

  const natural = calculateSlotRating(ronaldo, "ST");
  console.log(`✅ ST slotunda Ronaldo: ${natural.effectiveRating} OVR (Ceza: ${natural.penalty}) - Beklenen: 96, Ceza: 0`);
  if (natural.effectiveRating !== 96 || natural.penalty !== 0) throw new Error("Doğal mevki hatası!");

  const near = calculateSlotRating(ronaldo, "CAM");
  console.log(`✅ CAM slotunda Ronaldo (uzak mevki): ${near.effectiveRating} OVR (Ceza: ${near.penalty}) - Beklenen: 76, Ceza: 20`);
  if (near.effectiveRating !== 76 || near.penalty !== 20) throw new Error("Uzak mevki hatası!");

  const gkSlot = calculateSlotRating(ronaldo, "GK");
  console.log(`✅ GK slotunda Ronaldo: ${gkSlot.effectiveRating} OVR (Ceza: ${gkSlot.penalty}) - Beklenen: 40!`);
  if (gkSlot.effectiveRating !== 40) throw new Error("Kaleci cezası hatası!");

  console.log("\n==========================================");
  console.log("🧪 3. 15 POZİSYONLUK MAÇ SİMÜLASYONU TESTİ");
  console.log("==========================================");

  // Sahte iki takım dizilişi kuralım (4-3-3)
  const createMockLineup = (userId: string, baseOvr: number): TeamLineup => {
    const slots = createInitialSlotsForFormation("4-3-3");
    slots.forEach((s) => {
      s.placedPlayer = {
        id: `p_${s.slotId}`,
        fullName: `Oyuncu ${s.slotId}`,
        overallPrime: baseOvr,
        positions: [s.targetPosition],
      };
      s.effectiveRating = baseOvr;
    });
    return calculateLineupPowers(userId, "4-3-3", slots);
  };

  const teamA = createMockLineup("user_a", 88);
  const teamB = createMockLineup("user_b", 80);

  console.log(`Takım A OVR: ${teamA.teamOvr}`);
  console.log(`Takım B OVR: ${teamB.teamOvr}`);

  const match = simulateMatch("m1", teamA, "Galatasaray", teamB, "Fenerbahçe");
  console.log(`\n🏆 Maç Sonucu: Galatasaray ${match.homeScore} - ${match.awayScore} Fenerbahçe`);
  console.log(`Toplam Olay Sayısı: ${match.events.length}`);
  console.log("Örnek Maç Olayları:");
  match.events.slice(0, 5).forEach((e) => {
    console.log(`  [${e.minute}'] (${e.type.toUpperCase()}) ${e.description}`);
  });

  const samples = Array.from({ length: 100 }, (_, index) =>
    simulateMatch(`sample_${index}`, teamA, "Galatasaray", teamB, "Fenerbahçe")
  );
  const homeWins = samples.filter((result) => result.winnerUserId === teamA.userId).length;
  const awayWins = samples.filter((result) => result.winnerUserId === teamB.userId).length;
  const draws = samples.length - homeWins - awayWins;
  console.log(`100 maçlık dağılım: güçlü takım ${homeWins} galibiyet, zayıf takım ${awayWins} galibiyet, ${draws} beraberlik.`);

  console.log("\n==========================================");
  console.log("🧪 4. LİG FİKSTÜRÜ VE PUAN DURUMU TESTİ (3 Oyuncu)");
  console.log("==========================================");

  const fixtures = generateLeagueFixtures(["user1", "user2", "user3"]);
  console.log(`✅ Fikstür Maç Sayısı: ${fixtures.length} (Beklenen: 3)`);
  fixtures.forEach((f, i) => console.log(`  Maç ${i + 1}: ${f.homeUserId} vs ${f.awayUserId}`));

  const lineups = {
    user1: createMockLineup("user1", 90),
    user2: createMockLineup("user2", 84),
    user3: createMockLineup("user3", 78),
  };

  const participants = {
    user1: { userId: "user1", username: "Ahmet", budget: 30, squad: [], isReady: true, isHost: true },
    user2: { userId: "user2", username: "Mehmet", budget: 30, squad: [], isReady: true, isHost: false },
    user3: { userId: "user3", username: "Ali", budget: 30, squad: [], isReady: true, isHost: false },
  };

  const tournament = simulateEntireTournament(fixtures, lineups, participants);
  console.log("\n🏆 Turnuva Şampiyonu:", tournament.championUserId);
  console.log("Lig Puan Tablosu:");
  console.table(tournament.standings);

  console.log("\n==========================================");
  console.log("🧪 5. SON SANİYE TEKLİF & GEÇİŞ TAMPONU (COOLDOWN) TESTİ");
  console.log("==========================================");

  const testPool: AuctionPlayerCard[] = [
    { id: "messi", fullName: "Lionel Messi", overallPrime: 95, positions: ["RW", "CAM"] },
    { id: "mbappe", fullName: "Kylian Mbappe", overallPrime: 93, positions: ["ST", "LW"] },
    { id: "courtois", fullName: "Thibaut Courtois", overallPrime: 90, positions: ["GK"] },
  ];

  let roomState: AuctionRoomState = {
    roomId: "test_room",
    status: "lobby",
    hostUserId: "user1",
    settings: {
      budget: 100,
      startingBudget: 100,
      roundDuration: 8,
      ratingMin: 75,
      ratingMax: 99,
      maxParticipants: 8,
      turnDurationSeconds: 8,
      poolPlayerCount: 22,
      tacticsDurationSeconds: 180,
    },
    participants: {
      user1: { userId: "user1", username: "Ahmet", budget: 100, squad: [], isReady: true, isHost: true },
      user2: { userId: "user2", username: "Mehmet", budget: 100, squad: [], isReady: true, isHost: false },
    },
    turnOrder: ["user1", "user2"],
    pool: testPool,
    currentCardIndex: 0,
    currentCard: null,
    currentTurnUserId: "user1",
    currentHighestBid: null,
    passedUserIds: [],
    secondsLeft: 8,
    lineups: {},
    simulationMatches: [],
    currentSimMatchIndex: 0,
    currentSimMinute: 0,
  };

  // Açık artırmayı başlat (Kart 0: Messi, Açılış: 1$)
  roomState = startAuctionStage(roomState, testPool);
  // Cooldown'ı test için sıfırla ki Messi'ye teklif verilebilsin
  roomState.bidCooldownUntil = Date.now() - 100;

  // Ahmet 21$ teklif verir
  const bidRes1 = applyBid(roomState, "user1", 21, 0, "messi");
  if (!bidRes1.success) throw new Error("Ahmet 21$ veremedi: " + bidRes1.error);
  roomState = bidRes1.state;
  console.log("✅ Kart 0 (Messi): 21$ teklif kabul edildi.");

  // Kart 0 süresi biter veya herkes pas geçer -> 2 SANİYELİK SATIŞ KUTLAMASI BAŞLAR
  roomState = advanceAuctionCard(roomState);
  console.log(`✅ Kart satıldı! 2 saniyelik kutlama başladı: isSoldCelebration=${roomState.isSoldCelebration}, Son Satılan=${roomState.lastSoldEvent?.playerName} (${roomState.lastSoldEvent?.amount}$)`);
  if (!roomState.isSoldCelebration) throw new Error("isSoldCelebration true olmalıydı!");

  // Timer veya pas mesajı aynı satışı tekrar sonuçlandırmaya çalışsa bile kadro değişmemeli.
  const squadSizeAfterSale = roomState.participants.user1.squad.length;
  const salesCountAfterSale = roomState.salesHistory?.length || 0;
  roomState = advanceAuctionCard(roomState);
  if (roomState.participants.user1.squad.length !== squadSizeAfterSale) {
    throw new Error("HATA! Satış kutlaması sırasında aynı oyuncu kadroya ikinci kez eklendi!");
  }
  if ((roomState.salesHistory?.length || 0) !== salesCountAfterSale) {
    throw new Error("HATA! Satış kutlaması sırasında aynı satış geçmişe ikinci kez yazıldı!");
  }
  console.log("✅ ÇİFT SATIŞ KORUMASI: Aynı kart ikinci kez sonuçlandırılmadı.");

  // SENARYO A: 2 saniyelik kutlama esnasında teklif verilmeye çalışıldı
  const duringCelebrationBid = applyBid(roomState, "user2", 25, 0, "messi");
  if (duringCelebrationBid.success) {
    throw new Error("HATA! 2 saniyelik kutlama esnasında teklif kabul edildi!");
  }
  console.log("✅ KORUMA 1 BAŞARILI: Satış kutlamasında teklif reddedildi ->", duringCelebrationBid.error);

  // 2 saniyelik kutlama biter, sıradaki karta geçilir
  roomState = finishSoldCelebration(roomState);
  console.log(`✅ Kart 1'e geçildi: ${roomState.currentCard?.fullName} - Mevcut Teklif: ${roomState.currentHighestBid?.amount}$`);
  if (roomState.currentCardIndex !== 1) throw new Error("Kart indeksi 1 olmalıydı!");
  if (roomState.currentHighestBid?.amount !== 1) throw new Error("Yeni kart 1$ ile başlamalıydı!");

  // SENARYO B: Eski karta (Kart 0) ait son saniye teklifi yeni kartta gecikmeli geldi
  const staleBid = applyBid(roomState, "user2", 22, 0, "messi");
  if (staleBid.success) {
    throw new Error("HATA! Eski karta ait son saniye teklifi yeni karta aktarıldı!");
  }
  console.log("✅ KORUMA 2 BAŞARILI: Önceki karta ait geç teklif reddedildi ->", staleBid.error);

  // SENARYO C: 1 saniyelik geçiş tamponu sonrasında geçerli teklif
  roomState.bidCooldownUntil = Date.now() - 50;
  const validBid = applyBid(roomState, "user2", 5, 1, "mbappe");
  if (!validBid.success) {
    throw new Error("1 saniye sonra geçerli teklif reddedildi: " + validBid.error);
  }
  console.log(`✅ KORUMA 3 BAŞARILI: Yeni kart teklifi (5$) kabul edildi. (Yeni Fiyat: ${validBid.state.currentHighestBid?.amount}$)`);

  // SENARYO D: Kaleci Kontenjanı Testi (2 Kaleciye Kadar İzin Verilir, 3. Kaleci Engellenir)
  const gkRoomState = { ...roomState };
  gkRoomState.participants.user1.squad = [
    { id: "gk1", fullName: "Kaleci 1", overallPrime: 85, positions: ["GK"] },
    { id: "gk2", fullName: "Kaleci 2", overallPrime: 82, positions: ["GK"] },
  ];
  gkRoomState.currentCardIndex = 2;
  gkRoomState.bidCooldownUntil = Date.now() - 50;
  gkRoomState.currentCard = { id: "gk3", fullName: "Kaleci 3", overallPrime: 80, positions: ["GK"] };
  gkRoomState.currentHighestBid = { amount: 1, bidderUserId: "user2", bidderUsername: "Mehmet", timestamp: Date.now(), cardIndex: 2, cardId: "gk3" };
  const thirdGkBid = applyBid(gkRoomState, "user1", 3, 2, "gk3");
  if (thirdGkBid.success) {
    throw new Error("HATA! 2 kalecisi olan oyuncuya 3. kaleci teklifi kabul edildi!");
  }
  if (!thirdGkBid.error?.includes("2 kaleciniz")) {
    throw new Error("Beklenen 2 kaleci hatası gelmedi: " + thirdGkBid.error);
  }
  console.log("✅ KORUMA 4 BAŞARILI: 3. kaleci teklifi engellendi ->", thirdGkBid.error);

  console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test Hatası:", err);
    process.exit(1);
  });
