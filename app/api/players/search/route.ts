/**
 * İstemci tarafı fuzzy arama için hafif {id, name, popularityScore} oyuncu listesini döndürür.
 * Statik JSON indeksinden önbelleklenerek servis edilir ve HTTP CDN önbellek başlıklarıyla teslim edilir.
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/client";

interface LitePlayer {
  id: string;
  name: string;
  popularityScore: number;
}

let inMemoryPlayers: LitePlayer[] | null = null;
let lastLoadedTime = 0;

export async function GET() {
  try {
    const now = Date.now();
    // 1. Önce public/data/players-index.json statik dosyasını kontrol et
    const staticFilePath = path.join(process.cwd(), "public", "data", "players-index.json");
    if (fs.existsSync(staticFilePath)) {
      const stats = fs.statSync(staticFilePath);
      if (!inMemoryPlayers || stats.mtimeMs > lastLoadedTime) {
        const rawContent = fs.readFileSync(staticFilePath, "utf-8");
        inMemoryPlayers = JSON.parse(rawContent);
        lastLoadedTime = stats.mtimeMs;
      }

      return NextResponse.json(
        {
          players: inMemoryPlayers,
          total: inMemoryPlayers ? inMemoryPlayers.length : 0,
          fromCache: true,
          source: "static_file",
        },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        }
      );
    }

    // 2. Statik dosya henüz üretilmemişse DB'den en popüler ilk 20.000 oyuncuyu çek
    const dbPlayers = await prisma.player.findMany({
      where: {
        popularityScore: { gte: 40 },
      },
      select: {
        id: true,
        fullName: true,
        popularityScore: true,
      },
      orderBy: {
        popularityScore: "desc",
      },
      take: 10000,
    });

    inMemoryPlayers = dbPlayers.map((p) => ({
      id: p.id,
      name: p.fullName,
      popularityScore: p.popularityScore || 0,
    }));
    lastLoadedTime = now;

    return NextResponse.json(
      {
        players: inMemoryPlayers,
        total: inMemoryPlayers.length,
        fromCache: false,
        source: "database_fallback",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error("[API /api/players/search] Hata:", error);
    return NextResponse.json(
      { error: "Oyuncu listesi alınamadı" },
      { status: 500 }
    );
  }
}
