"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Coins,
  Gem,
  Crown,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { StoreItemCard, StoreItemDto } from "./store/StoreItemCard";
import { AcPackageCard } from "./store/AcPackageCard";
import { ACPackage, AC_PACKAGES } from "@/lib/db/storeCatalog";

interface StoreStageProps {
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

type StoreTab = "all" | "frame" | "title" | "theme" | "packages";

export function StoreStage({ onOpenAuthModal }: StoreStageProps = {}) {
  const { user, updateBalances } = useAuth();
  const [activeTab, setActiveTab] = useState<StoreTab>("all");
  const [items, setItems] = useState<StoreItemDto[]>([]);
  const [packages, setPackages] = useState<ACPackage[]>(AC_PACKAGES);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Mağaza ürünlerini ve kullanıcının envanterini API'den çek
  const fetchStoreData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/store/items");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.ownedItemIds) {
          setOwnedItemIds(data.ownedItemIds);
        }
      }

      const pkgRes = await fetch("/api/store/packages");
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        if (pkgData.packages) {
          setPackages(pkgData.packages);
        }
      }
    } catch (err) {
      console.error("[StoreStage] Veri yüklenirken hata:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Ürün Satın Alma İşlemi (Hile korumalı, sunucu onaylı)
  const handleBuyItem = async (item: StoreItemDto) => {
    if (!user) {
      onOpenAuthModal?.("login");
      return;
    }

    if (ownedItemIds.includes(item.id)) {
      setNotification({
        type: "info",
        message: "Bu eşyaya zaten sahipsiniz.",
      });
      return;
    }

    // İstemci tarafında hızlı ön kontrol (asıl kontrol sunucuda yapılır)
    const isCoin = item.currency === "COIN";
    const currentBalance = isCoin ? (user.coins ?? 0) : (user.alimCoins ?? 0);
    const currencyName = isCoin ? "Coin" : "AlimCoin (AC)";

    if (currentBalance < item.price) {
      setNotification({
        type: "error",
        message: `Yetersiz bakiye! Bu ürün için ${item.price.toLocaleString()} ${currencyName} gerekiyor (Mevcut bakiyeniz: ${currentBalance.toLocaleString()} ${currencyName}).`,
      });
      return;
    }

    try {
      setActionInProgressId(item.id);
      const res = await fetch("/api/store/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Satın alma işlemi tamamlanamadı.");
      }

      // Envanteri ve global bakiye state'ini senkronize et
      setOwnedItemIds((prev) => [...prev, item.id]);
      updateBalances(data.newCoins, data.newAlimCoins);

      setNotification({
        type: "success",
        message: data.message || `'${item.name}' başarıyla satın alındı ve profilinize eklendi!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Satın alma sırasında bir sorun oluştu.";
      setNotification({ type: "error", message: msg });
    } finally {
      setActionInProgressId(null);
    }
  };

  // AlimCoin (AC) Gerçek Para Paketi Satın Alma / Yükleme İşlemi
  const handleCheckoutAc = async (pkg: ACPackage) => {
    if (!user) {
      onOpenAuthModal?.("login");
      return;
    }

    try {
      setActionInProgressId(pkg.id);
      const res = await fetch("/api/store/checkout-ac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ödeme işlemi tamamlanamadı.");
      }

      // Güncel bakiyeyi anında yansıt
      updateBalances(data.newCoins, data.newAlimCoins);

      setNotification({
        type: "success",
        message: `💎 Tebrikler! ${data.addedAlimCoins} AC hesabınıza yüklendi. Yeni Bakiyeniz: ${data.newAlimCoins.toLocaleString()} AC.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ödeme doğrulanırken bir hata oluştu.";
      setNotification({ type: "error", message: msg });
    } finally {
      setActionInProgressId(null);
    }
  };

  const filteredItems = items.filter(
    (i) => activeTab === "all" || i.category.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-[#141b16] select-none font-sans p-6 sm:p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(21,128,61,0.07)_0%,rgba(244,247,245,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Üst Mağaza Banner'ı */}
        <div className="relative rounded-[28px] bg-gradient-to-br from-white via-white to-[#fbf7ee] border border-[#ebd8b4] p-6 sm:p-8 shadow-xs overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider mb-2">
              <Crown className="size-3.5 fill-amber-500 text-amber-600" />
              <span>Scout & Kulüp Mağazası</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#141b16]">
              Özel Rozetler, Unvanlar ve Temalar
            </h1>
            <p className="text-xs sm:text-sm text-[#525f56] font-medium mt-1">
              Oyun içi kazandığın Coin veya AlimCoin (AC) ile profilini özelleştir.
            </p>
          </div>

          {/* Gerçek Veritabanı Bakiyeleri */}
          <div className="flex items-center gap-2.5">
            {/* Düz Coin */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-[#e2e8e4] shadow-xs">
              <Coins className="size-4 fill-amber-500 text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] text-[#6b7770] font-bold block uppercase tracking-wider">Coin</span>
                <span className="font-mono font-black text-sm text-[#141b16]">
                  {(user?.coins ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* AlimCoin (AC) */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-emerald-300 shadow-xs group">
              <div className="flex size-5 items-center justify-center rounded-md bg-emerald-600 text-white font-black text-[9px] shadow-xs">
                AC
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">AlimCoin</span>
                <span className="font-mono font-black text-sm text-emerald-800">
                  {(user?.alimCoins ?? 0).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("packages")}
                className="ml-1 p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                title="AlimCoin Yükle"
              >
                <Plus className="size-3.5 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Bildirim / Hata / Başarı Alert Kutusu */}
        {notification && (
          <div
            className={`flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : notification.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              {notification.type === "success" && <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />}
              {notification.type === "error" && <AlertCircle className="size-5 text-rose-600 shrink-0" />}
              {notification.type === "info" && <Sparkles className="size-5 text-blue-600 shrink-0" />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* 2. Kategori Filtre Butonları */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all" as const, label: "TÜM ÜRÜNLER" },
            { id: "frame" as const, label: "AVATAR ÇERÇEVELERİ" },
            { id: "title" as const, label: "UNVANLAR" },
            { id: "theme" as const, label: "STADYUM TEMALARI" },
            { id: "packages" as const, label: "💎 ALİMCOİN (AC) YÜKLE", isHighlight: true },
          ].map((cat) => {
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? cat.isHighlight
                      ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400/30"
                      : "bg-[#15803d] text-white shadow-xs"
                    : cat.isHighlight
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    : "bg-white text-[#6b7770] border border-[#e2e8e4] hover:border-[#cbd5ce] hover:text-[#141b16]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 3. İçerik Gösterimi */}
        {activeTab === "packages" ? (
          /* AlimCoin (AC) Gerçek Para Satış Paketleri */
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-[#e2e8e4] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#141b16] tracking-tight">
                  AlimCoin (AC) Satın Alma Merkezi
                </h2>
                <p className="text-xs text-[#6b7770] mt-0.5">
                  Özel rozetler, vitrin temaları ve nadir unvanlar için hesabınıza resmi AlimCoin yükleyin.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>%100 Güvenli Ödeme Garantisi</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {packages.map((pkg) => (
                <AcPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isLoading={actionInProgressId === pkg.id}
                  onCheckout={handleCheckoutAc}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Mağaza Eşyaları Grid */
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="h-56 rounded-[24px] bg-white border border-[#e2e8e4] animate-pulse p-6"
                  />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#e2e8e4]">
                <Crown className="size-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#6b7770]">Bu kategoride henüz ürün bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <StoreItemCard
                    key={item.id}
                    item={item}
                    isOwned={ownedItemIds.includes(item.id)}
                    isLoading={actionInProgressId === item.id}
                    onBuy={handleBuyItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Alt Güvenlik & Hile Önleme Bilgilendirmesi */}
        <div className="p-4 rounded-2xl bg-[#edf4ef] border border-[#cbe4d4] flex items-center gap-3 text-xs text-[#285337]">
          <ShieldCheck className="size-5 text-[#15803d] shrink-0" />
          <p className="font-medium leading-relaxed">
            <strong className="font-black">Sunucu Doğrulamalı Güvenli Ekonomi:</strong> Tüm Coin ve AlimCoin bakiyeleri veritabanında atomik ACID işlemleriyle korunur. İstemci tarafındaki bellek değişiklikleri (CheatEngine vb.) sunucuda geçersiz sayılır.
          </p>
        </div>
      </div>
    </div>
  );
}
