import { prisma } from "../lib/db/client";

async function verifySupabaseCount() {
  const count: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM teams WHERE logo_url LIKE '%supabase.co%';
  `;
  console.log("📊 Teams with Supabase CDN logo URL:", count);

  const sampleTeams = await prisma.team.findMany({
    where: { logoUrl: { contains: "supabase.co" } },
    select: { name: true, country: true, league: true, logoUrl: true },
    take: 10,
  });
  console.log("\nSample Teams & Live HTTP Status:");
  for (const t of sampleTeams) {
    if (t.logoUrl) {
      const res = await fetch(t.logoUrl);
      console.log(`- ${t.name} (${t.country}) -> HTTP ${res.status} [${res.headers.get("content-type")}] -> ${t.logoUrl}`);
    }
  }
}

verifySupabaseCount().finally(() => prisma.$disconnect());
