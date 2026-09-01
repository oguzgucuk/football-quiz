import { prisma } from "../lib/db/client";

async function auditMissingEliteLogos() {
  console.log("🔍 Madde 1: Mevcut Boşluğu Netleştirme\n");

  // Önce veritabanındaki lig isimlerini gruplayalım ki tam eşleşme yapabilelim
  const leagues = await prisma.team.groupBy({
    by: ['league'],
    _count: true,
    where: { logoUrl: null },
    orderBy: { _count: { league: 'desc' } }
  });

  console.log("Logosu olmayan takımların liglere göre dağılımı (Top 10):");
  for (const l of leagues.slice(0, 10)) {
    console.log(`  - ${l.league ?? "(null)"}: ${l._count}`);
  }

  // Elite ligleri belirle (veritabanındaki formatlarına göre)
  // Genelde 'premier-league', 'laliga', 'serie-a', 'bundesliga', 'ligue-1', 'super-lig' şeklinde kaydedilmiş olabilir.
  // Ya da TheSportsDB import formatı olabilir. İçerenleri (contains) bulalım.
  
  const eliteLeagueKeywords = ['premier-league', 'laliga', 'serie-a', 'bundesliga', 'ligue-1', 'super-lig', 'serie-b', 'ligue-2', 'championship', 'segunda'];

  const missingEliteTeams = await prisma.team.findMany({
    where: {
      logoUrl: null,
      OR: eliteLeagueKeywords.map(kw => ({
        league: { contains: kw, mode: 'insensitive' }
      }))
    },
    select: {
      id: true,
      name: true,
      country: true,
      league: true,
      popularityScore: true
    },
    orderBy: { popularityScore: 'desc' }
  });

  console.log(`\n\n🎯 Hedef Kapsamdaki Eksik Kulüp Sayısı: ${missingEliteTeams.length}\n`);
  
  console.log("En popüler 30 eksik kulüp:");
  for (const t of missingEliteTeams.slice(0, 30)) {
    console.log(`  [Pop: ${t.popularityScore}] ${t.name} (${t.country} - ${t.league})`);
  }

  await prisma.$disconnect();
}

auditMissingEliteLogos();
