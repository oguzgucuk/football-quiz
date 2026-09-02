# Futbol Quiz

Gerçek zamanlı, çok oyunculu 1v1 futbol bilgi yarışı platformu. Oyuncular bağımsız olarak kulüplerini seçer ve her iki kulüpte de forma giymiş ortak futbolcuyu en hızlı bulan oyuncu puanı kazanır.

---

## Özellikler

- **Gerçek Zamanlı 1v1 Eşleşme:** PartyKit tabanlı düşük gecikmeli oda yönetimi ve anlık tur senkronizasyonu.
- **Akıllı ve Hızlı İsim Doğrulama:** Client tarafında çalışan Fuse.js tabanlı arama motoru ve sunucu tarafında normalizasyon, takma ad ve yazım hatası toleransı içeren cevap doğrulama altyapısı.
- **Yüksek Kaliteli Logo Pipeline:** Wikipedia Infobox (SVG) ve TheSportsDB (WebP) üzerinden Supabase Storage'a otomatik aktarılan, CDN destekli kulüp logoları.
- **Rekabetçi ELO Sistemi:** Dinamik K-faktörü ile hesaplanan dereceli sıralama ve rütbe sistemi.
- **Katmanlı Mimari:** UI, iş mantığı ve veri erişim katmanlarının birbirinden tamamen ayrıldığı temiz kod yapısı.

---

## Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | Modern SSR/CSR hibrit arayüz mimarisi |
| **Stil & Tasarım** | TailwindCSS v4, Framer Motion | Dinamik animasyonlar ve modern koyu tema |
| **Gerçek Zamanlı (Realtime)** | PartyKit | WebSocket tabanlı lobi ve oyun odası altyapısı |
| **Veritabanı & ORM** | PostgreSQL (Supabase / Neon), Prisma ORM | İlişkisel veri modeli ve migration yönetimi |
| **Depolama (Storage)** | Supabase Storage | Optimize edilmiş SVG ve WebP kulüp logoları |
| **Arama & Validasyon** | Fuse.js, Zod | Client-side fuzzy search ve runtime tip doğrulama |

---

## Proje Dizin Yapısı

```text
football-quiz/
├── app/                  # Next.js App Router sayfaları ve API rotaları
│   ├── admin/logos/      # Logo doğrulama ve denetim paneli
│   ├── api/              # Auth, oyun doğrulama ve arama endpointleri
│   └── play/[roomId]/    # Çok oyunculu oyun odası ekranı
├── components/
│   ├── game/             # Oyuna özel bileşenler (TeamPicker, RoundTimer, VersusDisplay)
│   ├── layout/           # Navbar, Footer ve navigasyon bileşenleri
│   └── ui/               # Temel görsel bileşenler (Button, Card, TeamBadge)
├── lib/
│   ├── db/               # Prisma sorguları ve veri erişim katmanı (Repository)
│   ├── elo/              # ELO değişim ve puan hesaplama mantığı
│   ├── realtime/         # PartyKit oda durum modelleri ve event tipleri
│   ├── storage/          # Görsel işleme ve Supabase depolama entegrasyonu
│   └── validation/       # Zod şemaları
├── party/                # PartyKit server ve oyun odası mantığı (game.ts, server.ts)
├── prisma/               # Veritabanı şeması ve migration dosyaları
├── scripts/              # Veri çekme, logo aktarımı ve kalite kontrol scriptleri
└── types/                # Paylaşılan TypeScript tip tanımları
```

---

## Kurulum ve Başlangıç

### 1. Bağımlılıkları Yükleyin

```bash
pnpm install
```

### 2. Ortam Değişkenlerini Tanımlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli bağlantı bilgilerini girin:

```bash
cp .env.example .env
```

Gerekli temel ortam değişkenleri:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_PARTYKIT_HOST="127.0.0.1:1999"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="your-jwt-secret"
```

### 3. Veritabanını Hazırlayın

Prisma istemcisini oluşturun ve şemayı veritabanına uygulayın:

```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Geliştirme Sunucularını Başlatın

Next.js ve PartyKit sunucularını aynı anda başlatmak için:

```bash
pnpm dev
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

---

## Kullanılabilir Komutlar

- `pnpm dev`: Geliştirme ortamını başlatır.
- `pnpm build`: Next.js üretim derlemesini alır.
- `pnpm party:dev`: Sadece yerel PartyKit sunucusunu başlatır.
- `pnpm party:deploy`: PartyKit odalarını bulut ortamına deploy eder.
- `pnpm prisma studio`: Veritabanı kayıtlarını tarayıcı arayüzünde görüntüler.

---

## Gelecek Planları ve Yol Haritası

Platformun LoL Client tarzı arayüze geçişi, açık arttırma (auction draft) ve maç simülasyonu gibi planlanan yeni oyun modları hakkında detaylı bilgi için [GELECEK_PLANLARI.md](./GELECEK_PLANLARI.md) dosyasını inceleyebilirsiniz.
