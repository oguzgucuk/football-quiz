/**
 * Sunucu-Yetkili (Server-Authoritative) Ekonomi ve Satın Alma Modülü.
 * - İstemciden gelen bakiye/fiyat verilerine asla güvenmez (CheatEngine koruması).
 * - Fiyat ve kullanıcı bakiyesi doğrudan PostgreSQL'den atomik $transaction ile okunup düşülür.
 * - Finansal denetim (audit ledger) için her işlem coin_transactions tablosuna yazılır.
 */

import { prisma } from "./client";
import { CurrencyType, TransactionType } from "@prisma/client";
import { AC_PACKAGES } from "./storeCatalog";

export interface PurchaseResult {
  success: boolean;
  message: string;
  itemId: string;
  itemName: string;
  currency: CurrencyType;
  pricePaid: number;
  newCoins: number;
  newAlimCoins: number;
}

export interface CreditAcResult {
  success: boolean;
  packageId: string;
  acAdded: number;
  newAlimCoins: number;
}

/**
 * Kullanıcının güncel Coin ve AlimCoin (AC) bakiyelerini doğrudan veritabanından çeker.
 */
export async function getUserBalances(userId: string): Promise<{ coins: number; alimCoins: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true, alimCoins: true },
  });

  if (!user) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  return {
    coins: user.coins,
    alimCoins: user.alimCoins,
  };
}

/**
 * Kullanıcının sahip olduğu envanter eşyalarının ID listesini döner.
 */
export async function getUserOwnedItemIds(userId: string): Promise<string[]> {
  const inventory = await prisma.userInventory.findMany({
    where: { userId },
    select: { itemId: true },
  });

  return inventory.map((i) => i.itemId);
}

/**
 * Mağazadan bir ürün satın alma işlemini atomik ve hile korumalı olarak yürütür.
 */
export async function purchaseStoreItem(userId: string, itemId: string): Promise<PurchaseResult> {
  // 1. Ürünün varlığını ve resmi fiyatını sunucu kataloğundan doğrula
  const item = await prisma.storeItem.findUnique({
    where: { id: itemId },
  });

  if (!item || !item.isActive) {
    throw new Error("Satın alınmak istenen ürün bulunamadı veya satışta değil.");
  }

  // 2. Kullanıcının ve mevcut bakiyelerinin DB'deki gerçek durumunu al
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, coins: true, alimCoins: true },
  });

  if (!user) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  // 3. Mükerrer satın alma kontrolü
  const existingOwnership = await prisma.userInventory.findUnique({
    where: {
      userId_itemId: {
        userId,
        itemId,
      },
    },
  });

  if (existingOwnership) {
    throw new Error("Bu ürüne zaten sahipsiniz.");
  }

  // 4. Bakiye kontrolü (CheatEngine koruması: İstemci belleği ne derse desin DB değeri esastır)
  const isCoinCurrency = item.currency === CurrencyType.COIN;
  const currentBalance = isCoinCurrency ? user.coins : user.alimCoins;

  if (currentBalance < item.price) {
    const currencyName = isCoinCurrency ? "Coin" : "AlimCoin (AC)";
    throw new Error(`Yetersiz bakiye! Bu ürün için ${item.price} ${currencyName} gerekiyor (Mevcut: ${currentBalance}).`);
  }

  // 5. Atomik $transaction ile bakiyeyi düş, envantere ekle ve denetim logu yaz
  const result = await prisma.$transaction(async (tx) => {
    // A) Bakiyeyi düş
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: isCoinCurrency
        ? { coins: { decrement: item.price } }
        : { alimCoins: { decrement: item.price } },
      select: { coins: true, alimCoins: true },
    });

    const balanceAfter = isCoinCurrency ? updatedUser.coins : updatedUser.alimCoins;

    // B) Envantere ekle
    await tx.userInventory.create({
      data: {
        userId,
        itemId: item.id,
        isEquipped: false,
      },
    });

    // C) Finansal denetim (audit ledger) satırı yaz
    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -item.price,
        currency: item.currency,
        type: TransactionType.ITEM_PURCHASE,
        balanceAfter,
        description: `Mağaza Alımı: ${item.name}`,
        referenceId: item.id,
      },
    });

    return updatedUser;
  });

  return {
    success: true,
    message: `'${item.name}' başarıyla satın alındı ve profilinize eklendi!`,
    itemId: item.id,
    itemName: item.name,
    currency: item.currency,
    pricePaid: item.price,
    newCoins: result.coins,
    newAlimCoins: result.alimCoins,
  };
}

/**
 * Resmi paket üzerinden kullanıcıya AlimCoin (AC) yüklemesi yapar.
 * (Ödeme ağ geçidi / checkout başarılı olduğunda çağrılır)
 */
export async function creditAlimCoins(userId: string, packageId: string): Promise<CreditAcResult> {
  const pkg = AC_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    throw new Error("Geçersiz AlimCoin paketi seçildi.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Kullanıcının AC bakiyesini artır
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { alimCoins: { increment: pkg.totalAc } },
      select: { alimCoins: true },
    });

    // 2. Denetim logu yaz
    await tx.coinTransaction.create({
      data: {
        userId,
        amount: pkg.totalAc,
        currency: CurrencyType.ALIM_COIN,
        type: TransactionType.AC_PURCHASE,
        balanceAfter: updatedUser.alimCoins,
        description: `AlimCoin Satın Alımı: ${pkg.description} (${pkg.priceTry} ₺)`,
        referenceId: pkg.id,
      },
    });

    return updatedUser;
  });

  return {
    success: true,
    packageId: pkg.id,
    acAdded: pkg.totalAc,
    newAlimCoins: result.alimCoins,
  };
}
