/**
 * Kaggle Transfermarkt veri setini parse edip Postgres veritabanına aktaran script.
 */

import { prisma } from "../lib/db/client";

async function importKaggleData() {
  console.log("[Import Kaggle] Kaggle veri aktarımı başlatılıyor...");

  // İlerleyen aşamalarda Kaggle CSV parse ve toplu upsert mantığı buraya eklenecek
  try {
    const totalTeams = await prisma.team.count();
    const totalPlayers = await prisma.player.count();
    console.log(`[Import Kaggle] Mevcut durum: ${totalTeams} takım, ${totalPlayers} oyuncu.`);
  } catch (error) {
    console.error("[Import Kaggle] Veri kontrolü sırasında hata oluştu:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importKaggleData().catch((error) => {
  console.error("[Import Kaggle] Beklenmeyen hata:", error);
  process.exit(1);
});
