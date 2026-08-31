# 🔍 Teknik Gözden Geçirme ve Eylem Listesi

> Bu doküman, `TECHNICAL_OVERVIEW.md`'de anlatılan mevcut implementasyonun
> incelenmesi sonucu hazırlanmıştır. Antigravity ajanına verilmek üzere
> yazılmıştır — her madde, ajanın doğrudan uygulayabileceği netlikte
> tanımlanmıştır. Öncelik sırasına göre gruplandırılmıştır.

---

## 🔴 Öncelik 1 — Tamamlandı ✅

### 1.1 Matchmaking'deki ELO Referansını Düzelt ✅
- **Yapıldı:** Matchmaking'in şu an **saf FIFO** çalıştığı doğrulandı. `TECHNICAL_OVERVIEW.md` dosyasındaki yanıltıcı ifade güncellendi ve Faz 2 ELO entegrasyonu ile ELO Bracket eşleştirmesine geçeceği belirtildi.

### 1.2 Round Timeout Sonrası En Genç 3-5 Doğru Cevap Örneği Gösterimi ✅
- **Yapıldı:** `/api/teams/common-players` endpoint'i ve `getCommonPlayersByTeams` DB fonksiyonu oluşturuldu.
- **Kural:** İki takımın ortak oyuncuları doğum tarihine göre en gençten en yaşlıya sıralanarak (`birthDate desc`) en fazla 5 adet çekiliyor (3'ten az varsa olduğu kadar).
- `RoundResultModal.tsx` güncellendi; süre dolduğunda veya pas geçildiğinde *"Oynayabilecek Ortak Futbolcular (En Genç)"* başlığıyla çipler halinde listeleniyor. Biri doğru bildiğinde ise *"Diğer Ortak Futbolcular"* olarak gösteriliyor.

### 1.3 Yanlış Cevap Sonrası Input Davranışı ✅
- **Doğrulandı:** `PlayerAnswerInput.tsx` içinde yanlış cevap verildiğinde input anında temizleniyor (`setInputValue("")`), kırmızı sarsıntı animasyonu oynatılıyor ve `inputRef.current?.focus()` ile otomatik odaklanma yapılıyor.

---

## 🟠 Öncelik 2 — MVP'yi Gerçek Kullanıcıya Açmadan Önce Şart

### 2.1 Reconnect / Bağlantı Kopması Yönetimi

Şu an dokümanda hiç bahsedilmiyor. Gerçek kullanıcılarla test ederken en
sık karşılaşılacak sorunlardan biri bu olacak (mobil ağ, sekme kapatma,
bilgisayar uykuya geçmesi vb.).

**Yapılacak:**
- Oyuncu bağlantıyı kaybettiğinde oda **hemen kapanmasın**, kısa bir süre
  (örn. 10-15 saniye) bekleyip reconnect fırsatı tanınsın.
- Bu süre içinde reconnect olursa oyuncu kaldığı round'a, mevcut state
  ile geri dönebilsin.
- Süre dolarsa rakibe otomatik galibiyet verilsin, oda temiz şekilde
  kapatılsın.
- Diğer oyuncuya "rakip bağlantısı koptu, bekleniyor..." gibi bir UI
  geri bildirimi gösterilsin — sessiz bir bekleme kullanıcıyı şaşırtır.

### 2.2 Rate Limiting

Şu an dokümanda hiç bahsedilmiyor. Cevap gönderme endpoint'i/event'i için
rate limit eklenmeli — bir istemcinin saniyede onlarca cevap denemesi
(bot/otomasyon şüphesi) engellenmeli.

**Yapılacak:**
- Cevap gönderme (`ANSWER_SUBMIT` gibi) event'ine kullanıcı/bağlantı
  bazlı bir rate limit ekle (örn. saniyede en fazla 3-5 deneme).
- Çok kısa sürede (örn. <300ms) art arda gelen cevapları logla — ileride
  hile tespiti için bu veri işe yarayacak, şimdiden loglanmaya başlansın.

### 2.3 Oyuncu Arama Girişi — Hibrit Dropdown (Fuse.js)

AGENTS.md Bölüm 12'de tanımlanan tasarım: kullanıcı serbest yazabilir,
aynı zamanda filtrelenmemiş (cevabı ele vermeyen) bir dropdown öneri
sunmalı, arama client-side (Fuse.js ile, oyuncu listesi önceden client'a
yüklenmiş halde) yapılmalı — backend'e sorgu atılmamalı.

**Yapılacak:**
- Bu özellik implement edildi mi? Dokümanda geçmiyor, doğrulama
  motorunda (Bölüm 3) sadece backend tarafı anlatılmış.
- Edilmediyse, oda açılışında `{id, name}` formatında hafif oyuncu
  listesinin client'a gönderilip gönderilmediği kontrol edilsin.

### 2.4 `missing_answers_log` Kullanımı

Kullanıcı bir isim yazıp sistemde bulunamadığında bu, planladığımız
`missing_answers_log` tablosuna yazılıyor mu? Bu mekanizma hem eksik veri
tespiti hem de olası hile/spam tespiti için önemli, implement edildiğinden
emin olunmalı.

---

## 🟡 Öncelik 3 — Sıradaki Büyük Özellik (Faz 2)

### 3.1 ELO Sistemi İmplementasyonu

Dokümanda formül zaten doğru tanımlanmış:
$$R_{yeni} = R_{eski} + K \times (S - E)$$

**Netleştirilmesi gerekenler:**
- $K=32$ sabit mi kalacak, yoksa oyuncu deneyim seviyesine göre
  (örn. ilk 20 maçta $K=40$, sonra $K=20$) değişken mi olacak? Değişken
  K-factor, yeni oyuncuların rank'inin daha hızlı oturmasını sağlar,
  klasik chess.com/LoL yaklaşımı budur.
- Ranksız maçlar (`ranked: false`) ELO hesabına hiç girmeyecek —
  bu ayrım şemada zaten var, uygulama mantığında da netleştirilsin.
- ELO implement edilince **Öncelik 1.1'deki matchmaking mantığı** gerçek
  ELO yakınlığına göre güncellenmeli.

### 3.2 Round Sonu / Maç Sonu Ekranlarının UX'i

Maç bittiğinde (5 tur sonunda) kullanıcıya ne gösteriliyor — sadece
kazanan/kaybeden mi, yoksa maç özeti (her round'un sonucu, kaç saniyede
cevap verildi vb.) de var mı? Bu, "tekrar oyna" motivasyonu için önemli
bir detay, Faz 2'de ELO ile birlikte ele alınabilir.

---

## 🟢 Öncelik 4 — İleri Faz / Cila Katmanı

Bunlar MVP'yi engellemez, ama proje olgunlaştıkça sırayla ele alınmalı:

- **Monitoring:** Sentry (veya benzeri ücretsiz bir hata izleme aracı)
  henüz bağlı değilse eklenmeli — özellikle realtime tarafında sessizce
  kopan bağlantıları production'da fark etmek zor olur.
- **Çoklu hesap / hile tespiti:** Aynı IP'den gelen eşleşmelerin
  işaretlenmesi, aşırı hızlı cevapların (Öncelik 2.2'de loglanan veri)
  periyodik incelenmesi.
- **Ses/haptic feedback:** Doğru cevap, tur bitişi, maç sonu için Web
  Audio API entegrasyonu (dokümanda zaten Faz 3 olarak planlanmış, sırası
  doğru).
- **Kullanıcı adı kelime filtresi:** Rahatsız edici kullanıcı adlarını
  engellemek için basit bir filtre.
- **Veri lisansı atfı:** Wikidata/Wikipedia kaynaklı veri için bir
  "kaynaklar" sayfasında CC-BY-SA atfı.
- **KVKK/gizlilik politikası:** Auth zaten eklendiği için (email/login
  varsa) bu artık ötelenemez bir öncelik haline geliyor — Faz 2'nin
  başında, ELO ile birlikte ele alınması önerilir.

---

## Antigravity'ye Verilecek Örnek Görev Promptu

> "AGENTS.md dosyasını oku. Bu dokümandaki (`REVIEW_AND_ACTIONS.md`)
> Öncelik 1 maddelerini sırayla incele: (1) matchmaking kodunda gerçekten
> ELO kullanılıyor mu yoksa saf FIFO mu, kontrol et ve dokümantasyonu
> koda göre düzelt; (2) round timeout sonrası doğru cevabın gösterilip
> gösterilmediğini kontrol et, gösterilmiyorsa ekle; (3) yanlış cevap
> sonrası input'un otomatik temizlenip fokuslandığını doğrula, değilse
> ekle. Her madde için ne bulduğunu ve ne değiştirdiğini özetle."
