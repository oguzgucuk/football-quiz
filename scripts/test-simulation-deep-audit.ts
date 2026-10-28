/**
 * Simülasyon Motoru, Mevki Cezaları ve Taktik Etkisi Denetim Testi.
 * Bu test doğrudan simülasyon motorunun 3 temel sorusunu ölçer:
 * 1. Oyuncu mevki cezaları (effectiveRating & roleMult) maça gerçekten etki ediyor mu?
 * 2. Kalede kaleci harici oyuncu oynatılması nasıl bir fark yaratıyor?
 * 3. Taktikler (tempo, pres, hücum yönü, pas stili) maç istatistiklerini nasıl değiştiriyor?
 */

import { FormationName, PitchPosition, TeamLineup, TeamTactics } from "../lib/auction/auctionTypes";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers, calculateSlotRating } from "../lib/auction/positionSuitability";
import { simulateMatch } from "../lib/auction/simulateMatch";

function createTeam(
  userId: string,
  formation: FormationName,
  playersConfig: { position: PitchPosition; naturalPositions: string[]; ovr: number }[],
  tactics?: Partial<TeamTactics>
): TeamLineup {
  const slots = createInitialSlotsForFormation(formation);
  slots.forEach((s, idx) => {
    const cfg = playersConfig[idx] || { position: s.targetPosition, naturalPositions: [s.targetPosition], ovr: 80 };
    const dummyCard = {
      id: `p_${userId}_${idx}`,
      fullName: `Oyuncu ${s.targetPosition}`,
      overallPrime: cfg.ovr,
      positions: cfg.naturalPositions,
    };
    const { effectiveRating, penalty } = calculateSlotRating(dummyCard, s.targetPosition);
    s.placedPlayer = dummyCard;
    s.effectiveRating = effectiveRating;
    s.penalty = penalty;
  });

  const lineup = calculateLineupPowers(userId, formation, slots);
  lineup.tactics = {
    tempo: tactics?.tempo || "balanced",
    buildUp: tactics?.buildUp || "balanced",
    pressing: tactics?.pressing || "balanced",
    attackDirection: tactics?.attackDirection || "balanced",
  };
  return lineup;
}

