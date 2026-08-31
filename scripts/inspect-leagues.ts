import { prisma } from "../lib/db/client";

async function inspectLeagues() {
  console.log("🔍 Veritabanındaki Tüm Ligler ve Ülkeler Analiz Ediliyor...\n");

  const teams = await prisma.team.findMany({
    select: {
      country: true,
      league: true,
    },
  });

  // Lig ve ülke istatistiği
  const leagueCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};

  for (const t of teams) {
    const l = t.league || "Bilinmiyor";
    const c = t.country || "Bilinmiyor";
    leagueCounts[l] = (leagueCounts[l] || 0) + 1;
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  }

  console.log("🏆 LİGLER VE TAKIM SAYILARI:");
  const sortedLeagues = Object.entries(leagueCounts).sort((a, b) => b[1] - a[1]);
  for (const [league, count] of sortedLeagues) {
    console.log(`  - ${league}: ${count} takım`);
  }

  console.log("\n🌍 ÜLKELER VE TAKIM SAYILARI:");
  const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  for (const [country, count] of sortedCountries) {
    console.log(`  - ${country}: ${count} takım`);
  }
}

inspectLeagues()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
