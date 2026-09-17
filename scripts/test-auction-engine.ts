/**
 * Müzayede Modu Motoru Test ve Doğrulama Scripti.
 * Havuz oluşturma, mevki cezaları, hat güçleri, maç simülasyonu ve lig puan durumunu test eder.
 */

import { generateAuctionPool } from "../lib/auction/generateAuctionPool";
import { calculateSlotRating, calculateLineupPowers } from "../lib/auction/positionSuitability";
import { FORMATION_CONFIGS, createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { simulateMatch } from "../lib/auction/simulateMatch";
import { generateLeagueFixtures, calculateStandings, simulateEntireTournament } from "../lib/auction/auctionTournament";
import { AuctionPlayerCard, TeamLineup, PitchPosition, AuctionRoomState } from "../lib/auction/auctionTypes";
import { startAuctionStage, applyBid, advanceAuctionCard } from "../lib/auction/auctionRoomEngine";

async function runTests() {
  console.log("==========================================");
  console.log("🧪 1. HAVUZ OLUŞTURMA TESTİ (generateAuctionPool)");
  console.log("==========================================");

  const pool = await generateAuctionPool({
    playerCount: 2,
    ratingMin: 75,
    ratingMax: 99,
  });

  console.log(`✅ 2 Kişilik Havuz Boyutu: ${pool.length} (Beklenen: 22)`);
  if (pool.length !== 22) throw new Error("Havuz boyutu 22 olmalıydı!");

  const gks = pool.filter((p) => p.positions.includes("GK"));
  console.log(`✅ Kaleci Sayısı: ${gks.length} (En az 2 olmalı)`);
  if (gks.length < 2) throw new Error("Yetersiz kaleci!");

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

  // Kart 0 süresi biter veya herkes pas geçer, sıradaki karta (Mbappe) geçilir
  roomState = advanceAuctionCard(roomState);
  console.log(`✅ Kart 1'e geçildi: ${roomState.currentCard?.fullName} - Mevcut Teklif: ${roomState.currentHighestBid?.amount}$`);
  if (roomState.currentCardIndex !== 1) throw new Error("Kart indeksi 1 olmalıydı!");
  if (roomState.currentHighestBid?.amount !== 1) throw new Error("Yeni kart 1$ ile başlamalıydı!");

  // SENARYO A: Mehmet son saniyede Messi'ye (Kart 0) 22$ teklif göndermişti, ağ gecikmesiyle yeni kartta geldi
  const staleBid = applyBid(roomState, "user2", 22, 0, "messi");
  if (staleBid.success) {
    throw new Error("HATA! Eski karta ait son saniye teklifi yeni karta aktarıldı!");
  }
  console.log("✅ KORUMA 1 BAŞARILI: Önceki karta ait geç teklif reddedildi ->", staleBid.error);

  // SENARYO B: Yeni kart açılır açılmaz (cooldown süresi içinde) teklif verilmeye çalışıldı
  const cooldownBid = applyBid(roomState, "user2", 15, 1, "mbappe");
  if (cooldownBid.success) {
    throw new Error("HATA! 1 saniyelik geçiş tamponu sırasında teklif kabul edildi!");
  }
  console.log("✅ KORUMA 2 BAŞARILI: 1 saniyelik geçiş tamponu teklifi engelledi ->", cooldownBid.error);

  // SENARYO C: 1 saniye geçtikten sonra normal teklif verilir
  roomState.bidCooldownUntil = Date.now() - 50; // 1 saniye geçtiğini simüle et
  const validBid = applyBid(roomState, "user2", 5, 1, "mbappe");
  if (!validBid.success) {
    throw new Error("1 saniye sonra geçerli teklif reddedildi: " + validBid.error);
  }
  console.log(`✅ KORUMA 3 BAŞARILI: Cooldown sonrası yeni kart teklifi (5$) kabul edildi. (Yeni Fiyat: ${validBid.state.currentHighestBid?.amount}$)`);

  console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test Hatası:", err);
    process.exit(1);
  });
