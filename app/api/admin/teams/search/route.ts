/**
 * Admin paneli kulüp ekleme formu için hızlı takım arama API rotası.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";
import { searchTeamsForAdmin } from "@/lib/db/adminPlayers";

export async function GET(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const teams = await searchTeamsForAdmin(query);
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Admin team search error:", error);
    return NextResponse.json(
      { error: "Takımlar aranırken hata oluştu" },
      { status: 500 }
    );
  }
}
