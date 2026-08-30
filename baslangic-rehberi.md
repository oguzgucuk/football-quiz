# 🚀 Başlangıç Rehberi — Futbol Quiz Oyunu

> Bu dosya sadece senin takip etmen için — Antigravity'ye vermiyorsun, sen
> bu adımları sırayla uygularken yanında bulunduruyorsun. Her adımı
> tamamladıkça kutucuğu işaretle.

---

## Adım 1 — Supabase Projesi

- [ ] [supabase.com](https://supabase.com) üzerinden yeni bir proje oluştur.
- [ ] **Region: Central EU (Frankfurt)** seç (İstanbul'a en yakın, en düşük
      gecikme).
- [ ] Proje oluşturulunca **Project Settings → Database** kısmına git,
      **Connection String** (URI formatında) al.
- [ ] Bu connection string'i şimdilik güvenli bir yere (örn. şifre
      yöneticine veya bir not uygulamasına) kaydet — bir sonraki adımda
      kullanacaksın. **Hiçbir zaman GitHub'a commit etme.**

**Beklenen sonuç:** Elinde şuna benzer bir connection string olacak:
`postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

---

## Adım 2 — Repo ve Next.js İskeleti

- [ ] GitHub'da boş bir repo oluştur (örn. `futbol-quiz`).
- [ ] Lokal makinende bir klasöre git, terminalde:
  ```bash
  pnpm create next-app@latest futbol-quiz
  ```
  Sorulan seçeneklerde:
  - TypeScript: **Yes**
  - ESLint: **Yes**
  - Tailwind CSS: **Yes**
  - `src/` dizini: tercihe bağlı (kullanmasan da olur)
  - App Router: **Yes**
  - Import alias: varsayılan (`@/*`) kalabilir
- [ ] `cd futbol-quiz` ile proje klasörüne gir.
- [ ] Daha önce hazırladığımız **AGENTS.md** dosyasını proje kök dizinine
      (package.json ile aynı seviyeye) koy.
- [ ] `git init` (henüz yapılmadıysa), `git remote add origin <repo-url>`,
      ilk commit'i at:
  ```bash
  git add .
  git commit -m "chore: initial project setup with pnpm and AGENTS.md"
  git push -u origin main
  ```

**Beklenen sonuç:** `pnpm dev` çalıştırınca `localhost:3000`'de boş bir
Next.js sayfası görüyorsun, AGENTS.md dosyası repo kökünde duruyor.

---

## Adım 3 — Prisma Kurulumu ve Supabase Bağlantısı

- [ ] Proje kökünde `.env.local` dosyası oluştur (yoksa), içine:
  ```
  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
  ```
- [ ] `.gitignore` dosyasını kontrol et, `.env.local` satırının orada
      olduğundan emin ol (Next.js projelerinde genelde otomatik gelir, yine
      de kontrol et).
- [ ] Prisma'yı kur:
  ```bash
  pnpm add -D prisma
  pnpm add @prisma/client
  npx prisma init
  ```
  Bu komut `/prisma/schema.prisma` dosyasını ve `.env` dosyasını
  oluşturur. `.env` içindeki `DATABASE_URL`'i az önce `.env.local`'e
  yazdığın değerle aynı yap (Prisma CLI genelde `.env` dosyasını okur,
  Next.js ise `.env.local`'i — ikisinde de aynı değeri tutmak en
  sorunsuz yol).

**Beklenen sonuç:** `/prisma/schema.prisma` dosyası elinde, provider
`postgresql` olarak ayarlı.

---

## Adım 4 — Veritabanı Şemasını Yaz ve Migration Çalıştır

- [ ] `schema.prisma` içine planladığımız modelleri ekle: `players`,
      `teams`, `player_team_history`, `users`, `matches`, `match_rounds`,
      `missing_answers_log`. (Bu adımda birlikte yazabiliriz, istersen
      söyle.)
- [ ] İlk migration'ı çalıştır:
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Migration başarılı olunca Supabase dashboard'unda **Table Editor**
      kısmına gidip tabloların gerçekten oluştuğunu gözle doğrula.
- [ ] `npx prisma studio` ile lokal bir arayüzden de tabloları
      inceleyebilirsin (opsiyonel ama debug için kullanışlı).

**Beklenen sonuç:** Supabase'de tüm tablolar boş halde görünüyor, Prisma
Client TypeScript tipleri otomatik oluşmuş durumda (`node_modules/.prisma`
altında).

---

## Adım 5 — Antigravity'ye İlk Görev: Veri Import Script'i

- [ ] Antigravity'yi proje klasöründe aç.
- [ ] İlk mesajında **açıkça** şunu belirt (aynen bu şekilde yazabilirsin):

  > "Önce proje kökündeki AGENTS.md dosyasını oku ve tüm kurallarına uy.
  > Sonra `/scripts/import-kaggle.ts` dosyasını oluştur: [Kaggle'dan
  > indirdiğin CSV dosyasının yolunu/adını buraya yaz] dosyasını parse
  > edip `players`, `teams`, `player_team_history` tablolarına Prisma ile
  > yazsın. Script tekrar çalıştırıldığında aynı kayıtları
  > tekrarlamamalı (upsert mantığı kullan)."

- [ ] Kaggle'dan ilgili veri setini indirip projede bir `/data` klasörüne
      koy (bu klasörü `.gitignore`'a ekle, büyük CSV dosyalarını repoya
      commit'leme).
- [ ] Script çalıştıktan sonra `npx prisma studio` ile tabloların gerçek
      veriyle dolduğunu kontrol et.
- [ ] (Opsiyonel, aynı gün değilse sorun değil) Aynı mantıkla
      `/scripts/import-wikidata.ts` script'ini de yazdır, 2012 öncesi
      dönem için.

**Beklenen sonuç:** `players` tablosunda binlerce gerçek oyuncu,
`player_team_history` tablosunda kariyer geçmişleri dolu durumda.

---

## Buradan Sonrası (Bir Sonraki Oturum)

Bu 5 adımı bitirince elinde şunlar olacak: çalışan bir Next.js projesi,
Supabase'e bağlı Prisma, gerçek oyuncu verisiyle dolu bir veritabanı.
Sıradaki büyük adımlar:

- [ ] Vercel'e bağlan, ilk (boş/iskelet) deploy'u yap.
- [ ] PartyKit kurulumu ve tek odalı mock realtime akışı.
- [ ] MVP oyun akışı: takım seçimi → 5sn sayaç → cevap girişi (hibrit
      dropdown + serbest yazı) → server-side doğrulama.

Bu adımlara geldiğinde bu dosyayı güncelleyip devam ederiz.

---

## Takıldığın Yerler İçin Hızlı Notlar

- **`prisma migrate dev` hata veriyor:** Genelde `DATABASE_URL` yanlış
  yazılmıştır ya da Supabase'in "connection pooling" portu (6543) yerine
  direkt portu (5432) kullanman gerekir — migration'lar için direkt
  bağlantı (5432) kullan, uygulamanın kendisi çalışırken pooling portunu
  (6543) tercih edebilirsin.
- **`pnpm dev` başlamıyor:** `node_modules` klasörünü silip
  `pnpm install` ile tekrar dene.
- **Antigravity AGENTS.md'yi görmüyor gibi davranıyor:** Dosyanın gerçekten
  proje kök dizininde (package.json ile aynı seviyede) olduğundan emin ol,
  ilk mesajında dosyaya açıkça referans ver.
