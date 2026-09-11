/**
 * Detaylı Maç Simülasyonu ve Taktik Denge Analiz Aracı (Benchmark).
 * Binlerce maç yaparak motorun matematiksel tutarlılığını, sürpriz oranlarını,
 * taktiklerin etkilerini ve dengeleri test eder.
 */

import { simulateMatch } from "../lib/auction/simulateMatch";
import { FormationName, PitchPosition, TeamLineup, TeamTactics } from "../lib/auction/auctionTypes";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers } from "../lib/auction/positionSuitability";
import { calculateMatchTempo } from "../lib/auction/corridorSetup";

interface LineupOptions {
  userId: string;
  defaultOvr: number;
  tactics?: Partial<TeamTactics>;
  formation?: FormationName;
  customRatings?: Partial<Record<PitchPosition, number>>;
  starPositions?: { position: PitchPosition; ovr: number }[];
}

function createBenchLineup(opts: LineupOptions): TeamLineup {
  const formation = opts.formation || "4-2-3-1";
  const slots = createInitialSlotsForFormation(formation);
  const tactics: TeamTactics = {
    tempo: opts.tactics?.tempo || "balanced",
    buildUp: opts.tactics?.buildUp || "balanced",
    pressing: opts.tactics?.pressing || "balanced",
    attackDirection: opts.tactics?.attackDirection || "balanced",
  };

  slots.forEach((s) => {
    let rating = opts.defaultOvr;
    if (opts.customRatings && opts.customRatings[s.targetPosition] !== undefined) {
      rating = opts.customRatings[s.targetPosition]!;
    }
    if (opts.starPositions) {
      const star = opts.starPositions.find((sp) => sp.position === s.targetPosition);
      if (star) rating = star.ovr;
    }

    s.placedPlayer = {
      id: `p_${opts.userId}_${s.slotId}`,
      fullName: `${s.targetPosition} ${opts.userId}`,
      overallPrime: rating,
      positions: [s.targetPosition],
    };
    s.effectiveRating = rating;
  });

  const lineup = calculateLineupPowers(opts.userId, formation, slots);
  lineup.tactics = tactics;
  return lineup;
}

interface SimStats {
  matches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  totalHomeGoals: number;
  totalAwayGoals: number;
  totalGoals: number;
  cleanSheetsHome: number;
  cleanSheetsAway: number;
  scoreCounts: Record<string, number>;
  goalBins: { "0": number; "1-2": number; "3-4": number; "5+": number };
  totalEvents: number;
  totalSaves: number;
}

function runBatch(
  home: TeamLineup,
  away: TeamLineup,
  count: number
): SimStats {
  const stats: SimStats = {
    matches: count,
    homeWins: 0,
    awayWins: 0,
    draws: 0,
    totalHomeGoals: 0,
    totalAwayGoals: 0,
    totalGoals: 0,
    cleanSheetsHome: 0,
    cleanSheetsAway: 0,
    scoreCounts: {},
    goalBins: { "0": 0, "1-2": 0, "3-4": 0, "5+": 0 },
    totalEvents: 0,
    totalSaves: 0,
  };

  for (let i = 0; i < count; i++) {
    const res = simulateMatch(`match_${i}`, home, "Home", away, "Away");
    if (res.homeScore > res.awayScore) stats.homeWins++;
    else if (res.awayScore > res.homeScore) stats.awayWins++;
    else stats.draws++;

    stats.totalHomeGoals += res.homeScore;
    stats.totalAwayGoals += res.awayScore;
    const matchGoals = res.homeScore + res.awayScore;
    stats.totalGoals += matchGoals;

    if (res.awayScore === 0) stats.cleanSheetsHome++;
    if (res.homeScore === 0) stats.cleanSheetsAway++;

    const scoreKey = `${res.homeScore}-${res.awayScore}`;
    stats.scoreCounts[scoreKey] = (stats.scoreCounts[scoreKey] || 0) + 1;

    if (matchGoals === 0) stats.goalBins["0"]++;
    else if (matchGoals <= 2) stats.goalBins["1-2"]++;
    else if (matchGoals <= 4) stats.goalBins["3-4"]++;
    else stats.goalBins["5+"]++;

    stats.totalEvents += res.events.length;
    res.events.forEach((e) => {
      if (e.type === "save") stats.totalSaves++;
    });
  }

  return stats;
}

import * as fs from "fs";

let logBuffer: string[] = [];
function log(msg: string = "") {
  console.log(msg);
  logBuffer.push(msg);
}

