/**
 * Eksik Dünya ve Kulüp Efsanelerini (Gennaro Gattuso, Alessandro Nesta,
 * Ruud Gullit, Frank Rijkaard, Cafu, Pelé) eksiksiz kariyer geçmişleriyle
 * birlikte veritabanına ekleyen tohumlama scripti.
 */

import { prisma } from "../../lib/db/client";

interface LegendCareerItem {
  teamName: string;
  seasonStart: number;
  seasonEnd: number;
  isNationalTeam: boolean;
}

interface LegendPlayerDef {
  fullName: string;
  birthDate: string;
  nationality: string;
  position: string;
  popularityScore: number;
  wikidataId: string;
  career: LegendCareerItem[];
}

const LEGENDS: LegendPlayerDef[] = [
  {
    fullName: "Gennaro Gattuso",
    birthDate: "1978-01-09",
    nationality: "Italy",
    position: "Midfielder",
    popularityScore: 94,
    wikidataId: "Q116980",
    career: [
      { teamName: "AC Milan", seasonStart: 1999, seasonEnd: 2012, isNationalTeam: false },
      { teamName: "Rangers FC", seasonStart: 1997, seasonEnd: 1998, isNationalTeam: false },
      { teamName: "US Salernitana 1919", seasonStart: 1998, seasonEnd: 1999, isNationalTeam: false },
      { teamName: "FC Sion", seasonStart: 2012, seasonEnd: 2013, isNationalTeam: false },
      { teamName: "A.C. Perugia Calcio", seasonStart: 1995, seasonEnd: 1997, isNationalTeam: false },
      { teamName: "Italy men's national association football team", seasonStart: 2000, seasonEnd: 2010, isNationalTeam: true },
      { teamName: "İtalya millî futbol takımı", seasonStart: 2000, seasonEnd: 2010, isNationalTeam: true },
    ],
  },
  {
    fullName: "Alessandro Nesta",
    birthDate: "1976-03-19",
    nationality: "Italy",
    position: "Defender",
    popularityScore: 95,
    wikidataId: "Q227892",
    career: [
      { teamName: "SS Lazio", seasonStart: 1993, seasonEnd: 2002, isNationalTeam: false },
      { teamName: "AC Milan", seasonStart: 2002, seasonEnd: 2012, isNationalTeam: false },
      { teamName: "CF Montréal", seasonStart: 2012, seasonEnd: 2013, isNationalTeam: false },
      { teamName: "Chennaiyin FC", seasonStart: 2014, seasonEnd: 2014, isNationalTeam: false },
      { teamName: "Italy men's national association football team", seasonStart: 1996, seasonEnd: 2006, isNationalTeam: true },
      { teamName: "İtalya millî futbol takımı", seasonStart: 1996, seasonEnd: 2006, isNationalTeam: true },
    ],
  },
  {
    fullName: "Ruud Gullit",
    birthDate: "1962-09-01",
    nationality: "Netherlands",
    position: "Midfielder",
    popularityScore: 95,
    wikidataId: "Q173972",
    career: [
      { teamName: "HFC Haarlem", seasonStart: 1979, seasonEnd: 1982, isNationalTeam: false },
      { teamName: "Feyenoord", seasonStart: 1982, seasonEnd: 1985, isNationalTeam: false },
      { teamName: "PSV Eindhoven", seasonStart: 1985, seasonEnd: 1987, isNationalTeam: false },
      { teamName: "AC Milan", seasonStart: 1987, seasonEnd: 1994, isNationalTeam: false },
      { teamName: "UC Sampdoria", seasonStart: 1993, seasonEnd: 1995, isNationalTeam: false },
      { teamName: "Chelsea FC", seasonStart: 1995, seasonEnd: 1998, isNationalTeam: false },
      { teamName: "Netherlands national association football team", seasonStart: 1981, seasonEnd: 1994, isNationalTeam: true },
      { teamName: "Hollanda millî futbol takımı", seasonStart: 1981, seasonEnd: 1994, isNationalTeam: true },
    ],
  },
  {
    fullName: "Frank Rijkaard",
    birthDate: "1962-09-30",
    nationality: "Netherlands",
    position: "Midfielder",
    popularityScore: 94,
    wikidataId: "Q169098",
    career: [
      { teamName: "AFC Ajax", seasonStart: 1980, seasonEnd: 1995, isNationalTeam: false },
      { teamName: "Sporting CP", seasonStart: 1987, seasonEnd: 1988, isNationalTeam: false },
      { teamName: "Real Zaragoza", seasonStart: 1987, seasonEnd: 1988, isNationalTeam: false },
      { teamName: "AC Milan", seasonStart: 1988, seasonEnd: 1993, isNationalTeam: false },
      { teamName: "Netherlands national association football team", seasonStart: 1981, seasonEnd: 1994, isNationalTeam: true },
      { teamName: "Hollanda millî futbol takımı", seasonStart: 1981, seasonEnd: 1994, isNationalTeam: true },
    ],
  },
  {
    fullName: "Cafu",
    birthDate: "1970-06-07",
    nationality: "Brazil",
    position: "Defender",
    popularityScore: 96,
    wikidataId: "Q178683",
    career: [
      { teamName: "São Paulo FC", seasonStart: 1989, seasonEnd: 1995, isNationalTeam: false },
      { teamName: "Real Zaragoza", seasonStart: 1995, seasonEnd: 1995, isNationalTeam: false },
      { teamName: "Palmeiras", seasonStart: 1995, seasonEnd: 1997, isNationalTeam: false },
      { teamName: "AS Roma", seasonStart: 1997, seasonEnd: 2003, isNationalTeam: false },
      { teamName: "AC Milan", seasonStart: 2003, seasonEnd: 2008, isNationalTeam: false },
      { teamName: "Brazil men's national football team", seasonStart: 1990, seasonEnd: 2006, isNationalTeam: true },
      { teamName: "Brezilya millî futbol takımı", seasonStart: 1990, seasonEnd: 2006, isNationalTeam: true },
    ],
  },
  {
    fullName: "Pelé",
    birthDate: "1940-10-23",
    nationality: "Brazil",
    position: "Forward",
    popularityScore: 99,
    wikidataId: "Q12897",
    career: [
      { teamName: "Santos FC", seasonStart: 1956, seasonEnd: 1974, isNationalTeam: false },
      { teamName: "New York Cosmos", seasonStart: 1975, seasonEnd: 1977, isNationalTeam: false },
      { teamName: "Brazil men's national football team", seasonStart: 1957, seasonEnd: 1971, isNationalTeam: true },
      { teamName: "Brezilya millî futbol takımı", seasonStart: 1957, seasonEnd: 1971, isNationalTeam: true },
    ],
  },
];

