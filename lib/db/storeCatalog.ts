/**
 * Resmi Mağaza Kataloğu ve AlimCoin (AC) Satış Paketleri.
 * Gerçek veritabanı eşleşmesi sağlar; sahte verileri ortadan kaldırır.
 */

import { prisma } from "./client";
import { CurrencyType } from "@prisma/client";

export interface ACPackage {
  id: string;
  acAmount: number;
  bonusAmount: number;
  totalAc: number;
  priceTry: number;
  badge?: string;
  description: string;
}

export const AC_PACKAGES: ACPackage[] = [
  {
    id: "pkg_100_ac",
    acAmount: 100,
    bonusAmount: 0,
    totalAc: 100,
    priceTry: 19.99,
    description: "Başlangıç AC Paketi",
  },
  {
    id: "pkg_550_ac",
    acAmount: 500,
    bonusAmount: 50,
    totalAc: 550,
    priceTry: 89.99,
    badge: "+%10 BONUS",
    description: "Popüler Scout Paketi",
  },
  {
    id: "pkg_1200_ac",
    acAmount: 1000,
    bonusAmount: 200,
    totalAc: 1200,
    priceTry: 179.99,
    badge: "+%20 BONUS",
    description: "Efsane Menajer Paketi",
  },
  {
    id: "pkg_3000_ac",
    acAmount: 2200,
    bonusAmount: 800,
    totalAc: 3000,
    priceTry: 399.99,
    badge: "EN İYİ DEĞER 🔥",
    description: "VIP Şampiyon Kulübü Paketi",
  },
];

export const DEFAULT_STORE_ITEMS = [
  {
    id: "item_emerald_frame",
    name: "Zümrüt Yeşil Saha Çerçevesi",
    category: "frame",
    price: 350,
    currency: CurrencyType.COIN,
    description: "Profil ve oyun içi avatarın etrafında parıldayan taktik yeşil neon çerçeve.",
    previewColor: "#15803d",
    badgeText: "Popüler",
  },
  {
    id: "item_gold_trophy_frame",
    name: "Şampiyonlar Altın Rozet Çerçevesi",
    category: "frame",
    price: 850,
    currency: CurrencyType.COIN,
    description: "Saf altın kaplama, yıldızlı şampiyonluk çerçevesi.",
    previewColor: "#d97706",
    badgeText: "Efsane",
  },
  {
    id: "item_scout_genius_title",
    name: "'Scout Dehası' Unvanı",
    category: "title",
    price: 150,
    currency: CurrencyType.ALIM_COIN,
    description: "Maç ekranında ve profilde isminin altında görünen prestijli scout unvanı.",
    previewColor: "#059669",
    badgeText: "Özel AC",
  },
  {
    id: "item_memory_monster_title",
    name: "'Futbol Ansiklopedisi' Unvanı",
    category: "title",
    price: 500,
    currency: CurrencyType.COIN,
    description: "Eski futbolcuları ve transferleri tek nefeste bilen hafıza canavarlarına özel.",
    previewColor: "#2563eb",
    badgeText: "Klasik",
  },
  {
    id: "item_vip_diamond_theme",
    name: "Elmas VIP Gece Teması",
    category: "theme",
    price: 300,
    currency: CurrencyType.ALIM_COIN,
    description: "Oyun içi arayüzde özel koyu obsidian ve elmas mavi parıltılı tema detayları.",
    previewColor: "#0284c7",
    badgeText: "VIP AC",
  },
  {
    id: "item_stadium_tiki_taka",
    name: "Tiki-Taka Kadife Saha",
    category: "theme",
    price: 1200,
    currency: CurrencyType.COIN,
    description: "Katalan pas geometrisi ve bordo-lacivert neon saha çizgileri.",
    previewColor: "#b91c1c",
  },
];

let isCatalogVerified = false;

/**
 * Mağaza açıldığında ürünlerin veritabanında var olduğundan emin olur (Idempotent seed).
 * Zaten kayıtlar varsa her istekte tekrar 6 defa veritabanına yazma yapmaz (Gecikmeyi önler).
 */
export async function ensureStoreCatalogSeeded(force = false) {
  if (isCatalogVerified && !force) {
    return;
  }

  const count = await prisma.storeItem.count();
  if (count >= DEFAULT_STORE_ITEMS.length && !force) {
    isCatalogVerified = true;
    return;
  }

  for (const item of DEFAULT_STORE_ITEMS) {
    await prisma.storeItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        category: item.category,
        price: item.price,
        currency: item.currency,
        description: item.description,
        previewColor: item.previewColor,
        badgeText: item.badgeText,
        isActive: true,
      },
      create: {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        currency: item.currency,
        description: item.description,
        previewColor: item.previewColor,
        badgeText: item.badgeText,
        isActive: true,
      },
    });
  }

  isCatalogVerified = true;
}
