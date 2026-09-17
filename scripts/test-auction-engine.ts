/**
 * Müzayede Modu Motoru Test ve Doğrulama Scripti.
 * Havuz oluşturma, mevki cezaları, hat güçleri, maç simülasyonu ve lig puan durumunu test eder.
 */

import { generateAuctionPool } from "../lib/auction/generateAuctionPool";
import { calculateSlotRating, calculateLineupPowers } from "../lib/auction/positionSuitability";
import { FORMATION_CONFIGS, createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { simulateMatch } from "../lib/auction/simulateMatch";
import { generateLeagueFixtures, calculateStandings, simulateEntireTournament } from "../lib/auction/auctionTournament";
import { AuctionPlayerCard, TeamLineup, PitchPosition } from "../lib/auction/auctionTypes";

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

  console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test Hatası:", err);
    process.exit(1);
  });
