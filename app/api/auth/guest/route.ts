/**
 * Misafir girişi API rotası (Kullanıcı adı belirleyerek anında başlama).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { guestSchema } from "@/lib/validation/authSchemas";
import { signSessionToken, AUTH_COOKIE_NAME, TOKEN_EXPIRATION_SECONDS } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = guestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı adı", details: parsed.error.format() },
        { status: 400 }
      );
    }

    let { username } = parsed.data;

    // Kullanıcı adı kalıcı bir kayıtlı kullanıcıya ait mi?
    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
      },
    });

    let guestUser;

    if (existing) {
      if (!existing.isGuest) {
        // Kalıcı hesap varsa sonuna rastgele rakam ekle
        username = `${username}_${Math.floor(100 + Math.random() * 900)}`;
        guestUser = await prisma.user.create({
          data: {
            username,
            eloRating: 1000,
            rankTier: "bronze",
            isGuest: true,
          },
        });
      } else {
        guestUser = existing;
      }
    } else {
      guestUser = await prisma.user.create({
        data: {
          username,
          eloRating: 1000,
          rankTier: "bronze",
          isGuest: true,
        },
      });
    }

    // JWT token üret ve cookie olarak ayarla
    const token = await signSessionToken({
      userId: guestUser.id,
      username: guestUser.username,
      isGuest: true,
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
        id: guestUser.id,
        username: guestUser.username,
        email: guestUser.email,
        eloRating: guestUser.eloRating,
        rankTier: guestUser.rankTier,
        matchesWon: guestUser.matchesWon,
        matchesLost: guestUser.matchesLost,
        isGuest: guestUser.isGuest,
        createdAt: guestUser.createdAt,
      },
    });
  } catch (error) {
    console.error("[API /api/auth/guest] Hata:", error);
    return NextResponse.json(
      { error: "Misafir girişi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
