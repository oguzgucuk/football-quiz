/**
 * Takım seçimi fazı için oyuncu geçmişi zengin olan takımlardan rastgele 6 adet döndürür.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    // En az 10 oyuncu geçmişi olan popüler takımları getir
    const teams = await prisma.team.findMany({
      where: {
        playersHistory: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        country: true,
        league: true,
        logoUrl: true,
      },
      take: 80,
    });

    const shuffled = [...teams].sort(() => 0.5 - Math.random());
    const selectedTeams = shuffled.slice(0, 6);

    return NextResponse.json({
      teams: selectedTeams,
    });
  } catch (error) {
    console.error("[API /api/teams/random] Hata:", error);
    return NextResponse.json(
      { error: "Takımlar yüklenemedi" },
      { status: 500 }
    );
  }
}
