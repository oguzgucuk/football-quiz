import { prisma } from "../lib/db/client";

async function verifyAllIndexes() {
  console.log("\n=================================================");
  console.log("🔍 VERİTABANI İNDEKSLERİ DETAYLI RAPORU");
  console.log("=================================================\n");

  try {
    const indexes: any[] = await prisma.$queryRawUnsafe(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('players', 'teams', 'player_team_history')
      ORDER BY tablename, indexname;
    `);

    console.table(
      indexes.map((idx) => ({
        Tablo: idx.tablename,
        İndeks: idx.indexname,
        Tanım: idx.indexdef,
      }))
    );

    const ext: any[] = await prisma.$queryRawUnsafe(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_trgm';
    `);
    console.log("\nAktif Eklentiler:", ext);
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllIndexes();
