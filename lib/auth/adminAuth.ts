/**
 * Admin paneli için basit ve güvenli PIN / Gizli Anahtar doğrulama katmanı.
 */

import { NextRequest } from "next/server";

export const ADMIN_SECRET_COOKIE_NAME = "fq_admin_token";

export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET_KEY || "admin123";
}

export function verifyAdminAuth(request: NextRequest): boolean {
  const adminSecret = getAdminSecret();

  // 1. Header kontrolü (x-admin-key)
  const headerKey = request.headers.get("x-admin-key");
  if (headerKey && headerKey === adminSecret) {
    return true;
  }

  // 2. Cookie kontrolü
  const cookieToken = request.cookies.get(ADMIN_SECRET_COOKIE_NAME)?.value;
  if (cookieToken && cookieToken === adminSecret) {
    return true;
  }

  return false;
}
