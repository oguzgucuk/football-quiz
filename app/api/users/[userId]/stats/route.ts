/**
 * Kullanıcı istatistikleri API rotası.
 * Giriş yapmış kullanıcı kendi veya başkasının istatistiklerini görebilir.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserStats } from "@/lib/db/stats";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({
        stats: {
          winRate: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesDraw: 0,
          totalMatches: 0,
        },
      });
    }

    const stats = await getUserStats(userId);

    if (!stats) {
      return NextResponse.json({
        stats: {
          winRate: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesDraw: 0,
          totalMatches: 0,
        },
      });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[API /api/users/[userId]/stats] Hata:", error);
    return NextResponse.json({
      stats: {
        winRate: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesDraw: 0,
        totalMatches: 0,
      },
    });
  }
}
