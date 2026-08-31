import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectMissingAnswers() {
  console.log("🔍 MissingAnswerLog İncelemesi Başlatılıyor...\n");

  const logs = await prisma.missingAnswerLog.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (logs.length === 0) {
    console.log("Kayıtlı eksik cevap bulunamadı.");
    return;
  }

  console.log(`Toplam ${logs.length} adet eksik cevap denemesi bulundu:\n`);

  for (const [index, log] of logs.entries()) {
    const [team1, team2] = await Promise.all([
      prisma.team.findUnique({ where: { id: log.team1Id }, select: { name: true, country: true } }),
      prisma.team.findUnique({ where: { id: log.team2Id }, select: { name: true, country: true } }),
    ]);

    // İsme göre DB'de oyuncu arayalım (belki oyuncu var ama takım ilişkisi eksik)
    const matchingPlayers = await prisma.player.findMany({
      where: {
        fullName: {
          contains: log.submittedName.trim(),
          mode: "insensitive",
        },
      },
      include: {
        teamsHistory: {
          include: {
            team: {
              select: { name: true },
            },
          },
        },
      },
      take: 5,
    });

    // İki takımın DB'deki gerçek ortak oyuncuları kimlerdi?
    const actualCommonPlayers = await prisma.player.findMany({
      where: {
        teamsHistory: { some: { teamId: log.team1Id } },
        AND: [{ teamsHistory: { some: { teamId: log.team2Id } } }],
      },
      select: {
        fullName: true,
        nationality: true,
      },
    });

    console.log(`[#${index + 1}] Girilen Cevap: "${log.submittedName}"`);
    console.log(`   Takımlar: ${team1?.name || log.team1Id} VS ${team2?.name || log.team2Id}`);
    console.log(`   Tarih: ${log.createdAt.toISOString()}`);
    
    if (matchingPlayers.length > 0) {
      console.log(`   🔎 DB'de Bulunan Oyuncu(lar):`);
      for (const p of matchingPlayers) {
        const teamNames = p.teamsHistory.map((t) => t.team.name).join(", ");
        console.log(`      - ${p.fullName} (${p.nationality || "Milliyet Yok"}) | Kulüpleri: [${teamNames || "Hiç kulüp bağlı değil"}]`);
      }
    } else {
      console.log(`   ❌ DB'de bu isimle hiçbir oyuncu kaydı bulunamadı.`);
    }

    if (actualCommonPlayers.length > 0) {
      console.log(`   💡 Bu iki takımın DB'deki Gerçek Ortak Oyuncuları (${actualCommonPlayers.length} kişi):`);
      console.log(`      ${actualCommonPlayers.map((p) => p.fullName).join(", ")}`);
    } else {
      console.log(`   ⚠️ DB'de bu iki takımın hiçbir ortak oyuncusu kayıtlı DEĞİL!`);
    }

    console.log("--------------------------------------------------------------------------------");
  }
}

inspectMissingAnswers()
  .catch((err) => console.error("Hata:", err))
  .finally(() => prisma.$disconnect());
