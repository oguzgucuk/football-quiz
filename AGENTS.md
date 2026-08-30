# Proje Kodlama Standartları — Futbol Quiz Oyunu

> Bu dosya Antigravity ajanının her görevde okuyup uygulaması için hazırlanmıştır.
> Proje kök dizinine `AGENTS.md` olarak koy (Antigravity, Cursor, Claude Code gibi
> birçok ajan aracı bu dosyayı otomatik okur). Kurallar büyüdükçe konuya göre
> `.agents/rules/` klasörü altında ayrı dosyalara bölebilirsin (örn.
> `.agents/rules/backend.md`, `.agents/rules/frontend.md`).

## Temel Felsefe

Amaç: **6 ay sonra bu koda dönüp bakan biri (ya da başka bir ajan) neyin ne
olduğunu 5 dakikada anlayabilsin.** Hız için okunabilirlikten ödün verme.
Bir fonksiyonun/dosyanın ne yaptığı ismi ve konumundan belli olmuyorsa, o kod
yanlış yazılmıştır — yorum ekleyerek değil, yeniden yapılandırarak düzelt.

Her görevde ajan şu sırayı izlemeli: **önce planla, sonra kodla.** Büyük bir
özellik isteniyorsa, direkt koda girmeden önce hangi dosyaların/fonksiyonların
oluşturulacağını kısaca listelemeli.

---

## 1. Dosya ve Klasör Yapısı

```
/app                    # Next.js App Router sayfaları (sadece routing + layout)
/components
  /ui                   # Genel, tekrar kullanılabilir görsel bileşenler (Button, Card...)
  /game                 # Oyuna özel bileşenler (TeamPicker, RoundTimer...)
/lib
  /db                   # Prisma client, DB sorgu fonksiyonları (repository katmanı)
  /realtime             # PartyKit/Colyseus oda mantığı
  /elo                  # Rank/ELO hesaplama mantığı
  /validation           # Zod şemaları
/types                  # Paylaşılan TypeScript tipleri
/scripts                # Veri import/seed scriptleri (Kaggle/Wikidata çekme vs.)
/prisma                 # schema.prisma, migrations
```

**Kural:** Bir dosya "ne işe yaradığı belli olmayan" bir isim taşıyamaz.
`utils.ts`, `helpers.ts`, `misc.ts` gibi çöp kutusu dosyalar **yasak**. Onun
yerine `formatMatchTime.ts`, `calculateEloChange.ts` gibi ne yaptığını
söyleyen isimler kullan — tek fonksiyon bile olsa.

---

## 2. Dosya ve Fonksiyon Boyut Limitleri

- **Bir dosya 300 satırı geçiyorsa** dur, böl. UI bileşenlerinde 200 satır iyi
  bir tavan.
- **Bir fonksiyon 40 satırı geçiyorsa** muhtemelen birden fazla iş yapıyordur
  — alt fonksiyonlara ayır.
