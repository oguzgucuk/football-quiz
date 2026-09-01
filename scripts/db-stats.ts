// Veritabanındaki takım istatistiklerini hızlıca özetler.
import { prisma } from "@/lib/db/client";

async function dbStats() {
  const total = await prisma.team.count();
  const withLogo = await prisma.team.count({ where: { logoUrl: { not: null } } });
  const withoutLogo = await prisma.team.count({ where: { logoUrl: null } });

  console.log(`\n📊 Takım İstatistikleri`);
  console.log(`  Toplam: ${total}`);
  console.log(`  Logo var: ${withLogo}`);
  console.log(`  Logo yok (monogram): ${withoutLogo}`);

  const byCountry = await prisma.team.groupBy({
    by: ["country"],
    _count: true,
    orderBy: { _count: { country: "desc" } },
    take: 20,
  });

  console.log(`\n🌍 Ülkelere Göre Dağılım (Top 20):`);
  for (const r of byCountry) {
    const withL = await prisma.team.count({ where: { country: r.country, logoUrl: { not: null } } });
    console.log(`  ${r.country ?? "(null)"}: ${r._count} takım, ${withL} logolu`);
  }
}

dbStats().finally(() => prisma.$disconnect());
