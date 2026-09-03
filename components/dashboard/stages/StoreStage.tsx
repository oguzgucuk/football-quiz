"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Coins,
  Gem,
  Sparkles,
  Shield,
  Check,
  Flame,
  Crown,
  Palette,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StoreItem {
  id: string;
  name: string;
  category: "frame" | "title" | "theme";
  price: number;
  currency: "coins" | "gems";
  description: string;
  previewColor?: string;
  badgeText?: string;
  isOwned?: boolean;
}

export function StoreStage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "frame" | "title" | "theme">("all");
  const [boughtItems, setBoughtItems] = useState<string[]>(["item_1"]);

  const items: StoreItem[] = [
    {
      id: "item_1",
      name: "Zümrüt Yeşil Saha Çerçevesi",
      category: "frame",
      price: 2500,
      currency: "coins",
      description: "Profil ve oyun içi avatarın etrafında parıldayan taktik yeşil neon çerçeve.",
      badgeText: "Popüler",
    },
    {
      id: "item_2",
      name: "Şampiyonlar Ligi Altın Rozet",
      category: "frame",
      price: 6000,
      currency: "coins",
      description: "Saf altın kaplama, yıldızlı şampiyonluk çerçevesi.",
      badgeText: "Efsane",
    },
    {
      id: "item_3",
      name: "'Scout Dehası' Unvanı",
      category: "title",
      price: 150,
      currency: "gems",
      description: "Maç ekranında isminin altında görünen prestijli scout unvanı.",
      badgeText: "Özel",
    },
    {
      id: "item_4",
      name: "'Hafıza Canavarı' Unvanı",
      category: "title",
      price: 200,
      currency: "gems",
      description: "En nadir futbolcuları dahi saniyeler içinde bulanlara özel unvan.",
    },
    {
      id: "item_5",
      name: "San Siro Gece Işıkları Teması",
      category: "theme",
      price: 8500,
      currency: "coins",
      description: "Oyun ekranında derin lacivert ve kırmızı spot ışıkları stadyum ambiyansı.",
      badgeText: "Yeni",
    },
    {
      id: "item_6",
      name: "Camp Nou Taktik Tahtası",
      category: "theme",
      price: 250,
      currency: "gems",
      description: "Tiki-taka pas geometrisi ve bordo-lacivert neon detaylar.",
    },
  ];

  const handleBuy = (item: StoreItem) => {
    if (boughtItems.includes(item.id)) return;
    setBoughtItems((prev) => [...prev, item.id]);
    alert(`🎉 '${item.name}' başarıyla satın alındı ve profilinize eklendi!`);
  };

  const filteredItems = items.filter(
    (i) => selectedCategory === "all" || i.category === selectedCategory
  );

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-[#f4f7f5] text-[#141b16] select-none font-sans p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(21,128,61,0.07)_0%,rgba(244,247,245,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Üst Mağaza Banner'ı */}
        <div className="relative rounded-[28px] bg-gradient-to-br from-white via-white to-[#fbf7ee] border border-[#ebd8b4] p-8 shadow-xs overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider mb-2">
              <Crown className="size-3.5 fill-amber-500 text-amber-600" />
              <span>Scout Mağazası</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#141b16]">
              Özel Rozetler, Unvanlar ve Temalar
            </h1>
            <p className="text-xs sm:text-sm text-[#525f56] font-medium mt-1">
              Kazandığın altın ve zümrütlerle profilini ve maç ekranını özelleştir.
            </p>
          </div>

          {/* Mevcut Bakiye Gösterimi */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-[#e2e8e4] shadow-xs">
              <Coins className="size-4 fill-amber-500 text-amber-600" />
              <div>
                <span className="text-[10px] text-[#6b7770] font-bold block">Altın</span>
                <span className="font-mono font-black text-sm text-[#141b16]">12.450</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border border-[#e2e8e4] shadow-xs">
              <Gem className="size-4 fill-[#15803d]/20 text-[#15803d]" />
              <div>
                <span className="text-[10px] text-[#6b7770] font-bold block">Zümrüt</span>
                <span className="font-mono font-black text-sm text-[#15803d]">{user?.eloRating || 1000}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Kategori Filtre Butonları */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "TÜM ÜRÜNLER" },
            { id: "frame", label: "AVATAR ÇERÇEVELERİ" },
            { id: "title", label: "UNVANLAR" },
            { id: "theme", label: "STADYUM TEMALARI" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-[#15803d] text-white shadow-xs"
                  : "bg-white text-[#6b7770] border border-[#e2e8e4] hover:border-[#cbd5ce] hover:text-[#141b16]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 3. Ürünler Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isOwned = boughtItems.includes(item.id);
            return (
              <div
                key={item.id}
                className="relative rounded-[24px] bg-white border border-[#e2e8e4] p-6 shadow-xs flex flex-col justify-between hover:border-[#bfe0cc] transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f5f8f6] border border-[#e2e8e4] text-[#15803d] group-hover:scale-105 transition-transform">
                      {item.category === "frame" && <Shield className="size-6 text-[#15803d]" />}
                      {item.category === "title" && <Crown className="size-6 text-amber-600" />}
                      {item.category === "theme" && <Palette className="size-6 text-cyan-600" />}
                    </div>

                    {item.badgeText && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {item.badgeText}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-[#141b16] tracking-tight mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#6b7770] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f0f4f2] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono font-black text-sm">
                    {item.currency === "coins" ? (
                      <>
                        <Coins className="size-4 fill-amber-500 text-amber-600" />
                        <span className="text-[#141b16]">{item.price.toLocaleString()}</span>
                      </>
                    ) : (
                      <>
                        <Gem className="size-4 fill-[#15803d]/20 text-[#15803d]" />
                        <span className="text-[#15803d]">{item.price}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={isOwned}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isOwned
                        ? "bg-[#e8f3ed] text-[#15803d] border border-[#cbe4d4] cursor-default flex items-center gap-1"
                        : "bg-[#15803d] text-white hover:bg-[#126d34] shadow-xs active:scale-95"
                    }`}
                  >
                    {isOwned ? (
                      <>
                        <Check className="size-3.5 stroke-[3]" />
                        <span>Kuşanıldı</span>
                      </>
                    ) : (
                      "Satın Al"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