- **Bir fonksiyon tek bir işi yapmalı** (Single Responsibility). "Ve" kelimesi
  olmadan ne yaptığını tek cümlede anlatamıyorsan (örn. "kullanıcıyı doğrular
  VE veritabanına yazar VE email gönderir"), bölünmesi gerekiyor demektir.
- Bir React component hem veri çekiyor, hem state yönetiyor, hem de karmaşık
  UI render ediyorsa → veri çekmeyi bir hook'a (`useMatchData`), mantığı ayrı
  bir fonksiyona çıkar, component sadece render etsin.

---

## 3. İsimlendirme Kuralları

- Fonksiyonlar: fiil + nesne → `getPlayerHistory()`, `validateAnswer()`,
  `calculateEloChange()`. Belirsiz isimler (`handleData`, `process`,
  `doStuff`) **yasak**.
- Boolean değişken/fonksiyonlar: `is`, `has`, `should` ile başlasın →
  `isRoundActive`, `hasWinner`.
- Dosya adı = içindeki ana export'un adı. `TeamPicker.tsx` dosyası
  `TeamPicker` component'ini export etmeli, başka bir şeyi değil.
- Kısaltma yok: `usr`, `plyr`, `tm` değil → `user`, `player`, `team`.

---

## 4. Katmanlı Mimari — Karışmasın

Şu üç katman birbirine karışmamalı:

1. **UI katmanı** (`/components`, `/app`) — sadece görsel, state, kullanıcı
   etkileşimi. Doğrudan Prisma sorgusu **yazmaz**.
2. **İş mantığı katmanı** (`/lib`) — ELO hesaplama, cevap doğrulama,
   eşleştirme mantığı. Framework'ten bağımsız, test edilebilir saf fonksiyonlar.
3. **Veri erişim katmanı** (`/lib/db`) — Prisma sorguları burada toplanır.
   `getPlayerByTeams(team1Id, team2Id)` gibi isimlendirilmiş, tek amaçlı
   fonksiyonlar. Component içinde asla ham `prisma.player.findMany(...)`
   çağrısı görülmemeli.

Bu ayrım "spagetti kod"un en büyük sebebini (her yerde her şeyin birbirine
bağımlı olması) baştan engeller.

---

## 5. TypeScript Kuralları

- `any` kullanımı **yasak**. Tip belirsizse `unknown` kullan ve daralt.
- Her API response, DB sonucu ve form verisi için açık tip/interface tanımla
  (`/types` altında veya ilgili dosyada).
- Zod ile runtime validasyon yap — özellikle WebSocket üzerinden gelen
  mesajlarda (client'tan gelen veri asla güvenilir değildir).
- `strict: true` tsconfig'de açık olsun.

---

## 6. Hata Yönetimi

- Sessiz `catch {}` blokları **yasak**. Her hata ya loglanır ya kullanıcıya
  anlamlı şekilde gösterilir, ya da yeniden fırlatılır.
- Realtime katmanında (oda/tur mantığı) beklenmeyen durumlar (oyuncu
  bağlantısı koptu, geçersiz cevap geldi) için açık `if` kontrolleri olsun,
  "olmaz zaten" varsayımıyla kod yazma.
- Kullanıcıya gösterilecek hata mesajları ile geliştirici log mesajları
  ayrı tutulsun (kullanıcıya stack trace gösterme).

---

## 7. Yorum ve Dokümantasyon

- Kod "ne yaptığını" yorumla açıklamaya çalışmasın — isimlendirme ile zaten
  anlaşılsın. Yorumlar sadece **"neden"i** açıklamalı: "Neden bu ELO K-factor
  değeri seçildi", "Neden burada race condition'a karşı lock var" gibi.
- Her `/lib` altındaki dosyanın en üstünde 1-2 satırlık amaç açıklaması olsun.
- Karmaşık iş mantığı fonksiyonlarının (ELO hesaplama, cevap doğrulama)
  üstünde kısa bir örnek input/output yorumu bulunsun.

---

## 8. Realtime / Oyun Mantığı Özel Kuralları

- Round timer, cevap doğrulama, kazanan belirleme **daima server-side**
  (PartyKit/Colyseus tarafında), client asla bu mantığa sahip olmamalı.
- Oda (room) state'i tek bir yerde (`/lib/realtime/roomState.ts` gibi)
  merkezi tanımlansın, birden fazla dosyaya dağılmasın.
- Her oda olayı (tur başladı, cevap geldi, tur bitti) isimlendirilmiş bir
  event tipi olsun, string literal'larla dağınık `if (type === "foo")`
  kontrolleri yerine bir `enum`/union type kullanılsın.

---

## 9. Veritabanı ve Sorgular

- Tüm Prisma sorguları `/lib/db` altında, konularına göre dosyalanmış olsun
  (`players.ts`, `matches.ts`, `users.ts`) — tek bir dev `db.ts` dosyasına
  hepsini doldurma.
- **Veri import/seed script'lerinde yeni kulüp veya oyuncu kaydı oluşturmadan önce fuzzy match / alias ve parmak izi kontrolü yapılır:**
  - **Kulüpler için:** Wikidata veya diğer harici kaynaklardan veri aktarırken doğrudan körü körüne `create` yapılmaz; mevcut `teams` tablosunda isim normalizasyonu, Levenshtein mesafesi ve `aliases` kontrolü yapılarak var olan kayda bağlanır, kopya kulüp oluşması baştan engellenir.
  - **Oyuncular için:** Oyuncu eşleştirmesi tek bir dış kaynağa güvenmez; `normalize(fullName) + birthDate` kesin parmak izi kontrolü yapılır. Kaynak bazlı ayrı ID alanları (`kaggleId`, `wikidataId`) kullanılır; harici kaynaklardan yeni kayıt açılmadan önce mevcut oyuncu bulunup ilgili kaynak ID'si güncellenir.
- Migration'lar açıklayıcı isimlerle (`add_elo_rating_to_users`), asla
  `update1`, `fix` gibi belirsiz isimlerle oluşturulmasın.
- N+1 sorgu riskine dikkat: ilişkili veri çekerken `include`/`select`
  kullan, döngü içinde ayrı ayrı sorgu atma.

---

## 10. Git ve Commit Kuralları

- Conventional Commits formatı: `feat:`, `fix:`, `refactor:`, `chore:`,
  `docs:`. Örn. `feat: add elo calculation for ranked matches`.
- Bir commit tek bir mantıksal değişikliği içersin — "genel güncelleme" gibi
  büyük, karışık commit'ler yapılmasın.
- Yeni bir özellik eklerken, ilgisiz dosyalarda "yeri gelmişken" düzenleme
  yapılmasın; ayrı commit/PR olsun.

---

## 11. Güvenlik Kontrol Listesi (her yeni endpoint/event için)

- [ ] Kullanıcı girdisi Zod ile doğrulandı mı?
- [ ] Client'tan gelen veriye güvenilmedi mi (özellikle skor, süre, kazanan
      bilgisi gibi oyunu etkileyecek alanlar)?
- [ ] Rate limiting gereken bir işlem mi (cevap gönderme, oda oluşturma)?
- [ ] Hassas veri (email, id) client'a gereksiz yere gönderilmiyor mu?

---

## 12. Oyuncu İsmi Girişi — Kural

Kullanıcı oyuncu ismini bir input alanına yazar; yazarken **filtrelenmemiş
(tüm veritabanından, cevabı ima etmeyen) bir dropdown** eşleşen isimleri
önerir, ama kullanıcı dropdown'u hiç kullanmadan da **direkt Enter'layarak**
cevap gönderebilir. Bu bilinçli bir hibrit tasarım: futbolcu isimleri
(özellikle yabancı oyuncular) hafızadan doğru yazmak zor olduğu için saf
"yaz ve umut et" (Gartic.io tarzı) UX burada yetersiz kalır; ama dropdown'un
**asla** "iki takımda da oynamış oyuncular" kümesine göre filtrelenmemesi
gerekir — filtrelenirse cevabı doğrudan ele verir ve oyun anlamsızlaşır.
Dropdown sadece yazım/hafıza asistanıdır, doğruluğu hâlâ server belirler.

**Performans — DB'ye sorgu atma, client-side ara:**
- Arama backend'e her tuş vuruşunda istek atarak yapılmaz. Bunun yerine
  oyuncu isim listesinin hafif bir kopyası (`{id, name}` çiftleri, oyuncu
  detayı yok) oda açılışında/oyun başında tek seferde client'a indirilir.
- Client'ta **Fuse.js** (veya benzeri hafif fuzzy-search kütüphanesi) ile
  bu liste bellekte tutulur, kullanıcı yazdıkça dropdown **ağa hiç
  çıkmadan, anında** filtrelenir. Bu hem network gecikmesini sıfırlar hem
  de DB'ye ekstra yük bindirmez (özellikle Neon/Supabase free tier'ın
  kısıtlı bağlantı limitine karşı önemli).
