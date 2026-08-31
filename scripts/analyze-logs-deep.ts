import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function analyzeAll21Logs() {
  const logs = await prisma.missingAnswerLog.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log("=== 21 EKSİK CEVAP DETAYLI ANALİZ RAPORU ===\n");

  for (const [i, log] of logs.entries()) {
    const t1 = await prisma.team.findUnique({ where: { id: log.team1Id } });
    const t2 = await prisma.team.findUnique({ where: { id: log.team2Id } });

    const p = await prisma.player.findMany({
      where: {
        fullName: { contains: log.submittedName.trim(), mode: "insensitive" },
      },
      include: {
        teamsHistory: {
          include: { team: true },
        },
      },
    });

    const common = t1 && t2 ? await prisma.player.findMany({
      where: {
        teamsHistory: { some: { teamId: t1.id } },
        AND: [{ teamsHistory: { some: { teamId: t2.id } } }],
      },
      select: { fullName: true },
    }) : [];

    console.log(`[#${i + 1}] "${log.submittedName}"`);
    console.log(`     T1: ${t1 ? `${t1.name} (${t1.country}) [${t1.id}]` : `Bilinmeyen Takım (${log.team1Id})`}`);
    console.log(`     T2: ${t2 ? `${t2.name} (${t2.country}) [${t2.id}]` : `Bilinmeyen Takım (${log.team2Id})`}`);
    
    if (p.length > 0) {
      console.log(`     Oyuncu: ${p.map(x => `${x.fullName} -> Kulüpleri: [${x.teamsHistory.map(th => th.team.name).join(", ")}]`).join(" | ")}`);
    } else {
      console.log(`     Oyuncu: DB'de "${log.submittedName}" bulunamadı`);
    }

    console.log(`     Ortak Oyuncular: ${common.length > 0 ? common.map(c => c.fullName).join(", ") : "Yok"}`);
    console.log("");
  }
}

analyzeAll21Logs().finally(() => prisma.$disconnect());
