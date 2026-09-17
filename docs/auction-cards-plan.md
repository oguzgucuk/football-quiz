# Müzayede Modu: Özel Taktik Kartları Mekaniği Uygulama Planı

> Bu doküman, AlimBALL Müzayede Ligi'ne eklenecek "Özel Taktik Kartları" (Special Cards) sisteminin mimari tasarımını, kurallarını ve uygulama adımlarını `GEMINI.md` standartlarına uygun olarak tanımlar.

---

## 1. Mekaniğin Özeti ve Temel Kurallar

- **Havuz Oranı:** Katılımcı sayısı başına ortalama **0.5 kart** (4 kişilik odada 2 kart, 8 kişilik odada 4 kart) müzayede havuzundaki futbolcuların arasına rastgele serpiştirilir.
- **Açık Artırma Süreci:** Kart sırası geldiğinde tıpkı bir futbolcu gibi açık artırmaya çıkar (özel altın/efsanevi kart çerçevesi ve efektlerle). En yüksek peyi süren oyuncu kartı satın alır.
- **Envanter (Çanta):** Satın alınan kartlar oyuncunun `squad` kadrosuna değil, bağımsız bir kart çantasına (`cardsInventory: SpecialCard[]`) eklenir. Asla futbolcu listesine karışmaz.
- **Kullanım Fazları:** Kartlar özelliğine göre ya **Müzayede Sırasında** (anlık) ya da **Taktik/Diziliş Aşamasında** kullanılır.

---

## 2. Kart Seti (5 Temel Kart Tanımı)

| Kart Adı | Kullanım Fazı | Hedef | Etkisi |
|---|---|---|---|
| **🛑 Veto / Pas Kartı** | Müzayede Sırasında | Sıradaki Futbolcu | İhaleye çıkan futbolcuyu doğrudan eler / havuza geri yollar; yeni futbolcu çeker. |
| **🔄 Zorunlu Takas Kartı** | Taktik Aşamasında | Kendi Oyuncun & Rakip Oyuncu | Kendi kadronuzdaki bir futbolcuyu rakibin **aynı mevkideki** (GK↔GK, DEF↔DEF, MID↔MID, FWD↔FWD) bir oyuncusuyla zorunlu değiştirir. |
| **💰 Para İadesi Kartı** | Müzayede Sırasında | Son Kazanılan İhale | Kazandığınız transfer bedelinin **%25'ini** kasaya anında iade eder. |
| **💉 Motivasyon Aşısı (+3 OVR)** | Taktik Aşamasında | Kendi Oyuncun | Seçilen futbolcunun maç simülasyonundaki tüm mevkisel güçlerini **+3 OVR** artırır. |
| **🛡️ Koridor Sabotajı** | Taktik Aşamasında | Rakip Takım | Belirlenen rakibin seçtiği koridor taktiğini (örn: Kanattan Hücum bonusu) o maç için nötrler. |

---

## 3. Mimari ve Güvenlik Standartları (`GEMINI.md`)

### A. Tip Güvenliği ve Ayrık Birlik (Discriminated Union)
Futbolcular ile kartlar aynı dizide `any` ile tutulamaz:
```typescript
export type AuctionItem =
  | { kind: "player"; data: AuctionPlayerCard }
  | { kind: "card"; data: SpecialCard };
```
Simülasyon motoru ve diziliş tahtası **yalnızca** `kind === "player"` olan nesneleri alır.

### B. Takas Kartı Güvenliği (Kadro Bozulma Koruması)
1. **Mevki Kilidi:** Takas yalnızca aynı pozisyon grubu arasında yapılabilir (GK ↔ GK, DEF ↔ DEF vb.). Kalecisiz veya forvetsiz takım kalması server-side Zod doğrulaması ile baştan engellenir.
2. **Server-Side Doğrulama:** İstemciden gelen takas isteği PartyKit sunucusunda `cardActionResolver.ts` tarafından kontrol edilir, onaylanmazsa kart harcanmaz.

### C. Dosya ve Katman Ayrımı
- `lib/auction/cards/cardTypes.ts`: Kart modelleri ve enumlar (<100 satır).
- `lib/auction/cards/cardDefinitions.ts`: Kart tanımları ve açıklamaları (<150 satır).
- `lib/auction/cards/cardPoolGenerator.ts`: Havuz kartı üretimi (<100 satır).
- `lib/auction/cards/cardActionResolver.ts`: Kart kullanım mantığı (<200 satır).
- `components/auction/cards/SpecialCardItem.tsx`: Hallmark altın/efsanevi kart UI (<150 satır).
- `components/auction/cards/CardInventoryDrawer.tsx`: Oyuncu envanter çekmecesi (<180 satır).
- `components/auction/cards/SwapPlayerModal.tsx`: Takas seçim modalı (<180 satır).

---

## 4. Adım Adım Entegrasyon Sırası (Uygulama Zamanı)

1. **Adım 1:** Kart veri tipleri (`cardTypes.ts`) ve kart listesi (`cardDefinitions.ts`) oluşturulacak.
2. **Adım 2:** `generateAuctionPool` içine kart karıştırma mantığı entegre edilecek (`AuctionItem[]`).
3. **Adım 3:** PartyKit'te kart ihalesi ve envantere yazma mantığı bağlanacak (`AUCTION_USE_CARD` event).
4. **Adım 4:** Hallmark tasarım standartlarıyla özel kart tasarımı ve taktik ekranı envanter butonu eklenecek.
5. **Adım 5:** `test-cards-engine.ts` ile tüm kart etkileri ve takas kuralları otomatik test edilecek.
