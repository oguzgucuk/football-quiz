/**
 * Tüm elit kulüpleri (Galatasaray, Fenerbahçe, Beşiktaş, Trabzonspor, Real Madrid,
 * Barcelona, Inter, Milan, Roma, Bayern vb.) kesin ve tekil isimleri altında birleştirir.
 */

import { prisma } from "../lib/db/client";

const ELITE_MERGES: { canonicalName: string; aliases: string[] }[] = [
  {
    canonicalName: "Galatasaray",
    aliases: ["Galatasaray", "Galatasaray S.K.", "Galatasaray SK", "Galatasaray A.Ş.", "Galatasaray Istanbul"],
  },
  {
    canonicalName: "Fenerbahçe",
    aliases: ["Fenerbahçe", "Fenerbahce", "Fenerbahçe S.K.", "Fenerbahce SK", "Fenerbahçe Istanbul", "Fenerbahçe Futbol A.Ş."],
  },
  {
    canonicalName: "Beşiktaş",
    aliases: ["Beşiktaş", "Besiktas", "Beşiktaş J.K.", "Beşiktaş JK", "Beşiktaş Jimnastik Kulübü", "Beşiktaş J.K. (Football)"],
  },
  {
    canonicalName: "Trabzonspor",
    aliases: ["Trabzonspor", "Trabzonspor Kulübü", "Trabzonspor A.Ş.", "Trabzonspor K."],
  },
  {
    canonicalName: "Inter Milan",
    aliases: ["Inter Milan", "FC Internazionale Milano", "Internazionale Milano", "FC Internazionale", "Inter Mailand"],
  },
  {
    canonicalName: "AS Roma",
    aliases: ["AS Roma", "Associazione Sportiva Roma", "A.S. Roma"],
  },
  {
    canonicalName: "Bayern München",
    aliases: ["Bayern München", "FC Bayern München", "Bayern Munich", "FC Bayern Munich", "FC Bayern Münih", "Bayern"],
  },
  {
    canonicalName: "RCD Espanyol",
    aliases: ["RCD Espanyol", "RCD Espanyol Barcelona", "RCD Espanyol de Barcelona"],
  },
  {
    canonicalName: "FC Barcelona",
    aliases: ["FC Barcelona", "Futbol Club Barcelona", "Barcelona", "FC Barcelona B", "FC Barcelona Atlètic", "FC Barcelona C"],
  },
  {
    canonicalName: "Real Madrid",
    aliases: ["Real Madrid", "Real Madrid CF", "Real Madrid Club de Fútbol", "Real Madrid Castilla", "Real Madrid C"],
  },
];

async function mergeEliteClubs() {
  console.log("🔄 [Elit Kulüp Tekilleştirme] Başlatılıyor...");

  let totalMerged = 0;

  for (const item of ELITE_MERGES) {
    const teams = await prisma.team.findMany({
      where: {
        OR: item.aliases.map((a) => ({
          name: { equals: a, mode: "insensitive" },
        })),
      },
      include: {
        playersHistory: true,
      },
    });

    if (teams.length <= 1) {
      if (teams.length === 1 && teams[0].name !== item.canonicalName) {
        await prisma.team.update({
          where: { id: teams[0].id },
          data: { name: item.canonicalName },
        });
      }
      continue;
    }

    // En çok oyuncu geçmişine sahip olanı ana kulüp yap
    const primary = teams.reduce((prev, curr) =>
      curr.playersHistory.length >= prev.playersHistory.length ? curr : prev
    );

    await prisma.team.update({
      where: { id: primary.id },
      data: { name: item.canonicalName },
    });

    const duplicates = teams.filter((t) => t.id !== primary.id);

    for (const dup of duplicates) {
      for (const history of dup.playersHistory) {
        try {
          await prisma.playerTeamHistory.upsert({
            where: {
              playerId_teamId: {
                playerId: history.playerId,
                teamId: primary.id,
              },
            },
            create: {
              playerId: history.playerId,
              teamId: primary.id,
              isNationalTeam: history.isNationalTeam,
              seasonStart: history.seasonStart,
              seasonEnd: history.seasonEnd,
            },
            update: {},
          });
        } catch {}
      }

      await prisma.playerTeamHistory.deleteMany({ where: { teamId: dup.id } });
      await prisma.team.delete({ where: { id: dup.id } });
      totalMerged++;
      console.log(`✓ '${dup.name}' (${dup.playersHistory.length} oyuncu) ➔ '${item.canonicalName}' içine birleştirildi.`);
    }
  }

  console.log(`\n🎉 Toplam ${totalMerged} kopya elit kulüp başarıyla tekilleştirildi!`);
}

mergeEliteClubs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
