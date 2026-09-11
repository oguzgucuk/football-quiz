/**
 * Admin oyuncu listesi (GET) ve yeni oyuncu ekleme (POST) API rotası.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";
import { getAdminPlayers, createAdminPlayer } from "@/lib/db/adminPlayers";
import { createPlayerSchema } from "@/lib/validation/adminPlayerSchema";

export async function GET(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || undefined;
    const teamId = searchParams.get("teamId") || undefined;
    const position = searchParams.get("position") || undefined;
    const minRating = searchParams.get("minRating")
      ? parseInt(searchParams.get("minRating")!, 10)
      : undefined;
    const maxRating = searchParams.get("maxRating")
      ? parseInt(searchParams.get("maxRating")!, 10)
      : undefined;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!, 10)
      : 1;
    const perPage = searchParams.get("perPage")
      ? parseInt(searchParams.get("perPage")!, 10)
      : 20;

    const data = await getAdminPlayers({
      search,
      teamId,
      position,
      minRating,
      maxRating,
      page,
      perPage,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin players fetch error:", error);
    return NextResponse.json(
      { error: "Oyuncular listelenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = createPlayerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const newPlayer = await createAdminPlayer(parsed.data);
    return NextResponse.json({ success: true, player: newPlayer }, { status: 201 });
  } catch (error) {
    console.error("Admin create player error:", error);
    return NextResponse.json(
      { error: "Yeni oyuncu oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}
