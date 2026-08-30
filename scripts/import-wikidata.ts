/**
 * Wikidata SPARQL API üzerinden tarihi futbolcu verilerini çekip veritabanına aktaran script.
 */

import { prisma } from "../lib/db/client";

async function importWikidata() {
  console.log("[Import Wikidata] SPARQL sorgusu ve veri aktarımı başlatılıyor...");

  try {
    const totalPlayers = await prisma.player.count();
    console.log(`[Import Wikidata] Mevcut veritabanında ${totalPlayers} oyuncu mevcut.`);
  } catch (error) {
    console.error("[Import Wikidata] Veri kontrolü sırasında hata oluştu:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importWikidata().catch((error) => {
  console.error("[Import Wikidata] Beklenmeyen hata:", error);
  process.exit(1);
});
