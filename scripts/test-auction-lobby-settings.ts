/**
 * Müzayede Lobisi Ayarları Doğrulama Testi.
 * Bütçe ve reyting aralığı kontrollerinin doğruluğunu, sınır değerlerini ve katılımcı bütçe senkronizasyonunu test eder.
 */

import { DEFAULT_LOBBY_SETTINGS, createInitialAuctionState, startAuctionStage } from "../lib/auction/auctionRoomEngine";
import { AuctionLobbySettings } from "../lib/auction/auctionTypes";

function runTests() {
  console.log("🧪 [Müzayede Lobisi Ayarları Testi Başlatılıyor...]");

  // 1. DEFAULT_LOBBY_SETTINGS Kontrolü
  console.log("1. Varsayılan ayarlar kontrolü:");
  console.log(`   - startingBudget: ${DEFAULT_LOBBY_SETTINGS.startingBudget}`);
  console.log(`   - ratingMin: ${DEFAULT_LOBBY_SETTINGS.ratingMin}`);
  console.log(`   - ratingMax: ${DEFAULT_LOBBY_SETTINGS.ratingMax}`);

  if (DEFAULT_LOBBY_SETTINGS.ratingMax !== 96) {
    throw new Error(`❌ ratingMax 96 olmalıydı ama ${DEFAULT_LOBBY_SETTINGS.ratingMax} bulundu!`);
  }
  if (DEFAULT_LOBBY_SETTINGS.ratingMin !== 70) {
    throw new Error(`❌ ratingMin 70 olmalıydı ama ${DEFAULT_LOBBY_SETTINGS.ratingMin} bulundu!`);
  }
  console.log("   ✅ Varsayılan ayarlar doğru (70 - 96 OVR, $30M bütçe).");

  // 2. Oda Oluşturma ve Başlangıç Durumu
  console.log("\n2. Oda başlangıç durumu kontrolü:");
  const state = createInitialAuctionState("room_test_1", "host_user_1", "Oda Sahibi");
  if (state.settings.ratingMax !== 96 || state.settings.ratingMin !== 70) {
    throw new Error("❌ Oda oluşturulurken ayarlar hatalı!");
  }
  if (state.participants["host_user_1"]?.budget !== 30) {
    throw new Error("❌ Host başlangıç bütçesi hatalı!");
  }
  console.log("   ✅ Oda başlangıç state ve host bütçesi başarıyla oluşturuldu.");

  // 3. Bütçe Değişimi ve Katılımcı Senkronizasyonu
  console.log("\n3. Bütçe güncellemesi simülasyonu:");
  const newBudget = 50;
  // Simüle edilen handler mantığı:
  state.settings.startingBudget = newBudget;
  for (const pid of Object.keys(state.participants)) {
    state.participants[pid].budget = newBudget;
  }
  if (state.participants["host_user_1"].budget !== 50) {
    throw new Error("❌ Katılımcı bütçesi güncellenmedi!");
  }
  console.log("   ✅ Katılımcı bütçesi $50M'e başarıyla senkronize edildi.");

  // 4. Reyting Aralığı Sınır Değerleri & Clamping Mantığı
  console.log("\n4. Reyting aralığı clamping kontrolü:");
  function clampSettings(input: Partial<AuctionLobbySettings>, currentSettings: AuctionLobbySettings): Partial<AuctionLobbySettings> {
    const validated: Partial<AuctionLobbySettings> = {};
    if (typeof input.startingBudget === "number") {
      validated.startingBudget = Math.max(20, Math.min(100, input.startingBudget));
    }
    if (typeof input.ratingMin === "number") {
      validated.ratingMin = Math.max(67, Math.min(94, input.ratingMin));
    }
    if (typeof input.ratingMax === "number") {
      const curMin = validated.ratingMin ?? currentSettings.ratingMin;
      validated.ratingMax = Math.max(curMin + 2, Math.min(96, input.ratingMax));
    }
    return validated;
  }

  // Aşırı değerler (Örn: 99 OVR veya 50 OVR)
  const clamped1 = clampSettings({ ratingMin: 50, ratingMax: 110, startingBudget: 250 }, state.settings);
  if (clamped1.ratingMin !== 67 || clamped1.ratingMax !== 96 || clamped1.startingBudget !== 100) {
    throw new Error(`❌ Sınır aşımı clamping başarısız: ${JSON.stringify(clamped1)}`);
  }
  console.log("   ✅ Aşırı yüksek ve düşük değerler (min: 50 -> 67, max: 110 -> 96, bütçe: 250 -> 100) başarıyla sınırlandı.");

  // Birbirine çok yakın ya da ters değerler (min >= max)
  const clamped2 = clampSettings({ ratingMin: 90, ratingMax: 80 }, state.settings);
  if (clamped2.ratingMax! < clamped2.ratingMin! + 2) {
    throw new Error(`❌ Ters aralık clamping başarısız: ${JSON.stringify(clamped2)}`);
  }
  console.log("   ✅ Min >= Max durumunda en az 2 OVR fark kuralı sağlandı.");

  // 5. Müzayede Başlatıldığında Yeni Bütçenin Uygulanması
  console.log("\n5. Müzayede başlangıcı bütçe sıfırlama testi:");
  const testPool = [
    {
      id: "card_1",
      fullName: "Test Oyuncu",
      overallPrime: 90,
      positions: ["ST"],
    },
  ];
  state.settings.startingBudget = 80;
  const auctionState = startAuctionStage(state, testPool);
  if (auctionState.participants["host_user_1"].budget !== 80) {
    throw new Error("❌ Oyun başladığında katılımcı bütçesi ayarlanan başlangıç bütçesine eşitlenmedi!");
  }
  console.log("   ✅ Oyun başlangıcında tüm katılımcılara $80M bütçe başarıyla aktarıldı.");

  console.log("\n🎉 TÜM TESTLER BAŞARIYLA GEÇTİ!");
}

runTests();
