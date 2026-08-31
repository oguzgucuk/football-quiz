/**
 * İstemci tarafı Fuse.js fuzzy arama motoru için hafif {id, name} oyuncu listesini döndürür.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// Bellek içi önbellek (Sunucu ömrü boyunca tek sorgu)
let cachedPlayers: { id: string; name: string }[] | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 dakika

export async function GET() {
  try {
    const now = Date.now();

    if (cachedPlayers && now - cacheTime < CACHE_DURATION_MS) {
      return NextResponse.json({
        players: cachedPlayers,
        total: cachedPlayers.length,
        fromCache: true,
      });
    }

    const dbPlayers = await prisma.player.findMany({
      select: {
        id: true,
        fullName: true,
        nationality: true,
        birthDate: true,
        position: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    cachedPlayers = dbPlayers.map((p) => ({
      id: p.id,
      name: p.fullName,
      nationality: p.nationality,
      birthYear: p.birthDate ? p.birthDate.getFullYear() : null,
      position: p.position,
    }));
    cacheTime = now;

    return NextResponse.json({
      players: cachedPlayers,
      total: cachedPlayers.length,
      fromCache: false,
    });
  } catch (error) {
    console.error("[API /api/players/search] Hata:", error);
    return NextResponse.json(
      { error: "Oyuncu listesi alınamadı" },
      { status: 500 }
    );
  }
}
