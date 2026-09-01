# 🔧 Logo Depolama Migrasyonu ve Kapsam Genişletme — Teknik Görev

> AGENTS.md kurallarına uyularak uygulanmalı. Bu doküman, önceki
> `LOGO_ISSUE_ANALYSIS_REPORT.md`'de tespit edilen kök nedenlerin devamı
> niteliğindedir — o rapor "neden görünmüyor"u çözdü, bu doküman "neden
> production'da hâlâ görünmeyebilir"i ve kapsam genişletmeyi çözüyor.
>
> **Her adım sırayla uygulanmalı, bir adım doğrulanmadan sonrakine
> geçilmemeli.** Adım sonlarındaki "Doğrulama" bölümleri atlanmamalı —
> bu proje daha önce "localde çalıştı" diye "tamamlandı" denilip
> production'da çalışmayan durumlarla karşılaştı, bu tekrarlanmamalı.

---

## ⚠️ Adım 0 — Önce Mevcut Durumu Tespit Et (Hiçbir Şeyi Değiştirmeden)

Değişikliğe başlamadan önce şu üç komutu çalıştır ve çıktılarını göster:

```bash
git status public/team-logos/
git ls-files public/team-logos/ | wc -l
du -sh public/team-logos/
```

**Beklenen çıktı senaryoları:**
- Eğer `git status` bu klasörü "Untracked" gösteriyorsa → dosyalar hiç
  commit'lenmemiş, production'a gitmemiş demektir (önceki analizde
  tespit edilen durum bu).
- Eğer `git ls-files` boş dönüyorsa → aynı şekilde, hiçbir dosya git
  tarafından takip edilmiyor.

**Bu çıktıları raporla, sonraki adıma bu bilgiyle geç.**

---

## 🔴 Adım 0.5 — Kirli Veri Denetimi: Amblem Yerine Stadyum/Sahne Fotoğrafları (Kritik, Migrasyondan Önce Şart)

**Tespit edilen sorun:** Önceki raporda "P18 (genel/stadyum resmi) katı
filtre ile elendi" iddia edilmişti, ancak gerçekte birçok kulüpte amblem
yerine **stadyum içi fotoğrafı, maç sahnesi veya taraftar fotoğrafı**
"logo" olarak kaydedilmiş ve gösteriliyor (örnek: Fenerbahçe kartında
amblem yerine dolu tribünlü bir stadyum fotoğrafı çıkıyor). Bu, P18/P154
filtresinin script'te ya hiç çalışmadığını ya da bazı durumlarda (P154
boşsa) sessizce P18'e veya başka bir görsel alanına düştüğünü gösteriyor.

**Bu, migrasyondan (Adım 1) önce mutlaka temizlenmeli** — aksi halde
bozuk görseller Supabase Storage'a taşınır, sorun çözülmüş gibi görünür
ama aslında sadece yer değiştirir.

### 0.5.1 Kök Nedeni Script'te Bul

`fetch-and-store-team-logos.ts` dosyasını incele:
- SPARQL sorgusu gerçekten sadece `P154`'ü mü çekiyor, yoksa bir
  `OPTIONAL`/fallback zinciri içinde `P154` boşsa başka bir property'ye
  (`P18`, `P41` — arma değil forma/logo karışıklığı, ya da genel "image"
  alanı) mi düşüyor?
- Wikimedia'dan dönen dosya, indirilmeden önce **gerçekten bir amblem mi
  olduğu doğrulanıyor mu**, yoksa dönen ilk sonuç sorgusuzca mı
  kaydediliyor?
- Dosya adında/kategorisinde "stadium", "stadyum", "crowd", "match",
  "interior" gibi kelimeler geçen sonuçlar otomatik elenmeli — bu kontrol
  var mı, yoksa sadece property tipine mi güveniliyor?

### 0.5.2 Zaten İndirilmiş Dosyaları Otomatik Olarak Şüpheli İşaretle

Elle her dosyaya bakmak yerine, birkaç basit teknik heuristikle şüpheli
dosyaları otomatik ayıkla:

