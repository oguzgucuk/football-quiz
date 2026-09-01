import { prisma } from "../lib/db/client";
import { calculatePlayerPopularity } from "../lib/popularity/calculatePopularity";

async function verifyPopularityCalculation() {
  console.log("=== DOĞRULAMA 3: CANLI FORMÜL ÇALIŞTIRMA TESTİ ===");

  const targetNames = ["Luca Toni", "Steven Gerrard", "Cristiano Ronaldo"];

  for (const name of targetNames) {
    const player = await prisma.player.findFirst({
      where: { fullName: { contains: name, mode: "insensitive" } },
      include: {
        teamsHistory: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!player) {
      console.log(`❌ Oyuncu bulunamadı: ${name}`);
      continue;
    }

    const marketValueEur = player.marketValueEur || 0;
    const transferCount = player.teamsHistory.length;
    const maxClubPrestige = player.teamsHistory.reduce(
      (max, h) => Math.max(max, h.team.popularityScore || 0),
      0
    );

    const calculatedScore = calculatePlayerPopularity({
      marketValueEur,
      transferCount,
      maxClubPrestige,
    });

    console.log(`\n⚽ Futbolcu: ${player.fullName}`);
    console.log(`   - DB'deki Kayıtlı Puan: ${player.popularityScore}/100`);
    console.log(`   - Piyasa Değeri: ${marketValueEur.toLocaleString()} €`);
    console.log(`   - Toplam Kulüp / Transfer Sayısı: ${transferCount}`);
    console.log(`   - En Yüksek Kulüp Prestiji: ${maxClubPrestige}/100`);
    console.log(`   - 🧮 Canlı Formül Hesaplama Çıktısı: ${calculatedScore}/100`);
    console.log(`   - Eşleşme Durumu: ${calculatedScore === player.popularityScore ? "✅ BİREBİR EŞLEŞİYOR" : "❌ FARKLI"}`);
  }

  await prisma.$disconnect();
}

verifyPopularityCalculation().catch((err) => {
  console.error(err);
  process.exit(1);
});
