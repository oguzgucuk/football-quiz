# ⚽ Web Futbol Quiz Oyunu — Final Proje Planı

## 1. Oyun Konsepti

**Temel akış:**
1. İki oyuncu odaya bağlanır (matchmaking ya da davet linki ile).
2. 5 saniyelik sayaç başlar, her iki oyuncu bağımsız olarak bir takım seçer.
3. Süre dolunca seçimler karşılıklı gösterilir.
4. Oyuncular, **her iki takımda da forma giymiş** bir futbolcunun adını yazar;
   ilk doğru cevabı yazan turu kazanır.
5. Skor/rank güncellenir, yeni tur başlar.

**MVP modu:** Takım vs Takım.
**Sonraki modlar:** Ülke vs Takım, Ülke vs Ülke, zaman aralığı kısıtlı mod.

---

## 2. Kesinleşen Teknoloji Stack

| Katman | Araç | Neden |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript** | Routing, auth entegrasyonu ve tek repo'da landing + oyun ekranı |
| Deploy (frontend) | **Vercel (Free)** | Next.js ile birebir entegre, ücretsiz katman yeterli |
| Realtime / oda yönetimi | **PartyKit** | Cloudflare Workers üzerinde çalışır, oda + senkron state + timer mantığını hazır sunar, ücretsiz katmanı bu iş için yeterli |
| Stil | **TailwindCSS** | Hızlı, tutarlı UI |
| State yönetimi (client) | **Zustand** | Bu boyutta bir oyun için Redux gereksiz ağırlık |
| Animasyon | **Framer Motion** | Sayaç, takım kartı geçişleri — oyunun "hız hissi" için önemli |
| Veritabanı | **PostgreSQL (Neon veya Supabase, Free)** | Kredi kartsız gerçek ücretsiz katman |
| ORM | **Prisma** | Tip güvenli sorgular, migration yönetimi |
| Cache / kuyruk | **Redis (Upstash, Free)** | Matchmaking kuyruğu, aktif oda cache'i, rate limiting |
| Auth | **Clerk veya NextAuth (Auth.js)** | Google/Discord login yeterli |
| Veri toplama scriptleri | **Node.js scriptleri (`/scripts`)** | Kaggle + Wikidata verisini çekip Postgres'e yükler |

**Maliyet:** Bu stack ile MVP tamamen **$0/ay** ile ayakta durur. Trafik
büyüyünce ilk ödeme muhtemelen Neon/Supabase'in ücretli katmanına geçiş
olacaktır (kullanıcı sayısı ciddi artınca).

⚠️ Not: Vercel serverless fonksiyonları uzun süreli WebSocket bağlantısı
tutamaz — bu yüzden realtime katmanı (PartyKit) ayrı barındırılıyor, Vercel
sadece frontend + normal API route'lar için kullanılıyor.

---

## 3. Veritabanı Şeması

```
players
  id, full_name, birth_date, nationality, position, external_ref (nullable)

teams
  id, name, country, league, logo_url

player_team_history        <-- oyunun kalbi
  id, player_id, team_id, season_start, season_end, is_national_team (bool)

users
  id, username, email, elo_rating, rank_tier, created_at

matches
  id, player1_id, player2_id, mode, ranked (bool), created_at

match_rounds
  id, match_id, round_number, entity1_id, entity1_type, entity2_id, entity2_type,
  winner_user_id, answer_given, answered_at, time_taken_ms

missing_answers_log         <-- kullanıcı sistemde olmayan bir isim yazdığında
  id, submitted_name, team1_id, team2_id, created_at
```

`player_team_history` üzerinde `(player_id, team_id)` composite index şart —
doğru cevap kontrolü milisaniyeler içinde dönmeli.

**Doğrulama sorgusu mantığı:**
```sql
SELECT p.full_name
FROM players p
JOIN player_team_history h1 ON h1.player_id = p.id AND h1.team_id = :team1
JOIN player_team_history h2 ON h2.player_id = p.id AND h2.team_id = :team2
WHERE lower(p.full_name) = lower(:cevap)
LIMIT 1;
```

---

## 4. Futbolcu Verisi — Kaynak Stratejisi

