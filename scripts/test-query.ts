import { prisma } from "../lib/db/client";

async function runVerification() {
  console.log("==========================================");
  console.log("🏆 TARİHİ VE GÜNCEL EŞLEŞME TESTLERİ");
  console.log("==========================================");

  const tests = [
    { teamA: "Real Madrid", teamB: "FC Barcelona" },
    { teamA: "Galatasaray", teamB: "FC Barcelona" },
    { teamA: "Fenerbahçe", teamB: "Flamengo" },
    { teamA: "Boca Juniors", teamB: "FC Barcelona" },
    { teamA: "Sakaryaspor", teamB: "Fenerbahçe" },
    { teamA: "Sakaryaspor", teamB: "Galatasaray" },
    { teamA: "Bursaspor", teamB: "Beşiktaş" },
    { teamA: "Santos FC", teamB: "Real Madrid" },
    { teamA: "River Plate", teamB: "Real Madrid" },
  ];

  for (const t of tests) {
    const tA = await prisma.team.findFirst({
      where: { name: { contains: t.teamA, mode: "insensitive" } },
    });
    const tB = await prisma.team.findFirst({
      where: { name: { contains: t.teamB, mode: "insensitive" } },
    });

    if (tA && tB) {
      const common = await prisma.player.findMany({
        where: {
          teamsHistory: { some: { teamId: tA.id } },
          AND: [{ teamsHistory: { some: { teamId: tB.id } } }],
        },
        select: { fullName: true, nationality: true },
        take: 10,
      });

      console.log(`\n🏟️  ${tA.name} ⚔️ ${tB.name} (${common.length} ortak oyuncu):`);
      console.log("   ⚽ " + common.map((p) => `${p.fullName}`).join(", "));
    } else {
      console.log(`\n❌ Bulunamadı: ${t.teamA} (${!!tA}) veya ${t.teamB} (${!!tB})`);
    }
  }
  console.log("\n==========================================");
}

runVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
