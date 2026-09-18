/**
 * 4 Boyutlu Taktik ve 9 Bölge Motoru Test Scripti.
 * Tempo, Oyun Kurma, Pres ve Yön mekaniklerinin doğruluğunu test eder.
 */

import {
  calculateZonePossessionPower,
  calculateZoneStealPower,
} from "../lib/auction/zonePowers";
import {
  calculateMatchTempo,
  pickNextCorridor,
  getPositionZoneWeight,
} from "../lib/auction/zoneGrid";
import { simulateMatch } from "../lib/auction/simulateMatch";
import { resolveNextState } from "../lib/auction/matchStateMachine";
import { FormationName, TeamLineup, TeamTactics } from "../lib/auction/auctionTypes";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers } from "../lib/auction/positionSuitability";
import { ratingCurve } from "../lib/auction/matchWeights";

function createTestLineup(
  userId: string,
  ovr: number,
  tactics: TeamTactics,
  formation: FormationName = "4-3-3"
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
  console.log(`İki takım da HIZLI tempo: ${tempoFast} pozisyon (Beklenen: 24)`);
  if (tempoFast !== 24) throw new Error("İki hızlı takım 24 pozisyon üretmeliydi!");

  const teamSlowA = createTestLineup("u1", 85, { tempo: "slow", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const teamSlowB = createTestLineup("u2", 85, { tempo: "slow", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const tempoSlow = calculateMatchTempo(teamSlowA, teamSlowB);
  console.log(`İki takım da YAVAŞ tempo: ${tempoSlow} pozisyon (Beklenen: 16)`);
  if (tempoSlow !== 16) throw new Error("İki yavaş takım 16 pozisyon üretmeliydi!");

  const teamDominant = createTestLineup("u1", 95, { tempo: "fast", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const teamWeak = createTestLineup("u2", 55, { tempo: "slow", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const tempoConflict = calculateMatchTempo(teamDominant, teamWeak);
  console.log(`95 GEN Hızlı vs 55 GEN Yavaş: ${tempoConflict} pozisyon (Güçlü takım baskın, beklenen > 20)`);
  if (tempoConflict <= 20) throw new Error("95 GEN'li takımın hızlı temposu ağır basmalıydı!");

  console.log("\n==========================================");
  console.log("🧪 2. OYUN KURMA (KISA PAS vs UZUN PAS) TESTLERİ");
  console.log("==========================================");

  const baseTeam = createTestLineup("u1", 80, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });
  const shortPassTeam = createTestLineup("u2", 80, { tempo: "balanced", buildUp: "short_pass", pressing: "balanced", attackDirection: "balanced" });
  const longBallTeam = createTestLineup("u3", 80, { tempo: "balanced", buildUp: "long_ball", pressing: "balanced", attackDirection: "balanced" });

  const baseAtk = calculateZonePossessionPower(baseTeam, "att_left");
  const shortAtk = calculateZonePossessionPower(shortPassTeam, "att_left");
  const longAtk = calculateZonePossessionPower(longBallTeam, "att_left");

  console.log(`Standart Hücum Gücü (att_left): ${baseAtk.toFixed(3)}`);
  console.log(`Kısa Pas Hücum Gücü (Forvetler Nerf: 0.85x, Orta Saha Buff): ${shortAtk.toFixed(3)}`);
  console.log(`Uzun Pas Hücum Gücü (Orta Saha Baypas: 0.30x, Forvet Buff): ${longAtk.toFixed(3)}`);

  if (shortAtk >= baseAtk) throw new Error("Kısa pasta direkt bitirici hücum gücü nerf yemeliydi!");
  if (longAtk >= baseAtk) throw new Error("Uzun pasta orta saha hücuma katılmadığı için delme gücü düşmeliydi!");

  const baseDef = calculateZoneStealPower(baseTeam, "def_left");
  const shortDef = calculateZoneStealPower(shortPassTeam, "def_left");
  console.log(`Standart Defans Gücü (def_left): ${baseDef.toFixed(3)}`);
  console.log(`Kısa Pas Defans Gücü (%5 Takım Nerf'ü): ${shortDef.toFixed(3)}`);
  if (Math.abs(shortDef - baseDef * 0.95) > 0.001) throw new Error("Kısa pas savunma gücüne %5 nerf uygulanmalı!");

  console.log("\n==========================================");
  console.log("🧪 3. PRES SEVİYESİ GÜÇ TRANSFERİ TESTLERİ");
  console.log("==========================================");

  const highPressTeam = createTestLineup("u1", 80, { tempo: "balanced", buildUp: "balanced", pressing: "high_press", attackDirection: "balanced" });
  const parkBusTeam = createTestLineup("u2", 80, { tempo: "balanced", buildUp: "balanced", pressing: "park_bus", attackDirection: "balanced" });

  const normalMid = calculateZoneStealPower(baseTeam, "mid_center");
  const pressMid = calculateZoneStealPower(highPressTeam, "mid_center");
  const busMid = calculateZoneStealPower(parkBusTeam, "mid_center");

  console.log(`Standart Orta Saha (mid_center): ${normalMid.toFixed(3)}`);
  console.log(`Önde Pres Orta Saha (+%25): ${pressMid.toFixed(3)}`);
  console.log(`Otobüsü Park Et Orta Saha (-%30): ${busMid.toFixed(3)}`);

  if (pressMid <= normalMid) throw new Error("Yüksek pres orta saha gücünü artırmalıydı!");
  if (busMid >= normalMid) throw new Error("Park bus orta saha gücünü düşürmeliydi!");

  const normalDef = calculateZoneStealPower(baseTeam, "def_center");
  const pressDef = calculateZoneStealPower(highPressTeam, "def_center");
  const busDef = calculateZoneStealPower(parkBusTeam, "def_center");

  console.log(`Standart Defans (def_center): ${normalDef.toFixed(3)}`);
  console.log(`Önde Pres Defans (Arkada Boşluk -%25): ${pressDef.toFixed(3)}`);
  console.log(`Otobüsü Park Et Defans (+%40): ${busDef.toFixed(3)}`);

  if (pressDef >= normalDef) throw new Error("Yüksek pres defans gücünü düşürmeliydi!");
  if (busDef <= normalDef) throw new Error("Park bus defans gücünü artırmalıydı!");

  console.log("\n==========================================");
  console.log("🧪 4. HÜCUM YÖNÜ VE KORİDOR SEÇİMİ TESTİ (1000 Deneme)");
  console.log("==========================================");

  const leftTeam = createTestLineup("u1", 90, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "left" });

  let leftCount = 0, centerCount = 0, rightCount = 0;
  for (let i = 0; i < 1000; i++) {
    const corridor = pickNextCorridor("center", leftTeam.tactics);
    if (corridor === "left") leftCount++;
    else if (corridor === "center") centerCount++;
    else rightCount++;
  }
  console.log(`Sol Kanat Odaklı Takım Dağılımı (Merkezden sonraki adım):`);
  console.log(`  Sol Koridor: %${((leftCount / 1000) * 100).toFixed(1)}`);
  console.log(`  Merkez Koridor: %${((centerCount / 1000) * 100).toFixed(1)}`);
  console.log(`  Sağ Koridor: %${((rightCount / 1000) * 100).toFixed(1)}`);

  if (leftCount <= centerCount || leftCount <= rightCount) {
    throw new Error("Sol kanat yönü en yüksek orana sahip olmalıydı!");
  }

  // Kanatlar (Wings) Testi
  const wingsTeam = createTestLineup("u3", 90, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "wings" });
  let wLeft = 0, wCenter = 0, wRight = 0;
  for (let i = 0; i < 1000; i++) {
    const corridor = pickNextCorridor("center", wingsTeam.tactics);
    if (corridor === "left") wLeft++;
    else if (corridor === "center") wCenter++;
    else wRight++;
  }
  console.log(`\nKanatlar (Wings) Odaklı Takım Dağılımı:`);
  console.log(`  Sol Koridor: %${((wLeft / 1000) * 100).toFixed(1)}`);
  console.log(`  Sağ Koridor: %${((wRight / 1000) * 100).toFixed(1)}`);
  console.log(`  Merkez Koridor: %${((wCenter / 1000) * 100).toFixed(1)}`);

  if (wCenter !== 0 || (wLeft + wRight) !== 1000) {
    throw new Error("Kanatlar taktiği merkezden atağı mutlaka iki kanattan birine açmalıdır!");
  }

  console.log("\n==========================================");
  console.log("🧪 5. CANLI MAÇ SİMÜLASYONU ENTEGRASYON TESTİ");
  console.log("==========================================");

  const match = simulateMatch("match_test_1", leftTeam, "Ev Sahibi", parkBusTeam, "Deplasman");
  console.log(`Maç Sonucu: Ev Sahibi ${match.homeScore} - ${match.awayScore} Deplasman`);
  console.log(`Toplam Olay: ${match.events.length}`);
  console.log("Örnek Spiker Anlatımları:");
  match.events.slice(0, 4).forEach((e) => {
    console.log(`  [${e.minute}'] (${e.type.toUpperCase()}) ${e.description}`);
  });

  console.log("\n==========================================");
  console.log("🧪 6. 9 BÖLGELİ MEVKİ DOĞAL ETKİNLİK KATSAYILARI (zoneGrid)");
  console.log("==========================================");

  // ST santrafor ağırlıkları
  const stCenter = getPositionZoneWeight("ST", "att_center");
  const stWing = getPositionZoneWeight("ST", "att_left");
  const stMid = getPositionZoneWeight("ST", "mid_center");
  console.log(`ST Doğal Etkinlikleri -> att_center: ${stCenter}, att_left: ${stWing}, mid_center: ${stMid}`);
  if (stCenter !== 1.0 || stWing !== 0.50 || stMid !== 0.20) {
    throw new Error("ST bölge ağırlıkları beklenen değerlerle uyuşmuyor!");
  }

  // CB stoper ağırlıkları
  const cbCenter = getPositionZoneWeight("CB", "def_center");
  const cbWing = getPositionZoneWeight("CB", "def_left");
  console.log(`CB Doğal Etkinlikleri -> def_center: ${cbCenter}, def_left: ${cbWing}`);
  if (cbCenter !== 1.0 || cbWing !== 0.40) {
    throw new Error("CB bölge ağırlıkları beklenen değerlerle uyuşmuyor!");
  }

  // CM orta saha ağırlıkları
  const cmCenter = getPositionZoneWeight("CM", "mid_center");
  const cmWing = getPositionZoneWeight("CM", "mid_left");
  console.log(`CM Doğal Etkinlikleri -> mid_center: ${cmCenter}, mid_left: ${cmWing}`);
  if (cmCenter !== 1.0 || cmWing !== 0.65) {
    throw new Error("CM bölge ağırlıkları beklenen değerlerle uyuşmuyor!");
  }

  console.log("\n==========================================");
  console.log("🧪 7. UZAKTAN ŞUT & 'KALEYİ GÖRÜNCE VUR' MOTOR TESTİ");
  console.log("==========================================");

  const shootOnSightTeam = createTestLineup("u1", 80, { tempo: "balanced", buildUp: "shoot_on_sight", pressing: "balanced", attackDirection: "balanced" });
  const normalOpponent = createTestLineup("u2", 80, { tempo: "balanced", buildUp: "balanced", pressing: "balanced", attackDirection: "balanced" });

  let retainedPossessionCount = 0;
  let shootOnSightTriggerCount = 0;
  const N = 1000;
  for (let i = 0; i < N; i++) {
    const res = resolveNextState(
      { possessingTeamUserId: shootOnSightTeam.userId, zone: "mid_center", phase: "midfield_possession", actionCount: 1 },
      10,
      shootOnSightTeam,
      "Ev Sahibi",
      normalOpponent,
      "Deplasman"
    );
    if (res.nextState.possessingTeamUserId === shootOnSightTeam.userId) {
      retainedPossessionCount++;
      if (res.nextState.phase === "finishing" && res.nextState.zone === "mid_center") {
        shootOnSightTriggerCount++;
      }
    }
  }

  const triggerPct = (shootOnSightTriggerCount / retainedPossessionCount) * 100;
  console.log(`Kaleyi Görünce Vur Takımı Topu Koruduğunda mid_center'da Direkt Şut Fazına Geçiş Sıklığı (Beklenen: ~%60): %${triggerPct.toFixed(1)} (${shootOnSightTriggerCount}/${retainedPossessionCount})`);

  if (triggerPct < 52 || triggerPct > 68) {
    throw new Error(`Kaleyi görünce vur direkt şut sıklığı %60 civarı olmalıydı! (Çıkan: %${triggerPct})`);
  }

  console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
}

runTacticsTests().catch((err) => {
  console.error("❌ TEST BAŞARISIZ:", err);
  process.exit(1);
});
