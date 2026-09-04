/**
 * Kullanıcı adına göre arkadaşlık isteği gönderme API rotası.
 * Kullanıcı bulunamazsa 404 "Böyle bir kullanıcı yok." döner.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { sendFriendRequestByUsername } from "@/lib/db/friendships";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Bu işlem için giriş yapmalısınız." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const username = body?.username;

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir kullanıcı adı girin." },
        { status: 400 }
      );
    }

    const result = await sendFriendRequestByUsername(user.id, username.trim());

    return NextResponse.json({
      success: true,
      message: `${result.targetUsername} kullanıcısına arkadaşlık isteği gönderildi.`,
      targetUsername: result.targetUsername,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const message = err.message || "Arkadaşlık isteği gönderilemedi.";

    if (err.code === "USER_NOT_FOUND" || message.includes("Böyle bir kullanıcı yok")) {
      return NextResponse.json(
        { error: "Böyle bir kullanıcı yok." },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
