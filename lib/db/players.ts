/**
 * Futbolcu sorguları ve iki takımda da forma giymiş oyuncu doğrulama repository fonksiyonları.
 */

import { prisma } from "@/lib/db/client";
import { PlayerSearchItem } from "@/types/game";

export async function findPlayerById(playerId: string) {
  return prisma.player.findUnique({
    where: { id: playerId },
    include: {
      teamsHistory: {
        include: {
          team: true,
        },
      },
    },
  });
}

export async function findCommonPlayerByTeamsAndName(
  team1Id: string,
  team2Id: string,
  submittedName: string
) {
  const normalizedInput = submittedName.trim().toLowerCase();

  return prisma.player.findFirst({
    where: {
      fullName: {
        equals: normalizedInput,
        mode: "insensitive",
      },
      teamsHistory: {
        some: {
          teamId: team1Id,
        },
      },
      AND: [
        {
          teamsHistory: {
            some: {
              teamId: team2Id,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      fullName: true,
      nationality: true,
    },
  });
}

export async function getAllPlayerSearchItems(): Promise<PlayerSearchItem[]> {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
    },
  });

  return players.map((player) => ({
    id: player.id,
    name: player.fullName,
  }));
}

export async function logMissingAnswer(
  submittedName: string,
  team1Id: string,
  team2Id: string
) {
  return prisma.missingAnswerLog.create({
    data: {
      submittedName,
      team1Id,
      team2Id,
    },
  });
}
