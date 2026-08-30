/**
 * Veritabanı sağlık kontrolü (Health Check):
 * Tanınmış yıldız futbolcuların (Messi, Modric, Ronaldo, Zlatan, Arda Turan, Burak Yılmaz vb.)
 * kariyer geçmişlerini ve kulüp dağılım istatistiklerini detaylı inceler.
 */

import { prisma } from "../lib/db/client";

async function runHealthCheck() {
  console.log("=====================================================");
  console.log("🏥 VERİTABANI SAĞLIK VE VERİ KALİTESİ KONTROLÜ");
  console.log("=====================================================\n");

  // 1. Önemli Futbolcuların Kulüp Geçmişi Testi
  const testPlayers = [
    "Lionel Messi",
    "Luka Modrić",
    "Cristiano Ronaldo",
    "Zlatan Ibrahimović",
    "Arda Turan",
    "Burak Yılmaz",
    "Hakan Şükür",
    "Caner Erkin",
    "Diego Maradona",
    "Zinédine Zidane",
    "Ronaldinho",
    "Michy Batshuayi",
  ];

  console.log("⭐ [1/3] Ünlü Futbolcuların Kariyer Geçmişi:\n");

  for (const name of testPlayers) {
    const player = await prisma.player.findFirst({
      where: {
        fullName: { contains: name, mode: "insensitive" },
      },
      include: {
        teamsHistory: {
          include: { team: true },
        },
      },
    });

    if (player) {
      const clubs = player.teamsHistory.map((h) => h.team.name);
      console.log(`👤 ${player.fullName} (${player.nationality || "Bilinmiyor"}) - [${clubs.length} Kulüp]`);
      console.log(`   🏟️  ${clubs.join(" ➔ ")}\n`);
    } else {
      console.log(`❌ Bulunamadı: ${name}\n`);
    }
  }

  // 2. Oyuncu Başına Kulüp Sayısı Dağılımı (Neden Ortalama ~1.85?)
  console.log("=====================================================");
  console.log("📊 [2/3] Oyuncu Başına Kulüp Sayısı Dağılım İstatistiği:\n");

  const playerStats = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      teamsHistory: {
        select: { id: true },
      },
    },
  });

  let singleClub = 0;
  let twoClubs = 0;
  let threeToFiveClubs = 0;
  let sixPlusClubs = 0;

  for (const p of playerStats) {
    const count = p.teamsHistory.length;
    if (count === 1) singleClub++;
    else if (count === 2) twoClubs++;
    else if (count >= 3 && count <= 5) threeToFiveClubs++;
    else if (count >= 6) sixPlusClubs++;
  }

  const total = playerStats.length;
  console.log(`   • 1 Kulübü olan oyuncular (Gençler / Tek kulüp oynayanlar): ${singleClub} (%${((singleClub / total) * 100).toFixed(1)})`);
  console.log(`   • 2 Kulübü olan oyuncular: ${twoClubs} (%${((twoClubs / total) * 100).toFixed(1)})`);
  console.log(`   • 3 - 5 Kulüpte oynamış oyuncular: ${threeToFiveClubs} (%${((threeToFiveClubs / total) * 100).toFixed(1)})`);
  console.log(`   • 6+ Kulüpte oynamış deneyimli oyuncular: ${sixPlusClubs} (%${((sixPlusClubs / total) * 100).toFixed(1)})`);

  // 3. En Çok Kulüpte Oynamış İlk 10 Oyuncu
  console.log("\n=====================================================");
  console.log("🌍 [3/3] En Çok Kulüp Değiştiren İlk 10 Oyuncu (Gezginler):\n");

  const sortedPlayers = [...playerStats].sort(
    (a, b) => b.teamsHistory.length - a.teamsHistory.length
  );

  for (const p of sortedPlayers.slice(0, 10)) {
    console.log(`   🏆 ${p.fullName}: ${p.teamsHistory.length} farklı kulüp`);
  }

  console.log("\n=====================================================");
}

runHealthCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
