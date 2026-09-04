/**
 * Arkadaşlık isteğini kabul et.
 * Sadece isteğin alıcısı çağırabilir.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { acceptFriendRequest } from "@/lib/db/friendships";

interface RouteParams {
  params: Promise<{ friendId: string }>;
}

/** POST /api/friends/[friendId]/accept — friendship isteğini kabul et */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const { friendId } = await params;
    // friendId burada friendshipId olarak kullanılır (accept için)
    await acceptFriendRequest(friendId, user.id);

    return NextResponse.json({ success: true, message: "Arkadaşlık isteği kabul edildi." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İstek kabul edilemedi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
