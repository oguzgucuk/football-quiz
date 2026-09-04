/**
 * [DEPRECATED] Misafir girişi rotası — Misafir oynama özelliği kaldırıldı.
 * Artık bu endpoint 403 döndürür. Kayıtlı hesap gereklidir.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Misafir girişi devre dışı bırakıldı. Lütfen bir hesap oluşturun veya giriş yapın.",
    },
    { status: 403 }
  );
}
