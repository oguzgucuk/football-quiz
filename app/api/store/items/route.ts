import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureStoreCatalogSeeded } from "@/lib/db/storeCatalog";
import { getUserOwnedItemIds } from "@/lib/db/economy";

export async function GET() {
  try {
    // 1. Katalogda eksik ürün varsa DB'ye aktar
    await ensureStoreCatalogSeeded();

    // 2. Aktif mağaza ürünlerini getir
    const items = await prisma.storeItem.findMany({
      where: { isActive: true },
      orderBy: [{ currency: "asc" }, { price: "asc" }],
    });

    // 3. Kullanıcı oturum açmışsa sahip olduğu ürünleri ve güncel bakiyelerini al
    const user = await getCurrentUser();
    let ownedItemIds: string[] = [];
    let userBalances = null;

    if (user) {
      ownedItemIds = await getUserOwnedItemIds(user.id);
      userBalances = {
        coins: user.coins,
        alimCoins: user.alimCoins,
      };
    }

    return NextResponse.json({
      success: true,
      items,
      ownedItemIds,
      userBalances,
    });
  } catch (error) {
    console.error("[API /api/store/items] Hata:", error);
    return NextResponse.json(
      { error: "Mağaza ürünleri yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
