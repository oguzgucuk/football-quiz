/**
 * Kullanıcı arama API rotası — arkadaş eklemek için kullanıcı adı araması.
 * Minimum 2 karakter gerektirir, kendi hesabını hariç tutar.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: "insensitive" },
        isGuest: false,
        id: { not: user.id }, // Kendini hariç tut
      },
      select: { id: true, username: true, eloRating: true, rankTier: true },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[API /api/users/search] Hata:", error);
    return NextResponse.json({ error: "Arama yapılamadı" }, { status: 500 });
  }
}
