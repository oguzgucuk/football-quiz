/**
 * Tüm liglerdeki ve veri kaynaklarındaki (Kaggle & Wikidata) kulüp isim varyasyonlarını
 * (ASCII, Türkçe karakterler, resmi kulüp adları, Wikidata futbol şubeleri) tek bir kanonik kulüpte birleştirir.
 */

import { prisma } from "../lib/db/client";

const CLUB_MERGE_RULES: { canonicalName: string; aliases: string[] }[] = [
  {
    canonicalName: "Fenerbahçe",
    aliases: [
      "Fenerbahçe", "Fenerbahce", "Fenerbahçe SK", "Fenerbahce SK",
      "Fenerbahçe Istanbul", "Fenerbahçe Futbol A.Ş.", "Fenerbahce Istanbul",
      "Fenerbahce SK Istanbul"
    ],
  },
  {
    canonicalName: "Galatasaray",
    aliases: [
      "Galatasaray", "Galatasaray SK", "Galatasaray A.Ş.", "Galatasaray Istanbul",
      "Galatasaray A.S.", "Galatasaray Sportif A.Ş.", "Galatasaray S.K."
    ],
  },
  {
    canonicalName: "Beşiktaş",
    aliases: [
      "Beşiktaş", "Besiktas", "Beşiktaş JK", "Besiktas JK",
      "Beşiktaş Jimnastik Kulübü", "Besiktas Istanbul", "Beşiktaş Istanbul",
      "Beşiktaş J.K."
    ],
  },
  {
    canonicalName: "Trabzonspor",
    aliases: [
      "Trabzonspor", "Trabzonspor Kulübü", "Trabzonspor A.Ş.", "Trabzonspor A.S.", "Trabzonspor K."
    ],
  },
  {
    canonicalName: "Sakaryaspor",
    aliases: ["Sakaryaspor", "Sakaryaspor Kulübü Derneği", "Sakaryaspor KD", "Sakaryaspor A.Ş."],
  },
  {
    canonicalName: "Bursaspor",
    aliases: ["Bursaspor", "Bursaspor Kulübü Derneği", "Bursaspor KD", "Bursaspor Kulübü"],
  },
  {
    canonicalName: "Kocaelispor",
    aliases: ["Kocaelispor", "Kocaelispor Kulübü", "Kocaelispor K."],
  },
  {
    canonicalName: "Gençlerbirliği",
    aliases: ["Gençlerbirliği", "Genclerbirligi", "Gençlerbirliği SK", "Genclerbirligi Ankara"],
  },
  {
    canonicalName: "Eskişehirspor",
    aliases: ["Eskişehirspor", "Eskisehirspor", "Eskişehirspor Kulübü"],
  },
  {
    canonicalName: "Göztepe",
    aliases: ["Göztepe", "Goztepe", "Göztepe SK", "Goztepe AS"],
  },
  {
    canonicalName: "Altay",
    aliases: ["Altay", "Altay SK", "Altay Izmir", "Altay SK Izmir"],
  },
  {
    canonicalName: "MKE Ankaragücü",
    aliases: ["MKE Ankaragücü", "Ankaragücü", "MKE Ankaragucu", "MKE Ankaragücü GSK"],
  },
  {
    canonicalName: "İstanbulspor",
    aliases: ["İstanbulspor", "Istanbulspor", "İstanbulspor A.Ş.", "Istanbulspor AS"],
  },
  {
    canonicalName: "Real Madrid",
    aliases: ["Real Madrid", "Real Madrid Club de Fútbol", "Real Madrid CF"],
  },
  {
    canonicalName: "FC Barcelona",
    aliases: ["FC Barcelona", "Futbol Club Barcelona", "Barcelona"],
  },
  {
    canonicalName: "Atlético Madrid",
    aliases: ["Atlético Madrid", "Atletico Madrid", "Club Atlético de Madrid"],
  },
  {
    canonicalName: "Sevilla FC",
    aliases: ["Sevilla FC", "Sevilla Fútbol Club", "Sevilla"],
  },
  {
    canonicalName: "Flamengo",
    aliases: ["Flamengo", "Clube de Regatas do Flamengo", "CR Flamengo"],
  },
  {
    canonicalName: "Santos FC",
    aliases: ["Santos FC", "Santos Futebol Clube", "Santos"],
  },
  {
    canonicalName: "Palmeiras",
    aliases: ["Palmeiras", "Sociedade Esportiva Palmeiras", "SE Palmeiras"],
  },
  {
    canonicalName: "Corinthians",
    aliases: ["Corinthians", "Sport Club Corinthians Paulista", "SC Corinthians"],
  },
  {
    canonicalName: "São Paulo FC",
    aliases: ["São Paulo FC", "São Paulo Futebol Clube", "Sao Paulo FC", "São Paulo", "Sao Paulo"],
  },
  {
    canonicalName: "Grêmio",
    aliases: ["Grêmio", "Gremio", "Grêmio Foot-Ball Porto Alegrense", "Grêmio FBPA"],
  },
  {
    canonicalName: "Internacional",
    aliases: ["Internacional", "Sport Club Internacional", "SC Internacional"],
  },
  {
    canonicalName: "Fluminense",
    aliases: ["Fluminense", "Fluminense F.C.", "Fluminense FC", "Fluminense Football Club"],
  },
  {
    canonicalName: "Atlético Mineiro",
    aliases: ["Atlético Mineiro", "Clube Atlético Mineiro", "Atletico Mineiro"],
  },
  {
    canonicalName: "Boca Juniors",
    aliases: ["Boca Juniors", "Club Atlético Boca Juniors", "CA Boca Juniors"],
  },
  {
    canonicalName: "River Plate",
    aliases: ["River Plate", "Club Atlético River Plate", "CA River Plate"],
  },
  {
    canonicalName: "Newell's Old Boys",
    aliases: ["Newell's Old Boys", "Club Atlético Newell's Old Boys", "Newells Old Boys"],
  },
  {
    canonicalName: "Argentinos Juniors",
    aliases: ["Argentinos Juniors", "Asociación Atlética Argentinos Juniors"],
  },
  {
    canonicalName: "Manchester United",
    aliases: ["Manchester United", "Manchester United Football Club", "Man Utd"],
  },
  {
    canonicalName: "Manchester City",
    aliases: ["Manchester City", "Manchester City Football Club", "Man City"],
  },
  {
    canonicalName: "Liverpool FC",
    aliases: ["Liverpool FC", "Liverpool Football Club", "Liverpool"],
  },
  {
    canonicalName: "Arsenal FC",
    aliases: ["Arsenal FC", "Arsenal Football Club", "Arsenal"],
  },
  {
    canonicalName: "Chelsea FC",
    aliases: ["Chelsea FC", "Chelsea Football Club", "Chelsea"],
  },
  {
    canonicalName: "Tottenham Hotspur",
    aliases: ["Tottenham Hotspur", "Tottenham Hotspur Football Club", "Tottenham", "Spurs"],
  },
  {
    canonicalName: "Juventus",
    aliases: ["Juventus", "Juventus Football Club", "Juventus FC"],
  },
  {
    canonicalName: "AC Milan",
    aliases: ["AC Milan", "Associazione Calcio Milan", "Milan", "A.C. Milan"],
  },
  {
    canonicalName: "Inter Milan",
    aliases: [
      "Inter Milan", "Football Club Internazionale Milano", "Inter", "Internazionale",
      "FC Internazionale Milano", "Inter Mailand"
    ],
  },
  {
    canonicalName: "SSC Napoli",
    aliases: ["SSC Napoli", "Società Sportiva Calcio Napoli", "Napoli"],
  },
  {
    canonicalName: "Parma",
    aliases: ["Parma", "Parma Calcio 1913", "Parma FC", "Parma AC"],
  },
  {
    canonicalName: "Torino FC",
    aliases: ["Torino FC", "Torino Football Club", "Torino"],
  },
  {
    canonicalName: "Udinese Calcio",
    aliases: ["Udinese Calcio", "Udinese"],
  },
  {
    canonicalName: "Bayern München",
    aliases: ["Bayern München", "FC Bayern München", "Bayern Munich", "FC Bayern Munich", "Bayern"],
  },
  {
    canonicalName: "Borussia Dortmund",
    aliases: ["Borussia Dortmund", "Ballspielverein Borussia 09 e. V. Dortmund", "BVB"],
  },
  {
    canonicalName: "VfL Wolfsburg",
    aliases: ["VfL Wolfsburg", "Wolfsburg"],
  },
  {
    canonicalName: "Paris Saint-Germain",
    aliases: ["Paris Saint-Germain", "Paris Saint-Germain Football Club", "PSG", "Paris Saint-Germain FC"],
  },
  {
    canonicalName: "Middlesbrough FC",
    aliases: ["Middlesbrough FC", "Middlesbrough F.C.", "Middlesbrough"],
  },
  {
    canonicalName: "Stoke City",
    aliases: ["Stoke City", "Stoke City F.C.", "Stoke City FC"],
  },
  {
    canonicalName: "Bolton Wanderers",
    aliases: ["Bolton Wanderers", "Bolton Wanderers F.C.", "Bolton Wanderers FC"],
  },
  {
    canonicalName: "Blackburn Rovers",
    aliases: ["Blackburn Rovers", "Blackburn Rovers F.C.", "Blackburn Rovers FC"],
  },
];