async function findTeamByFuzzyName(targetName: string) {
  // 1. Exact match
  let team = await prisma.team.findFirst({
    where: { name: { equals: targetName, mode: "insensitive" } },
  });
  if (team) return team;

  // 2. Aliases match
  team = await prisma.team.findFirst({
    where: { aliases: { has: targetName } },
  });
  if (team) return team;

  // 3. Contains match
  team = await prisma.team.findFirst({
    where: { name: { contains: targetName, mode: "insensitive" } },
    orderBy: { popularityScore: "desc" },
  });
  return team;
}

export async function importMissingLegends() {
  console.log("🌟 [Eksik Efsaneler İçe Aktarma] Başlatılıyor...\n");

  let createdPlayers = 0;
  let linkedHistories = 0;

  for (const legend of LEGENDS) {
    console.log(`📌 İşleniyor: ${legend.fullName} (${legend.wikidataId})...`);

    // Oyuncu kontrolü (wikidataId veya tam isim)
    let player = await prisma.player.findFirst({
      where: {
        OR: [
          { wikidataId: legend.wikidataId },
          { externalRef: `wikidata:${legend.wikidataId}` },
          { fullName: { equals: legend.fullName, mode: "insensitive" } },
        ],
      },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          fullName: legend.fullName,
          birthDate: new Date(legend.birthDate),
          nationality: legend.nationality,
          position: legend.position,
          popularityScore: legend.popularityScore,
          wikidataId: legend.wikidataId,
          externalRef: `wikidata:${legend.wikidataId}`,
        },
      });
      createdPlayers++;
      console.log(`  ✨ Yeni Efsane Oyuncu Oluşturuldu: ${player.fullName} (ID: ${player.id})`);
    } else {
      // Popülerlik veya wikidataId eksikse güncelle
      await prisma.player.update({
        where: { id: player.id },
        data: {
          wikidataId: legend.wikidataId,
          externalRef: player.externalRef || `wikidata:${legend.wikidataId}`,
          popularityScore: Math.max(player.popularityScore, legend.popularityScore),
        },
      });
      console.log(`  🔄 Mevcut Oyuncu Güncellendi: ${player.fullName} (ID: ${player.id})`);
    }

    // Kariyer takımlarını bağla
    for (const careerItem of legend.career) {
      const team = await findTeamByFuzzyName(careerItem.teamName);
      if (!team) {
        console.log(`  ⚠️ Kulüp bulunamadı: "${careerItem.teamName}"`);
        continue;
      }

      await prisma.playerTeamHistory.upsert({
        where: {
          playerId_teamId: {
            playerId: player.id,
            teamId: team.id,
          },
        },
        create: {
          playerId: player.id,
          teamId: team.id,
          seasonStart: careerItem.seasonStart,
          seasonEnd: careerItem.seasonEnd,
          isNationalTeam: careerItem.isNationalTeam,
        },
        update: {
          seasonStart: careerItem.seasonStart,
          seasonEnd: careerItem.seasonEnd,
          isNationalTeam: careerItem.isNationalTeam,
        },
      });

      linkedHistories++;
      console.log(`  ⚽ Bağlandı: ${player.fullName} -> ${team.name} (${careerItem.seasonStart}-${careerItem.seasonEnd})`);
    }
  }

  console.log(`\n🎉 [Efsaneler Tamamlandı]`);
  console.log(`   - Eklenen/Güncellenen Oyuncu Sayısı: ${LEGENDS.length}`);
  console.log(`   - Oluşturulan Yeni Oyuncu Kaydı: ${createdPlayers}`);
  console.log(`   - Bağlanan Kulüp-Kariyer Kayıtları: ${linkedHistories}`);
}

if (require.main === module) {
  importMissingLegends()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
