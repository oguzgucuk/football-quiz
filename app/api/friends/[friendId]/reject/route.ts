/**
 * Arkadaşlık isteğini reddet.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { removeFriendship } from "@/lib/db/friendships";

interface RouteParams {
  params: Promise<{ friendId: string }>;
}

/** POST /api/friends/[friendId]/reject — isteği reddet */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { friendId } = await params;
    // friendId burada senderId'dir; her iki yönden sil
    await removeFriendship(user.id, friendId);

    return NextResponse.json({ success: true, message: "Arkadaşlık isteği reddedildi." });
  } catch (error) {
    console.error("[API /api/friends/[friendId]/reject] Hata:", error);
    return NextResponse.json({ error: "İstek reddedilemedi" }, { status: 500 });
  }
}
