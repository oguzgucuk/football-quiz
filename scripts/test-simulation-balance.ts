import { simulateMatch } from "../lib/auction/simulateMatch";
import { TeamLineup } from "../lib/auction/auctionTypes";

function createMockLineup(userId: string, atk: number, mid: number, def: number, gk: number): TeamLineup {
  return {
    userId,
    formation: "4-3-3",
    teamOvr: Math.round((atk + mid + def + gk) / 4),
    rawDefPower: def,
    rawMidPower: mid,
    rawFwdPower: atk,
    effectiveAtkPower: atk,
    effectiveDefPower: def,
    isConfirmed: true,
    slots: [
      { targetPosition: "GK", effectiveRating: gk, placedPlayer: { id: "p1", fullName: "Kaleci " + userId, overallPrime: gk, positions: ["GK"] } },
      { targetPosition: "ST", effectiveRating: atk, placedPlayer: { id: "p2", fullName: "Yildiz Forvet " + userId, overallPrime: atk, positions: ["ST"] } },
      { targetPosition: "CM", effectiveRating: mid, placedPlayer: { id: "p3", fullName: "Orta Saha " + userId, overallPrime: mid, positions: ["CM"] } },
      { targetPosition: "CB", effectiveRating: def, placedPlayer: { id: "p4", fullName: "Stoper " + userId, overallPrime: def, positions: ["CB"] } }
    ]
  };
}

console.log("=== TEST 1: Süper Takım (95 Atk, 95 Mid, 90 Def) vs Zayıf Takım (50 Atk, 50 Mid, 50 Def) ===");
let blowouts = 0;
let totalHome = 0, totalAway = 0;
for (let i = 0; i < 20; i++) {
  const res = simulateMatch("m" + i, createMockLineup("u1", 95, 95, 90, 90), "SuperTeam", createMockLineup("u2", 50, 50, 50, 50), "WeakTeam");
  if (res.homeScore >= 4) blowouts++;
  totalHome += res.homeScore;
  totalAway += res.awayScore;
  if (i < 5) console.log("Maç " + (i + 1) + ": " + res.homeScore + " - " + res.awayScore);
}
console.log("20 maçta 4+ gol atılan hezimet sayısı: " + blowouts + " / 20");
console.log("Ortalama skor: " + (totalHome / 20).toFixed(1) + " - " + (totalAway / 20).toFixed(1));

console.log("\n=== TEST 3: Güçlü Takım (88/88/88) vs Orta Takım (72/72/72) ===");
let midTierHome = 0, midTierAway = 0;
for (let i = 0; i < 20; i++) {
  const res = simulateMatch("m" + i, createMockLineup("u1", 88, 88, 88, 88), "StrongTeam", createMockLineup("u2", 72, 72, 72, 72), "MidTeam");
  midTierHome += res.homeScore;
  midTierAway += res.awayScore;
  if (i < 5) console.log("Maç " + (i + 1) + ": " + res.homeScore + " - " + res.awayScore);
}
console.log("Ortalama skor: " + (midTierHome / 20).toFixed(1) + " - " + (midTierAway / 20).toFixed(1));

console.log("\n=== TEST 4: Derbi / Hafif Üstünlük (86/86/86) vs (82/82/82) ===");
let derbiHome = 0, derbiAway = 0;
for (let i = 0; i < 20; i++) {
  const res = simulateMatch("m" + i, createMockLineup("u1", 86, 86, 86, 86), "DerbiHome", createMockLineup("u2", 82, 82, 82, 82), "DerbiAway");
  derbiHome += res.homeScore;
  derbiAway += res.awayScore;
  if (i < 5) console.log("Maç " + (i + 1) + ": " + res.homeScore + " - " + res.awayScore);
}
console.log("Ortalama skor: " + (derbiHome / 20).toFixed(1) + " - " + (derbiAway / 20).toFixed(1));

