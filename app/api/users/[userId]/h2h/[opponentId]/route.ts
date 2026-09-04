/**
 * Head-to-Head istatistik API rotası.
 * İki oyuncu arasındaki geçmiş maç geçmişini döndürür.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getH2hStats } from "@/lib/db/h2hStats";

interface RouteParams {
  params: Promise<{ userId: string; opponentId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { userId, opponentId } = await params;
    const stats = await getH2hStats(userId, opponentId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[API /api/users/[userId]/h2h/[opponentId]] Hata:", error);
    return NextResponse.json({ error: "H2H istatistikleri alınamadı" }, { status: 500 });
  }
}
