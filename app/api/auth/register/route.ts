/**
 * Yeni kullanıcı kaydı API rotası.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";
import { registerSchema } from "@/lib/validation/authSchemas";
import { signSessionToken, AUTH_COOKIE_NAME, TOKEN_EXPIRATION_SECONDS } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz form verisi", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;

    // Kullanıcı adı veya e-posta zaten kayıtlı mı kontrol et
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: email, mode: "insensitive" } },
        ],
      },
    });

    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json(
          { error: "Bu kullanıcı adı zaten kullanılıyor" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Bu e-posta adresi ile zaten bir hesap mevcut" },
        { status: 409 }
      );
    }

    // Parolayı hashle
    const passwordHash = await bcrypt.hash(password, 10);

    // Yeni kullanıcıyı oluştur
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        eloRating: 1000,
        rankTier: "bronze",
        isGuest: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        eloRating: true,
        rankTier: true,
        matchesWon: true,
        matchesLost: true,
        isGuest: true,
        createdAt: true,
      },
    });

    // JWT token üret ve cookie olarak ayarla
    const token = await signSessionToken({
      userId: newUser.id,
      username: newUser.username,
      isGuest: false,
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
      user: newUser,
    });
  } catch (error) {
    console.error("[API /api/auth/register] Hata:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
