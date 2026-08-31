import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const cnt = await prisma.player.count();
  const withNat = await prisma.player.count({ where: { nationality: { not: null } } });
  const withPos = await prisma.player.count({ where: { position: { not: null } } });
  const withBirth = await prisma.player.count({ where: { birthDate: { not: null } } });
  const teamCnt = await prisma.team.count();
  const missingLogs = await prisma.missingAnswerLog.count();

  // Tek isimli oyuncular (muhtemelen sorun çıkarabilir)
  const singleNamePlayers = await prisma.player.count({
    where: { fullName: { not: { contains: " " } } }
  });

  // Milliyetsiz oyuncular
  const noNatPlayers = await prisma.player.count({ where: { nationality: null } });

  // Takım geçmişi olmayan oyuncular (orphan)
  const playersWithNoTeams = await prisma.player.findMany({
    where: { teamsHistory: { none: {} } },
    select: { id: true, fullName: true },
    take: 10
  });

  console.log("=== DB STATS ===");
  console.log({ players: cnt, teams: teamCnt, missingLogs });
  console.log({ withNationality: withNat, withPosition: withPos, withBirthDate: withBirth });
  console.log(`No nationality: ${noNatPlayers} (${((noNatPlayers/cnt)*100).toFixed(1)}%)`);
  console.log(`Single name players: ${singleNamePlayers} (${((singleNamePlayers/cnt)*100).toFixed(1)}%)`);
  console.log(`Players with no team history (sample): ${playersWithNoTeams.length}`);
  if (playersWithNoTeams.length > 0) {
    console.log(playersWithNoTeams.map(p => p.fullName).join(", "));
  }
}

main().finally(() => prisma.$disconnect());
