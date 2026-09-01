import { prisma } from "@/lib/db/client";

async function testAdminApi() {
  // Sayfa 1, tümü
  const total = await prisma.team.count();
  const page1 = await prisma.team.findMany({ take: 5, skip: 0, orderBy: [{ popularityScore: "desc" }, { name: "asc" }], select: { name: true, logoUrl: true } });
  console.log("Total:", total);
  console.log("Page1 (top 5 by popularity):", page1.map(t => `${t.name} → ${t.logoUrl ? "✅" : "⚪"}`));

  // logoUrl null filter
  const noLogo = await prisma.team.count({ where: { logoUrl: null } });
  const withLogo = await prisma.team.count({ where: { logoUrl: { not: null } } });
  console.log(`\nWith logo: ${withLogo}, No logo: ${noLogo}, Sum: ${withLogo + noLogo} (should = ${total})`);

  // rawQuery ülke listesi
  const countries = await prisma.$queryRaw<Array<{ country: string; count: number }>>`
    SELECT country, COUNT(*)::int AS count FROM teams WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 5
  `;
  console.log("\nTop 5 countries:", countries);

  await prisma.$disconnect();
}

testAdminApi();
