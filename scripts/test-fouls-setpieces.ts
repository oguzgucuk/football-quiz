/**
 * Faul ve Duran Top (Set Piece) Test ve Doğrulama Scripti.
 * 1,000 maç simüle ederek penaltı, serbest vuruş, korner stoper tehditleri ve faullerin
 * istatistiksel dağılımını ve spiker anlatımlarını test eder.
 */

import { simulateMatch } from "../lib/auction/simulateMatch";
import { TeamLineup, TeamTactics } from "../lib/auction/auctionTypes";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers } from "../lib/auction/positionSuitability";

function createTeam(userId: string, ovr: number, tactics?: Partial<TeamTactics>): TeamLineup {
  const slots = createInitialSlotsForFormation("4-3-3");
  slots.forEach((s) => {
    s.placedPlayer = {
      id: `p_${userId}_${s.slotId}`,
      fullName: `${s.targetPosition} Oyuncu (${userId})`,
      overallPrime: ovr,
      positions: [s.targetPosition],
    };
    s.effectiveRating = ovr;
  });
  const lineup = calculateLineupPowers(userId, "4-3-3", slots);
  lineup.tactics = {
    tempo: tactics?.tempo || "balanced",
    buildUp: tactics?.buildUp || "balanced",
    pressing: tactics?.pressing || "balanced",
    attackDirection: tactics?.attackDirection || "balanced",
  };
  return lineup;
}

async function run() {
  console.log("===============================================================");
  console.log("🎯 FAUL VE DURAN TOP SİSTEMİ TESTİ (1,000 Maç)");
  console.log("===============================================================\n");

  const teamA = createTeam("A", 82, { pressing: "high_press", tempo: "fast" });
  const teamB = createTeam("B", 80, { buildUp: "short_pass", tempo: "balanced" });

  let totalPenaltiesAwarded = 0;
  let totalPenaltyGoals = 0;
  let totalPenaltySaves = 0;
  let totalFreeKicksAwarded = 0;
  let totalFreeKickGoals = 0;
  let totalCornerGoals = 0;
  let totalCbCornerThreats = 0;
  let totalFouls = 0;
  let totalYellowCards = 0;
  const sampleEvents: string[] = [];

  const matchCount = 1000;

  for (let i = 0; i < matchCount; i++) {
    const res = simulateMatch(`m_${i}`, teamA, "Galatasaray", teamB, "Fenerbahçe");

    res.events.forEach((ev) => {
      if (ev.type === "penalty") {
        totalPenaltiesAwarded++;
        if (sampleEvents.length < 5) sampleEvents.push(`⏱️ [${ev.minute}'] (PENALTI) ${ev.description}`);
      }
      if (ev.type === "free_kick") {
        totalFreeKicksAwarded++;
        if (sampleEvents.length < 5) sampleEvents.push(`⏱️ [${ev.minute}'] (FRİKİK) ${ev.description}`);
      }
      if (ev.type === "foul") {
        totalFouls++;
      }
      if (ev.description.includes("sarı kart")) {
        totalYellowCards++;
      }
      if (ev.description.includes("PENALTIDAN GOL") || ev.description.includes("penaltı noktasında hata yapmadı")) {
        totalPenaltyGoals++;
      }
      if (ev.description.includes("PENALTI KAÇTI") || ev.description.includes("penaltıda köşeyi bildi")) {
        totalPenaltySaves++;
      }
      if (ev.description.includes("FRİKİK GOLÜ") || ev.description.includes("BÖYLE BİR GOL YOK")) {
        totalFreeKickGoals++;
      }
      if (ev.type === "corner" && ev.description.includes("kule stoper")) {
        totalCbCornerThreats++;
      }
      if (ev.type === "goal" && ev.description.includes("KÖŞE VURUŞU")) {
        totalCornerGoals++;
      }
    });
  }

  console.log(`📊 1,000 MAÇLIK DURAN TOP VE FAUL İSTATİSTİKLERİ:`);
  console.log(`- Toplam Faul: ${totalFouls} (Ortalama: ${(totalFouls / matchCount).toFixed(2)} faul/maç)`);
  console.log(`- Çıkan Sarı Kart: ${totalYellowCards} (Ortalama: ${(totalYellowCards / matchCount).toFixed(2)} kart/maç)`);
  console.log(`- Kazanılan Penaltı: ${totalPenaltiesAwarded} (Ortalama: ${(totalPenaltiesAwarded / matchCount).toFixed(2)} penaltı/maç, %${((totalPenaltiesAwarded / matchCount) * 100).toFixed(1)} maçta penaltı)`);
  console.log(`  └ Penaltı Golü: ${totalPenaltyGoals} (Dönüşüm Oranı: %${totalPenaltiesAwarded > 0 ? ((totalPenaltyGoals / totalPenaltiesAwarded) * 100).toFixed(1) : 0})`);
  console.log(`  └ Penaltı Kurtarışı: ${totalPenaltySaves}`);
  console.log(`- Tehlikeli Frikik: ${totalFreeKicksAwarded} (Ortalama: ${(totalFreeKicksAwarded / matchCount).toFixed(2)} frikik/maç)`);
  console.log(`  └ Frikik Golü: ${totalFreeKickGoals}`);
  console.log(`- Stoperlerin İleri Çıktığı Kornerler: ${totalCbCornerThreats}`);
  console.log(`- Korner Golleri: ${totalCornerGoals}\n`);

  console.log("🎙️ ÖRNEK SPİKER ANLATIMLARI:");
  sampleEvents.forEach((se) => console.log(`  ${se}`));

  console.log("\n===============================================================");
  console.log("🎉 FAUL VE DURAN TOP SİSTEMİ TESTİ BAŞARIYLA TAMAMLANDI!");
  console.log("===============================================================");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
