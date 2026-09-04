/**
 * Futbolcu sorguları ve iki takımda da forma giymiş oyuncu doğrulama repository fonksiyonları.
 */

import { prisma } from "@/lib/db/client";
import { PlayerSearchItem } from "@/types/game";
import { logMissingAnswer as logMissingAnswerService } from "./missingAnswers";

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
    orderBy: {
      fullName: "asc",
    },
  });

  return players.map((p) => ({
    id: p.id,
    name: p.fullName,
  }));
}

export async function getCommonPlayersByTeams(
  team1Id: string,
  team2Id: string,
  limit: number = 5
) {
  return prisma.player.findMany({
    where: {
      teamsHistory: {
        some: { teamId: team1Id },
      },
      AND: [
        {
          teamsHistory: {
            some: { teamId: team2Id },
          },
        },
      ],
    },
    select: {
      id: true,
      fullName: true,
      nationality: true,
      birthDate: true,
      popularityScore: true,
    },
    orderBy: [
      { popularityScore: "desc" },
      { marketValueEur: { sort: "desc", nulls: "last" } },
      { fullName: "asc" },
    ],
    take: limit,
  });
}

export async function logMissingAnswer(
  submittedName: string,
  team1Id: string,
  team2Id: string
) {
  return logMissingAnswerService({
    rawAnswer: submittedName,
    team1Id,
    team2Id,
  });
}
