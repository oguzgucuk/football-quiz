import { prisma } from "../lib/db/client";

async function applyIndexes() {
  console.log("\n=================================================");
  console.log("⚡ POSTGRESQL PG_TRGM & GIN İNDEKSLERİNİ UYGULAMA");
  console.log("=================================================\n");

  try {
    // 1. pg_trgm eklentisi
    console.log("1. pg_trgm eklentisi etkinleştiriliyor...");
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log("   ✅ pg_trgm eklentisi aktif.");

    // 2. players.full_name GIN trgm indeksi
    console.log("2. players (full_name) GIN trgm indeksi oluşturuluyor...");
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_players_fullname_trgm ON players USING GIN (full_name gin_trgm_ops);`
    );
    console.log("   ✅ idx_players_fullname_trgm oluşturuldu.");

    // 3. teams.name GIN trgm indeksi
    console.log("3. teams (name) GIN trgm indeksi oluşturuluyor...");
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_teams_name_trgm ON teams USING GIN (name gin_trgm_ops);`
    );
    console.log("   ✅ idx_teams_name_trgm oluşturuldu.");

    // 4. Doğrulama: pg_indexes tablosundan kontrol et
    console.log("\n4. Veritabanındaki indeksler doğrulanıyor...");
    const indexes: any[] = await prisma.$queryRawUnsafe(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE indexname IN ('idx_players_fullname_trgm', 'idx_teams_name_trgm');
    `);

    console.table(indexes);

    const extensions: any[] = await prisma.$queryRawUnsafe(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_trgm';
    `);
    console.log("\nEklenti Durumu:", extensions);

    console.log("\n🎉 Tüm GIN/pg_trgm indeksleri başarıyla uygulandı!\n");
  } catch (error) {
    console.error("❌ İndeks oluşturma hatası:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();
