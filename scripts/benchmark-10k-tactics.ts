/**
 * 10,000 Maçlık Taktiksel Varyasyon ve Denge Analiz Aracı (10k Tactical Benchmark).
 * 10 farklı taktik senaryosunda (her biri 1,000 maç) oyunun dengesini,
 * taş-kağıt-makas taktik etkilerini ve reyting üstünlüğünü test eder.
 */

import * as fs from "fs";
import * as path from "path";
import { simulateMatch } from "../lib/auction/simulateMatch";
import { FormationName, PitchPosition, TeamLineup, TeamTactics, ZoneId } from "../lib/auction/auctionTypes";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers } from "../lib/auction/positionSuitability";

interface LineupOptions {
  userId: string;
  defaultOvr: number;
  tactics?: Partial<TeamTactics>;
  formation?: FormationName;
  customRatings?: Partial<Record<PitchPosition, number>>;
}

function createBenchLineup(opts: LineupOptions): TeamLineup {
  const formation = opts.formation || "4-3-3";
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

interface ScenarioStats {
  name: string;
  description: string;
  matches: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  homeGoals: number;
  awayGoals: number;
  totalGoals: number;
  homeCleanSheets: number;
  awayCleanSheets: number;
  goalBins: { "0": number; "1-2": number; "3-4": number; "5+": number };
  scoreCounts: Record<string, number>;
  totalEvents: number;
  totalSaves: number;
  homeDefTurnovers: number;
  awayDefTurnovers: number;
  totalChances: number;
}

function runScenarioBatch(
  name: string,
  description: string,
  home: TeamLineup,
  away: TeamLineup,
  count: number = 1000
): ScenarioStats {
  const stats: ScenarioStats = {
    name,
    description,
    matches: count,
    homeWins: 0,
    awayWins: 0,
    draws: 0,
    homeGoals: 0,
    awayGoals: 0,
    totalGoals: 0,
    homeCleanSheets: 0,
    awayCleanSheets: 0,
    goalBins: { "0": 0, "1-2": 0, "3-4": 0, "5+": 0 },
    scoreCounts: {},
    totalEvents: 0,
    totalSaves: 0,
    homeDefTurnovers: 0,
    awayDefTurnovers: 0,
    totalChances: 0,
  };

  for (let i = 0; i < count; i++) {
    const res = simulateMatch(`m_${name}_${i}`, home, "Ev Sahibi", away, "Deplasman");

    if (res.homeScore > res.awayScore) stats.homeWins++;
    else if (res.awayScore > res.homeScore) stats.awayWins++;
    else stats.draws++;

    stats.homeGoals += res.homeScore;
    stats.awayGoals += res.awayScore;
    const matchGoals = res.homeScore + res.awayScore;
    stats.totalGoals += matchGoals;

    if (res.awayScore === 0) stats.homeCleanSheets++;
    if (res.homeScore === 0) stats.awayCleanSheets++;

    const scoreKey = `${res.homeScore}-${res.awayScore}`;
    stats.scoreCounts[scoreKey] = (stats.scoreCounts[scoreKey] || 0) + 1;

    if (matchGoals === 0) stats.goalBins["0"]++;
    else if (matchGoals <= 2) stats.goalBins["1-2"]++;
    else if (matchGoals <= 4) stats.goalBins["3-4"]++;
    else stats.goalBins["5+"]++;

    stats.totalEvents += res.events.length;

    res.events.forEach((ev) => {
      if (ev.type === "save") stats.totalSaves++;
      if (ev.type === "goal" || ev.type === "save") stats.totalChances++;

      if (ev.type === "turnover" && ev.zone) {
        if (ev.teamUserId === away.userId && (ev.zone === "att_left" || ev.zone === "att_center" || ev.zone === "att_right")) {
          stats.homeDefTurnovers++;
        } else if (ev.teamUserId === home.userId && (ev.zone === "att_left" || ev.zone === "att_center" || ev.zone === "att_right")) {
          stats.awayDefTurnovers++;
        }
      }
    });
  }

  return stats;
}

const outputLines: string[] = [];
function out(text: string = "") {
  console.log(text);
  outputLines.push(text);
}

async function main() {
  out("================================================================================");
  out("⚽ 10,000 MAÇLIK TAKTİKSEL VARYASYON VE DENGE ANALİZİ (10K BENCHMARK)");
  out("================================================================================");
  out("Motor: 9 Bölgeli Markov Durum Makinesi (State Machine)");
  out("Tarih: " + new Date().toLocaleString("tr-TR"));
  out("Her senaryoda 1,000 maç simüle edilerek toplam 10,000 maç analizi çıkarılmaktadır.\n");

  const startTime = Date.now();
  const scenarios: ScenarioStats[] = [];

  // 1. Temel Kontrol Çizgisi: Eşit Dengeli vs Dengeli
  scenarios.push(
    runScenarioBatch(
      "1. Temel Çizgi (Dengeli vs Dengeli)",
      "İki takım da 80 GEN, Dengeli tempo, Dengeli pas, Dengeli pres. (Baz çizgi)",
      createBenchLineup({ userId: "H", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "balanced", pressing: "balanced" } }),
      createBenchLineup({ userId: "A", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "balanced", pressing: "balanced" } })
    )
  );

  // 2. Tempo Çatışması: Hızlı Tempo vs Yavaş Tempo
  scenarios.push(
    runScenarioBatch(
      "2. Tempo Çatışması (Hızlı vs Yavaş)",
      "Ev Sahibi: Hızlı Tempo (fazla pozisyon ve risk) | Deplasman: Yavaş Tempo (topu tutma)",
      createBenchLineup({ userId: "H", defaultOvr: 80, tactics: { tempo: "fast", buildUp: "balanced", pressing: "balanced" } }),
      createBenchLineup({ userId: "A", defaultOvr: 80, tactics: { tempo: "slow", buildUp: "balanced", pressing: "balanced" } })
    )
  );

  // 3. Kısa Pas vs Önde Pres (Taş-Kağıt-Makas Kritik Test)
  scenarios.push(
    runScenarioBatch(
      "3. Kısa Pas vs Önde Pres",
      "Ev Sahibi: Kısa Pas (kendi yarı sahasından oyun kurma) | Deplasman: Önde Pres (yüksek baskı)",
      createBenchLineup({ userId: "H", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "short_pass", pressing: "balanced" } }),
      createBenchLineup({ userId: "A", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "balanced", pressing: "high_press" } })
    )
  );

  // 4. Uzun Top vs Önde Pres (Presi Baypas Etme)
  scenarios.push(
    runScenarioBatch(
      "4. Uzun Top vs Önde Pres",
      "Ev Sahibi: Uzun Top (orta sahayı ve presi dikine aşma) | Deplasman: Önde Pres (savunma arkasında boşluk)",
      createBenchLineup({ userId: "H", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "long_ball", pressing: "balanced" } }),
      createBenchLineup({ userId: "A", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "balanced", pressing: "high_press" } })
    )
  );

  // 5. Kısa Pas vs Otobüsü Çek (Katı Savunmayı Açma)
  scenarios.push(
    runScenarioBatch(
      "5. Kısa Pas vs Otobüsü Çek",
      "Ev Sahibi: Kısa Pas (sabırlı pas oyunu) | Deplasman: Otobüsü Çek (derin blok ve alan daraltma)",
      createBenchLineup({ userId: "H", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "short_pass", pressing: "balanced" } }),
      createBenchLineup({ userId: "A", defaultOvr: 80, tactics: { tempo: "slow", buildUp: "balanced", pressing: "park_bus" } })
    )
  );

  // 6. Kaleyi Görünce Vur vs Otobüsü Çek (Uzaktan Şut Kilidi)
  scenarios.push(
    runScenarioBatch(
      "6. Kaleyi Görünce Vur vs Otobüsü Çek",
      "Ev Sahibi: Kaleyi Görünce Vur (uzaktan şutlarla kilidi açma) | Deplasman: Otobüsü Çek",
      createBenchLineup({ userId: "H", defaultOvr: 80, tactics: { tempo: "balanced", buildUp: "shoot_on_sight", pressing: "balanced" } }),
      createBenchLineup({ userId: "A", defaultOvr: 80, tactics: { tempo: "slow", buildUp: "balanced", pressing: "park_bus" } })
    )
  );

  // 7. Kanatlara Yüklen vs Merkeze Yüklen
  scenarios.push(
    runScenarioBatch(
      "7. Kanatlara Yüklen vs Merkeze Yüklen",
      "Ev Sahibi: Kanatlar (Wings) | Deplasman: Merkez (Center)",
      createBenchLineup({ userId: "H", defaultOvr: 80, tactics: { attackDirection: "wings" } }),
      createBenchLineup({ userId: "A", defaultOvr: 80, tactics: { attackDirection: "center" } })
    )
  );

  // 8. Taktiksel Zayıf Bek Madeni (92 Sol Açık vs 65 Sağ Bek)
  scenarios.push(
    runScenarioBatch(
      "8. Zayıf Bek Madeni (92 LW vs 65 RB)",
      "Ev Sahibi: 92 LW ile 'Sola Yüklen' taktiği | Deplasman: 65 RB zayıf halkası",
      createBenchLineup({
        userId: "H",
        defaultOvr: 80,
        customRatings: { LW: 92 },
        tactics: { attackDirection: "left" },
      }),
      createBenchLineup({
        userId: "A",
        defaultOvr: 80,
        customRatings: { RB: 65 },
        tactics: { attackDirection: "balanced" },
      })
    )
  );

  // 9. Kalite vs Taktik (85 GEN Kısa Pas vs 75 GEN Önde Pres)
  scenarios.push(
    runScenarioBatch(
      "9. Kalite vs Taktik (85 GEN Kısa Pas vs 75 GEN Pres)",
      "Ev Sahibi: 85 GEN (Kısa Pas) | Deplasman: 75 GEN (Önde Pres - taktiksel kontra ama kalite farkı)",
      createBenchLineup({ userId: "H", defaultOvr: 85, tactics: { buildUp: "short_pass" } }),
      createBenchLineup({ userId: "A", defaultOvr: 75, tactics: { pressing: "high_press" } })
    )
  );

  // 10. Zayıf Takımın Umudu (75 GEN Otobüs/Yavaş vs 85 GEN Hızlı/Pres)
  scenarios.push(
    runScenarioBatch(
      "10. Zayıf Takımın Umudu (75 GEN Otobüs vs 85 GEN Pres)",
      "Ev Sahibi: 75 GEN (Otobüsü Çek + Yavaş Tempo) | Deplasman: 85 GEN (Önde Pres + Hızlı Tempo)",
      createBenchLineup({ userId: "H", defaultOvr: 75, tactics: { tempo: "slow", pressing: "park_bus" } }),
      createBenchLineup({ userId: "A", defaultOvr: 85, tactics: { tempo: "fast", pressing: "high_press" } })
    )
  );

  const durationMs = Date.now() - startTime;

  // ÇIKTILARI YAZDIR
  scenarios.forEach((s) => {
    const hwPct = ((s.homeWins / s.matches) * 100).toFixed(1);
    const dPct = ((s.draws / s.matches) * 100).toFixed(1);
    const awPct = ((s.awayWins / s.matches) * 100).toFixed(1);
    const hg = (s.homeGoals / s.matches).toFixed(2);
    const ag = (s.awayGoals / s.matches).toFixed(2);
    const tg = (s.totalGoals / s.matches).toFixed(2);
    const csH = ((s.homeCleanSheets / s.matches) * 100).toFixed(1);
    const csA = ((s.awayCleanSheets / s.matches) * 100).toFixed(1);
    const hDefTurnover = (s.homeDefTurnovers / s.matches).toFixed(2);
    const aDefTurnover = (s.awayDefTurnovers / s.matches).toFixed(2);

    const topScores = Object.entries(s.scoreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([sc, count]) => `${sc} (%${((count / s.matches) * 100).toFixed(1)})`)
      .join(", ");

    out("--------------------------------------------------------------------------------");
    out(`📌 SENARYO: ${s.name}`);
    out(`   Tanım: ${s.description}`);
    out("--------------------------------------------------------------------------------");
    out(`   Sonuç Dağılımı: Ev Sahibi %${hwPct}  |  Beraberlik %${dPct}  |  Deplasman %${awPct}`);
    out(`   Ortalama Skor:  ${hg} - ${ag}  (Toplam Gol: ${tg} / maç)`);
    out(`   Gol Yememe:     Ev Sahibi: %${csH}  |  Deplasman: %${csA}`);
    out(`   Defansta Top Kaybı: Ev: ${hDefTurnover} / maç  |  Dep: ${aDefTurnover} / maç`);
    out(`   Gol Dağılımı:   0 Gol: %${((s.goalBins["0"] / s.matches) * 100).toFixed(1)} | 1-2 Gol: %${((s.goalBins["1-2"] / s.matches) * 100).toFixed(1)} | 3-4 Gol: %${((s.goalBins["3-4"] / s.matches) * 100).toFixed(1)} | 5+ Gol: %${((s.goalBins["5+"] / s.matches) * 100).toFixed(1)}`);
    out(`   En Çok Çıkan Skorlar: ${topScores}\n`);
  });

  out("================================================================================");
  out(`🏁 TOPLAM 10,000 MAÇ ${durationMs}ms İÇİNDE SİMÜLE EDİLDİ (Ortalama ${(durationMs / 10000).toFixed(2)}ms / maç)`);
  out("================================================================================\n");

  const reportPath = path.join(__dirname, "tactics_balance_10k_report.txt");
  fs.writeFileSync(reportPath, outputLines.join("\n"), "utf-8");
  out(`📄 Rapor dosyaya kaydedildi: ${reportPath}`);
}

main().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
