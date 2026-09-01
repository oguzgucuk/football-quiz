import { prisma } from "../lib/db/client";

async function fixEgemenAndMergeClubs() {
  console.log("🛠️ [Kulüp Tekilleştirme & Egemen Korkmaz Düzeltmesi] Başlatılıyor...\n");

  // 1. Ana Kulüp ID'lerini Al
  const mainFb = await prisma.team.findFirst({
    where: { name: "Fenerbahçe", country: { in: ["Türkiye", "Turkey"] } },
  });
  const mainTs = await prisma.team.findFirst({
    where: { name: "Trabzonspor" },
  });
  const mainBjk = await prisma.team.findFirst({
    where: { name: "Beşiktaş" },
  });
  const mainBursa = await prisma.team.findFirst({
    where: { name: "Bursaspor" },
  });
  const mainBasaksehir = await prisma.team.findFirst({
    where: { OR: [{ name: { contains: "Başakşehir" } }, { name: { contains: "Basaksehir" } }] },
  });

  console.log("Ana Kulüpler:", {
    fenerbahce: mainFb?.id,
    trabzonspor: mainTs?.id,
    besiktas: mainBjk?.id,
    bursaspor: mainBursa?.id,
  });

  // 2. Mükerrer Fenerbahçe Istanbul kulübünü ana Fenerbahçe ile birleştir
  const duplicateFb = await prisma.team.findUnique({
    where: { id: "cmthqw0j200c8u6b0rfkmb3ad" },
  });

  if (duplicateFb && mainFb && duplicateFb.id !== mainFb.id) {
    console.log("🔄 Fenerbahçe Istanbul -> Fenerbahçe transferleri taşınıyor...");
    const dupHistories = await prisma.playerTeamHistory.findMany({
      where: { teamId: duplicateFb.id },
    });

    for (const h of dupHistories) {
      const exists = await prisma.playerTeamHistory.findFirst({
        where: { playerId: h.playerId, teamId: mainFb.id },
      });
      if (!exists) {
        await prisma.playerTeamHistory.create({
          data: { playerId: h.playerId, teamId: mainFb.id },
        });
      }
      await prisma.playerTeamHistory.delete({ where: { id: h.id } });
    }

    // Aliases güncelle
    await prisma.team.update({
      where: { id: mainFb.id },
      data: {
        aliases: { push: ["Fenerbahçe Istanbul", "Fenerbahce Istanbul"] },
      },
    });

    await prisma.team.delete({ where: { id: duplicateFb.id } });
    console.log("   ✅ Fenerbahçe Istanbul tekilleştirildi ve silindi.");
  }

  // 3. Egemen Korkmaz Oyuncusunu Bul ve Tüm Kulüplerini Bağla
  const egemen = await prisma.player.findFirst({
    where: { fullName: { equals: "Egemen Korkmaz", mode: "insensitive" } },
  });

  if (egemen) {
    console.log(`\n⚽ Egemen Korkmaz (${egemen.id}) Kulüpleri Bağlanıyor...`);

    const targetTeamIds = [
      mainTs?.id,
      mainFb?.id,
      mainBjk?.id,
      mainBursa?.id,
      mainBasaksehir?.id,
    ].filter(Boolean) as string[];

    for (const tId of targetTeamIds) {
      const team = await prisma.team.findUnique({ where: { id: tId } });
      const existing = await prisma.playerTeamHistory.findFirst({
        where: { playerId: egemen.id, teamId: tId },
      });

      if (!existing && team) {
        await prisma.playerTeamHistory.create({
          data: {
            playerId: egemen.id,
            teamId: tId,
          },
        });
        console.log(`   🔗 Bağlandı: Egemen Korkmaz -> ${team.name}`);
      } else if (team) {
        console.log(`   ✓ Zaten Bağlı: Egemen Korkmaz -> ${team.name}`);
      }
    }

    // Popülerlik puanını güncelle
    await prisma.player.update({
      where: { id: egemen.id },
      data: {
        popularityScore: 78,
        marketValueEur: 7600000,
        wikidataId: "Q1114411",
      },
    });
  }

  console.log("\n🎉 DÜZELTME BAŞARIYLA TAMAMLANDI!");
}

fixEgemenAndMergeClubs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
