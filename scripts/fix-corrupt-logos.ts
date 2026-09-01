import { prisma } from "../lib/db/client";

async function run() {
  const teamsWithWebp = await prisma.team.findMany({
    where: {
      logoUrl: {
        endsWith: ".webp"
      }
    }
  });

  console.log(`Found ${teamsWithWebp.length} teams with .webp logos.`);

  let resetCount = 0;
  for (const team of teamsWithWebp) {
    if (!team.logoUrl) continue;
    
    try {
      const res = await fetch(team.logoUrl);
      const buffer = await res.arrayBuffer();
      const text = Buffer.from(buffer).slice(0, 10).toString();
      
      // JSON begins with {"buffer" or {"type"
      if (text.includes('{"buffer"') || text.includes('{"type"')) {
        console.log(`Corrupt JSON logo detected for ${team.name}, resetting...`);
        await prisma.team.update({
          where: { id: team.id },
          data: { logoUrl: null }
        });
        resetCount++;
      }
    } catch (e) {
      console.error(`Error checking ${team.name}:`, e);
    }
  }

  console.log(`Reset ${resetCount} corrupt logos.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
