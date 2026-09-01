/**
 * İstemci tarafı Fuse.js serbest takım araması için tüm aktif ve seçkin kulüpleri döndürür.
 * Popülerlik puanına göre sıralı olarak teslim edilir.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { isTeamPlayableInGame } from "@/lib/db/allowedTeams";

interface CachedTeam {
  id: string;
  name: string;
  country: string | null;
  league: string | null;
  aliases: string[];
  popularityScore: number;
  logoUrl: string | null;
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
        popularityScore: true,
        logoUrl: true,
      },
      orderBy: {
        popularityScore: "desc",
      },
    });

    // Sadece izin verilen liglerdeki ve ülkelerdeki takımları filtrele
    const playableTeams = dbTeams
      .filter((t) => isTeamPlayableInGame(t))
      .map((t) => ({
        id: t.id,
        name: t.name,
        country: t.country,
        league: t.league,
        aliases: t.aliases,
        popularityScore: t.popularityScore || 0,
        logoUrl: t.logoUrl,
      }));

    cachedTeams = playableTeams;
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
