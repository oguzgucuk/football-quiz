import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { creditAlimCoins } from "@/lib/db/economy";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "AlimCoin satın almak için giriş yapmanız gerekiyor." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packageId } = body;

    if (!packageId || typeof packageId !== "string") {
      return NextResponse.json(
        { error: "Geçersiz paket kimliği." },
        { status: 400 }
      );
    }

    // AlimCoin paketini doğrula ve hesaba yükle
    const result = await creditAlimCoins(user.id, packageId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AC yükleme başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
