/**
 * İstemci tarafı Fuse.js serbest takım araması için tüm aktif kulüpleri döndürür.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const dbTeams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        league: true,
        aliases: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      teams: dbTeams,
      total: dbTeams.length,
    });
  } catch (error) {
    console.error("[API /api/teams/search] Hata:", error);
    return NextResponse.json(
      { error: "Kulüp listesi alınamadı" },
      { status: 500 }
    );
  }
}
