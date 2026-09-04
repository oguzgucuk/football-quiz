/**
 * Maç ve tur kayıtlarının veritabanı işlemlerini yürüten repository fonksiyonları.
 * - Idempotent maç sonucu kaydı
 * - ELO hesaplama ve rankTier güncellemesi (Atomik $transaction)
 * - Streak (galibiyet serisi) takibi
 */

import { prisma } from "./client";
import { calculateEloChange } from "../elo/calculateEloChange";

export interface CompletedRoundData {
  roundNumber: number;
  entity1Id: string;
  entity2Id: string;
  winnerUserId?: string | null;
  answerGiven?: string | null;
  timeTakenMs?: number | null;
}

export interface FinalizeMatchParams {
  matchId: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  mode?: string;
  ranked?: boolean;
  rounds: CompletedRoundData[];
}

export interface FinalizeMatchResult {
  matchId: string;
  isDraw: boolean;
  p1EloChange: number;
  p2EloChange: number;
  p1NewElo: number;
  p2NewElo: number;
}

function calculateRankTier(elo: number): string {
  if (elo >= 1700) return "diamond";
  if (elo >= 1500) return "platinum";
  if (elo >= 1300) return "gold";
  if (elo >= 1100) return "silver";
  return "bronze";
}

/**
 * 5 tur sonunda maçı, turları ve oyuncuların güncel ELO/galibiyet istatistiklerini
 * tek bir atomik veritabanı transaction'ında kaydeder.
 *
 * @example
 * // player1 3-2 kazandığında:
 * finalizeMatchAndPersistElo({ matchId, player1Id, player2Id, player1Score: 3, player2Score: 2, ... })
 * // => { matchId, isDraw: false, p1EloChange: +14, p2EloChange: -14, ... }
 */
export async function finalizeMatchAndPersistElo({
  matchId,
  player1Id,
  player2Id,
  player1Score,
  player2Score,
  mode = "team_vs_team",
  ranked = true,
  rounds = [],
}: FinalizeMatchParams): Promise<FinalizeMatchResult> {
  // 1. Idempotency kontrolü: Maç daha önce kaydedilmiş mi?
  const existingMatch = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (existingMatch) {
    console.warn(`⚠️ [MatchService] Maç ${matchId} zaten veritabanında kayıtlı. Tekrar yazılmadı.`);
    return {
      matchId,
      isDraw: player1Score === player2Score,
      p1EloChange: 0,
      p2EloChange: 0,
      p1NewElo: 1000,
      p2NewElo: 1000,
    };
  }

  const isP1Bot = player1Id.startsWith("bot_");
  const isP2Bot = player2Id.startsWith("bot_");
  const isDraw = player1Score === player2Score;
  const p1Wins = player1Score > player2Score;
  const p2Wins = player2Score > player1Score;

  const winnerUserId = isDraw ? null : p1Wins ? player1Id : player2Id;

  // 2. Oyuncuları DB'den çek
  const [user1, user2] = await Promise.all([
    isP1Bot ? null : prisma.user.findUnique({ where: { id: player1Id } }),
    isP2Bot ? null : prisma.user.findUnique({ where: { id: player2Id } }),
  ]);

  let p1EloChange = 0;
  let p2EloChange = 0;
  let p1NewElo = user1?.eloRating ?? 1000;
  let p2NewElo = user2?.eloRating ?? 1000;

  // 3. ELO Hesaplaması (Ranked ve gerçek oyuncular varsa)
  if (ranked && !isDraw) {
    const p1CurrentElo = user1?.eloRating ?? 1000;
    const p2CurrentElo = user2?.eloRating ?? 1000;

    if (user1) {
      p1EloChange = calculateEloChange({
        playerElo: p1CurrentElo,
        opponentElo: p2CurrentElo,
        isWinner: p1Wins,
      });
      p1NewElo = Math.max(100, p1CurrentElo + p1EloChange);
    }

    if (user2) {
      p2EloChange = calculateEloChange({
        playerElo: p2CurrentElo,
        opponentElo: p1CurrentElo,
        isWinner: p2Wins,
      });
      p2NewElo = Math.max(100, p2CurrentElo + p2EloChange);
    }
  }

  // 4. Streak hesaplaması (kazanan/kaybeden için)
  const p1CurrentStreak = user1?.currentStreak ?? 0;
  const p2CurrentStreak = user2?.currentStreak ?? 0;
  const p1BestStreak = user1?.bestStreak ?? 0;
  const p2BestStreak = user2?.bestStreak ?? 0;

  const p1NewStreak = isDraw ? 0 : p1Wins ? p1CurrentStreak + 1 : 0;
  const p2NewStreak = isDraw ? 0 : p2Wins ? p2CurrentStreak + 1 : 0;

  // 5. Atomik Transaction ile kaydet
  await prisma.$transaction(async (tx) => {
    // A) Maç ana kaydı
    await tx.match.create({
      data: {
        id: matchId,
        player1Id,
        player2Id,
        player1Score,
        player2Score,
        winnerUserId,
        player1EloChange: p1EloChange,
        player2EloChange: p2EloChange,
        mode,
        ranked,
      },
    });

    // B) Tur detayları
    if (rounds.length > 0) {
      await tx.matchRound.createMany({
        data: rounds.map((r) => ({
          matchId,
          roundNumber: r.roundNumber,
          entity1Id: r.entity1Id,
          entity1Type: "team",
          entity2Id: r.entity2Id,
          entity2Type: "team",
          winnerUserId: r.winnerUserId ?? null,
          answerGiven: r.answerGiven ?? null,
          timeTakenMs: r.timeTakenMs ?? null,
          answeredAt: new Date(),
        })),
      });
    }

    // C) Oyuncu 1 güncellemesi
    if (user1 && !user1.isGuest) {
      await tx.user.update({
        where: { id: user1.id },
        data: {
          eloRating: p1NewElo,
          rankTier: calculateRankTier(p1NewElo),
          matchesWon: p1Wins ? { increment: 1 } : undefined,
          matchesLost: p2Wins ? { increment: 1 } : undefined,
          matchesDraw: isDraw ? { increment: 1 } : undefined,
          currentStreak: p1NewStreak,
          bestStreak: Math.max(p1BestStreak, p1NewStreak),
          lastSeenAt: new Date(),
        },
      });
    }

    // D) Oyuncu 2 güncellemesi
    if (user2 && !user2.isGuest) {
      await tx.user.update({
        where: { id: user2.id },
        data: {
          eloRating: p2NewElo,
          rankTier: calculateRankTier(p2NewElo),
          matchesWon: p2Wins ? { increment: 1 } : undefined,
          matchesLost: p1Wins ? { increment: 1 } : undefined,
          matchesDraw: isDraw ? { increment: 1 } : undefined,
          currentStreak: p2NewStreak,
          bestStreak: Math.max(p2BestStreak, p2NewStreak),
          lastSeenAt: new Date(),
        },
      });
    }
  });

  console.log(
    `✅ [MatchService] Maç ${matchId} kaydedildi. ELO: P1=${p1EloChange > 0 ? "+" : ""}${p1EloChange} (${p1NewElo}), P2=${p2EloChange > 0 ? "+" : ""}${p2EloChange} (${p2NewElo})`
  );

  return {
    matchId,
    isDraw,
    p1EloChange,
    p2EloChange,
    p1NewElo,
    p2NewElo,
  };
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
