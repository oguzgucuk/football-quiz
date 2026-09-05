import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureStoreCatalogSeeded } from "@/lib/db/storeCatalog";
import { getUserOwnedItemIds } from "@/lib/db/economy";
import { StoreItem } from "@prisma/client";

// Bellek içi katalog önbelleği (Gereksiz DB sorgularını ve ağ gecikmesini engeller)
let cachedStoreItems: StoreItem[] | null = null;
let lastCacheTimestamp = 0;
const STORE_CACHE_TTL_MS = 60 * 1000; // 60 saniye önbellek

async function getCachedStoreItems(): Promise<StoreItem[]> {
  const now = Date.now();
  if (cachedStoreItems && now - lastCacheTimestamp < STORE_CACHE_TTL_MS) {
    return cachedStoreItems;
  }

  let items = await prisma.storeItem.findMany({
    where: { isActive: true },
    orderBy: [{ currency: "asc" }, { price: "asc" }],
  });

  // Eğer veritabanı tamamen boşsa (ilk kurulum), tek seferlik seed et ve tekrar çek
  if (items.length === 0) {
    await ensureStoreCatalogSeeded(true);
    items = await prisma.storeItem.findMany({
      where: { isActive: true },
      orderBy: [{ currency: "asc" }, { price: "asc" }],
    });
  }

  cachedStoreItems = items;
  lastCacheTimestamp = now;
  return items;
}

export async function GET() {
  try {
    // 1. Ürün listesini (önbellekten/DB) ve oturum açmış kullanıcıyı PARALEL getir
    const [items, user] = await Promise.all([
      getCachedStoreItems(),
      getCurrentUser(),
    ]);

    // 2. Kullanıcı oturum açmışsa sahip olduğu ürünleri ve güncel bakiyelerini al
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
