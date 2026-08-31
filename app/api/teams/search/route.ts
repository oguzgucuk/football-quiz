/**
 * İstemci tarafı Fuse.js serbest takım araması için tüm aktif kulüpleri döndürür.
 * Sonuçlar 30 dakika boyunca bellekte önbelleğe alınır (oyuncu API'siyle aynı strateji).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

interface CachedTeam {
  id: string;
  name: string;
  country: string | null;
  league: string | null;
  aliases: string[];
}

// Bellek içi önbellek (Sunucu ömrü boyunca tek sorgu)
let cachedTeams: CachedTeam[] | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 dakika

export async function GET() {
  try {
    const now = Date.now();

    if (cachedTeams && now - cacheTime < CACHE_DURATION_MS) {
      return NextResponse.json({
        teams: cachedTeams,
        total: cachedTeams.length,
        fromCache: true,
      });
    }

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

    cachedTeams = dbTeams;
    cacheTime = now;

    return NextResponse.json({
      teams: cachedTeams,
      total: cachedTeams.length,
      fromCache: false,
    });
  } catch (error) {
    console.error("[API /api/teams/search] Hata:", error);
    return NextResponse.json(
      { error: "Kulüp listesi alınamadı" },
      { status: 500 }
    );
  }
}
