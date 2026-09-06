/**
 * Prime Overall ve pozisyon atamalarını doğrulayan test ve raporlama scripti.
 */

import { prisma } from "../../lib/db/client";

async function verify() {
  console.log("🔍 [Prime Overall Doğrulama Testi]\n");

  // 1. İstatistikler
  const totalWithPrime = await prisma.player.count({
    where: { overallPrime: { not: null } },
  });
  const minPrime = await prisma.player.findFirst({
    where: { overallPrime: { not: null } },
    orderBy: { overallPrime: "asc" },
    select: { fullName: true, overallPrime: true },
  });
  const maxPrime = await prisma.player.findFirst({
    where: { overallPrime: { not: null } },
    orderBy: { overallPrime: "desc" },
    select: { fullName: true, overallPrime: true },
  });

  console.log(`📊 Toplam Prime Reyting Alan Oyuncu: ${totalWithPrime}`);
  console.log(`   - En düşük reyting: ${minPrime?.fullName} (${minPrime?.overallPrime})`);
  console.log(`   - En yüksek reyting: ${maxPrime?.fullName} (${maxPrime?.overallPrime})`);

  if (minPrime && minPrime.overallPrime! < 67) {
    console.error(`❌ HATA: 67 altı reyting bulundu: ${minPrime.fullName} -> ${minPrime.overallPrime}`);
  } else {
    console.log("   ✅ 67 barajı kuralı eksiksiz sağlandı.");
  }

  // 2. Dünya Çapında Zirve (Top 15)
  console.log("\n⭐ [Dünya Zirvesi - En Yüksek 15 Oyuncu]");
  const top15 = await prisma.player.findMany({
    where: { overallPrime: { not: null } },
    orderBy: { overallPrime: "desc" },
    take: 15,
    select: { fullName: true, overallPrime: true, positions: true, nationality: true },
  });
  console.table(top15.map((p) => ({
    İsim: p.fullName,
    Reyting: p.overallPrime,
    Pozisyonlar: p.positions.join(", "),
    Uyruk: p.nationality,
  })));

  // 3. Özel Benchmark Oyuncuları
  console.log("\n🎯 [Önemli Benchmark Oyuncuları Kontrolü]");
  const testNames = [
    "Lionel Messi",
    "Cristiano Ronaldo",
    "Pelé",
    "Diego Maradona",
    "Zinedine Zidane",
    "Thierry Henry",
    "Gianluigi Buffon",
    "Ronaldinho",
    "Ruud van Nistelrooy",
    "Adriano",
    "Alex de Souza",
    "Sergen Yalçın",
    "Hakan Şükür",
    "Tuncay Şanlı",
    "Nihat Kahveci",
    "Rüştü Reçber",
    "Hakan Çalhanoğlu",
    "Arda Güler",
    "Ferdi Kadıoğlu",
    "İsmail Yüksek",
    "Kevin De Bruyne",
    "Kylian Mbappé",
  ];

  const benchmarks = await prisma.player.findMany({
    where: {
      fullName: { in: testNames },
    },
    select: { fullName: true, overallPrime: true, positions: true },
  });

  console.table(benchmarks.map((p) => ({
    İsim: p.fullName,
    Reyting: p.overallPrime ?? "Belirlenmedi",
    Pozisyonlar: p.positions.length > 0 ? p.positions.join(", ") : "-",
  })));

  // 4. En Eski Tarihli Oyuncular
  console.log("\n⏳ [Tarihsel Derinlik - En Eski Doğumlu Prime Oyuncular]");
  const oldest = await prisma.player.findMany({
    where: { overallPrime: { not: null }, birthDate: { not: null } },
    orderBy: { birthDate: "asc" },
    take: 8,
    select: { fullName: true, birthDate: true, overallPrime: true, nationality: true },
  });
  console.table(oldest.map((p) => ({
    İsim: p.fullName,
    DoğumTarihi: p.birthDate?.toISOString().slice(0, 10),
    Reyting: p.overallPrime,
    Ülke: p.nationality,
  })));
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

