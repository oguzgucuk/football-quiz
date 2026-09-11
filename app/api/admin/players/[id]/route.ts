/**
 * Tekil oyuncu detayı (GET) ve güncelleme (PUT) API rotası.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";
import { getAdminPlayerById, updateAdminPlayer } from "@/lib/db/adminPlayers";
import { updatePlayerSchema } from "@/lib/validation/adminPlayerSchema";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const player = await getAdminPlayerById(id);

    if (!player) {
      return NextResponse.json({ error: "Oyuncu bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error("Admin get player error:", error);
    return NextResponse.json(
      { error: "Oyuncu detayları getirilemedi" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const json = await request.json();
    const parsed = updatePlayerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateAdminPlayer(id, parsed.data);
    return NextResponse.json({ success: true, player: updated });
  } catch (error) {
    console.error("Admin update player error:", error);
    return NextResponse.json(
      { error: "Oyuncu bilgileri güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}
