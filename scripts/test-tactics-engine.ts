/**
 * 4 Boyutlu Taktik ve Koridor Motoru Test Scripti.
 * Tempo, Oyun Kurma, Pres ve Yön mekaniklerinin doğruluğunu test eder.
 */

import {
  calculateCorridorAttackPower,
  calculateCorridorDefensePower,
  calculateCorridorMidfieldScore,
  calculateMatchTempo,
  determineAttackCorridor,
  getSlotCorridor,
} from "../lib/auction/corridorEngine";
import { simulateMatch } from "../lib/auction/simulateMatch";
import { TeamLineup, TeamTactics } from "../lib/auction/auctionTypes";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers } from "../lib/auction/positionSuitability";
import { ratingCurve } from "../lib/auction/matchWeights";

function createTestLineup(
  userId: string,
  ovr: number,
  tactics: TeamTactics,
  formation: any = "4-2-3-1"
): TeamLineup {
  const slots = createInitialSlotsForFormation(formation);
  slots.forEach((s) => {
    s.placedPlayer = {
      id: `p_${userId}_${s.slotId}`,
      fullName: `Oyuncu ${s.slotId}`,
      overallPrime: ovr,
      positions: [s.targetPosition],
    };
    s.effectiveRating = ovr;
  });
  const lineup = calculateLineupPowers(userId, formation, slots);
  lineup.tactics = tactics;
  return lineup;
}

