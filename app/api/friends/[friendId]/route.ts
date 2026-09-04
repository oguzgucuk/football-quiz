/**
 * Arkadaşlık istemi gönder (POST) / arkadaşı sil (DELETE).
 * [friendId] = hedef kullanıcının ID'si.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { sendFriendRequest, removeFriendship } from "@/lib/db/friendships";

interface RouteParams {
  params: Promise<{ friendId: string }>;
}

/** POST /api/friends/[friendId] — Arkadaşlık isteği gönder */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { friendId } = await params;
    await sendFriendRequest(user.id, friendId);

    return NextResponse.json({ success: true, message: "Arkadaşlık isteği gönderildi." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İstek gönderilemedi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** DELETE /api/friends/[friendId] — Arkadaşı listeden çıkar */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { friendId } = await params;
    await removeFriendship(user.id, friendId);

    return NextResponse.json({ success: true, message: "Arkadaş silindi." });
  } catch (error) {
    console.error("[API /api/friends/[friendId]] DELETE Hata:", error);
    return NextResponse.json({ error: "Arkadaş silinemedi" }, { status: 500 });
  }
}
