/**
 * Kullanıcı girişi API rotası (E-posta veya kullanıcı adı ile).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";
import { loginSchema } from "@/lib/validation/authSchemas";
import { signSessionToken, AUTH_COOKIE_NAME, TOKEN_EXPIRATION_SECONDS } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz giriş bilgileri", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    // Kullanıcı adı veya e-posta ile kullanıcıyı bul
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: "insensitive" } },
          { email: { equals: identifier, mode: "insensitive" } },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Kullanıcı adı/e-posta veya parola hatalı" },
        { status: 401 }
      );
    }

    // Parola kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Kullanıcı adı/e-posta veya parola hatalı" },
        { status: 401 }
      );
    }

    // JWT token üret ve cookie olarak ayarla
    const token = await signSessionToken({
      userId: user.id,
      username: user.username,
      isGuest: user.isGuest,
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_EXPIRATION_SECONDS,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        eloRating: user.eloRating,
        rankTier: user.rankTier,
        matchesWon: user.matchesWon,
        matchesLost: user.matchesLost,
        isGuest: user.isGuest,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[API /api/auth/login] Hata:", error);
    return NextResponse.json(
      { error: "Giriş yapılırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
