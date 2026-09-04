import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { purchaseStoreItem } from "@/lib/db/economy";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Satın alma işlemi için giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json(
        { error: "Geçersiz ürün kimliği." },
        { status: 400 }
      );
    }

    // Sunucu-yetkili satın alma fonksiyonu
    const result = await purchaseStoreItem(user.id, itemId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Satın alma başarısız oldu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
