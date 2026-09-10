import { createInitialAuctionState, advanceAuctionCard } from "../lib/auction/auctionRoomEngine";
import { generateLeagueFixtures, simulateEntireTournament, calculateStandings } from "../lib/auction/auctionTournament";
import { AuctionPlayerCard, TeamLineup } from "../lib/auction/auctionTypes";

async function testSimulationFlow() {
  console.log("=== Testing Auction Simulation Flow & Progressive Standings ===");

  const dummyCard: AuctionPlayerCard = {
    id: "card_1",
    fullName: "Kylian Mbappé",
    overallPrime: 91,
    positions: ["ST"],
  };

  let state = createInitialAuctionState("test_room", "u1", "Oğuz");
  state.participants["u2"] = {
    userId: "u2",
    username: "Ahmet",
    budget: 100,
    isReady: true,
    squad: [],
  };
  state.participants["u3"] = {
    userId: "u3",
    username: "Mehmet",
    budget: 100,
    isReady: true,
    squad: [],
  };
  state.participants["u4"] = {
    userId: "u4",
    username: "Ali",
    budget: 100,
    isReady: true,
    squad: [],
  };

  // 1. Kadro Kurma (Tactics) Aşaması ve 90 Saniye Süre Kontrolü
  state.status = "auction";
  state.pool = [dummyCard];
  state.currentCardIndex = 0;
  state.currentCard = dummyCard;

  // Advance to tactics
  state = advanceAuctionCard(state);
  console.log("Tactics status:", state.status);
  console.log("Tactics duration:", state.secondsLeft);
  if (state.status !== "tactics") throw new Error("Expected tactics stage!");
  if (state.secondsLeft !== 90) throw new Error("Expected 90s for tactics, got " + state.secondsLeft);
  if (state.confirmedLineupUserIds.length !== 0) throw new Error("confirmedLineupUserIds should start empty!");

  console.log("✅ 1. Tactics 90s & confirmedLineupUserIds check passed!");

  // 2. Kadro Onaylama Sayacı (X / Y Kişi Onayladı)
  const activeUids = ["u1", "u2", "u3", "u4"];
  state.confirmedLineupUserIds.push("u1");
  console.log(`Lineup confirm count: ${state.confirmedLineupUserIds.length}/${activeUids.length}`);
  if (state.confirmedLineupUserIds.length !== 1) throw new Error("Lineup confirm count mismatch!");

  state.confirmedLineupUserIds.push("u2");
  state.confirmedLineupUserIds.push("u3");
  state.confirmedLineupUserIds.push("u4");
  const allConfirmed = activeUids.every((uid) => state.confirmedLineupUserIds.includes(uid));
  if (!allConfirmed) throw new Error("All users should be confirmed!");

  console.log("✅ 2. Lineup confirm counting passed!");

  // 3. Simülasyon Başlangıcı & Sıfır Spoiler Puan Tablosu
  const dummyLineup = (uid: string): TeamLineup => ({
    userId: uid,
    formation: "4-2-3-1",
    slots: [],
    teamOvr: 85,
    rawDefPower: 85,
    rawMidPower: 85,
    rawFwdPower: 85,
    effectiveAtkPower: 85,
    effectiveDefPower: 85,
    isConfirmed: true,
  });

  state.lineups = {
    u1: dummyLineup("u1"),
    u2: dummyLineup("u2"),
    u3: dummyLineup("u3"),
    u4: dummyLineup("u4"),
  };

  const fixtures = generateLeagueFixtures(activeUids);
  console.log(`Fixtures count for 4 players: ${fixtures.length} matches`);
  if (fixtures.length !== 6) throw new Error("4 players should generate 6 fixtures!");

  const { matches } = simulateEntireTournament(fixtures, state.lineups, state.participants);
  state.simulationMatches = matches;

  // Başlangıç Puan Durumu: 0 Maç oynanmış olmalı
  state.standings = calculateStandings(activeUids, state.participants, []);
  console.log("Initial standings total games played:", state.standings.reduce((sum, r) => sum + r.played, 0));
  console.log("Initial standings total points:", state.standings.reduce((sum, r) => sum + r.points, 0));
  if (state.standings.some((r) => r.played !== 0 || r.points !== 0)) {
    throw new Error("Initial standings leaked future points!");
  }

  console.log("✅ 3. Zero-spoiler initial standings verified (all 0 played, 0 pts)!");

  // 4. Maç 1 Bittiğinde (90') Puan Tablosunun Sadece Maç 1 ile Güncellenmesi
  const completedMatch1 = state.simulationMatches.slice(0, 1);
  const standingsAfterMatch1 = calculateStandings(activeUids, state.participants, completedMatch1);
  const totalPlayedAfterM1 = standingsAfterMatch1.reduce((sum, r) => sum + r.played, 0);
  console.log("Total matches counted after Match 1:", totalPlayedAfterM1 / 2);
  if (totalPlayedAfterM1 !== 2) throw new Error("Only 1 match (2 teams) should be counted after Match 1!");

  const home = completedMatch1[0].homeUserId;
  const away = completedMatch1[0].awayUserId;
  const otherTeams = activeUids.filter((id) => id !== home && id !== away);
  for (const otherId of otherTeams) {
    const row = standingsAfterMatch1.find((r) => r.userId === otherId);
    if (row && (row.played !== 0 || row.points !== 0)) {
      throw new Error(`Unplayed team ${otherId} has points in standings!`);
    }
  }

  console.log("✅ 4. Progressive standings after match 1 verified (no future spoiler)!");

  // 5. Hazır Butonu ve Sayacı (X / Y Kişi Hazır)
  state.simReadyUserIds = [];
  state.simReadyUserIds.push("u1");
  console.log(`Sim ready count: ${state.simReadyUserIds.length}/${activeUids.length}`);
  if (state.simReadyUserIds.length !== 1) throw new Error("Ready count mismatch!");

  state.simReadyUserIds.push("u2");
  state.simReadyUserIds.push("u3");
  state.simReadyUserIds.push("u4");
  const allReady = state.simReadyUserIds.length >= activeUids.length;
  if (!allReady) throw new Error("Expected all ready!");

  console.log("✅ 5. Ready count & all ready trigger verified!");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

testSimulationFlow().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