- Ölçek büyürse (yüz binlerce oyuncu, tüm listeyi client'a yüklemek
  mantıksızlaşırsa): en popüler/sık oynanan oyuncuları (örn. ~20-30 bin)
  client'a önceden yükle, nadir isimler için opsiyonel bir server-side
  fallback (Postgres `pg_trgm` trigram index ile) arkada dursun. Bu
  MVP'de gerekli değil, sadece ileri faz optimizasyonu olarak not edilsin.
- Enter'a basınca (dropdown'dan seçilsin ya da direkt yazılsın fark etmez)
  metin server'a gönderilir; tüm doğrulama (normalize + alias + typo
  tolerance, bkz. Bölüm "Cevap Doğrulama" notları) server-side tek
  noktadan yürür — client-side hiçbir "doğru mu değil mi" ön kontrolü
  yapılmaz.
- **Yanlış cevap sonrası hızlı tekrar deneme:** Server'dan yanlış sonucu
  dönünce input **anında temizlenir ve otomatik fokuslanır**, kullanıcı
  elle silmeden direkt yeni bir deneme yazabilsin/dropdown'dan
  seçebilsin. Round durmaz, rakip hâlâ doğru cevabı yazabiliyor olmalı —
  yanlış deneme sadece o oyuncuyu yeni denemeye yönlendirir, oyunu
  kilitlemez.
