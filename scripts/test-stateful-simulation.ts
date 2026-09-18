import assert from "node:assert/strict";
import { simulateMatch } from "../lib/auction/simulateMatch";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers } from "../lib/auction/positionSuitability";
import { calculateCorridorAttackPower, pickCorridorShooter } from "../lib/auction/corridorEngine";
import { buildCanonicalLineup } from "../lib/auction/validateLineup";
import { AuctionParticipant, FormationName, TeamLineup, TeamTactics } from "../lib/auction/auctionTypes";
import { createSeededRandom } from "../lib/auction/simulationRandom";
import { createInitialAuctionState } from "../lib/auction/auctionRoomEngine";
import { stateForAuctionViewer } from "../lib/auction/visibleAuctionState";
import { selectMatchHighlights } from "../lib/auction/matchHighlights";
import { generateLeagueSchedule, simulateSingleRoundMatches } from "../lib/auction/auctionTournament";

const DEFAULT_TACTICS: TeamTactics = {
  tempo: "balanced",
  buildUp: "balanced",
  pressing: "balanced",
  attackDirection: "balanced",
  transition: "balanced",
  chanceCreation: "balanced",
};

function createTeam(userId: string, ovr = 80, tactics: Partial<TeamTactics> = {}, formation: FormationName = "4-3-3"): TeamLineup {
  const slots = createInitialSlotsForFormation(formation);
  for (const slot of slots) {
    slot.placedPlayer = {
      id: `${userId}-${slot.slotId}`,
      fullName: `${slot.targetPosition} ${userId}`,
      overallPrime: ovr,
      positions: [slot.targetPosition],
    };
    slot.effectiveRating = ovr;
  }
  const lineup = calculateLineupPowers(userId, formation, slots);
  lineup.tactics = { ...DEFAULT_TACTICS, ...tactics };
  return lineup;
}

function batch(home: TeamLineup, away: TeamLineup, count: number) {
  let homeWins = 0, awayWins = 0, draws = 0, goals = 0;
  let counterEvents = 0, looseBallEvents = 0;
  const eventTypes = new Set<string>();
  for (let index = 0; index < count; index++) {
    const result = simulateMatch(`match-${index}`, home, "Home", away, "Away", `balance-${index}`);
    goals += result.homeScore + result.awayScore;
    assert.ok(result.events.every((event, i) => event.minute >= 1 && event.minute <= 90 &&
      (i === 0 || event.minute >= result.events[i - 1].minute)), "Olaylar üretildikleri sırada kronolojik olmalı");
    const highlights = selectMatchHighlights(result.events, 90);
    assert.equal(highlights.filter((event) => event.type === "goal").length, result.homeScore + result.awayScore, "Özet hiçbir golü gizlememeli");
    assert.ok(highlights.every((event) => event.type !== "turnover" && event.type !== "counter"), "Rutin olaylar maç özetine sızdı");
    result.events.forEach((event) => {
      eventTypes.add(event.type);
      if (event.type === "counter") counterEvents++;
      if (event.description.includes("seken top") || event.description.includes("ceza sahasında kaldı")) looseBallEvents++;
      if (event.type === "save") {
        assert.equal(event.playerName, `GK ${event.teamUserId}`, "Kaleci kurtarışı savunan takıma yazılmalı");
      }
    });
    if (result.homeScore > result.awayScore) homeWins++;
    else if (result.awayScore > result.homeScore) awayWins++;
    else draws++;
    assert.equal(result.events.filter((event) => event.type === "goal" && event.teamUserId === home.userId).length, result.homeScore);
    assert.equal(result.events.filter((event) => event.type === "goal" && event.teamUserId === away.userId).length, result.awayScore);
  }
  return {
    homeWinPct: homeWins / count * 100,
    awayWinPct: awayWins / count * 100,
    drawPct: draws / count * 100,
    goalsPerMatch: goals / count,
    counterEventsPerMatch: counterEvents / count,
    looseBallEventsPerMatch: looseBallEvents / count,
    eventTypes,
  };
}