```typescript
// scripts/audit-logo-quality.ts
import sharp from "sharp";
import { readdir } from "fs/promises";
import path from "path";

interface AuditResult {
  file: string;
  suspicious: boolean;
  reasons: string[];
}

async function auditLogo(filePath: string): Promise<AuditResult> {
  const reasons: string[] = [];
  const metadata = await sharp(filePath).metadata();

  // 1. En-boy oranı kontrolü: gerçek amblemler genelde kareye yakındır (1:1 - 1:1.3).
  //    Stadyum/sahne fotoğrafları genelde 4:3, 16:9 gibi belirgin dikdörtgendir.
  const ratio = (metadata.width ?? 1) / (metadata.height ?? 1);
  if (ratio > 1.3 || ratio < 0.77) {
    reasons.push(`Şüpheli en-boy oranı: ${ratio.toFixed(2)} (amblem için beklenmez)`);
  }

  // 2. Format kontrolü: JPG formatı amblemler için nadirdir (amblemler
  //    genelde SVG veya transparan PNG'dir). JPG + büyük boyut = fotoğraf işareti.
  if (metadata.format === "jpeg" || metadata.format === "jpg") {
    reasons.push("JPG formatı — amblemler genelde SVG/PNG olur, fotoğraf olabilir");
  }

  // 3. Transparanlık kontrolü: SVG/PNG amblemlerin çoğu transparan
  //    arka plana sahiptir, fotoğraflarda bu neredeyse hiç olmaz.
  if (metadata.format === "png" && !metadata.hasAlpha) {
    reasons.push("PNG ama alpha kanalı yok — fotoğraf olabilir");
  }

  // 4. Renk karmaşıklığı: fotoğraflar genelde çok daha fazla benzersiz
  //    renk içerir, amblemler az sayıda düz renkten oluşur.
  const { dominant } = await sharp(filePath).stats();
  // (Basit bir sinyal olarak dosya boyutu/piksel oranı da kullanılabilir:
  //  aynı çözünürlükte fotoğraflar genelde amblemlerden çok daha büyük
  //  dosya boyutuna sahiptir çünkü daha fazla detay/gürültü içerirler.)

  return { file: filePath, suspicious: reasons.length > 0, reasons };
}

async function auditAll() {
  // Not: Bu script Adım 1'den ÖNCE, hâlâ public/team-logos/ altındayken
  // veya migration script'i içine entegre edilerek Supabase upload'undan
  // ÖNCE çalıştırılmalı.
  const dir = path.join(process.cwd(), "public/team-logos");
  const files = await readdir(dir);
  const results = await Promise.all(files.map((f) => auditLogo(path.join(dir, f))));

  const suspicious = results.filter((r) => r.suspicious);
  console.log(`\n${suspicious.length}/${results.length} dosya şüpheli:\n`);
  for (const r of suspicious) {
    console.log(`⚠️  ${r.file}\n   ${r.reasons.join(", ")}\n`);
  }
}
```

**Not:** Bu heuristikler **%100 kesin değil**, yanlış pozitif/negatif
verebilir — amaç elle bakılacak listeyi 2.800 dosyadan makul bir sayıya
(muhtemelen birkaç düzine) indirmek, tamamen otomatik karar verdirmek
değil.

### 0.5.3 Şüpheli Dosyaları Gözle Doğrula, Sonra Sil ve Yeniden Çek

- Şüpheli işaretlenen dosyaların bir **contact sheet** (küçük thumbnail
  ızgarası) halinde tek bir görselde birleştirilip sana gösterilmesi
  istensin (`sharp` ile kolayca yapılabilir) — 30-40 küçük resme tek
  bakışta göz gezdirmek, tek tek dosya açmaktan çok daha hızlı.
- Gerçekten yanlış (fotoğraf/stadyum/taraftar görseli) olanlar için:
  1. İlgili kulübün `logo_url` alanı `null`'a çekilsin (fallback rozete
     düşsün, yanlış görsel göstermektense monogram göstermek tercih
     edilir).
  2. Bu kulüpler için, düzeltilmiş SPARQL sorgusuyla (0.5.1'de bulunan
     kök sebep giderildikten sonra) **yeniden** logo çekme denensin.
  3. Yeniden çekilen görsel de bu audit script'inden geçirilsin —
     doğrulanmadan direkt kabul edilmesin.

### 0.5.4 Doğrulama

Audit script'i tekrar çalıştırıldığında şüpheli dosya sayısı sıfıra
yakın olmalı. Kalan birkaç "şüpheli ama aslında doğru" (örn. dikdörtgen
formatlı ama gerçek bir amblem varyasyonu) dosya varsa, bunlar elle
gözden geçirilip beyaz listeye alınabilir.

