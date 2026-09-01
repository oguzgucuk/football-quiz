import { prisma } from "../lib/db/client";

async function inspectEgemen() {
  console.log("🔍 Egemen Korkmaz ve Transfer Geçmişi İnceleniyor...\n");

  const players = await prisma.player.findMany({
    where: {
      fullName: { contains: "Egemen", mode: "insensitive" },
    },
    include: {
      teamsHistory: {
        include: {
          team: true,
        },
      },
    },
  });

  console.log(`Bulunan Oyuncu Sayısı: ${players.length}`);
  for (const p of players) {
    console.log(`\nOyuncu: ${p.fullName} (ID: ${p.id}, Doğum: ${p.birthDate?.toISOString().split("T")[0]})`);
    console.log("Oynadığı Takımlar:");
    for (const th of p.teamsHistory) {
      console.log(`  - ${th.team.name} (Takım ID: ${th.team.id}, Ülke: ${th.team.country}, Lig: ${th.team.league})`);
    }
  }

  // Trabzonspor ve Fenerbahçe kulüp kayıtlarını bulalım
  console.log("\n🏟️ Trabzonspor & Fenerbahçe Kulüp Kayıtları:");
  const trabzonClubs = await prisma.team.findMany({
    where: {
      OR: [
        { name: { contains: "Trabzon", mode: "insensitive" } },
        { aliases: { has: "Trabzonspor" } },
      ],
    },
  });
  for (const t of trabzonClubs) {
    console.log(`  - Trabzon: ${t.name} (ID: ${t.id}, Aliases: ${t.aliases.join(", ")})`);
  }

  const fbClubs = await prisma.team.findMany({
    where: {
      OR: [
        { name: { contains: "Fenerbah", mode: "insensitive" } },
        { aliases: { has: "Fenerbahçe" } },
      ],
    },
  });
  for (const t of fbClubs) {
    console.log(`  - FB: ${t.name} (ID: ${t.id}, Aliases: ${t.aliases.join(", ")})`);
  }

  // missing answer loglarına bakalım
  const logs = await prisma.missingAnswerLog.findMany({
    where: {
      submittedName: { contains: "egemen", mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("\n📋 Son Missing Logları (Egemen):");
  for (const l of logs) {
    const t1 = await prisma.team.findUnique({ where: { id: l.team1Id } });
    const t2 = await prisma.team.findUnique({ where: { id: l.team2Id } });
    console.log(`  - Denenen: "${l.submittedName}", Takım 1: ${t1?.name} (${l.team1Id}), Takım 2: ${t2?.name} (${l.team2Id}), Tarih: ${l.createdAt}`);
  }
}

inspectEgemen()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