function printStats(title: string, stats: SimStats) {
  const homeWinPct = ((stats.homeWins / stats.matches) * 100).toFixed(1);
  const awayWinPct = ((stats.awayWins / stats.matches) * 100).toFixed(1);
  const drawPct = ((stats.draws / stats.matches) * 100).toFixed(1);
  const avgHomeGoals = (stats.totalHomeGoals / stats.matches).toFixed(2);
  const avgAwayGoals = (stats.totalAwayGoals / stats.matches).toFixed(2);
  const avgTotalGoals = (stats.totalGoals / stats.matches).toFixed(2);
  const avgEvents = (stats.totalEvents / stats.matches).toFixed(1);

  log(`\n------------------------------------------------------------`);
  log(`📊 ${title} (${stats.matches} Maç)`);
  log(`------------------------------------------------------------`);
  log(`  Sonuçlar: Ev Sahibi %${homeWinPct} | Beraberlik %${drawPct} | Deplasman %${awayWinPct}`);
  log(`  Ort. Skor: ${avgHomeGoals} - ${avgAwayGoals} (Toplam Gol: ${avgTotalGoals} gol/maç)`);
  log(`  Ort. Pozisyon/Olay: ${avgEvents} olay/maç | Toplam Kurtarış: ${(stats.totalSaves / stats.matches).toFixed(1)}/maç`);
  log(`  Gol Dağılımı: 0 Gol: %${((stats.goalBins["0"] / stats.matches) * 100).toFixed(1)} | 1-2 Gol: %${((stats.goalBins["1-2"] / stats.matches) * 100).toFixed(1)} | 3-4 Gol: %${((stats.goalBins["3-4"] / stats.matches) * 100).toFixed(1)} | 5+ Gol: %${((stats.goalBins["5+"] / stats.matches) * 100).toFixed(1)}`);
  
  // En sık 3 skor
  const sortedScores = Object.entries(stats.scoreCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  log(`  En Çok Görülen Skorlar: ${sortedScores.map(([score, c]) => `${score} (%${((c / stats.matches) * 100).toFixed(1)})`).join(", ")}`);
}

async function runAllBenchmarks() {
  console.log("============================================================");
  console.log("⚽ AUCTION MAÇ SİMÜLASYONU VE TAKTİK DENGESİ BÜYÜK TESTİ ⚽");
  console.log("============================================================");

  // ------------------------------------------------------------
  // BÖLÜM 1: BAZ DENGE VE EV/DEPLASMAN BİAS TESTİ (80 vs 80)
  // ------------------------------------------------------------
  const t80A = createBenchLineup({ userId: "teamA", defaultOvr: 80 });
  const t80B = createBenchLineup({ userId: "teamB", defaultOvr: 80 });
  const baseBalance = runBatch(t80A, t80B, 5000);
  printStats("1. Dengeli Takımlar (80 GEN vs 80 GEN, Dengeli Taktik)", baseBalance);

  // ------------------------------------------------------------
  // BÖLÜM 2: GÜÇ FARKLILIKLARI VE SÜRPRİZ ORANI (OVR SENSITIVITY)
  // ------------------------------------------------------------
  // A) Hafif Üstünlük: 83 GEN vs 77 GEN (+6 GEN)
  const t83 = createBenchLineup({ userId: "t83", defaultOvr: 83 });
  const t77 = createBenchLineup({ userId: "t77", defaultOvr: 77 });
  const stats83v77 = runBatch(t83, t77, 3000);
  printStats("2A. Hafif Üstünlük: 83 GEN vs 77 GEN (+6 Fark)", stats83v77);

  // B) Belirgin Üstünlük: 86 GEN vs 74 GEN (+12 Fark)
  const t86 = createBenchLineup({ userId: "t86", defaultOvr: 86 });
  const t74 = createBenchLineup({ userId: "t74", defaultOvr: 74 });
  const stats86v74 = runBatch(t86, t74, 3000);
  printStats("2B. Belirgin Üstünlük: 86 GEN vs 74 GEN (+12 Fark)", stats86v74);

  // C) Dev Fark: 90 GEN vs 70 GEN (+20 Fark)
  const t90 = createBenchLineup({ userId: "t90", defaultOvr: 90 });
  const t70 = createBenchLineup({ userId: "t70", defaultOvr: 70 });
  const stats90v70 = runBatch(t90, t70, 3000);
  printStats("2C. Büyük Fark: 90 GEN vs 70 GEN (+20 Fark)", stats90v70);

  // D) Uçurum: 95 GEN vs 55 GEN (+40 Fark)
  const t95 = createBenchLineup({ userId: "t95", defaultOvr: 95 });
  const t55 = createBenchLineup({ userId: "t55", defaultOvr: 55 });
  const stats95v55 = runBatch(t95, t55, 3000);
  printStats("2D. Uçurum Fark: 95 GEN vs 55 GEN (+40 Fark)", stats95v55);

  // ------------------------------------------------------------
  // BÖLÜM 3: TEMPO TAKTİĞİ ETKİLERİ (Pozisyon ve Skor Dağılımı)
  // ------------------------------------------------------------
  const tSlowA = createBenchLineup({ userId: "tSlowA", defaultOvr: 80, tactics: { tempo: "slow" } });
  const tSlowB = createBenchLineup({ userId: "tSlowB", defaultOvr: 80, tactics: { tempo: "slow" } });
  const statsSlow = runBatch(tSlowA, tSlowB, 3000);
  printStats("3A. Yavaş Tempo vs Yavaş Tempo (Düşük Pozisyon/Kilit Maç)", statsSlow);

  const tFastA = createBenchLineup({ userId: "tFastA", defaultOvr: 80, tactics: { tempo: "fast" } });
  const tFastB = createBenchLineup({ userId: "tFastB", defaultOvr: 80, tactics: { tempo: "fast" } });
  const statsFast = runBatch(tFastA, tFastB, 3000);
  printStats("3B. Hızlı Tempo vs Hızlı Tempo (Yüksek Pozisyon/Bol Gol)", statsFast);

  const statsFastVsSlow = runBatch(tFastA, tSlowB, 3000);
  printStats("3C. Hızlı Tempo vs Yavaş Tempo (Tempo Çatışması)", statsFastVsSlow);

  // ------------------------------------------------------------
  // BÖLÜM 4: PRES TAKTİKLERİ VE UNDERDOG PARK BUS TESTİ
  // ------------------------------------------------------------
  // 4A: Eşit güçte High Press vs Balanced
  const tHighPress = createBenchLineup({ userId: "tHP", defaultOvr: 80, tactics: { pressing: "high_press" } });
  const tBalanced = createBenchLineup({ userId: "tBal", defaultOvr: 80, tactics: { pressing: "balanced" } });
  const statsHpVsBal = runBatch(tHighPress, tBalanced, 3000);
  printStats("4A. High Press vs Balanced (Eşit 80 GEN)", statsHpVsBal);

  // 4B: Eşit güçte Park Bus vs Balanced
  const tParkBus = createBenchLineup({ userId: "tPB", defaultOvr: 80, tactics: { pressing: "park_bus" } });
  const statsPbVsBal = runBatch(tParkBus, tBalanced, 3000);
  printStats("4B. Park Bus vs Balanced (Eşit 80 GEN)", statsPbVsBal);

  // 4C: High Press vs Park Bus
  const statsHpVsPb = runBatch(tHighPress, tParkBus, 3000);
  printStats("4C. High Press vs Park Bus (Stil Çarpışması)", statsHpVsPb);

  // 4D: ZAYIF TAKIM STRATEJİSİ: 75 GEN Park Bus vs 85 GEN Balanced (Karşılaştırma: 75 Balanced vs 85 Balanced)
  const t85 = createBenchLineup({ userId: "t85", defaultOvr: 85 });
  const t75Bal = createBenchLineup({ userId: "t75Bal", defaultOvr: 75, tactics: { pressing: "balanced" } });
  const t75Pb = createBenchLineup({ userId: "t75Pb", defaultOvr: 75, tactics: { pressing: "park_bus", tempo: "slow" } });

  const stats75BalVs85 = runBatch(t75Bal, t85, 3000);
  printStats("4D-1. Zayıf Takım Dengeli Oynarsa: 75 GEN Balanced vs 85 GEN", stats75BalVs85);

  const stats75PbVs85 = runBatch(t75Pb, t85, 3000);
  printStats("4D-2. Zayıf Takım Otobüs Çekerse: 75 GEN Park Bus + Slow vs 85 GEN", stats75PbVs85);

  // ------------------------------------------------------------
  // BÖLÜM 5: OYUN KURMA (BUILD-UP) TAKTİKLERİ
  // ------------------------------------------------------------
  const tShortPass = createBenchLineup({ userId: "tSP", defaultOvr: 80, tactics: { buildUp: "short_pass" } });
  const tLongBall = createBenchLineup({ userId: "tLB", defaultOvr: 80, tactics: { buildUp: "long_ball" } });

  const statsSpVsBal = runBatch(tShortPass, tBalanced, 3000);
  printStats("5A. Kısa Pas vs Dengeli (80 GEN)", statsSpVsBal);

  const statsLbVsBal = runBatch(tLongBall, tBalanced, 3000);
  printStats("5B. Uzun Pas vs Dengeli (80 GEN)", statsLbVsBal);

  const statsSpVsLb = runBatch(tShortPass, tLongBall, 3000);
  printStats("5C. Kısa Pas vs Uzun Pas (80 GEN)", statsSpVsLb);

  // ------------------------------------------------------------
  // BÖLÜM 6: YÖN / KORİDOR ODAKLI HÜCUM VE ZAYIF KARIN TESTİ
  // ------------------------------------------------------------
  // Takım A'nın sol kanadı süper star (LW: 92 GEN), kalanı 78 GEN.
  // Takım A atak yönünü "left" seçiyor.
  // Rakip Takım B'nin sağ beki (RB) 70 GEN (zayıf karın) vs 88 GEN (güçlü savunma).
  const tStarLeft_AttackLeft = createBenchLineup({
    userId: "starLeft",
    defaultOvr: 78,
    tactics: { attackDirection: "left" },
    customRatings: { LW: 92 },
  });

  const tStarLeft_AttackBalanced = createBenchLineup({
    userId: "starLeftBal",
    defaultOvr: 78,
    tactics: { attackDirection: "balanced" },
    customRatings: { LW: 92 },
  });

  const tWeakRightBack = createBenchLineup({
    userId: "weakRB",
    defaultOvr: 78,
    customRatings: { RB: 68 }, // Sol kanat hücumunu karşılayacak bek zayıf!
  });

  const tStrongRightBack = createBenchLineup({
    userId: "strongRB",
    defaultOvr: 78,
    customRatings: { RB: 90 }, // Sol kanat hücumunu karşılayacak bek elit!
  });

  const statsStarVsWeakExploit = runBatch(tStarLeft_AttackLeft, tWeakRightBack, 3000);
  printStats("6A. Taktiksel Maden: 92 LW 'Sola Yüklen' vs 68 RB Zayıf Bek", statsStarVsWeakExploit);

  const statsStarVsWeakNormal = runBatch(tStarLeft_AttackBalanced, tWeakRightBack, 3000);
  printStats("6B. Normal Oyun: 92 LW 'Dengeli Yön' vs 68 RB Zayıf Bek", statsStarVsWeakNormal);

  const statsStarVsStrongCounter = runBatch(tStarLeft_AttackLeft, tStrongRightBack, 3000);
  printStats("6C. Önlem Alındı: 92 LW 'Sola Yüklen' vs 90 RB Kilit Savunma", statsStarVsStrongCounter);

  // ------------------------------------------------------------
  // BÖLÜM 7: KALECİ VE BİTİRİCİ (GK vs ST) ETKİSİ
  // ------------------------------------------------------------
  // 90 GK'lı takım vs 60 GK'lı takım (Diğer 10 oyuncu eşit 80 GEN)
  const t90GK = createBenchLineup({ userId: "gk90", defaultOvr: 80, customRatings: { GK: 90 } });
  const t60GK = createBenchLineup({ userId: "gk60", defaultOvr: 80, customRatings: { GK: 60 } });
  const statsGkImpact = runBatch(t90GK, t60GK, 3000);
  printStats("7A. Kaleci Etkisi: 90 GK Takımı vs 60 GK Takımı (Diğer 10 Oyuncu Eşit 80)", statsGkImpact);

  // 90 ST'li takım vs 60 ST'li takım (Diğer 10 oyuncu eşit 80 GEN)
  const t90ST = createBenchLineup({ userId: "st90", defaultOvr: 80, customRatings: { ST: 90 } });
  const t60ST = createBenchLineup({ userId: "st60", defaultOvr: 80, customRatings: { ST: 60 } });
  const statsStImpact = runBatch(t90ST, t60ST, 3000);
  printStats("7B. Forvet Etkisi: 90 ST Takımı vs 60 ST Takımı (Diğer 10 Oyuncu Eşit 80)", statsStImpact);

  log("\n============================================================");
  log("🏁 TÜM BENCHMARK VE SİMÜLASYON TESTLERİ TAMAMLANDI");
  log("============================================================");

  fs.writeFileSync("scripts/simulation_report.txt", logBuffer.join("\n"), "utf-8");
  console.log("Rapor scripts/simulation_report.txt dosyasına yazıldı.");
}

runAllBenchmarks().catch((err) => {
  console.error("Benchmark hatası:", err);
  process.exit(1);
});

