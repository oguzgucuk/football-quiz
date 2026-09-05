/**
 * Kullanıcı istatistikleri ve maç geçmişi veritabanı sorgu fonksiyonları.
 * Kazanma oranı, streak ve gerçek maç geçmişi kayıtlarını içerir.
 */

import { prisma } from "./client";

export interface UserStats {
  eloRating: number;
  rankTier: string;
  matchesWon: number;
  matchesLost: number;
  matchesDraw: number;
  totalMatches: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  recentMatches: RecentMatch[];
}

export interface RecentMatch {
  matchId: string;
  opponentId: string;
  opponentUsername: string;
  isBot: boolean;
  mode: string;
  ranked: boolean;
  playerScore: number;
  opponentScore: number;
  isWin: boolean;
  isDraw: boolean;
  eloChange: number;
  playedAt: Date;
}

/**
 * Kullanıcının son oynadığı maç geçmişini getirir (varsayılan: son 30 maç).
 */
export async function getUserMatchHistory(
  userId: string,
  limit: number = 30
): Promise<RecentMatch[]> {
  const matchRecords = await prisma.match.findMany({
    where: {
      OR: [{ player1Id: userId }, { player2Id: userId }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      player1Id: true,
      player2Id: true,
      player1Score: true,
      player2Score: true,
      winnerUserId: true,
      player1EloChange: true,
      player2EloChange: true,
      mode: true,
      ranked: true,
      createdAt: true,
    },
  });

  if (matchRecords.length === 0) return [];

  // Gerçek oyuncu olan rakiplerin kullanıcı adlarını toplu çek
  const realOpponentIds = matchRecords
    .map((m) => (m.player1Id === userId ? m.player2Id : m.player1Id))
    .filter((id) => !id.startsWith("bot_"));

  const opponents = realOpponentIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: realOpponentIds } },
        select: { id: true, username: true },
      })
    : [];

  const opponentMap = new Map(opponents.map((o) => [o.id, o.username]));

  return matchRecords.map((m) => {
    const isPlayer1 = m.player1Id === userId;
    const opponentId = isPlayer1 ? m.player2Id : m.player1Id;
    const isBot = opponentId.startsWith("bot_");
    const myScore = isPlayer1 ? m.player1Score : m.player2Score;
    const opponentScore = isPlayer1 ? m.player2Score : m.player1Score;
    const isDraw = m.winnerUserId === null;
    const isWin = m.winnerUserId === userId;
    const eloChange = (isPlayer1 ? m.player1EloChange : m.player2EloChange) ?? 0;

    const opponentUsername = isBot
      ? "Yapay Zeka"
      : (opponentMap.get(opponentId) ?? "Oyuncu");

    return {
      matchId: m.id,
      opponentId,
      opponentUsername,
      isBot,
      mode: m.mode || "ranked",
      ranked: Boolean(m.ranked),
      playerScore: myScore,
      opponentScore,
      isWin,
      isDraw,
      eloChange,
      playedAt: m.createdAt,
    };
  });
}

/**
 * Bir kullanıcının tüm istatistiklerini ve son maçlarını döndürür.
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      eloRating: true,
      rankTier: true,
      matchesWon: true,
      matchesLost: true,
      matchesDraw: true,
      currentStreak: true,
      bestStreak: true,
    },
  });

  if (!user) return null;

  const totalMatches = user.matchesWon + user.matchesLost + user.matchesDraw;
  const winRate =
    totalMatches > 0 ? Math.round((user.matchesWon / totalMatches) * 100) : 0;

  const recentMatches = await getUserMatchHistory(userId, 30);

  return {
    eloRating: user.eloRating,
    rankTier: user.rankTier,
    matchesWon: user.matchesWon,
    matchesLost: user.matchesLost,
    matchesDraw: user.matchesDraw,
    totalMatches,
    winRate,
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    recentMatches,
  };
}
