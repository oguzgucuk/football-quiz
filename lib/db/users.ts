/**
 * Kullanıcı ve ELO sıralama veritabanı repository fonksiyonları.
 */

import { prisma } from "@/lib/db/client";

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function updateUserEloRating(
  userId: string,
  newElo: number,
  newRankTier: string
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      eloRating: newElo,
      rankTier: newRankTier,
    },
  });
}

export async function getLeaderboardUsers(limit: number = 20) {
  return prisma.user.findMany({
    orderBy: { eloRating: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      eloRating: true,
      rankTier: true,
      createdAt: true,
    },
  });
}
