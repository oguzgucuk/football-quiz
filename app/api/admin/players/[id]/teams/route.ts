/**
 * Oyuncuya yeni kulüp geçmişi ekleme API rotası.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";
import { addPlayerClubHistory } from "@/lib/db/adminPlayers";
import { addPlayerClubSchema } from "@/lib/validation/adminPlayerSchema";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { id } = await props.params;
    const json = await request.json();
    const parsed = addPlayerClubSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const history = await addPlayerClubHistory(id, parsed.data);
    return NextResponse.json({ success: true, history }, { status: 201 });
  } catch (error) {
    console.error("Admin add club history error:", error);
    return NextResponse.json(
      { error: "Kulüp oyuncuya eklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
