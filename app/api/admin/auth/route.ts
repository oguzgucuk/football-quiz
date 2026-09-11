/**
 * Admin giriş PIN kontrolü ve çerez ayarlama endpoint'i.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSecret, ADMIN_SECRET_COOKIE_NAME } from "@/lib/auth/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    const currentSecret = getAdminSecret();

    if (!pin || pin.trim() !== currentSecret) {
      return NextResponse.json(
        { success: false, error: "Geçersiz admin şifresi veya PIN" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin girişi başarılı",
    });

    // 7 gün geçerli cookie ata
    response.cookies.set({
      name: ADMIN_SECRET_COOKIE_NAME,
      value: currentSecret,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Giriş sırasında hata oluştu" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const currentSecret = getAdminSecret();
  const cookieToken = request.cookies.get(ADMIN_SECRET_COOKIE_NAME)?.value;
  const headerKey = request.headers.get("x-admin-key");

  const isAuthenticated = cookieToken === currentSecret || headerKey === currentSecret;

  return NextResponse.json({ isAuthenticated });
}
