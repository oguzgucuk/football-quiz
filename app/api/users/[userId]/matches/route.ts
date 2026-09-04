/**
 * Kullanıcı maç geçmişi API rotası.
 * Kullanıcının son oynadığı maçları (rakip, skor, ELO değişimi, tarih) döndürür.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserMatchHistory } from "@/lib/db/stats";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 30, 50) : 30;

    const matches = await getUserMatchHistory(userId, limit);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("[API /api/users/[userId]/matches] Hata:", error);
    return NextResponse.json({ error: "Maç geçmişi alınamadı" }, { status: 500 });
  }
}
