/**
 * Mevcut externalRef değerlerini kaggleId ve wikidataId sütunlarına aktaran tek seferlik script.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("⚡ [ID Senkronizasyonu] Başlatılıyor...");

  const wikidataUpdated = await prisma.$executeRawUnsafe(`
    UPDATE players 
    SET wikidata_id = REPLACE(external_ref, 'wikidata:', '') 
    WHERE external_ref LIKE 'wikidata:%' AND wikidata_id IS NULL;
  `);

  const kaggleUpdated = await prisma.$executeRawUnsafe(`
    UPDATE players 
    SET kaggle_id = external_ref 
    WHERE external_ref NOT LIKE 'wikidata:%' AND external_ref IS NOT NULL AND kaggle_id IS NULL;
  `);

  console.log(`✓ Wikidata ID'si atanan oyuncu sayısı: ${wikidataUpdated}`);
  console.log(`✓ Kaggle ID'si atanan oyuncu sayısı: ${kaggleUpdated}`);
  console.log("🎉 [ID Senkronizasyonu Tamamlandı!]");
}

main()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
