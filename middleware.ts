/**
 * Next.js Middleware — Korunan rota erişim kontrolü.
 * Oturum cookie'si yoksa kullanıcıyı /login sayfasına yönlendirir.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware Edge Runtime'da çalışır; @/ alias kullanmak yerine sabiti inline tutuyoruz.
const AUTH_COOKIE_NAME = "football_quiz_token";

// Oturum gerektiren rota önekleri (canlı maç odaları doğrudan URL ile girilemez)
const PROTECTED_PREFIXES = ["/play"];

// Oturum gerektirmeyen public rotalar
const PUBLIC_PATHS = [
  "/",
  "/store",
  "/settings",
  "/sandbox",
  "/api/auth",
  "/api/teams",
  "/api/players",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isProtectedPath(pathname: string): boolean {
  // Sadece /play (canlı maç odası) korumalıdır; ana dashboard ve vitrin herkese açıktır
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Korunan canlı maç rotası kontrolü
  if (isProtectedPath(pathname)) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      const homeUrl = new URL("/", request.url);
      homeUrl.searchParams.set("auth", "login");
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * _next/static, _next/image, favicon.ico, data/ gibi Next.js iç
     * rotalarını hariç tut — sadece uygulama rotalarını yakala.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|data/|public/).*)",
  ],
};
