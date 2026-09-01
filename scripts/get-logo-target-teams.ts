import { prisma } from "../lib/db/client";

export const TARGET_LEAGUES_BY_COUNTRY: Record<string, string[]> = {
  "United Kingdom": ["premier-league", "championship"],
  Spain: ["laliga"],
  Italy: ["serie-a", "Serie A"],
  Germany: ["bundesliga"],
  France: ["ligue-1"],
  Turkey: ["super-lig"],
};

export async function getTargetTeams() {
  const leagueFilters = Object.entries(TARGET_LEAGUES_BY_COUNTRY).map(([country, leagues]) => ({
    country,
    league: { in: leagues },
  }));

  const topLeaguesTeams = await prisma.team.findMany({
    where: {
      OR: leagueFilters,
    },
    select: {
      id: true,
      name: true,
      country: true,
      league: true,
      popularityScore: true,
      logoUrl: true,
      externalRef: true,
      aliases: true,
    },
    orderBy: { popularityScore: "desc" },
  });

  const topArgentina = await prisma.team.findMany({
    where: { country: "Argentina" },
    orderBy: { popularityScore: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      country: true,
      league: true,
      popularityScore: true,
      logoUrl: true,
      externalRef: true,
      aliases: true,
    },
  });

  const topBrazil = await prisma.team.findMany({
    where: { country: "Brazil" },
    orderBy: { popularityScore: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      country: true,
      league: true,
      popularityScore: true,
      logoUrl: true,
      externalRef: true,
      aliases: true,
    },
  });

  // Unique by ID
  const map = new Map<string, typeof topLeaguesTeams[0]>();
  for (const t of [...topLeaguesTeams, ...topArgentina, ...topBrazil]) {
    map.set(t.id, t);
  }

  return Array.from(map.values());
}

async function main() {
  const targets = await getTargetTeams();
  console.log(`🎯 Toplam Hedef Kulüp Sayısı: ${targets.length}`);
  const byCountry: Record<string, number> = {};
  for (const t of targets) {
    byCountry[t.country] = (byCountry[t.country] || 0) + 1;
  }
  console.log("Ülke Dağılımı:", byCountry);
  console.log("\nÖrnek Hedef Kulüpler (İlk 15):");
  for (const t of targets.slice(0, 15)) {
    console.log(`- [${t.name}] (${t.country} - ${t.league}) -> Pop: ${t.popularityScore}, Logo: ${t.logoUrl || "YOK (Monogram)"}`);
  }
}

if (require.main === module) {
  main().finally(() => prisma.$disconnect());
}
