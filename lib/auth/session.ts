/**
 * Sunucu tarafında (Server Components & API Routes) mevcut oturum açmış kullanıcıyı getiren yardımcı modül.
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { AUTH_COOKIE_NAME, verifySessionToken } from "./jwt";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  eloRating: number;
  rankTier: string;
  matchesWon: number;
  matchesLost: number;
  isGuest: boolean;
  avatarUrl: string | null;
  createdAt: Date;
}

/**
 * Mevcut HTTP request'indeki JWT cookie'den kullanıcıyı getirir.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        eloRating: true,
        rankTier: true,
        matchesWon: true,
        matchesLost: true,
        isGuest: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("[getCurrentUser] Hata:", error);
    return null;
  }
}
