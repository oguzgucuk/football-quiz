/**
 * Kullanıcı oturumunu sonlandıran (logout) API rotası.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth/jwt";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json({ success: true, message: "Başarıyla çıkış yapıldı" });
  } catch (error) {
    console.error("[API /api/auth/logout] Hata:", error);
    return NextResponse.json({ error: "Çıkış yapılamadı" }, { status: 500 });
  }
}