function main() {
  for (const count of [5, 6, 7]) {
    const ids = Array.from({ length: count }, (_, i) => `user-${i}`);
    const schedule = generateLeagueSchedule(ids);
    const pairs = new Set<string>();
    for (const round of schedule) {
      const playing = round.pairings.flatMap((pair) => [pair.homeUserId, pair.awayUserId]);
      assert.equal(new Set(playing).size, playing.length, "Aynı oyuncu bir turda iki maç oynuyor");
      assert.equal(playing.length + (round.byeUserId ? 1 : 0), count, "Turda oyuncu eksik");
      for (const pair of round.pairings) {
        const key = [pair.homeUserId, pair.awayUserId].sort().join(":");
        assert.ok(!pairs.has(key), "Lig eşleşmesi tekrarlandı");
        pairs.add(key);
      }
    }
    assert.equal(pairs.size, count * (count - 1) / 2, "Herkes herkesle bir kez oynamalı");
  }
  const home = createTeam("home");
  const away = createTeam("away");

  const first = simulateMatch("deterministic", home, "Home", away, "Away", "fixed-seed");
  const replay = simulateMatch("deterministic", home, "Home", away, "Away", "fixed-seed");
  assert.deepEqual(first, replay, "Aynı seed aynı maçı üretmeli");
  assert.ok(first.events.every((event) => event.phase && event.zone && event.corridor), "Her olay topun faz, bölge ve koridor bilgisini taşımalı");

  const roomState = createInitialAuctionState("room", "home", "Home");
  roomState.participants.away = { userId: "away", username: "Away", budget: 0, squad: [], isReady: true, isHost: false };
  roomState.status = "simulation";
  roomState.currentRoundMinute = 30;
  roomState.currentRoundIndex = 0;
  roomState.simulationRounds = [{ roundNumber: 1, byeUserId: null, matches: [first] }];
  roomState.simulationMatches = [first];
  const visibleAtThirty = stateForAuctionViewer(roomState, "home");
  const visibleMatch = visibleAtThirty.simulationRounds[0].matches[0];
  assert.ok(visibleMatch.events.every((event) => event.minute <= 30), "Gelecekteki maç olayı istemciye sızdı");
  assert.equal(visibleMatch.simulationSeed, undefined, "Maç seed'i sonuçlanmadan istemciye sızdı");
  assert.ok(first.events.some((event) => event.minute > 30), "Görünür durum üretilirken sunucudaki gelecek olaylar değişmemeli");

  roomState.status = "tactics";
  roomState.lineups = { home, away };
  const tacticsView = stateForAuctionViewer(roomState, "home");
  assert.ok(tacticsView.lineups.home.tactics, "Oyuncunun kendi taktiği gizlendi");
  assert.equal(tacticsView.lineups.away.tactics, undefined, "Rakibin kilitli taktiği erken açıldı");

  const base = batch(home, away, 2500);
  assert.ok(base.goalsPerMatch >= 1.8 && base.goalsPerMatch <= 2.8, `Gol ortalaması hedef dışında: ${base.goalsPerMatch}`);
  assert.ok(Math.abs(base.homeWinPct - base.awayWinPct) <= 5, "Eşit takımlarda ev/deplasman yanlılığı oluştu");
  for (const expected of ["goal", "save", "miss", "counter", "corner", "turnover"]) {
    assert.ok(base.eventTypes.has(expected), `${expected} olayı hiç üretilmedi`);
  }
  assert.ok(base.looseBallEventsPerMatch > 0.2, "Seken/ikinci top akışı yeterince üretilmiyor");

  const ratingGap = batch(createTeam("strong", 83), createTeam("weak", 77), 2500);
  assert.ok(ratingGap.homeWinPct >= 45 && ratingGap.homeWinPct <= 62, `+6 OVR galibiyet oranı dengesiz: ${ratingGap.homeWinPct}`);
  assert.ok(ratingGap.awayWinPct >= 12 && ratingGap.awayWinPct <= 27, `+6 OVR sürpriz oranı dengesiz: ${ratingGap.awayWinPct}`);

  const tacticVariants: Array<[string, Partial<TeamTactics>]> = [
    ["high press", { pressing: "high_press" }],
    ["slow", { tempo: "slow" }],
    ["fast", { tempo: "fast" }],
    ["low block", { pressing: "park_bus" }],
    ["short pass", { buildUp: "short_pass" }],
    ["direct", { buildUp: "long_ball" }],
    ["counter", { transition: "counter" }],
    ["retain", { transition: "retain" }],
    ["patient", { chanceCreation: "patient" }],
    ["cross", { chanceCreation: "early_cross" }],
    ["shoot", { chanceCreation: "shoot_on_sight" }],
  ];
  for (const [name, tactics] of tacticVariants) {
    const stats = batch(createTeam(`t-${name}`, 80, tactics), away, 1200);
    assert.ok(Math.abs(stats.homeWinPct - stats.awayWinPct) <= 12, `${name} tek başına baskın veya kullanılamaz: ${stats.homeWinPct}/${stats.awayWinPct}`);
  }

  const counterStats = batch(createTeam("counter", 80, { transition: "counter" }), away, 1000);
  const retainStats = batch(createTeam("retain", 80, { transition: "retain" }), away, 1000);
  assert.ok(counterStats.counterEventsPerMatch > retainStats.counterEventsPerMatch * 1.25, "Kontra geçiş tercihi sahadaki davranışı yeterince değiştirmiyor");

  const plans: Array<[string, Partial<TeamTactics>]> = [
    ["possession", { tempo: "slow", buildUp: "short_pass", transition: "retain", chanceCreation: "patient", pressing: "balanced", attackDirection: "center" }],
    ["deep-counter", { tempo: "fast", buildUp: "long_ball", transition: "counter", pressing: "park_bus", attackDirection: "wings" }],
    ["press-and-cross", { tempo: "fast", buildUp: "long_ball", pressing: "high_press", chanceCreation: "early_cross", attackDirection: "wings" }],
    ["press-and-pass", { tempo: "fast", buildUp: "short_pass", transition: "retain", pressing: "high_press", chanceCreation: "patient" }],
    ["deep-shoot", { tempo: "slow", pressing: "park_bus", chanceCreation: "shoot_on_sight", transition: "counter" }],
  ];
  for (const [name, plan] of plans) {
    const stats = batch(createTeam(name, 80, plan), away, 1800);
    assert.ok(Math.abs(stats.homeWinPct - stats.awayWinPct) <= 18,
      `${name} taktik birleşimi aşırı baskın/zayıf: ${stats.homeWinPct}/${stats.awayWinPct}`);
  }

  const directVsPress = batch(createTeam("direct", 80, { buildUp: "long_ball" }), createTeam("press", 80, { pressing: "high_press" }), 1400);
  const shortVsPress = batch(createTeam("short", 80, { buildUp: "short_pass" }), createTeam("press2", 80, { pressing: "high_press" }), 1400);
  assert.ok(directVsPress.homeWinPct > shortVsPress.homeWinPct + 5, "Direkt oyun önde prese karşı kısa pastan daha etkili değil");

  const formations: FormationName[] = ["3-5-2", "3-4-2-1", "3-4-3", "4-4-2(1)", "4-4-2(2)", "4-5-1", "4-3-3", "4-2-4", "5-3-2", "5-2-3", "5-4-1(1)", "5-4-1(2)"];
  for (const formation of formations) {
    const stats = batch(createTeam(`formation-${formation}`, 80, {}, formation), away, 650);
    assert.ok(Math.abs(stats.homeWinPct - stats.awayWinPct) <= 15, `${formation} dizilişi genel olarak aşırı güçlü veya zayıf`);
  }

  const onlyStriker = createTeam("striker", 40);
  for (const slot of onlyStriker.slots) if (slot.targetPosition === "ST") slot.effectiveRating = 80;
  assert.ok(calculateCorridorAttackPower(onlyStriker, "left") > 0.1, "Tek santrfor kanat hücumuna katkı vermiyor");

  const shooterCounts: Record<string, number> = {};
  const random = createSeededRandom("left-shooters");
  for (let index = 0; index < 3000; index++) {
    const shooter = pickCorridorShooter(home, "left", random);
    const position = shooter?.targetPosition || "none";
    shooterCounts[position] = (shooterCounts[position] || 0) + 1;
  }
  assert.equal(shooterCounts.RW || 0, 0, "Ters kanattaki RW sol koridor şutörü seçildi");

  const participant: AuctionParticipant = {
    userId: "home", username: "Home", budget: 0, squad: home.slots.map((slot) => slot.placedPlayer!), isReady: true, isHost: true,
  };
  const forged = structuredClone(home);
  forged.slots[0].effectiveRating = 999;
  forged.teamOvr = 999;
  const canonical = buildCanonicalLineup("home", participant, forged);
  assert.ok(canonical.lineup);
  assert.equal(canonical.lineup!.slots[0].effectiveRating, 80, "Sunucu istemcinin sahte reytingini kabul etti");
  assert.equal(canonical.lineup!.teamOvr, 80, "Sunucu istemcinin sahte takım OVR değerini kabul etti");

  const round = simulateSingleRoundMatches(
    { roundNumber: 1, byeUserId: null, pairings: [{ homeUserId: "home", awayUserId: "away" }] },
    { home, away }, { home: participant }, "snapshot-test"
  );
  const storedRating = round.matches[0].homeLineup!.slots[0].effectiveRating;
  home.slots[0].effectiveRating = 1;
  assert.equal(round.matches[0].homeLineup!.slots[0].effectiveRating, storedRating, "Yeni kadro düzenlemesi geçmiş maçın kadrosunu değiştirdi");
  home.slots[0].effectiveRating = storedRating;

  const duplicate = structuredClone(home);
  duplicate.slots[1].placedPlayer = duplicate.slots[0].placedPlayer;
  assert.ok(buildCanonicalLineup("home", participant, duplicate).error, "Aynı oyuncu iki slota kabul edildi");

  console.log("✅ Stateful simulation tests passed", {
    base: { home: base.homeWinPct.toFixed(1), draw: base.drawPct.toFixed(1), away: base.awayWinPct.toFixed(1), goals: base.goalsPerMatch.toFixed(2) },
    ratingGap: { strong: ratingGap.homeWinPct.toFixed(1), draw: ratingGap.drawPct.toFixed(1), upset: ratingGap.awayWinPct.toFixed(1) },
  });
}

main();
