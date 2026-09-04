/**
 * Bekleyen arkadaşlık istekleri — gelen PENDING istekleri döndürür.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPendingRequestsForUser } from "@/lib/db/friendships";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const requests = await getPendingRequestsForUser(user.id);
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[API /api/friends/requests] Hata:", error);
    return NextResponse.json({ error: "İstekler alınamadı" }, { status: 500 });
  }
}