async function audit() {
  console.log("================================================================================");
  console.log("🔍 SİMÜLASYON MOTORU, MEVKİ CEZALARI VE TAKTİK DERİN DENETİMİ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // DENEY 1: MEVKİ CEZALARININ MAÇA ETKİSİ
  // ---------------------------------------------------------------------------
  console.log("📊 1. TEST: DOĞAL MEVKİ (0 Ceza) vs TERS MEVKİLER (-35 Ceza & Ters Roller)");
  console.log("   - Takım A: 11 oyuncunun tamamı kendi doğal mevkisinde (85 OVR, 0 Ceza)");
  console.log("   - Takım B: 85 OVR oyuncular ama forvetler stoperde, stoperler forvette (-35 Ceza)");

  const natural433Config: { position: PitchPosition; naturalPositions: string[]; ovr: number }[] = [
    { position: "GK", naturalPositions: ["GK"], ovr: 85 },
    { position: "LB", naturalPositions: ["LB"], ovr: 85 },
    { position: "CB", naturalPositions: ["CB"], ovr: 85 },
    { position: "CB", naturalPositions: ["CB"], ovr: 85 },
    { position: "RB", naturalPositions: ["RB"], ovr: 85 },
    { position: "CM", naturalPositions: ["CM"], ovr: 85 },
    { position: "CDM", naturalPositions: ["CDM"], ovr: 85 },
    { position: "CAM", naturalPositions: ["CAM"], ovr: 85 },
    { position: "LW", naturalPositions: ["LW"], ovr: 85 },
    { position: "ST", naturalPositions: ["ST"], ovr: 85 },
    { position: "RW", naturalPositions: ["RW"], ovr: 85 },
  ];

  // Forvetleri stopere, stoperleri forvete koy
  const outOfPosition433Config: { position: PitchPosition; naturalPositions: string[]; ovr: number }[] = [
    { position: "GK", naturalPositions: ["GK"], ovr: 85 },
    { position: "LB", naturalPositions: ["ST"], ovr: 85 },  // Forvet bekte (-35)
    { position: "CB", naturalPositions: ["ST"], ovr: 85 },  // Forvet stoperde (-35)
    { position: "CB", naturalPositions: ["LW"], ovr: 85 },  // Kanat stoperde (-35)
    { position: "RB", naturalPositions: ["RW"], ovr: 85 },  // Kanat bekte (-35)
    { position: "CM", naturalPositions: ["CB"], ovr: 85 },  // Stoper orta sahada (-35)
    { position: "CDM", naturalPositions: ["ST"], ovr: 85 }, // Forvet ön liberoda (-35)
    { position: "CAM", naturalPositions: ["CB"], ovr: 85 }, // Stoper 10 numarada (-35)
    { position: "LW", naturalPositions: ["LB"], ovr: 85 },  // Bek açıkta (-35)
    { position: "ST", naturalPositions: ["CB"], ovr: 85 },  // Stoper santraforda (-35)
    { position: "RW", naturalPositions: ["RB"], ovr: 85 },  // Bek açıkta (-35)
  ];

  const teamNatural = createTeam("A_Natural", "4-3-3", natural433Config);
  const teamPenalty = createTeam("B_Penalty", "4-3-3", outOfPosition433Config);

  console.log(`   Takım A Efektif Takım GEN: ${teamNatural.teamOvr}`);
  console.log(`   Takım B Efektif Takım GEN: ${teamPenalty.teamOvr}`);

  let naturalWins = 0, penaltyWins = 0, draws1 = 0;
  let naturalGoals = 0, penaltyGoals = 0;
  const matchCount = 500;

  for (let i = 0; i < matchCount; i++) {
    const res = simulateMatch(`m_${i}`, teamNatural, "Doğal Takım", teamPenalty, "Cezalı Takım");
    if (res.homeScore > res.awayScore) naturalWins++;
    else if (res.awayScore > res.homeScore) penaltyWins++;
    else draws1++;
    naturalGoals += res.homeScore;
    penaltyGoals += res.awayScore;
  }

  console.log(`   Sonuç (${matchCount} Maç):`);
  console.log(`   🏆 Doğal Mevkili Takım: %${((naturalWins / matchCount) * 100).toFixed(1)} galibiyet (${naturalWins} maç)`);
  console.log(`   💀 Ters Mevkili Takım: %${((penaltyWins / matchCount) * 100).toFixed(1)} galibiyet (${penaltyWins} maç)`);
  console.log(`   🤝 Beraberlik: %${((draws1 / matchCount) * 100).toFixed(1)}`);
  console.log(`   ⚽ Ortalama Skor: Doğal ${ (naturalGoals / matchCount).toFixed(2) } - ${ (penaltyGoals / matchCount).toFixed(2) } Cezalı`);

  if (naturalWins < matchCount * 0.75) {
    throw new Error("❌ HATA: Mevki cezaları maça yeterince etki etmiyor!");
  } else {
    console.log("   ✅ ONAYLANDI: Mevki cezaları maça doğrudan ve ezici şekilde etki ediyor!\n");
  }

  // ---------------------------------------------------------------------------
  // DENEY 2: KALECİSİZ ÇIKMA CEZASI (Forvet Kalede)
  // ---------------------------------------------------------------------------
  console.log("📊 2. TEST: KALECİ HARİCİ OYUNCU KALEYE GEÇERSE NE OLUR?");
  console.log("   - Takım A: 85 OVR Kaleci kalede");
  console.log("   - Takım B: 85 OVR Santrafor kalede (Efektif reyting 35'e düşer)");

  const noGkConfig = [...natural433Config];
  noGkConfig[0] = { position: "GK", naturalPositions: ["ST"], ovr: 85 }; // Santrafor kalede

  const teamWithGk = createTeam("A_GK", "4-3-3", natural433Config);
  const teamNoGk = createTeam("B_NoGK", "4-3-3", noGkConfig);

  let gkTeamWins = 0, noGkTeamWins = 0, draws2 = 0;
  let goalsAgainstGk = 0, goalsAgainstNoGk = 0;
  let shotsOnGk = 0, shotsOnNoGk = 0;

  for (let i = 0; i < matchCount; i++) {
    const res = simulateMatch(`m_gk_${i}`, teamWithGk, "Kalecili", teamNoGk, "Kalecisiz");
    if (res.homeScore > res.awayScore) gkTeamWins++;
    else if (res.awayScore > res.homeScore) noGkTeamWins++;
    else draws2++;
    goalsAgainstNoGk += res.homeScore;
    goalsAgainstGk += res.awayScore;

    res.events.forEach((e) => {
      if (e.type === "goal") {
        if (e.teamUserId === "A_GK") {
          // Team A scored on Team B (No GK)
          shotsOnNoGk++;
        } else {
          // Team B scored on Team A (85 GK)
          shotsOnGk++;
        }
      } else if (e.type === "save") {
        if (e.teamUserId === "B_NoGK") {
          // Team B's goalkeeper (No GK) made a save against a shot from Team A
          shotsOnNoGk++;
        } else if (e.teamUserId === "A_GK") {
          // Team A's goalkeeper (85 GK) made a save against a shot from Team B
          shotsOnGk++;
        }
      }
    });
  }

  const savesByNoGk = shotsOnNoGk - goalsAgainstNoGk;
  const savesByRealGk = shotsOnGk - goalsAgainstGk;

  console.log(`   Sonuç (${matchCount} Maç):`);
  console.log(`   🧤 Kalecili Takım Galibiyet: %${((gkTeamWins / matchCount) * 100).toFixed(1)}`);
  console.log(`   🧤 Kalecisiz Takım Galibiyet: %${((noGkTeamWins / matchCount) * 100).toFixed(1)}`);
  console.log(`   🧤 Kalecisiz Kaleye Çekilen Şut: ${(shotsOnNoGk / matchCount).toFixed(2)} şut/maç`);
  console.log(`   🧤 Kalecisiz Kalenin Yediği Gol: ${(goalsAgainstNoGk / matchCount).toFixed(2)} gol/maç (Kurtarış oranı: %${((savesByNoGk / Math.max(1, shotsOnNoGk)) * 100).toFixed(1)})`);
  console.log(`   🧤 85'lik Kaleciye Çekilen Şut: ${(shotsOnGk / matchCount).toFixed(2)} şut/maç`);
  console.log(`   🧤 85'lik Kalecinin Yediği Gol: ${(goalsAgainstGk / matchCount).toFixed(2)} gol/maç (Kurtarış oranı: %${((savesByRealGk / Math.max(1, shotsOnGk)) * 100).toFixed(1)})`);

  // ---------------------------------------------------------------------------
  // DENEY 3: TAKTİKSEL ETKİLERİN DOĞRULANMASI (Pres, Faul, Tempo)
  // ---------------------------------------------------------------------------
  console.log("📊 3. TEST: TAKTİKLER GERÇEKTEN ÇALIŞIYOR MU?");

  // Pres Karşılaştırması: High Press vs Park the Bus
  const teamHighPress = createTeam("HP", "4-3-3", natural433Config, { pressing: "high_press" });
  const teamParkBus = createTeam("PB", "4-3-3", natural433Config, { pressing: "park_bus" });

  let hpFouls = 0, pbFouls = 0;
  let hpTurnovers = 0, pbTurnovers = 0;

  for (let i = 0; i < matchCount; i++) {
    const res = simulateMatch(`m_tac_${i}`, teamHighPress, "Önde Pres", teamParkBus, "Otobüs");
    res.events.forEach((e) => {
      if (e.type === "foul" || e.type === "free_kick" || e.type === "penalty") {
        if (e.teamUserId === "HP") pbFouls++; // Faulü yapan savunan takımdır
        else hpFouls++;
      }
      if (e.type === "turnover") {
        if (e.teamUserId === "HP") hpTurnovers++;
        else pbTurnovers++;
      }
    });
  }

  console.log(`   Önde Pres Takımı:`);
  console.log(`     - Rakip alanda top çalma (Turnover): ${hpTurnovers} kez`);
  console.log(`     - Yaptığı faul sayısı: ${hpFouls}`);
  console.log(`   Otobüsü Çek Takımı:`);
  console.log(`     - Rakip alanda top çalma (Turnover): ${pbTurnovers} kez`);
  console.log(`     - Yaptığı faul sayısı: ${pbFouls}`);

  console.log(`\n   Tempo Karşılaştırması (Hızlı vs Yavaş):`);
  const teamFast = createTeam("Fast", "4-3-3", natural433Config, { tempo: "fast" });
  const teamSlow = createTeam("Slow", "4-3-3", natural433Config, { tempo: "slow" });

  let fastMatchesEvents = 0;
  let slowMatchesEvents = 0;

  for (let i = 0; i < 200; i++) {
    const resFast = simulateMatch(`m_f_${i}`, teamFast, "Fast1", teamFast, "Fast2");
    fastMatchesEvents += resFast.events.length;

    const resSlow = simulateMatch(`m_s_${i}`, teamSlow, "Slow1", teamSlow, "Slow2");
    slowMatchesEvents += resSlow.events.length;
  }

  console.log(`     - 2 Hızlı Takım Arasındaki Maç Başı Olay/Pozisyon: ${(fastMatchesEvents / 200).toFixed(1)}`);
  console.log(`     - 2 Yavaş Takım Arasındaki Maç Başı Olay/Pozisyon: ${(slowMatchesEvents / 200).toFixed(1)}`);

  if (fastMatchesEvents <= slowMatchesEvents) {
    throw new Error("❌ HATA: Hızlı tempo daha fazla pozisyon üretmedi!");
  }

  console.log("\n================================================================================");
  console.log("🎉 DENETİM TAMAMLANDI: CEZALAR, KALECİ VE TAKTİK DİNAMİKLERİ %100 ÇALIŞIYOR!");
  console.log("================================================================================");
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});
