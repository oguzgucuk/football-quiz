/**
 * Q18656 (Manchester United) referanslı tüm oyuncu geçmişlerini gerçek Manchester United kulübüne aktarır.
 */

import { prisma } from "../lib/db/client";

async function fixManchesterUnited() {
  console.log("🛠️ [Manchester United Düzeltmesi] Başlatılıyor...");

  const wrongTeam = await prisma.team.findFirst({
    where: { externalRef: "wikidata:Q18656" },
    include: { playersHistory: true },
  });

  const realManU = await prisma.team.findFirst({
    where: { name: "Manchester United" },
  });

  if (!wrongTeam || !realManU) {
    console.log("Takımlar bulunamadı");
    return;
  }

  console.log(`➡️ ${wrongTeam.playersHistory.length} oyuncu geçmişi gerçek Manchester United'a aktarılıyor...`);

  let count = 0;
  for (const h of wrongTeam.playersHistory) {
    try {
      await prisma.playerTeamHistory.upsert({
        where: {
          playerId_teamId: {
            playerId: h.playerId,
            teamId: realManU.id,
          },
        },
        create: {
          playerId: h.playerId,
          teamId: realManU.id,
          isNationalTeam: h.isNationalTeam,
          seasonStart: h.seasonStart,
          seasonEnd: h.seasonEnd,
        },
        update: {},
      });
      count++;
    } catch {}
  }

  await prisma.playerTeamHistory.deleteMany({ where: { teamId: wrongTeam.id } });
  await prisma.team.delete({ where: { id: wrongTeam.id } });

  console.log(`🎉 [Başarılı] ${count} efsane oyuncu (Gerard Piqué, Cristiano Ronaldo vb.) Manchester United'a bağlandı!`);
}

fixManchesterUnited()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
