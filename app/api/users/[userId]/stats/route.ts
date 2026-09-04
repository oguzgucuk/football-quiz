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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { userId } = await params;
    const stats = await getUserStats(userId);

    if (!stats) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[API /api/users/[userId]/stats] Hata:", error);
    return NextResponse.json({ error: "İstatistikler alınamadı" }, { status: 500 });
  }
}
