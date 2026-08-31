/**
 * Takım seçimi fazı için oyuncu geçmişi zengin olan takımlardan rastgele 6 adet döndürür.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { isTeamPlayableInGame } from "@/lib/db/allowedTeams";

export async function GET() {
  try {
    // En az 5 oyuncu geçmişi olan takımları getir
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
      take: 200,
    });

    // İzin verilen lig ve ülkelere göre filtrele
    const playableTeams = teams.filter((t) => isTeamPlayableInGame(t));
    const shuffled = [...playableTeams].sort(() => 0.5 - Math.random());
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
