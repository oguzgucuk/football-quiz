/**
 * İki oyuncu arasındaki head-to-head (H2H) maç geçmişini hesaplayan repository.
 * Her iki yönden (player1 veya player2) yapılan maçları kapsar.
 */

import { prisma } from "./client";

export interface H2HStats {
  totalMatches: number;
  myWins: number;
  opponentWins: number;
  draws: number;
  myWinRate: number;
  recentMatches: {
    matchId: string;
    myScore: number;
    opponentScore: number;
    isWin: boolean;
    isDraw: boolean;
    playedAt: Date;
  }[];
}

/**
 * İki kullanıcı arasındaki geçmiş maç istatistiklerini döndürür.
 *
 * @example
 * getH2hStats("userA", "userB")
 * // => { totalMatches: 7, myWins: 4, opponentWins: 3, myWinRate: 57, ... }
 */
export async function getH2hStats(userId: string, opponentId: string): Promise<H2HStats> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { player1Id: userId, player2Id: opponentId },
        { player1Id: opponentId, player2Id: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      player1Id: true,
      player1Score: true,
      player2Score: true,
      winnerUserId: true,
      createdAt: true,
    },
  });

  let myWins = 0;
  let opponentWins = 0;
  let draws = 0;

  const recentMatches = matches.map((m) => {
    const isPlayer1 = m.player1Id === userId;
    const myScore = isPlayer1 ? m.player1Score : m.player2Score;
    const opponentScore = isPlayer1 ? m.player2Score : m.player1Score;
    const isDraw = m.winnerUserId === null;
    const isWin = m.winnerUserId === userId;

    if (isDraw) draws++;
    else if (isWin) myWins++;
    else opponentWins++;

    return {
      matchId: m.id,
      myScore,
      opponentScore,
      isWin,
      isDraw,
      playedAt: m.createdAt,
    };
  });

  const totalMatches = myWins + opponentWins + draws;
  const myWinRate = totalMatches > 0 ? Math.round((myWins / totalMatches) * 100) : 0;

  return {
    totalMatches,
    myWins,
    opponentWins,
    draws,
    myWinRate,
    recentMatches,
  };
}
