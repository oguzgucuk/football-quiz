import { prisma } from "../lib/db/client";

async function verifyCounts() {
  console.log("=== DOĞRULAMA 2: VERİTABANI SORGULARI ===");

  // 1. Toplam transfer/kariyer sayısı
  const totalHistory = await prisma.playerTeamHistory.count();
  console.log(`1. player_team_history toplam satır sayısı: ${totalHistory}`);

  const totalPlayers = await prisma.player.count();
  console.log(`2. player toplam satır sayısı: ${totalPlayers}`);

  const totalTeams = await prisma.team.count();
  console.log(`3. team toplam satır sayısı: ${totalTeams}`);

  // 2. Duplicate kayıt kontrolü (player_id, team_id, season_start)
  const duplicates: any[] = await prisma.$queryRaw`
    SELECT player_id, team_id, season_start, COUNT(*)::int as count 
    FROM player_team_history 
    GROUP BY player_id, team_id, season_start 
    HAVING COUNT(*) > 1
    LIMIT 20;
  `;
  console.log(`4. Duplicate (player_id, team_id, season_start) sayısı: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log("   Örnek duplicateler:", duplicates.slice(0, 5));
  }

  // Duplicate kayıt kontrolü (player_id, team_id genel)
  const teamPlayerDuplicates: any[] = await prisma.$queryRaw`
    SELECT player_id, team_id, COUNT(*)::int as count 
    FROM player_team_history 
    GROUP BY player_id, team_id 
    HAVING COUNT(*) > 1
    LIMIT 20;
  `;
  console.log(`4b. Aynı oyuncu - aynı takım çoklu dönem sayısı (örn: kiralık gidip dönenler): ${teamPlayerDuplicates.length}`);

  // 3. analyze-data-coverage.ts'deki mantığı test et
  const rawHist: any[] = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN season_start >= 2021 THEN '2021-2026'
        WHEN season_start >= 2018 THEN '2018-2020'
        WHEN season_start >= 2010 THEN '2010-2017'
        WHEN season_start >= 2000 THEN '2000-2009'
        ELSE '2000 Öncesi'
      END as period,
      COUNT(*)::int as count
    FROM player_team_history
    GROUP BY 1
    ORDER BY MIN(season_start) DESC;
  `;
  console.log("5. Gerçek Dönem Histogramı:", rawHist);

  const histSum = rawHist.reduce((acc, r) => acc + Number(r.count), 0);
  console.log(`6. Histogram Toplamı: ${histSum}`);

  await prisma.$disconnect();
}

verifyCounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
