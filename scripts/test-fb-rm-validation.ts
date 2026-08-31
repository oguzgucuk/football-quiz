/**
 * Fenerbahçe - Real Madrid ve Real Madrid - Barcelona eşleşmelerinde
 * Arda Güler ve Luís Figo cevap doğrulamasını test eden script.
 */

import { prisma } from "../lib/db/client";
import { matchPlayerAnswer } from "../lib/validation/matchPlayerAnswer";

async function runTests() {
  console.log("🧪 [Test] Fenerbahçe - Real Madrid ve Real Madrid - Barcelona Cevap Testi...\n");

  const fenerbahce = await prisma.team.findFirst({ where: { name: { equals: "Fenerbahçe", mode: "insensitive" } } });
  const realMadrid = await prisma.team.findFirst({ where: { name: { equals: "Real Madrid", mode: "insensitive" } } });
  const barcelona = await prisma.team.findFirst({ where: { name: { equals: "FC Barcelona", mode: "insensitive" } } });

  if (!fenerbahce || !realMadrid || !barcelona) {
    console.error("Takımlar bulunamadı!");
    process.exit(1);
  }

  // 1. Fenerbahçe - Real Madrid Ortak Oyuncuları
  const fbRmPlayers = await prisma.player.findMany({
    where: {
      teamsHistory: { some: { teamId: fenerbahce.id } },
      AND: [{ teamsHistory: { some: { teamId: realMadrid.id } } }],
    },
    select: { id: true, fullName: true, nationality: true },
  });

  console.log(`📊 Fenerbahçe & Real Madrid Ortak Oyuncu Sayısı: ${fbRmPlayers.length}`);
  console.log("   Oyuncular:", fbRmPlayers.map((p) => p.fullName).join(", "));

  const ardaMatch = matchPlayerAnswer("arda güler", fbRmPlayers);
  console.log(`✓ "arda güler" girdisi ➔ Eşleşen: ${ardaMatch ? ardaMatch.fullName : "YOK (HATA!)"}`);

  const ardaTypoMatch = matchPlayerAnswer("arda guler", fbRmPlayers);
  console.log(`✓ "arda guler" girdisi ➔ Eşleşen: ${ardaTypoMatch ? ardaTypoMatch.fullName : "YOK (HATA!)"}`);

  // 2. Real Madrid - FC Barcelona Ortak Oyuncuları
  const rmBarcaPlayers = await prisma.player.findMany({
    where: {
      teamsHistory: { some: { teamId: realMadrid.id } },
      AND: [{ teamsHistory: { some: { teamId: barcelona.id } } }],
    },
    select: { id: true, fullName: true, nationality: true },
  });

  console.log(`\n📊 Real Madrid & FC Barcelona Ortak Oyuncu Sayısı: ${rmBarcaPlayers.length}`);
  console.log("   Oyuncular:", rmBarcaPlayers.map((p) => p.fullName).join(", "));

  const figoMatch = matchPlayerAnswer("luis figo", rmBarcaPlayers);
  console.log(`✓ "luis figo" girdisi ➔ Eşleşen: ${figoMatch ? figoMatch.fullName : "YOK (HATA!)"}`);

  const figoSingleMatch = matchPlayerAnswer("figo", rmBarcaPlayers);
  console.log(`✓ "figo" girdisi ➔ Eşleşen: ${figoSingleMatch ? figoSingleMatch.fullName : "YOK (HATA!)"}`);

  if (ardaMatch && figoMatch) {
    console.log("\n🎉 [Tüm Testler Başarıyla Geçti!]");
  } else {
    console.error("\n❌ Testlerden biri başarısız oldu!");
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
