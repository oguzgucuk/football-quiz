import {
  createInitialAuctionState,
  startAuctionStage,
  applyBid,
  advanceAuctionCard,
  isGoalkeeper,
} from "../lib/auction/auctionRoomEngine";
import { AuctionPlayerCard } from "../lib/auction/auctionTypes";

console.log("=== 1. IS_GOALKEEPER KONTROLLERİ ===");
console.log("positions: ['GK'] ->", isGoalkeeper({ positions: ["GK"] }));
console.log("primaryPosition: 'Goalkeeper', positions: [] ->", isGoalkeeper({ primaryPosition: "Goalkeeper", positions: [] }));
console.log("position: 'Goalkeeper', positions: [] ->", isGoalkeeper({ position: "Goalkeeper", positions: [] } as any));
console.log("positions: ['Kaleci'] ->", isGoalkeeper({ positions: ["Kaleci"] }));
console.log("primaryPosition: 'ST', positions: ['ST', 'CF'] ->", isGoalkeeper({ primaryPosition: "ST", positions: ["ST", "CF"] }));

console.log("\n=== 2. MÜZAYEDE AKIŞI: 1 KALECİSİ OLAN OYUNCUYA KALECİ DENK GELMEMELİ ===");

const gk1: AuctionPlayerCard = {
  id: "gk-1",
  fullName: "Manuel Neuer",
  overallPrime: 90,
  positions: ["GK"],
  primaryPosition: "GK",
};

const gk2: AuctionPlayerCard = {
  id: "gk-2",
  fullName: "Thibaut Courtois",
  overallPrime: 89,
  positions: [],
  primaryPosition: "Goalkeeper",
};

const gk3: AuctionPlayerCard = {
  id: "gk-3",
  fullName: "Ederson",
  overallPrime: 88,
  positions: ["GK"],
  primaryPosition: "GK",
};

const gk4: AuctionPlayerCard = {
  id: "gk-4",
  fullName: "Alisson",
  overallPrime: 89,
  positions: ["GK"],
  primaryPosition: "GK",
};

const fwd1: AuctionPlayerCard = {
  id: "fwd-1",
  fullName: "Kylian Mbappe",
  overallPrime: 91,
  positions: ["ST"],
  primaryPosition: "ST",
};

const mid1: AuctionPlayerCard = {
  id: "mid-1",
  fullName: "Luka Modric",
  overallPrime: 88,
  positions: ["CM"],
  primaryPosition: "CM",
};

let state = createInitialAuctionState("test-room", "user1", "User 1");
state.participants["user2"] = {
  userId: "user2",
  username: "User 2",
  budget: 30,
  squad: [],
  isReady: true,
  isHost: false,
};
state.turnOrder = ["user1", "user2"];

// Havuz: gk1, gk2, gk3, gk4, fwd1, mid1
const pool = [gk1, gk2, gk3, gk4, fwd1, mid1];
state = startAuctionStage(state, pool);

console.log("Turn 0 (gk1):", state.currentCard?.fullName, "| Açılış Teklifçisi:", state.currentTurnUserId);
state = advanceAuctionCard(state);
console.log("User 1 kadrosu:", state.participants.user1.squad.map((p) => p.fullName));

console.log("Turn 1 (gk2):", state.currentCard?.fullName, "| Açılış Teklifçisi:", state.currentTurnUserId);
state = advanceAuctionCard(state);
console.log("User 2 kadrosu:", state.participants.user2.squad.map((p) => p.fullName));

console.log("\n-> Her iki oyuncunun da kalecisi oldu. Sırada ardışık 2 kaleci (gk3 Ederson, gk4 Alisson) var:");
console.log("Turn 2 (Otomatik Atlanmalı):");
console.log("Beklenen Kart: Kylian Mbappe (Kaleciler atlandı)");
console.log("Gerçekte Gelen Kart:", state.currentCard?.fullName);
console.log("Açılış Teklifçisi:", state.currentTurnUserId);
console.log("Teklif Durumu:", state.currentHighestBid?.amount, "$ veren:", state.currentHighestBid?.bidderUsername);

const turn2CardName = state.currentCard?.fullName;

console.log("\n=== 3. MANUEL TEKLİF KORUMASI ===");
// user1 Kylian Mbappe'ye teklif verebilir mi?
const validBid = applyBid(state, "user1", 2, state.currentCardIndex, state.currentCard?.id);
console.log("User 1 Mbappe'ye 2$ teklif verebildi mi?", validBid.success);

// User 1 sahte bir kaleciye teklif vermeye çalışırsa engelleniyor mu?
state.currentCard = gk3; // geçici olarak kaleci yaptık
const invalidGkBid = applyBid(state, "user1", 5, state.currentCardIndex, gk3.id);
console.log("User 1 kalecisi varken başka kaleciye teklif verebildi mi?", invalidGkBid.success, "| Hata mesajı:", invalidGkBid.error);

if (turn2CardName === "Kylian Mbappe" && !invalidGkBid.success && validBid.success) {
  console.log("\n🎉 TÜM KALECİ KORUMA TESTLERİ BAŞARIYLA GEÇTİ!");
} else {
  console.error("\n❌ HATA: Kaleci testi başarısız!");
  process.exit(1);
}