| Dönem | Kaynak | Not |
|---|---|---|
| 2012 – günümüz | **Kaggle Transfermarkt veri setleri** | Hazır, temiz, geniş kapsam — MVP'nin omurgası |
| 2012 öncesi | **Wikidata (SPARQL)** | CC0 lisanslı, tamamen legal, Wikipedia infobox verisinden geliyor |
| Kapsam dışı kalanlar | **RSSSF (rsssf.org)** | Eski/nadir ligler için manuel/scriptli tamamlama, düşük öncelik |
| Eksik veri takibi | **`missing_answers_log` tablosu** | Kullanıcı bulamadığı oyuncuyu yazınca loglanır, en çok talep edilenler öncelikli eklenir |

Transfermarkt'ı doğrudan ve büyük ölçekli scrape etmek ToS ihlali riski
taşıdığı için **kalıcı veri kaynağı olarak kullanılmıyor**. Kaggle + Wikidata
kombinasyonu MVP için yeterli kapsamı sağlıyor; büyüme sonrası gerekirse
API-Football gibi resmi/ücretli bir API'ye geçiş değerlendirilir.

**Veri yükleme akışı:**
1. `/scripts/import-kaggle.ts` — Kaggle CSV'sini parse edip `players`,
   `teams`, `player_team_history` tablolarına yazar.
2. `/scripts/import-wikidata.ts` — SPARQL sorgusuyla eksik/eski dönem
   oyuncularını çekip aynı tablolara ekler (dedupe kontrolü ile).
3. Bu scriptler tek seferlik değil, periyodik çalıştırılabilir (yeni sezon
   transferleri için).

---

## 5. Güvenlik ve Anti-Cheat

- Doğru cevap **asla client'a gönderilmez**, sadece doğru/yanlış sonucu döner.
- Round timer **server'da (PartyKit) tutulur**, client'ın gönderdiği zaman
  damgasına güvenilmez.
- Cevap gönderme endpoint'i Redis ile **rate limit'lenir**.
- `players`/`teams`/`player_team_history` herkese açık salt-okunur veri —
  RLS gerekmez. `users`/`matches` gibi kullanıcıya özel veriler backend
  (Next.js API + Prisma) üzerinden yönetildiği için client doğrudan DB'ye
  bağlanmıyor; bu modelde RLS zorunlu değil (Supabase'i client-side direct
  DB erişimiyle kullanmıyoruz).

---

## 6. Rank Sistemi

- Başlangıç puanı: 1000, klasik **ELO formülü** ile güncelleme.
- Rank tier'ları: Bronz / Gümüş / Altın / Platin / Elmas.
- `matches.ranked = false` olan maçlar ELO hesabına dahil edilmez (ranksız
  mod isteyenler için).

---

## 7. Geliştirme Fazları

| Faz | İçerik |
|---|---|
| **Faz 0** | Kaggle + Wikidata scriptleri ile veritabanını doldur, dedupe et, temizle |
| **Faz 1 (MVP)** | Tek mod (Takım vs Takım), PartyKit ile 2 kişilik oda, server-side cevap doğrulama, auth yok, ranksız |
| **Faz 2** | Auth (Clerk/NextAuth), ELO/rank sistemi, maç geçmişi, matchmaking kuyruğu (Redis) |
| **Faz 3** | Diğer modlar (ülke vs takım, zaman aralığı), oda kodu ile arkadaş daveti, spectator mode |
| **Faz 4** | PWA/mobil uyum, leaderboard, sezon sistemi |

---

## 8. Kod Kalitesi

Proje için ayrı bir `AGENTS.md` dosyası hazırlandı (Antigravity'nin otomatik
okuduğu kural dosyası) — dosya/fonksiyon boyut limitleri, katmanlı mimari,
isimlendirme kuralları ve güvenlik kontrol listesi içeriyor. Antigravity'de
kod yazdırırken bu dosya proje kökünde dursun, ajan her görevde otomatik
referans alacaktır.

---

## Özet

- **Frontend + deploy:** Next.js → Vercel (Free)
- **Realtime:** PartyKit (Cloudflare, Free)
- **DB:** PostgreSQL (Neon/Supabase, Free) + Prisma
- **Cache/kuyruk:** Upstash Redis (Free)
- **Veri kaynağı:** Kaggle (2012+) + Wikidata (2012 öncesi) + eksik veri log
  sistemi
- **Toplam başlangıç maliyeti:** $0/ay
