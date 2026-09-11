/**
 * Oyuncunun kulüp geçmişini güncelleme (PUT) ve silme (DELETE) API rotası.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";
import {
  updatePlayerClubHistory,
  removePlayerClubHistory,
} from "@/lib/db/adminPlayers";
import { updatePlayerClubSchema } from "@/lib/validation/adminPlayerSchema";

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; teamId: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { id, teamId } = await props.params;
    const json = await request.json();
    const parsed = updatePlayerClubSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await updatePlayerClubHistory(id, teamId, parsed.data);
    return NextResponse.json({ success: true, history: updated });
  } catch (error) {
    console.error("Admin update club history error:", error);
    return NextResponse.json(
      { error: "Kulüp geçmişi güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; teamId: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { id, teamId } = await props.params;
    await removePlayerClubHistory(id, teamId);
    return NextResponse.json({ success: true, message: "Kulüp başarıyla kaldırıldı" });
  } catch (error) {
    console.error("Admin delete club history error:", error);
    return NextResponse.json(
      { error: "Kulüp geçmişi silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
