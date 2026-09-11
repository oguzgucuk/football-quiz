/**
 * Admin paneli için oyuncu ve kulüp geçmişi Prisma veri erişim katmanı.
 */

import { prisma } from "./client";
import { Prisma } from "@prisma/client";
import {
  UpdatePlayerInput,
  CreatePlayerInput,
  AddPlayerClubInput,
  UpdatePlayerClubInput,
} from "../validation/adminPlayerSchema";

export interface AdminPlayerListOptions {
  search?: string;
  teamId?: string;
  position?: string;
  minRating?: number;
  maxRating?: number;
  page?: number;
  perPage?: number;
}

export async function getAdminPlayers(options: AdminPlayerListOptions) {
  const page = Math.max(1, options.page || 1);
  const perPage = Math.min(Math.max(1, options.perPage || 20), 100);
  const skip = (page - 1) * perPage;

  const where: Prisma.PlayerWhereInput = {};

  if (options.search) {
    where.OR = [
      { fullName: { contains: options.search, mode: "insensitive" } },
      { nationality: { contains: options.search, mode: "insensitive" } },
    ];
  }

  if (options.teamId) {
    where.teamsHistory = { some: { teamId: options.teamId } };
  }

  if (options.position) {
    where.OR = [
      { position: { equals: options.position, mode: "insensitive" } },
      { positions: { has: options.position.toUpperCase() } },
    ];
  }

  if (options.minRating !== undefined || options.maxRating !== undefined) {
    where.overallPrime = {};
    if (options.minRating !== undefined) where.overallPrime.gte = options.minRating;
    if (options.maxRating !== undefined) where.overallPrime.lte = options.maxRating;
  }

  const [players, total] = await Promise.all([
    prisma.player.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        position: true,
        positions: true,
        overallPrime: true,
        popularityScore: true,
        nationality: true,
        birthDate: true,
        teamsHistory: {
          take: 3,
          orderBy: { seasonEnd: "desc" },
          select: {
            seasonStart: true,
            seasonEnd: true,
            team: {
              select: { id: true, name: true, logoUrl: true },
            },
          },
        },
      },
      orderBy: [{ popularityScore: "desc" }, { overallPrime: "desc" }],
      skip,
      take: perPage,
    }),
    prisma.player.count({ where }),
  ]);

  return {
    players,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function getAdminPlayerById(playerId: string) {
  return prisma.player.findUnique({
    where: { id: playerId },
    include: {
      teamsHistory: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              country: true,
              league: true,
            },
          },
        },
        orderBy: [{ seasonEnd: "desc" }, { seasonStart: "desc" }],
      },
    },
  });
}

export async function updateAdminPlayer(playerId: string, data: UpdatePlayerInput) {
  const birthDate = data.birthDate ? new Date(data.birthDate) : null;

  return prisma.player.update({
    where: { id: playerId },
    data: {
      fullName: data.fullName,
      birthDate: birthDate && !isNaN(birthDate.getTime()) ? birthDate : null,
      nationality: data.nationality || null,
      position: data.position || null,
      positions: data.positions || [],
      overallPrime: data.overallPrime,
      popularityScore: data.popularityScore,
    },
  });
}

export async function addPlayerClubHistory(playerId: string, data: AddPlayerClubInput) {
  return prisma.playerTeamHistory.upsert({
    where: {
      playerId_teamId: {
        playerId,
        teamId: data.teamId,
      },
    },
    update: {
      seasonStart: data.seasonStart,
      seasonEnd: data.seasonEnd,
      isNationalTeam: data.isNationalTeam,
    },
    create: {
      playerId,
      teamId: data.teamId,
      seasonStart: data.seasonStart,
      seasonEnd: data.seasonEnd,
      isNationalTeam: data.isNationalTeam,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          country: true,
          league: true,
        },
      },
    },
  });
}

export async function updatePlayerClubHistory(
  playerId: string,
  teamId: string,
  data: UpdatePlayerClubInput
) {
  return prisma.playerTeamHistory.update({
    where: {
      playerId_teamId: {
        playerId,
        teamId,
      },
    },
    data: {
      seasonStart: data.seasonStart,
      seasonEnd: data.seasonEnd,
      isNationalTeam: data.isNationalTeam,
    },
  });
}

export async function removePlayerClubHistory(playerId: string, teamId: string) {
  return prisma.playerTeamHistory.delete({
    where: {
      playerId_teamId: {
        playerId,
        teamId,
      },
    },
  });
}

export async function createAdminPlayer(data: CreatePlayerInput) {
  const birthDate = data.birthDate ? new Date(data.birthDate) : null;

  return prisma.player.create({
    data: {
      fullName: data.fullName,
      birthDate: birthDate && !isNaN(birthDate.getTime()) ? birthDate : null,
      nationality: data.nationality || null,
      position: data.position || null,
      positions: data.positions || [],
      overallPrime: data.overallPrime,
      popularityScore: data.popularityScore,
      ...(data.initialTeamId && {
        teamsHistory: {
          create: {
            teamId: data.initialTeamId,
            seasonStart: data.seasonStart || 2026,
          },
        },
      }),
    },
  });
}

export async function searchTeamsForAdmin(query: string) {
  if (!query || query.trim().length < 2) return [];

  return prisma.team.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { league: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      country: true,
      league: true,
    },
    orderBy: { popularityScore: "desc" },
    take: 15,
  });
}
