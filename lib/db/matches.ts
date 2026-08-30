/**
 * Maç ve tur kayıtlarının veritabanı işlemlerini yürüten repository fonksiyonları.
 */

import { prisma } from "@/lib/db/client";

interface CreateMatchParams {
  player1Id: string;
  player2Id: string;
  mode?: string;
  ranked?: boolean;
}

interface SaveRoundParams {
  matchId: string;
  roundNumber: number;
  entity1Id: string;
  entity2Id: string;
  winnerUserId?: string | null;
  answerGiven?: string | null;
  timeTakenMs?: number | null;
}

export async function createMatchRecord({
  player1Id,
  player2Id,
  mode = "team_vs_team",
  ranked = true,
}: CreateMatchParams) {
  return prisma.match.create({
    data: {
      player1Id,
      player2Id,
      mode,
      ranked,
    },
  });
}

export async function saveMatchRoundRecord({
  matchId,
  roundNumber,
  entity1Id,
  entity2Id,
  winnerUserId,
  answerGiven,
  timeTakenMs,
}: SaveRoundParams) {
  return prisma.matchRound.create({
    data: {
      matchId,
      roundNumber,
      entity1Id,
      entity2Id,
      winnerUserId,
      answerGiven,
      timeTakenMs,
      answeredAt: new Date(),
    },
  });
}

export async function findMatchById(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      rounds: {
        orderBy: { roundNumber: "asc" },
      },
    },
  });
}
