/**
 * Liderlik tablosu API rotası — ELO'ya göre sıralanmış en iyi oyuncular.
 */

import { NextResponse } from "next/server";
import { getLeaderboardUsers } from "@/lib/db/users";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const users = await getLeaderboardUsers(limit);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[API /api/users/leaderboard] Hata:", error);
    return NextResponse.json({ error: "Liderlik tablosu alınamadı" }, { status: 500 });
  }
}