**Bu adım tamamlanmadan Adım 1'e (Supabase migrasyonu) geçilmemeli.**

---

## 🔴 Adım 1 — Supabase Storage'a Geçiş (Öncelikli, Kritik)

### 1.1 Bucket Oluştur

Supabase dashboard'unda ya da script ile:
```typescript
await supabase.storage.createBucket("team-logos", {
  public: true,
  fileSizeLimit: 512 * 1024, // 512 KB üst sınır — bkz. Adım 2
  allowedMimeTypes: ["image/svg+xml", "image/png", "image/webp"],
});
```

### 1.2 Mevcut 110 Logoyu Taşıyan Migration Script'i Yaz

```typescript
// scripts/migrate-logos-to-supabase.ts
import { readdir, readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const LOCAL_DIR = path.join(process.cwd(), "public/team-logos");

async function migrate() {
  const files = await readdir(LOCAL_DIR);
  let success = 0;
  let failed = 0;

  for (const file of files) {
    const teamId = path.parse(file).name; // dosya adı = team id
    const ext = path.parse(file).ext.slice(1); // "svg" | "png"
    const buffer = await readFile(path.join(LOCAL_DIR, file));

    const { error: uploadError } = await supabase.storage
      .from("team-logos")
      .upload(`${teamId}.${ext}`, buffer, {
        contentType: ext === "svg" ? "image/svg+xml" : "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ ${file}: ${uploadError.message}`);
      failed++;
      continue;
    }

    const { data } = supabase.storage.from("team-logos").getPublicUrl(`${teamId}.${ext}`);

    await prisma.team.updateMany({
      where: { id: teamId },
      data: { logoUrl: data.publicUrl },
    });

    success++;
    console.log(`✅ ${teamId} -> ${data.publicUrl}`);
  }

  console.log(`\nToplam: ${success} başarılı, ${failed} başarısız.`);
}

migrate().finally(() => prisma.$disconnect());
```

### 1.3 `fetch-and-store-team-logos.ts` Script'ini Güncelle

Bundan sonraki tüm yeni logo indirmeleri **doğrudan Supabase Storage'a**
gitmeli, `public/team-logos/`'a bir daha yazılmamalı. Script'in
indirme/kaydetme kısmını yukarıdaki `migrate.ts`'deki upload mantığıyla
birleştir — indir, diske değil doğrudan Supabase'e yükle.

### 1.4 Yerel Klasörü Temizle

Migration doğrulandıktan sonra (Adım 1.5'e bak), `public/team-logos/`
klasörünü sil ve `.gitignore`'a ekle (gelecekte biri yanlışlıkla oraya
dosya koyarsa commit'lenmesin diye):

```
# .gitignore
public/team-logos/
```

### 1.5 Doğrulama — Bu Adımı Atlamadan Geçme

```sql
SELECT COUNT(*) FROM teams WHERE logo_url LIKE '%supabase.co%';
```
Bu sayı, taşınan logo sayısıyla (110 civarı) eşleşmeli. Ayrıca en az 3
farklı `logo_url` değerini tarayıcıda **doğrudan açıp** görüntünün
gerçekten yüklendiğini gözle doğrula (200 OK dönmesi yetmez, görsel
gerçekten görünmeli).

---

## 🟠 Adım 2 — İndirme Script'ine Boyut/Format Kontrolü Ekle

**Sorun:** ADO Den Haag'ın logosu 4.2 MB çıkmıştı — bu bir logo için
anormal, muhtemelen optimize edilmemiş/yanlış bir dosya çekilmiş.

```typescript
import sharp from "sharp"; // pnpm add sharp

const MAX_FILE_SIZE = 200 * 1024; // 200 KB
const TARGET_DIMENSION = 256; // px

