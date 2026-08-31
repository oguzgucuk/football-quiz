/**
 * Aktif kullanıcı oturumunu getiren API rotası.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      user,
      isAuthenticated: !!user,
    });
  } catch (error) {
    console.error("[API /api/auth/me] Hata:", error);
    return NextResponse.json({ user: null, isAuthenticated: false }, { status: 500 });
  }
}
