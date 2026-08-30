# ⚽ Futbol Quiz Oyunu

Gerçek zamanlı 1v1 futbol bilgi yarışı. İki oyuncu bağımsız olarak birer takım seçer, ardından her iki kulüpte de forma giymiş ortak futbolcuyu en hızlı yazan oyuncu turu kazanır.

## 🚀 Teknoloji Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + TailwindCSS v4
- **Realtime**: PartyKit (Cloudflare Workers)
- **Veritabanı & ORM**: PostgreSQL (Neon/Supabase) + Prisma ORM
- **State & Arama**: Zustand + Fuse.js (Client-side hızlı oyuncu fuzzy search)
- **Animasyon**: Framer Motion
- **Doğrulama**: Zod

## 📁 Katmanlı Proje Yapısı

```
/app                    # Next.js App Router sayfaları (sadece routing + layout)
/components
  /ui                   # Genel görsel bileşenler (Button, Card, Badge...)
  /game                 # Oyuna özel bileşenler (TeamPicker, RoundTimer, PlayerAnswerInput...)
/lib
  /db                   # Prisma client ve DB sorgu fonksiyonları (repository katmanı)
  /realtime             # PartyKit oda modelleri ve event tanımları
  /elo                  # Rank/ELO hesaplama mantığı
  /validation           # Zod şemaları
/types                  # Paylaşılan TypeScript tipleri
/scripts                # Kaggle / Wikidata veri import scriptleri
/prisma                 # schema.prisma, migrations
```

## 🛠️ Kurulum & Geliştirme

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env.example` dosyasını `.env` olarak kopyalayın ve PostgreSQL bağlantınızı girin:
```bash
cp .env.example .env
```

3. Prisma client oluşturun:
```bash
npx prisma generate
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

## 📜 Kurallar & Standartlar

Geliştirme süreci ve kodlama standartları için [`AGENTS.md`](./AGENTS.md) ve [`futbol-quiz-final-plan.md`](./futbol-quiz-final-plan.md) belgelerine başvurun.
