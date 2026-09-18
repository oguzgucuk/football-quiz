import assert from "node:assert/strict";
import { matchMinuteAt, matchStartAtMinute, MATCH_DURATION_MS } from "../lib/auction/matchClock";
import { calculateRatingTiers, generateAuctionPool } from "../lib/auction/generateAuctionPool";
import { prisma } from "../lib/db/client";
import { selectMatchHighlights } from "../lib/auction/matchHighlights";
import { MatchEvent } from "../lib/auction/auctionTypes";

const start = 1_000_000;
for (let minute = 0; minute <= 90; minute++) {
  assert.equal(matchMinuteAt(start, start + minute * 1000), minute);
  assert.equal(matchStartAtMinute(minute, start + minute * 1000), start);
}
assert.equal(MATCH_DURATION_MS, 90_000);
assert.equal(matchMinuteAt(start, start - 1000), 0);
assert.equal(matchMinuteAt(start, start + 100_000), 90);
assert.equal(matchMinuteAt(start, start + 1999), 1);
for (const players of [5, 6, 7]) {
  const tiers = calculateRatingTiers(70, 99, players * 14);
  assert.equal(tiers.find(t => t.min === 90)?.targetCount, players * 3);
  assert.equal(tiers.reduce((sum, t) => sum + t.targetCount, 0), players * 14);
  assert.ok(players * 3 >= Math.round(players * 14 * 0.11) + 3);
}
const events: MatchEvent[] = [
  { minute: 3, type: "turnover", teamUserId: "a", description: "Pas arası" },
  { minute: 5, type: "attack_start", phase: "chance_creation", teamUserId: "a", description: "Tehlikeli hücum" },
  { minute: 6, type: "corner", teamUserId: "a", description: "Korner" },
  { minute: 6, type: "chance", phase: "loose_ball", zone: "penalty_area", teamUserId: "a", description: "İkinci şans" },
  { minute: 7, type: "goal", teamUserId: "a", description: "Gol" },
];
assert.deepEqual(selectMatchHighlights(events, 6), events.slice(1, 4));
assert.deepEqual(selectMatchHighlights(events, 90), events.slice(1));
console.log("✓ Clock, meaningful highlights, and 5/6/7-player diamond quotas passed");

async function checkLivePools() {
  try {
    for (const playerCount of [5, 6, 7]) {
      const pool = await generateAuctionPool({ playerCount, ratingMin: 70, ratingMax: 99 });
      const diamonds = pool.filter(p => p.overallPrime >= 90).length;
      assert.equal(pool.length, playerCount * 14);
      assert.equal(new Set(pool.map(p => p.id)).size, pool.length);
      assert.equal(diamonds, playerCount * 3);
      console.log(`✓ ${playerCount} players: ${pool.length} unique cards, ${diamonds} diamonds`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
if (process.argv.includes("--pool")) {
  checkLivePools().catch(error => { console.error(error); process.exitCode = 1; });
}
