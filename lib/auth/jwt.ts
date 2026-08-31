/**
 * JWT token imzalama, doğrulama ve oturum cookie yapılandırması (jose kütüphanesi ile).
 */

import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("⚠️ [Auth] PRODUCTION ortamında JWT_SECRET tanımlanmamış! Güvenlik için lütfen .env içinde JWT_SECRET belirleyin.");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "football-quiz-dev-secret-key-2026-super-secure"
);

export const AUTH_COOKIE_NAME = "football_quiz_token";
export const TOKEN_EXPIRATION_TIME = "30d";
export const TOKEN_EXPIRATION_SECONDS = 30 * 24 * 60 * 60; // 30 gün

export interface SessionPayload {
  userId: string;
  username: string;
  isGuest: boolean;
}

/**
 * Kullanıcı için imzalı bir JWT token oluşturur.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION_TIME)
    .sign(JWT_SECRET);
}

/**
 * JWT token'ı doğrular ve payload'ı döner.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      isGuest: Boolean(payload.isGuest),
    };
  } catch {
    return null;
  }
}
