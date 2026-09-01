# 🥈 İkincil Logo Kaynağı: TheSportsDB Entegrasyonu

> AGENTS.md kurallarına uyularak uygulanmalı. Bu doküman, mevcut logo
> pipeline'ına (Wikidata → Supabase Storage) **ikinci bir kaynak** ekliyor
> — Wikidata'da bulunamayan kulüpler için. **Kapsam sınırlı: sadece 6
> büyük Avrupa ligi ve Türkiye Süper Ligi'nden, Wikidata'da hâlâ logosu
> eksik olan kulüpler hedeflenecek.** Arjantin/Brezilya'nın kapsamı
> genişletilmiyor, önceki dokümanda belirlenen top-5 sınırı geçerliliğini
> koruyor.

---

## 1. Önce Mevcut Boşluğu Netleştir

```sql
SELECT id, name, country, league
FROM teams
WHERE logo_url IS NULL
  AND (
    league IN ('Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Süper Lig')
  )
ORDER BY popularity_score DESC;
```

Bu sorgunun çıktısını göster — TheSportsDB adımına başlamadan önce
**gerçekte kaç kulübün** eksik olduğunu (102 çekilmişti, hedef kapsamda
toplam kaç kulüp olduğu, aradaki fark) net olarak bil. Rastgele bir
sayıyla değil bu listeyle ilerle.

---

## 2. TheSportsDB API Entegrasyonu

### 2.1 Temel Kullanım

```typescript
// scripts/fetch-logos-thesportsdb.ts
const API_KEY = "3"; // ücretsiz test anahtarı, dakikada ~30 istek limiti
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// Lig bazlı tüm takımları çek
async function getTeamsByLeague(leagueName: string) {
  const url = `${BASE_URL}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.teams ?? [];
}

// TheSportsDB lig isimleri kendi formatında — eşleştirme tablosu gerekli
const LEAGUE_NAME_MAP: Record<string, string> = {
  "Premier League": "English Premier League",
  "La Liga": "Spanish La Liga",
  "Serie A": "Italian Serie A",
  "Bundesliga": "German Bundesliga",
  "Ligue 1": "French Ligue 1",
  "Süper Lig": "Turkish Super Lig", // TheSportsDB'deki gerçek adı doğrulanmalı
};
```

**Önemli:** TheSportsDB'nin lig isimlendirmesi senin veritabanındakiyle
birebir örtüşmeyebilir. Entegrasyona başlamadan önce
`GET {BASE_URL}/all_leagues.php` ile tüm lig isimlerini çek, Türkiye
Süper Ligi'nin ve diğer 5 liginin **gerçek** TheSportsDB adlarını
doğrula — tahmin etme.

### 2.2 Rate Limiting'e Saygı Göster

Ücretsiz anahtar dakikada ~30 istek ile sınırlı. Script'te istekler
arasına bekleme eklenmeli:

```typescript
async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  await new Promise((resolve) => setTimeout(resolve, 2100)); // dakikada ~28 istek
  return result;
}
```

429 hatası alınırsa (rate limit aşımı), script çökmesin — bekleyip tekrar
denesin (retry mantığı), sessizce veri kaybetmesin.

### 2.3 Eşleştirme Mantığı — Yeni Kulüp Oluşturma, Sadece Güncelleme

**Kritik kural:** Bu script **asla yeni bir `teams` kaydı oluşturmamalı**
— sadece mevcut, `logo_url IS NULL` olan kayıtları güncellemeli. Amaç
veritabanına yeni kulüp eklemek değil, eksik logoyu doldurmak.

```typescript
async function matchAndUpdateLogo(sportsDbTeam: any) {
  const normalized = normalizeTeamName(sportsDbTeam.strTeam);

  // Sadece logosu eksik olan, hedef ligdeki kulüplerde ara
  const existing = await prisma.team.findFirst({
    where: {
      logoUrl: null,
      league: { in: TARGET_LEAGUES },
      OR: [
        { name: { equals: sportsDbTeam.strTeam, mode: "insensitive" } },
        // aliases alanı varsa onlarla da karşılaştır
      ],
    },
  });

  if (!existing) {
    console.log(`⏭️  Eşleşme yok, atlanıyor: ${sportsDbTeam.strTeam}`);
    return;
  }

  // Eşleşme bulunduysa devam — Bölüm 3'teki kalite kontrolü uygulanacak
  return { teamId: existing.id, badgeUrl: sportsDbTeam.strBadge };
}
```

Zayıf/belirsiz eşleşmeler (fuzzy match güven skoru düşükse) otomatik
kabul edilmesin, ayrı bir listede toplanıp elle onaya sunulsun — daha
önce kurduğumuz "yüksek güven / düşük güven" ayrımı burada da geçerli.

---

## 3. Aynı Kalite Kontrolünden Geçir — Kör Güvenme

**Bu adım atlanamaz.** `DATA_QUALITY_DIAGNOSTIC.md`'de SVG'ler için
kurduğumuz doğrulama mantığı, TheSportsDB'den gelen görseller için de
**aynen** uygulanmalı — yeni bir kaynak, yeni bir "güvenilir kabul et"
nedeni değil.

```typescript
// LOGO_STORAGE_MIGRATION.md Adım 2'deki processLogo() ve
// DATA_QUALITY_DIAGNOSTIC.md'deki validateSvgBeforeUpload() fonksiyonları
// buraya da uygulanmalı:

async function downloadAndValidate(badgeUrl: string): Promise<Buffer | null> {
  const response = await fetch(badgeUrl);
  if (!response.ok) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0) return null;
  if (buffer.byteLength > 300 * 1024) {
    // TheSportsDB görselleri genelde PNG — boyut/format kontrolüne tabi tutulsun
    return processLogo(buffer, "png"); // resize + webp dönüşümü (önceki dokümandan)
  }
  return buffer;
}
```

TheSportsDB görselleri genelde PNG formatında ve makul boyutta gelir
(Wikimedia'nın aksine "kirli" fotoğraf riski daha düşük, çünkü bu servis
özellikle badge/logo için küratörlü), ama yine de **hiçbir kaynağa körü
körüne güvenilmemeli** — aynı doğrulama pipeline'ından geçsin.

---

## 4. Fallback Zinciri Sırası — Net Tanımla

Logo çekme mantığı artık şu sırayı takip etmeli, kod içinde bu sıra
açıkça yorumlanmalı (gelecekte bakan biri mantığı anlasın diye):

```typescript
// lib/logos/resolveLogo.ts
async function resolveTeamLogo(team: Team): Promise<string | null> {
  // 1. Wikidata (birincil kaynak, en geniş kapsam)
  let result = await tryWikidataLogo(team);
  if (result) return result;

  // 2. TheSportsDB (ikincil kaynak, Wikidata'da bulunamayanlar için)
  result = await trySportsDbLogo(team);
  if (result) return result;

  // 3. Hiçbiri bulunamadıysa: null döner, UI otomatik olarak
  //    fallback monogram rozete düşer (bkz. TeamBadge component)
  return null;
}
```

Bu sıralama, mevcut Wikidata pipeline'ını **bozmadan** yanına ekleme
yapıldığını garanti eder — geriye dönük uyumluluk korunur.

---

## 5. Doğrulama

1. Bölüm 1'deki sorguyu tekrar çalıştır — eksik kulüp sayısı ne kadar
   azaldı?
2. En az 5 yeni eklenen logoyu **gerçek tarayıcıda açıp** gözle doğrula
   (200 OK yeterli değil, görsel gerçekten doğru kulübün amblemi mi).
3. Rate limit'e takılıp sessizce veri kaybı olup olmadığını script
   loglarından kontrol et — kaç kulüp "atlandı" (eşleşme yok) vs kaç
   kulüp "hata" (rate limit/network) sebebiyle işlenemedi, bu ikisi
   ayrı raporlanmalı.

---

## Kabul Kriterleri (Ajan İçin Kontrol Listesi)

- [ ] Hedef kapsamdaki (6 büyük lig + Süper Lig) gerçek eksik kulüp
      sayısı sorguyla tespit edildi, varsayılmadı.
- [ ] TheSportsDB lig isimleri `all_leagues.php` ile doğrulandı, tahmin
      edilmedi.
- [ ] Script **yeni kulüp kaydı oluşturmuyor**, sadece
      `logo_url IS NULL` olan mevcut kayıtları güncelliyor.
- [ ] Rate limit'e (dakikada ~30 istek) saygı gösteriliyor, 429
      hatasında script çökmüyor.
- [ ] Düşük güvenli eşleşmeler otomatik kabul edilmiyor, elle onaya
      sunuluyor.
- [ ] İndirilen her görsel, önceki dokümanlardaki aynı kalite kontrol
      pipeline'ından (boyut, format, boş dosya kontrolü) geçiyor.
- [ ] Fallback sırası (Wikidata → TheSportsDB → monogram) kodda açık
      şekilde yorumlanmış durumda.
- [ ] En az 5 yeni logo gerçek tarayıcıda açılıp gözle doğrulandı.
- [ ] Kapsam sadece 6 büyük Avrupa ligi + Süper Lig ile sınırlı kaldı,
      Arjantin/Brezilya'nın top-5 sınırı genişletilmedi.

---

## Antigravity'ye Verilecek Görev Promptu

> "AGENTS.md dosyasını oku. `LOGO_SECONDARY_SOURCE.md` dosyasındaki
> adımları sırayla uygula. Önce Bölüm 1'deki sorguyu çalıştırıp gerçek
> eksik kulüp sayısını bana raporla. TheSportsDB'nin lig isimlerini
> `all_leagues.php` ile doğrula, tahmin etme. Script'in **kesinlikle
> yeni kulüp kaydı oluşturmadığından**, sadece eksik logoları
> doldurduğundan emin ol. İndirilen her görseli önceki dokümanlardaki
> (`LOGO_STORAGE_MIGRATION.md`, `DATA_QUALITY_DIAGNOSTIC.md`) kalite
> kontrol pipeline'ından geçir — yeni kaynak diye atlamak yok. İşlem
> bitince kaç yeni logo eklendiğini, kaç kulübün hâlâ eksik kaldığını,
> ve en az 5 örneği tarayıcıda gözle doğrulayıp ekran görüntüsüyle
> raporla."