- Yanlış cevap için **anlık ve hafif** bir UI geri bildirimi yeterli
  (kısa kırmızı highlight/shake animasyonu gibi); akışı kesen modal/dialog
  kullanılmaz.

## 13. Proje Boyunca Dikkat Edilecekler (Genel Kontrol Listesi)

- **Cevap doğrulama:** İsim normalize et (lowercase + Türkçe/aksan
  karakter temizleme), alias/takma ad tablosu tut, küçük yazım hatalarına
  (Levenshtein ile 1-2 karakter) tolerans tanı.
- **Adillik:** Round başlangıcını server timestamp ile senkronize et,
  ping/gecikme farkını client-side telafi et.
- **Reconnect:** Kısa kopmalarda (5-10 sn) oyuncuya yeniden bağlanma hakkı
  tanı, oda hemen kapatılmasın; uzun kopmada rakibe otomatik galibiyet ver.
- **Hile önleme:** Aşırı hızlı (örn. <300ms) cevapları şüpheli işaretle;
  çoklu hesap/IP kontrolü ileri fazda planlanmalı; kullanıcı adı için
  kelime filtresi olsun.
- **Veri lisansı:** Wikidata/Wikipedia kaynaklı veri kullanıldığında
  CC-BY-SA atfı bir "about/kaynaklar" sayfasında yer alsın.
- **KVKK/gizlilik:** Email/Google/Discord login kullanılıyorsa basit bir
  gizlilik politikası ve açık rıza metni büyümeden önce eklensin.
- **Performans:** Oyuncu/takım verisi her round'da DB'den değil, oda
  açılışında belleğe yüklenip oradan kullanılsın.
- **Monitoring:** Sentry (veya benzeri ücretsiz bir hata izleme aracı)
  baştan bağlansın; `missing_answers_log` tablosu düzenli incelensin —
  hem veri eksiklerini hem olası hileleri gösterir.
- **UX:** "Rakip aranıyor", "rakip seçim yapıyor" gibi bekleme durumları
  için her zaman görsel geri bildirim olsun; tasarım mobil öncelikli
  yapılsın.

## 14. Ajan Bu Projede Kod Yazarken Ek Kurallar

- Yeni bir dosya oluşturmadan önce, benzer bir işlevin zaten var olup
  olmadığını kontrol et — tekrar yazma.
- Bir özelliği uygularken ilgili tüm katmanları (UI + iş mantığı + DB) aynı
  görevde tutarlı şekilde güncelle, yarım bırakma.
- Büyük bir refactor/yeni özellik öncesi, değişecek dosyaları kısaca listele
  ve nedenini belirt, sonra uygula.
- Test yoksa bile, kritik iş mantığı fonksiyonları (ELO hesaplama, cevap
  doğrulama) saf ve test edilebilir yazılsın — ileride test eklemek kolay
  olsun.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
