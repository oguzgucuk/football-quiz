import { prisma } from "../lib/db/client";

async function checkNihat() {
  console.log("🔍 Nihat Kahveci Veritabanı Araması...\n");

  const players = await prisma.player.findMany({
    where: {
      OR: [
        { fullName: { contains: "Nihat", mode: "insensitive" } },
        { fullName: { contains: "Kahveci", mode: "insensitive" } },
      ],
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
    console.log(`\nOyuncu: ${p.fullName} (ID: ${p.id}, Ülke: ${p.nationality}, Doğum: ${p.birthDate?.toISOString().split("T")[0]})`);
    console.log("Oynadığı Takımlar:");
    for (const th of p.teamsHistory) {
      console.log(`  - ${th.team.name} (Takım ID: ${th.team.id}, Ülke: ${th.team.country}, Lig: ${th.team.league})`);
    }
  }

  // Missing answers loguna da bakalım, kullanıcı hangi takımlarla denedi?
  const logs = await prisma.missingAnswerLog.findMany({
    where: {
      submittedName: { contains: "nihat", mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("\n📋 Nihat ile ilgili Son Missing Logları:");
  for (const l of logs) {
    const t1 = await prisma.team.findUnique({ where: { id: l.team1Id } });
    const t2 = await prisma.team.findUnique({ where: { id: l.team2Id } });
    console.log(`  - Denenen: "${l.submittedName}", Takım 1: ${t1?.name} (${l.team1Id}), Takım 2: ${t2?.name} (${l.team2Id}), Tarih: ${l.createdAt}`);
  }
}

checkNihat()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