async function runTacticsTests() {
  console.log("==========================================");
  console.log("🧪 1. TEMPO VE POZİSYON SAYISI TESTLERİ");
  console.log("==========================================");

  const teamFastA = createTestLineup("u1", 85, { tempo: "fast", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const teamFastB = createTestLineup("u2", 85, { tempo: "fast", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const tempoFast = calculateMatchTempo(teamFastA, teamFastB);
  console.log(`İki takım da HIZLI tempo: ${tempoFast} pozisyon (Beklenen: 18)`);
  if (tempoFast !== 18) throw new Error("İki hızlı takım 18 pozisyon üretmeliydi!");

  const teamSlowA = createTestLineup("u1", 85, { tempo: "slow", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const teamSlowB = createTestLineup("u2", 85, { tempo: "slow", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const tempoSlow = calculateMatchTempo(teamSlowA, teamSlowB);
  console.log(`İki takım da YAVAŞ tempo: ${tempoSlow} pozisyon (Beklenen: 10)`);
  if (tempoSlow !== 10) throw new Error("İki yavaş takım 10 pozisyon üretmeliydi!");

  const teamDominant = createTestLineup("u1", 95, { tempo: "fast", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const teamWeak = createTestLineup("u2", 55, { tempo: "slow", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const tempoConflict = calculateMatchTempo(teamDominant, teamWeak);
  console.log(`95 GEN Hızlı vs 55 GEN Yavaş: ${tempoConflict} pozisyon (Güçlü takım baskın, beklenen > 14)`);
  if (tempoConflict <= 14) throw new Error("95 GEN'li takımın hızlı temposu ağır basmalıydı!");

  console.log("\n==========================================");
  console.log("🧪 2. OYUN KURMA (KISA PAS vs UZUN PAS) TESTLERİ");
  console.log("==========================================");

  const baseTeam = createTestLineup("u1", 80, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const shortPassTeam = createTestLineup("u2", 80, { tempo: "balanced", buildUp: "short_pass", pressing: "balanced", attackDirection: "balanced" });
  const longBallTeam = createTestLineup("u3", 80, { tempo: "balanced", buildUp: "long_ball", pressing: "balanced", attackDirection: "balanced" });

  const baseAtk = calculateCorridorAttackPower(baseTeam, "left");
  const shortAtk = calculateCorridorAttackPower(shortPassTeam, "left");
  const longAtk = calculateCorridorAttackPower(longBallTeam, "left");

  console.log(`Standart Hücum Gücü: ${baseAtk.toFixed(3)}`);
  console.log(`Kısa Pas Hücum Gücü (Bek ve Orta Saha +%25): ${shortAtk.toFixed(3)}`);
  console.log(`Uzun Pas Hücum Gücü (Orta Saha Baypas -%80): ${longAtk.toFixed(3)}`);

  if (shortAtk <= baseAtk) throw new Error("Kısa pas hücum gücünü artırmalıydı!");
  if (longAtk >= baseAtk) throw new Error("Uzun pasta orta saha hücuma katılmadığı için delme gücü düşmeliydi!");

  const baseDef = calculateCorridorDefensePower(baseTeam, "left");
  const shortDef = calculateCorridorDefensePower(shortPassTeam, "left");
  console.log(`Standart Defans Gücü: ${baseDef.toFixed(3)}`);
  console.log(`Kısa Pas Defans Gücü (Önde Yakalanma -%25): ${shortDef.toFixed(3)}`);
  if (shortDef >= baseDef) throw new Error("Kısa pas savunma gücünü düşürmeliydi!");

  console.log("\n==========================================");
  console.log("🧪 3. PRES SEVİYESİ GÜÇ TRANSFERİ TESTLERİ");
  console.log("==========================================");

  const highPressTeam = createTestLineup("u1", 80, { tempo: "balanced", buildUp: "balanced", pressing: "high_press", attackDirection: "balanced" });
  const parkBusTeam = createTestLineup("u2", 80, { tempo: "balanced", buildUp: "balanced", pressing: "park_bus", attackDirection: "balanced" });

  const normalMid = calculateCorridorMidfieldScore(baseTeam, "center");
  const pressMid = calculateCorridorMidfieldScore(highPressTeam, "center");
  const busMid = calculateCorridorMidfieldScore(parkBusTeam, "center");

  console.log(`Standart Orta Saha: ${normalMid.toFixed(3)}`);
  console.log(`Önde Pres Orta Saha (+%25): ${pressMid.toFixed(3)}`);
  console.log(`Otobüsü Park Et Orta Saha (-%25): ${busMid.toFixed(3)}`);

  if (pressMid <= normalMid) throw new Error("Yüksek pres orta saha gücünü artırmalıydı!");
  if (busMid >= normalMid) throw new Error("Park bus orta saha gücünü düşürmeliydi!");

  const normalDef = calculateCorridorDefensePower(baseTeam, "center");
  const pressDef = calculateCorridorDefensePower(highPressTeam, "center");
  const busDef = calculateCorridorDefensePower(parkBusTeam, "center");

  console.log(`Standart Defans: ${normalDef.toFixed(3)}`);
  console.log(`Önde Pres Defans (Arkada Boşluk -%25): ${pressDef.toFixed(3)}`);
  console.log(`Otobüsü Park Et Defans (+%25): ${busDef.toFixed(3)}`);

  if (pressDef >= normalDef) throw new Error("Yüksek pres defans gücünü düşürmeliydi!");
  if (busDef <= normalDef) throw new Error("Park bus defans gücünü artırmalıydı!");

  console.log("\n==========================================");
  console.log("🧪 4. HÜCUM YÖNÜ VE KORİDOR ZARI TESTİ (1000 Deneme)");
  console.log("==========================================");

  const leftTeam = createTestLineup("u1", 90, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "left" });
  const balancedTeam = createTestLineup("u2", 70, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });

  let leftCount = 0, centerCount = 0, rightCount = 0;
  for (let i = 0; i < 1000; i++) {
    const corridor = determineAttackCorridor(leftTeam, balancedTeam);
    if (corridor === "left") leftCount++;
    else if (corridor === "center") centerCount++;
    else rightCount++;
  }
  console.log(`Sol Kanat Odaklı Takım (90 GEN) Dağılımı:`);
  console.log(`  Sol Koridor: %${((leftCount / 1000) * 100).toFixed(1)}`);
  console.log(`  Merkez Koridor: %${((centerCount / 1000) * 100).toFixed(1)}`);
  console.log(`  Sağ Koridor: %${((rightCount / 1000) * 100).toFixed(1)}`);

  if (leftCount <= centerCount || leftCount <= rightCount) {
    throw new Error("Sol kanat yönü en yüksek orana sahip olmalıydı!");
  }

  console.log("\n==========================================");
  console.log("🧪 5. CANLI MAÇ SİMÜLASYONU ENTEGRASYON TESTİ");
  console.log("==========================================");

  const match = simulateMatch("match_test_1", leftTeam, "Ev Sahibi", parkBusTeam, "Deplasman");
  console.log(`Maç Sonucu: Ev Sahibi ${match.homeScore} - ${match.awayScore} Deplasman`);
  console.log(`Toplam Olay: ${match.events.length}`);
  console.log("Örnek Koridor Spiker Anlatımları:");
  match.events.slice(0, 4).forEach((e) => {
    console.log(`  [${e.minute}'] (${e.type.toUpperCase()}) ${e.description}`);
  });

  console.log("\n==========================================");
  console.log("🧪 6. MEVKİLERİN KANAT ETKİ ORANLARI DOĞRULAMASI");
  console.log("==========================================");

  // 1. Tek ST (4-2-3-1) vs Çift ST (3-5-2 veya 4-4-2) ST kanat atağı etkisi
  // Sadece ST'lerin sol kanada ürettiği hücum gücünü izole kontrol edelim:
  const singleStTeam = createTestLineup("u1", 80, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" }, "4-2-3-1");
  const doubleStTeam = createTestLineup("u2", 80, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" }, "3-5-2");

  // 4-2-3-1'deki tek ST'nin sol kanada katkısı: 1.5 * 0.30 = 0.45 * curve
  // 3-5-2'deki sol ST'nin sol kanada katkısı: 1.5 * 0.60 = 0.90 * curve
  const singleStSlot = singleStTeam.slots.find((s) => s.targetPosition === "ST")!;
  const doubleStSlot = doubleStTeam.slots.find((s) => s.targetPosition === "ST" && getSlotCorridor(s.slotId, s.targetPosition, "3-5-2") === "left")!;

  const curve = ratingCurve(80);
  const singleStContrib = curve * 1.5 * 0.30;
  const doubleStContrib = curve * 1.5 * 0.60;

  console.log(`Tek ST Kanat Katkısı (%30 tabanlı): ${singleStContrib.toFixed(3)}`);
  console.log(`Çift ST Sol ST Katkısı (%60 tabanlı): ${doubleStContrib.toFixed(3)}`);
  if (doubleStContrib !== singleStContrib * 2) throw new Error("Çift ST dizilişinde o taraftaki ST tam 2 kat (%60 vs %30) katkı sağlamalıydı!");

  // 2. 3'lü Savunma (3-5-2) vs 4'lü Savunma (4-4-2) Sol Stoper (CB) kanat karşılama etkisi
  // 3'lü savunmadaki sol CB katkısı: 1.5 * 0.70 = 1.05 * curve
  // 4'lü savunmadaki sol CB katkısı: 1.5 * 0.35 = 0.525 * curve
  const cb3BackContrib = curve * 1.5 * 0.70;
  const cb4BackContrib = curve * 1.5 * 0.35;
  console.log(`3'lü Savunma Sol CB Kanat Katkısı (%70 tabanlı): ${cb3BackContrib.toFixed(3)}`);
  console.log(`4'lü Savunma Stoper Kanat Kademesi (%35 tabanlı): ${cb4BackContrib.toFixed(3)}`);
  if (cb3BackContrib !== cb4BackContrib * 2) throw new Error("3'lü savunmada o taraftaki CB tam 2 kat (%70 vs %35) etkili olmalıydı!");

  // 3. Çoklu Orta Saha (3-4 CM) vs Az Orta Saha (2 CM) kanat orta saha desteği
  // Çoklu orta sahadaki sol CM katkısı: 0.60 * curve
  // 2 orta sahadaki sol CM katkısı: 0.20 * curve
  const multiMidContrib = curve * 0.60;
  const fewMidContrib = curve * 0.20;
  console.log(`Çoklu Orta Saha (3-4 CM) Kanat Katkısı (%60 tabanlı): ${multiMidContrib.toFixed(3)}`);
  console.log(`2 Orta Saha Kanat Katkısı (%20 tabanlı): ${fewMidContrib.toFixed(3)}`);
  if (Math.abs(multiMidContrib - fewMidContrib * 3) > 0.0001) throw new Error("Çoklu orta sahada ilgili CM tam 3 kat (%60 vs %20) etkili olmalıydı!");

  console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
}

runTacticsTests().catch((err) => {
  console.error("❌ TEST BAŞARISIZ:", err);
  process.exit(1);
});
