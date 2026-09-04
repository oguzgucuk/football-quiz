/**
 * Kullanıcı oturumunu sonlandıran (logout) API rotası.
 * Kullanıcı durumunu veritabanında çevrimdışı yapar ve auth cookie'sini temizler.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentStatus: "offline" },
      }).catch(() => {});
    }

    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return NextResponse.json({ success: true, message: "Başarıyla çıkış yapıldı" });
  } catch (error) {
    console.error("[API /api/auth/logout] Hata:", error);
    return NextResponse.json({ error: "Çıkış yapılamadı" }, { status: 500 });
  }
}