async function processLogo(buffer: Buffer, ext: string): Promise<Buffer> {
  if (ext === "svg") {
    // SVG'ler zaten küçük, boyut kontrolü yeterli
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`SVG beklenenden büyük (${buffer.length} bytes) — elle incele`);
    }
    return buffer;
  }

  // PNG/diğer raster formatlar: yeniden boyutlandır + WebP'ye çevir
  const resized = await sharp(buffer)
    .resize(TARGET_DIMENSION, TARGET_DIMENSION, { fit: "inside" })
    .webp({ quality: 85 })
    .toBuffer();

  if (resized.length > MAX_FILE_SIZE) {
    console.warn(`⚠️ İşlendikten sonra hâlâ büyük: ${resized.length} bytes — elle incele`);
  }

  return resized;
}
```

Bu fonksiyon, indirme script'inde upload'dan **önce** her dosyaya
uygulanmalı. Format `webp`'ye çevrildiği için `contentType` ve dosya
uzantısı buna göre güncellenmeli.

---

## 🟡 Adım 3 — Kapsam Genişletme: Belirlenen Ligler

**Kapsam net olarak şu şekilde sınırlandırılmıştır — bunun dışına
çıkılmamalı:**

- ✅ **6 büyük Avrupa ligi** (Premier League, La Liga, Serie A, Bundesliga,
  Ligue 1) — bu liglerdeki **tüm kulüpler**.
- ✅ **Türkiye Süper Ligi** — ligdeki **tüm kulüpler** (sadece bilinen
  birkaçı değil).
- ✅ **Arjantin** — `popularity_score`'a göre **en popüler 5 kulüp.**
- ✅ **Brezilya** — `popularity_score`'a göre **en popüler 5 kulüp.**
- ❌ Türkiye 1. Lig (Süper Lig altı), Türkiye 2. Lig, Arjantin/Brezilya'nın
  geri kalanı, diğer tüm ligler → **bu aşamada dahil edilmeyecek**,
  fallback monogram rozetle devam edecek.

### 3.1 Hedef Kulüp Listesini Çıkaran Sorgu

```typescript
// scripts/get-logo-target-teams.ts
const TOP5_LEAGUES = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"];

