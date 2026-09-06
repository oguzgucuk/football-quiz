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

export async function getCommonPlayersByNationAndTeam(
  nationQueries: string[],
  teamId: string,
  limit: number = 5
) {
  return prisma.player.findMany({
    where: {
      teamsHistory: {
        some: { teamId },
      },
      nationality: { in: nationQueries, mode: "insensitive" },
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

export interface PlayerExplorerParams {
  search?: string;
  sortBy?: "rating_desc" | "rating_asc" | "age_asc" | "age_desc" | "name_asc" | "name_desc";
  positionGroup?: "ALL" | "ATT" | "MID" | "DEF" | "GK";
  page?: number;
  limit?: number;
  onlyPrime?: boolean;
}

function buildPlayerWhere(params: PlayerExplorerParams) {
  const where: Record<string, unknown> = {};

  if (params.onlyPrime !== false) {
    where.overallPrime = { not: null };
  }

  if (params.search && params.search.trim().length > 0) {
    where.fullName = { contains: params.search.trim(), mode: "insensitive" };
  }

  const posMap: Record<string, string[]> = {
    ATT: ["ST", "CF", "LW", "RW"],
    MID: ["CAM", "CM", "CDM", "LM", "RM"],
    DEF: ["CB", "LB", "RB", "LWB", "RWB"],
    GK: ["GK"],
  };

  if (params.positionGroup && params.positionGroup !== "ALL" && posMap[params.positionGroup]) {
    where.positions = { hasSome: posMap[params.positionGroup] };
  }

  return where;
}

function buildPlayerOrderBy(sortBy: string = "rating_desc") {
  switch (sortBy) {
    case "rating_asc":
      return [{ overallPrime: { sort: "asc" as const, nulls: "last" as const } }, { fullName: "asc" as const }];
    case "age_asc":
      return [{ birthDate: { sort: "desc" as const, nulls: "last" as const } }, { overallPrime: { sort: "desc" as const, nulls: "last" as const } }];
    case "age_desc":
      return [{ birthDate: { sort: "asc" as const, nulls: "last" as const } }, { overallPrime: { sort: "desc" as const, nulls: "last" as const } }];
    case "name_asc":
      return [{ fullName: "asc" as const }];
    case "name_desc":
      return [{ fullName: "desc" as const }];
    case "rating_desc":
    default:
      return [{ overallPrime: { sort: "desc" as const, nulls: "last" as const } }, { fullName: "asc" as const }];
  }
}

import { searchPlayersExplorer } from "./searchPlayersExplorer";

export async function getPlayersExplorerList(params: PlayerExplorerParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(60, Math.max(1, params.limit || 24));
  const skip = (page - 1) * limit;

  // Arama sorgusu varsa unaccent & typo toleranslı PostgreSQL motorunu kullan
  if (params.search && params.search.trim().length > 0) {
    return searchPlayersExplorer(params, limit, skip, page);
  }

  const where = buildPlayerWhere(params);
  const orderBy = buildPlayerOrderBy(params.sortBy);

  const [total, rawPlayers] = await Promise.all([
    prisma.player.count({ where }),
    prisma.player.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        birthDate: true,
        nationality: true,
        position: true,
        overallPrime: true,
        positions: true,
        teamsHistory: {
          take: 5,
          select: {
            team: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const players = rawPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : null,
    nationality: p.nationality,
    position: p.position,
    overallPrime: p.overallPrime,
    positions: p.positions,
    teams: p.teamsHistory.map((th) => th.team),
  }));

  return {
    players,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

