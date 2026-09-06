import { createInitialAuctionState, startAuctionStage, applyBid, advanceAuctionCard } from "../lib/auction/auctionRoomEngine";
import { AuctionPlayerCard } from "../lib/auction/auctionTypes";

async function testSoldEvent() {
  console.log("=== Testing Auction Sold Event & Position Grouping ===");

  const dummyCard: AuctionPlayerCard = {
    id: "gk_1",
    fullName: "Manuel Neuer",
    overallPrime: 90,
    positions: ["GK"],
  };

  const dummyCard2: AuctionPlayerCard = {
    id: "fwd_1",
    fullName: "Erling Haaland",
    overallPrime: 91,
    positions: ["ST"],
  };

  let state = createInitialAuctionState("test_room", "u1", "Oğuz");
  state.settings.startingBudget = 100;
  state.participants["u2"] = {
    userId: "u2",
    username: "Ahmet",
    budget: 100,
    isReady: true,
    squad: [],
  };

  state = startAuctionStage(state, [dummyCard, dummyCard2]);

  console.log("Initial state status:", state.status);
  console.log("Initial card:", state.currentCard?.fullName);

  // u2 bids $25M
  const bidRes = applyBid(state, "u2", 25);
  if (!bidRes.success) throw new Error("Bid failed: " + bidRes.error);
  state = bidRes.state;

  // Advance auction card (sold to u2)
  state = advanceAuctionCard(state);

  console.log("Sold Event:", state.lastSoldEvent);
  if (!state.lastSoldEvent) throw new Error("lastSoldEvent should be defined!");
  if (state.lastSoldEvent.playerName !== "Manuel Neuer") throw new Error("Wrong player name!");
  if (state.lastSoldEvent.buyerUserId !== "u2") throw new Error("Wrong buyer id!");
  if (state.lastSoldEvent.buyerUsername !== "Ahmet") throw new Error("Wrong buyer username!");
  if (state.lastSoldEvent.amount !== 25) throw new Error("Wrong amount!");
  if (state.lastSoldEvent.overall !== 90) throw new Error("Wrong overall!");

  console.log("u2 squad length:", state.participants["u2"].squad.length);
  console.log("u2 remaining budget:", state.participants["u2"].budget);
  if (state.participants["u2"].budget !== 75) throw new Error("Budget deduction failed!");

  // Position categorization check
  const testSquad: AuctionPlayerCard[] = [
    { id: "1", fullName: "Manuel Neuer", overallPrime: 90, positions: ["GK"] },
    { id: "2", fullName: "Virgil van Dijk", overallPrime: 89, positions: ["CB"] },
    { id: "3", fullName: "Luka Modric", overallPrime: 88, positions: ["CM"] },
    { id: "4", fullName: "Erling Haaland", overallPrime: 91, positions: ["ST"] },
  ];

  const squadWithoutGk: AuctionPlayerCard[] = [
    { id: "2", fullName: "Virgil van Dijk", overallPrime: 89, positions: ["CB"] },
    { id: "3", fullName: "Luka Modric", overallPrime: 88, positions: ["CM"] },
    { id: "4", fullName: "Erling Haaland", overallPrime: 91, positions: ["ST"] },
  ];

  const categorize = (squad: AuctionPlayerCard[]) => {
    const gk: AuctionPlayerCard[] = [];
    const def: AuctionPlayerCard[] = [];
    const mid: AuctionPlayerCard[] = [];
    const fwd: AuctionPlayerCard[] = [];
    for (const player of squad) {
      const positions = (player.positions?.length > 0 ? player.positions : [player.primaryPosition || "CM"]).map((p) => p.toUpperCase());
      if (positions.includes("GK") || positions.some((p) => p === "KL" || p.includes("GOALKEEPER"))) {
        gk.push(player);
      } else if (positions.some((p) => ["CB", "LB", "RB", "LWB", "RWB", "DEF"].includes(p))) {
        def.push(player);
      } else if (positions.some((p) => ["CDM", "CM", "CAM", "LM", "RM", "MID"].includes(p))) {
        mid.push(player);
      } else {
        fwd.push(player);
      }
    }
    return { gk, def, mid, fwd };
  };

  const group1 = categorize(testSquad);
  if (group1.gk.length !== 1 || group1.def.length !== 1 || group1.mid.length !== 1 || group1.fwd.length !== 1) {
    throw new Error("Categorization count mismatch!");
  }

  const groupNoGk = categorize(squadWithoutGk);
  if (groupNoGk.gk.length !== 0) throw new Error("GK count should be 0!");
  console.log("Empty GK check:", groupNoGk.gk.length === 0 ? "⚠️ Kaleci Yok" : "Var");

  console.log("✅ Sold Event & Position Grouping Tests All Passed!");
}

testSoldEvent().catch((err) => {
  console.error("❌ Test Failed:", err);
  process.exit(1);
});
