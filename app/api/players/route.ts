/**
 * Oyuncu veritabanı keşif ve arama/filtreleme API endpoint'i.
 */

import { NextRequest, NextResponse } from "next/server";
import { playerExplorerSchema } from "@/lib/validation/playerExplorerSchema";
import { getPlayersExplorerList } from "@/lib/db/players";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = {
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      positionGroup: searchParams.get("positionGroup") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      onlyPrime: searchParams.get("onlyPrime") || undefined,
    };

    const validation = playerExplorerSchema.safeParse(rawQuery);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Geçersiz arama parametreleri", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = await getPlayersExplorerList(validation.data);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API /api/players] Hata:", message);
    return NextResponse.json(
      { error: "Oyuncular yüklenirken bir hata oluştu", details: message },
      { status: 500 }
    );
  }
}
