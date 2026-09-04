/**
 * Arkadaş listesi — Giriş yapmış kullanıcının tüm ACCEPTED arkadaşlarını döndürür.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getFriendsOfUser } from "@/lib/db/friendships";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor" }, { status: 401 });
    }

    const friends = await getFriendsOfUser(user.id);
    return NextResponse.json({ friends });
  } catch (error) {
    console.error("[API /api/friends] Hata:", error);
    return NextResponse.json({ error: "Arkadaşlar alınamadı" }, { status: 500 });
  }
}