async function mergeAllDuplicates() {
  console.log("🔄 [Kapsamlı Kulüp Birleştirme] Başlatılıyor...");

  let totalMergedTeams = 0;
  let totalTransferredHistories = 0;

  for (const rule of CLUB_MERGE_RULES) {
    const matchingTeams = await prisma.team.findMany({
      where: {
        OR: rule.aliases.map((alias) => ({
          name: { equals: alias, mode: "insensitive" },
        })),
      },
      include: {
        playersHistory: true,
      },
    });

    if (matchingTeams.length <= 1) {
      if (matchingTeams.length === 1 && matchingTeams[0].name !== rule.canonicalName) {
        await prisma.team.update({
          where: { id: matchingTeams[0].id },
          data: { name: rule.canonicalName },
        });
      }
      continue;
    }

    const primaryTeam = matchingTeams.reduce((prev, curr) =>
      curr.playersHistory.length >= prev.playersHistory.length ? curr : prev
    );

    await prisma.team.update({
      where: { id: primaryTeam.id },
      data: { name: rule.canonicalName },
    });

    const duplicateTeams = matchingTeams.filter((t) => t.id !== primaryTeam.id);

    for (const dup of duplicateTeams) {
      for (const history of dup.playersHistory) {
        try {
          await prisma.playerTeamHistory.upsert({
            where: {
              playerId_teamId: {
                playerId: history.playerId,
                teamId: primaryTeam.id,
              },
            },
            create: {
              playerId: history.playerId,
              teamId: primaryTeam.id,
              isNationalTeam: history.isNationalTeam,
              seasonStart: history.seasonStart,
              seasonEnd: history.seasonEnd,
            },
            update: {},
          });
          totalTransferredHistories++;
        } catch {}
      }

      await prisma.playerTeamHistory.deleteMany({ where: { teamId: dup.id } });
      await prisma.team.delete({ where: { id: dup.id } });
      totalMergedTeams++;
    }

    console.log(`✓ '${rule.canonicalName}' için ${duplicateTeams.length} kopya takım birleştirildi.`);
  }

  console.log(`\n🎉 [Birleştirme Tamamlandı]`);
  console.log(`   - Birleştirilen Kopya Takımlar: ${totalMergedTeams}`);
  console.log(`   - Aktarılan Oyuncu Geçmişleri: ${totalTransferredHistories}`);
  console.log(`📊 Güncel Veritabanı Toplamı:`);
  console.log(`   - Kulüpler: ${await prisma.team.count()}`);
  console.log(`   - Futbolcular: ${await prisma.player.count()}`);
  console.log(`   - Kulüp-Oyuncu Eşleşmesi: ${await prisma.playerTeamHistory.count()}`);
}

mergeAllDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
