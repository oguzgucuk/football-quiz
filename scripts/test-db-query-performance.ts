import { prisma } from "../lib/db/client";

async function testQueryPerformance() {
  console.log("\n=================================================");
  console.log("⚡ VERİTABANI SORGULARI & İNDEKS PERFORMANS TESTİ");
  console.log("=================================================\n");

  try {
    // 1. Test: pg_trgm GIN Index Testi (players tablosunda ILIKE araması)
    console.log("1. Test: players tablosunda GIN trgm indeksi ile ILIKE araması:");
    const t1Start = performance.now();
    const trgmPlayerResults: any[] = await prisma.$queryRawUnsafe(`
      EXPLAIN ANALYZE 
      SELECT id, full_name, popularity_score 
      FROM players 
      WHERE full_name ILIKE '%Ronaldo%' 
      LIMIT 10;
    `);
    const t1Duration = (performance.now() - t1Start).toFixed(2);
    console.log(`   ⏱️ Süre: ${t1Duration} ms`);
    console.log("   Execution Plan (Özet):", trgmPlayerResults[0]["QUERY PLAN"]);

    // 2. Test: teams tablosunda GIN trgm indeksi ile ILIKE araması
    console.log("\n2. Test: teams tablosunda GIN trgm indeksi ile ILIKE araması:");
    const t2Start = performance.now();
    const trgmTeamResults: any[] = await prisma.$queryRawUnsafe(`
      EXPLAIN ANALYZE 
      SELECT id, name, popularity_score 
      FROM teams 
      WHERE name ILIKE '%Madrid%' 
      LIMIT 5;
    `);
    const t2Duration = (performance.now() - t2Start).toFixed(2);
    console.log(`   ⏱️ Süre: ${t2Duration} ms`);
    console.log("   Execution Plan (Özet):", trgmTeamResults[0]["QUERY PLAN"]);

    // 3. Test: PlayerTeamHistory B-Tree team_id indeksi ile ortak oyuncu sorgusu
    console.log("\n3. Test: İki kulübün ortak oyuncu araması (Real Madrid vs Barcelona):");
    const t3Start = performance.now();
    const commonPlayers = await prisma.player.findMany({
      where: {
        teamsHistory: { some: { teamId: "cmtfrb40e00dtu6k4wklez572" } }, // Real Madrid
        AND: [{ teamsHistory: { some: { teamId: "cmtfrb40c003au6k4nfn56sus" } } }], // Barcelona
      },
      select: {
        id: true,
        fullName: true,
      },
    });
    const t3Duration = (performance.now() - t3Start).toFixed(2);
    console.log(`   ⏱️ Süre: ${t3Duration} ms`);
    console.log(`   ✅ Bulunan Ortak Oyuncular (${commonPlayers.length}):`, commonPlayers.map((p) => p.fullName).slice(0, 5));

    // 4. Test: B-tree popularityScore sıralama sorgusu
    console.log("\n4. Test: En popüler oyuncular sıralaması (B-Tree popularity_score):");
    const t4Start = performance.now();
    const topPopular = await prisma.player.findMany({
      orderBy: { popularityScore: "desc" },
      take: 5,
      select: { fullName: true, popularityScore: true },
    });
    const t4Duration = (performance.now() - t4Start).toFixed(2);
    console.log(`   ⏱️ Süre: ${t4Duration} ms`);
    console.log("   ✅ Top Oyuncular:", topPopular);

    console.log("\n=================================================");
    console.log("🎉 TÜM VERİTABANI İNDEKS TESTLERİ BAŞARIYLA TAMAMLANDI!");
    console.log("=================================================\n");
  } catch (err) {
    console.error("Test hatası:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testQueryPerformance();
