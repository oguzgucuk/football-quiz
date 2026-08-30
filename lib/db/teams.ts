/**
 * Takım sorgulama ve rastgele takım seçimi repository fonksiyonları.
 */

import { prisma } from "@/lib/db/client";

export async function findTeamById(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
  });
}

export async function getAllTeams() {
  return prisma.team.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getRandomTeams(count: number = 6) {
  const allTeams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      country: true,
      league: true,
      logoUrl: true,
    },
  });

  const shuffled = [...allTeams].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