async function getTargetTeams() {
  const top5AndSuperLig = await prisma.team.findMany({
    where: {
      OR: [
        { league: { in: TOP5_LEAGUES } },
        { league: "Süper Lig" }, // veritabanındaki gerçek alan adını kontrol et
      ],
    },
  });

  const topArgentina = await prisma.team.findMany({
    where: { country: "Argentina" },
    orderBy: { popularityScore: "desc" },
    take: 5,
  });

  const topBrazil = await prisma.team.findMany({
    where: { country: "Brazil" },
    orderBy: { popularityScore: "desc" },
    take: 5,
  });

  return [...top5AndSuperLig, ...topArgentina, ...topBrazil];
}
```

**Not:** `league` alanındaki gerçek değerleri (`Süper Lig` yazımı, Kaggle/
Wikidata'dan gelen format farklı olabilir — örn. `"Turkish Super Lig"` ya
da `"Trendyol Süper Lig"` gibi) önce bir `SELECT DISTINCT league FROM
teams WHERE country = 'Turkey';` ile kontrol et, filtre buna göre
yazılsın. Yanlış string eşleşmesi kulüpleri sessizce dışarıda bırakabilir.

### 3.2 İndirme Script'ini Bu Listeyle Sınırlı Çalıştır

Mevcut `fetch-and-store-team-logos.ts`'i, `take: 300` (popülerlik sınırı)
yerine yukarıdaki `getTargetTeams()` fonksiyonunun döndürdüğü **spesifik
kulüp ID listesiyle** çalışacak şekilde güncelle. Popülerlik skoruna göre
genel bir kesim yapmak yerine, net kapsamı (lig + ülke bazlı) hedefle.

### 3.3 Beklenen Sonuç ve Gerçekçilik Notu

- Top 5 Avrupa ligi + Süper Lig: Wikidata kapsamı iyi olduğu için
  **büyük çoğunluğunun** (%80-90+) logosu bulunabilmeli.
- Arjantin/Brezilya top 5: Bu kulüpler (Boca, River, Flamengo vb.) zaten
  dünya çapında tanınan kulüpler, Wikidata'da logolarının olma ihtimali
  yüksek — ama %100 garanti değil, bulunamayan olursa fallback devam
  eder.

---

## 🟢 Adım 4 — Diğer Veri Kaynaklarını Kontrol Et

`SandboxMode.tsx` bileşeninin takım listesini **`/api/teams/search`
endpoint'inden mi** aldığını, yoksa **kendi ayrı bir sorgu/statik liste**
mi kullandığını kontrol et. Eğer ayrıysa, orada da `logoUrl` seçiminin
(select/statik liste) eksik olup olmadığını doğrula — Adım 1.1 ve 1.2'de
(önceki raporda) tespit edilen hata deseni (`select` sorgusunda alan
unutulması) burada da tekrarlanmış olabilir.

---

## 🔵 Adım 5 — Production Doğrulaması (Zorunlu, Atlanamaz)

**Bu adım kritik: sadece localhost'ta test etmek yeterli değil.**

1. Değişiklikleri bir **Vercel preview deploy**'una gönder (feature
   branch, `main`'e merge etmeden önce).
2. Preview URL'de gerçek oyunu aç, en az 3 farklı maç senaryosunda
   (Süper Lig takımı vs Avrupa takımı, Arjantin vs Brezilya, biri
   kapsam dışı bir ligden) logoların/fallback'lerin doğru göründüğünü
   **ekran görüntüsüyle** kanıtla.
3. Browser DevTools → Network sekmesinde logo isteklerinin gerçekten
   `supabase.co` domain'inden, `200 OK` ile döndüğünü doğrula.
4. Bu doğrulama tamamlanmadan "tamamlandı" raporu yazılmasın.

---

## Kabul Kriterleri (Ajan İçin Kontrol Listesi)

- [ ] Adım 0'daki git durumu tespiti yapıldı ve raporlandı.
- [ ] Adım 0.5'teki kalite denetimi çalıştırıldı, şüpheli (amblem
      olmayan/stadyum-sahne fotoğrafı) dosyalar tespit edilip elle
      doğrulandı; gerçekten yanlış olanlar `null`'a çekilip kök sebep
      düzeltildikten sonra yeniden çekildi.
- [ ] SPARQL/fetch script'indeki P154→P18 (veya başka bir alana) sessiz
      fallback davranışı bulunup düzeltildi — sadece gerçek amblem
      property'si (P154) kullanılıyor, boşsa dosya hiç indirilmiyor
      (fallback monogram rozete bırakılıyor).
- [ ] Tüm mevcut logolar (temizlenmiş haliyle) Supabase Storage'a
      taşındı, `teams.logo_url` Supabase CDN URL'lerini gösteriyor.
- [ ] `public/team-logos/` klasörü silindi, `.gitignore`'a eklendi.
- [ ] İndirme script'ine boyut/format kontrolü (sharp ile resize +
      webp dönüşümü) eklendi, hiçbir dosya 200KB'ı aşmıyor.
- [ ] Kapsam **tam olarak** belirtilen liglerle sınırlı: 6 büyük Avrupa
      ligi (tüm kulüpler) + Süper Lig (tüm kulüpler) + Arjantin top 5 +
      Brezilya top 5 — ne eksik ne fazla.
- [ ] `SandboxMode.tsx`'in veri kaynağı kontrol edildi, gerekiyorsa aynı
      düzeltme orada da uygulandı.
- [ ] Değişiklikler bir Vercel preview deploy'unda gerçekten test edildi,
      ekran görüntüsüyle doğrulandı — sadece localhost testi yeterli
      sayılmadı.

---

## Antigravity'ye Verilecek Görev Promptu

> "AGENTS.md dosyasını oku. `LOGO_STORAGE_MIGRATION.md` dosyasındaki
> adımları **sırayla, her adımı doğrulamadan bir sonrakine geçmeden**
> uygula. Adım 0'ı çalıştırıp gerçek git durumunu bana raporla, ben
> onaylamadan sonrakine geçme. **Adım 0.5'i atlama** — Fenerbahçe
> örneğinde olduğu gibi bazı kulüplerde amblem yerine stadyum/sahne
> fotoğrafı 'logo' olarak kaydedilmiş durumda, bunun kök sebebini
> script'te bul ve düzelt, tüm mevcut dosyaları denetle, şüpheli
> olanların bir contact sheet görselini bana göster, ben onaylamadan
> silme/yeniden çekme işlemine geçme. Kapsam genişletmesinde (Adım 3)
> belirtilen lig/ülke sınırlarının dışına asla çıkma — sadece 6 büyük
> Avrupa ligi, Türkiye Süper Ligi, ve Arjantin/Brezilya'nın en popüler
> 5'er kulübü. Son adımda (Adım 5) gerçek bir Vercel preview deploy'unda
> test edip ekran görüntüsü olmadan 'tamamlandı' deme."
