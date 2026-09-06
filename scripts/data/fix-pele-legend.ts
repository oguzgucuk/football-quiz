/**
 * Kral Pelé (Edson Arantes do Nascimento, 1940-10-23, Brezilya) kaydını
 * Vítor Pelé ile karışan wikidataId çakışmasından kurtarıp doğru şekilde veritabanına ekler.
 */

import { prisma } from "../../lib/db/client";

async function fixPele() {
  console.log("👑 [Kral Pelé Düzeltmesi]");

  // 1. Vítor Pelé'yi düzelt (Kaggle'dan yanlışlıkla Q12897 almış)
  const vitorPele = await prisma.player.findFirst({
    where: { externalRef: "48930" },
  });
  if (vitorPele) {
    await prisma.player.update({
      where: { id: vitorPele.id },
      data: {
        wikidataId: null,
        fullName: "Vítor Pelé",
        popularityScore: 60,
      },
    });
    console.log("   ✅ Vítor Pelé (1987) kaydı düzeltildi.");
  }

  // 2. Gerçek Kral Pelé'yi oluştur veya güncelle
  let kingPele = await prisma.player.findFirst({
    where: { wikidataId: "Q12897" },
  });

  if (!kingPele) {
    kingPele = await prisma.player.create({
      data: {
        fullName: "Pelé",
        birthDate: new Date("1940-10-23T00:00:00.000Z"),
        nationality: "Brazil",
        position: "Attack",
        popularityScore: 99,
        wikidataId: "Q12897",
        overallPrime: 98,
        positions: ["CAM", "CF", "ST"],
      },
    });
    console.log("   ✅ Kral Pelé (1940, 98 OVR) başarıyla veritabanına eklendi!");
  } else {
    await prisma.player.update({
      where: { id: kingPele.id },
      data: {
        fullName: "Pelé",
        birthDate: new Date("1940-10-23T00:00:00.000Z"),
        nationality: "Brazil",
        overallPrime: 98,
        positions: ["CAM", "CF", "ST"],
      },
    });
    console.log("   ✅ Kral Pelé güncellendi.");
  }

  // 3. Santos FC ve Brezilya Takımlarını Bağla
  const santos = await prisma.team.findFirst({
    where: { name: { contains: "Santos", mode: "insensitive" } },
  });
  if (santos && kingPele) {
    await prisma.playerTeamHistory.upsert({
      where: { playerId_teamId: { playerId: kingPele.id, teamId: santos.id } },
      create: { playerId: kingPele.id, teamId: santos.id, seasonStart: 1956, seasonEnd: 1974 },
      update: {},
    });
    console.log("   ✅ Santos FC kariyeri eklendi.");
  }

  const brazil = await prisma.team.findFirst({
    where: { name: { contains: "Brezilya", mode: "insensitive" } },
  });
  if (brazil && kingPele) {
    await prisma.playerTeamHistory.upsert({
      where: { playerId_teamId: { playerId: kingPele.id, teamId: brazil.id } },
      create: { playerId: kingPele.id, teamId: brazil.id, isNationalTeam: true, seasonStart: 1957, seasonEnd: 1971 },
      update: {},
    });
    console.log("   ✅ Brezilya Millî Takımı kariyeri eklendi.");
  }
}

fixPele()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
