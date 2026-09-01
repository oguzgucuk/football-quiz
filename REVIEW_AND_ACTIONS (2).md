# 🔍 Teknik Gözden Geçirme ve Eylem Listesi

> Bu doküman, `TECHNICAL_OVERVIEW.md`'de anlatılan mevcut implementasyonun
> incelenmesi sonucu hazırlanmıştır. Antigravity ajanına verilmek üzere
> yazılmıştır — her madde, ajanın doğrudan uygulayabileceği netlikte
> tanımlanmıştır. Öncelik sırasına göre gruplandırılmıştır.

---

## 🔴 Öncelik 1 — Şimdi Düzeltilmeli (Çekirdek Oyun Döngüsünü Etkiliyor)

### 1.1 Matchmaking'deki ELO Referansını Düzelt

**Sorun:** `TECHNICAL_OVERVIEW.md` Bölüm 4'te matchmaking kuyruğunun "FIFO +
ELO yakınlığı mantığıyla" eşleştirme yaptığı yazıyor, ancak ELO sistemi
henüz implemente edilmemiş (Bölüm 6'da gelecek adım olarak listelenmiş).
Bu bir dokümantasyon hatası mı yoksa kodda gerçekten var olmayan bir
mantığa referans mı veriyor, netleştirilmeli.

**Yapılacak:**
- Matchmaking kodunu incele: şu an gerçekte hangi mantıkla eşleştirme
  yapılıyor (saf FIFO mu, yoksa sabit/varsayılan bir ELO değeriyle mi)?
- ELO sistemi henüz yokken matchmaking'i **saf FIFO** olarak çalıştır,
  dokümandaki yanıltıcı ifadeyi düzelt.
- ELO sistemi eklendiğinde (bkz. Öncelik 3) matchmaking mantığı buna göre
  güncellenecek — şimdilik bu bağımlılığı net şekilde işaretle.

### 1.2 Round Timeout Sonrası Davranışı Gözden Geçir

**Mevcut durum:** 15 saniyelik cevap süresi dolunca puansız bir sonraki
tura geçiliyor — bu makul bir varsayılan, ama şu ek durumlar test edilip
netleştirilmeli:

- [ ] Süre dolduğunda **doğru cevap oyunculara gösteriliyor mu?**
      (Gösterilmesi öneriliyor — kullanıcı "peki doğru cevap neydi"
      diye merak eder, göstermemek can sıkıcı bir deneyim yaratır.)
- [ ] Round'lar arası geçişte kısa bir "sonuç ekranı" (round kazananı/
      berabere, doğru cevap) var mı? Yoksa direkt bir sonraki takım
      seçimine mi geçiliyor? Kullanıcı deneyimi için bir ara ekran (2-3
      saniyelik) önerilir.
- [ ] Timeout'lu round'lar `match_rounds` tablosuna nasıl kaydediliyor —
      `winner_user_id` null mu yazılıyor? İleri fazda istatistik
      (örn. "en çok timeout olan takım çiftleri") çıkarmak istersen bu
      alanın tutarlı doldurulması önemli.

### 1.3 Yanlış Cevap Sonrası Input Davranışını Doğrula

AGENTS.md Bölüm 12'de tanımlanan kural: yanlış cevap sonrası input
**anında temizlenmeli ve otomatik fokuslanmalı**, kullanıcı elle silmeden
direkt yeni deneme yazabilmeli. Bu davranış implement edildi mi, edilmediyse
şimdi eklensin — bu, oyunun "hız hissi" için kritik bir detay ve sonradan
gözden kaçması kolay bir şey.

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

## 🔴 Öncelik 1 (Ek) — Egemen Korkmaz Olayından Çıkan Sistemsel Düzeltmeler

> Bu bölüm, "Egemen Korkmaz (Fenerbahçe — Trabzonspor)" olay raporunun
> incelenmesi sonucu eklenmiştir. Olayın kendisi doğru teşhis edilip
> çözülmüş, ancak çözüm sürecinde **tek seferlik/elle yapılan bazı
> müdahaleler**, daha önce kurduğumuz otomatik sistemlerin prensiplerini
> ihlal ediyor. Bunlar düzeltilmeden bu tür "yama" işlemleri tekrarlanırsa
> sistem zamanla tutarsız ve bakımı imkansız hale gelir.

### 1.4 Popülerlik Puanının Elle Set Edilmesi — Yasakla

**Sorun:** Olay çözümünde Egemen Korkmaz'ın popülerlik puanı "78/100" olarak
**elle güncellenmiş**. Bu, `POPULARITY_RANKING.md`'de kurduğumuz "hiçbir
oyuncu/takım için elle puan girilmez, her şey formülden otomatik türetilir"
prensibini ihlal ediyor. Bir kişi için elle düzeltme yapılırsa, bu zamanla
onlarca kişi için tekrarlanan, tutarsız ve sürdürülemez bir alışkanlığa
dönüşür — tam da kaçınmaya çalıştığımız durum.

**Yapılacak:**
- `popularityScore` alanına asla elle sayı yazılmasın.
- Bir oyuncunun kariyer verisi (transfer geçmişi, piyasa değeri vb.)
  güncellendiğinde, popülerlik puanı **her zaman
  `calculatePlayerPopularity()` fonksiyonu yeniden çağrılarak** otomatik
  hesaplansın.
- Mevcut "78" değeri, formül tekrar çalıştırılarak doğrulansın/düzeltilsin.

### 1.5 Kaggle Veri Kapsamı Konusunda Çelişki — Netleştir

**Sorun:** Daha önce Kaggle veri setinin **2012'den itibaren** kapsadığı
konuşulmuştu. Bu olay raporu ise setin *"ağırlıklı olarak 2018–2024
arası"* olduğunu söylüyor — bu iki ifade tutarsız. Gerçek kapsam net
değil, ve bu bilinmeden diğer eksik dönemler tahmin edilemiyor.

**Yapılacak:**
- `player_team_history` tablosundaki kayıtların **yıllara göre dağılımını**
  (histogram) çıkaran bir analiz script'i yazılsın (`season_start` alanına
  göre `GROUP BY` ile kaç kayıt olduğu görülsün).
- Bu analiz, hangi dönemlerin/hangi liglerin sistematik olarak zayıf
  olduğunu **önceden** ortaya çıkarır — tek tek kullanıcı şikayeti
  geldikçe reaktif yama yapmak yerine, proaktif olarak hangi dönem/lig
  için ek Wikidata çekimi gerektiğini planlamayı sağlar.

### 1.6 Kulüp Dedup Script'i Şehir Eklerini Kaçırıyor — Güncelle ve Tekrar Çalıştır

**Sorun:** "Fenerbahçe" / "Fenerbahçe Istanbul" mükerrer kaydı, daha önce
yazılan `find-duplicate-teams.ts` script'inden kaçmış. Script'in normalize
fonksiyonu muhtemelen sadece kulüp eklerini (FC, SK, CF, AS, AC) temizliyor,
şehir isimlerini (İstanbul, Madrid, München gibi yaygın ekler) temizlemiyor.

**Yapılacak:**
- `normalize()` fonksiyonuna yaygın şehir eklerini de temizleyecek bir
  adım eklensin.
- Dedup script'i **tüm veritabanı üzerinde tekrar** çalıştırılsın — bu tek
  kulüple sınırlı bir düzeltme değil, muhtemelen başka gizli mükerrer
  kayıtlar da var, sadece henüz kullanıcı şikayeti gelmedi.
- Bulunan tüm yeni çakışmalar, önceki "yüksek güven / düşük güven" ayrımına
  göre işlensin (bkz. önceki dedup script mantığı).

### 1.7 Süreç: Reaktiften Proaktife Geç

**Sorun:** Şu anki akış "kullanıcı yanlış cevap alır → tek tek araştırılır
→ elle düzeltilir" şeklinde. MVP'de kabul edilebilir ama ölçeklenmez.

**Yapılacak:**
- `missing_answers_log` **tek tek değil, haftalık toplu** olarak incelensin.
- En çok tekrar eden eksik isimler önceliklendirilip **toplu bir Wikidata
  düzeltme script'i** ile işlensin (tek tek elle arama yapılmasın).
- Her toplu düzeltme sonrası etkilenen oyuncu/takımların popülerlik
  puanları **otomatik olarak yeniden hesaplansın** (bkz. 1.4).

### 1.8 Wikidata Sayfalama Sorunu ve Wikipedia Infobox Fallback

**Sorun:** İbrahimoviç-Inter (2006-2009) ve Nihat Kahveci gibi, gerçekte
iyi belgelenmiş transferler bile eksik çıkıyor. Bu rastgele bir veri
boşluğu değil, muhtemelen **sistematik bir script sorunu** işaret ediyor:

- **En olası sebep — sayfalama eksikliği:** SPARQL sorgusu `LIMIT`'siz ya
  da tek seferlik çalıştırılmışsa, Wikidata'nın 60 saniyelik timeout'una
  takılıp **sessizce yarım sonuç dönmüş** olabilir. Script bunu "bitti"
  sanıp devam etmiş olabilir.
- **İkinci ihtimal — zaman filtresi hatası:** Script'in `?end` tarihi olan
  (yani kariyeri kapanmış/geçmiş) kayıtları yanlışlıkla filtrelemiş
  olması mümkün.

**Yapılacak:**
1. SPARQL sorgusuna **sayfalama (`LIMIT 5000 OFFSET N`)** eklensin, script
   sonuç sayısı 5000'in altına düşene kadar `OFFSET`'i artırarak döngüde
   çalışsın.
2. Zaman filtresi mantığı kontrol edilsin — `end` tarihi olan (kariyeri
   bitmiş) kayıtların da alındığından emin olunsun.
3. Import **sıfırdan tekrar çalıştırılsın** (sayfalama düzeltmesiyle) —
   bu tek başına eksiklerin büyük kısmını kapatabilir.
4. Kalan boşlukları tespit etmek için şu sorgu çalıştırılsın (rastgele
   değil, önem sırasına göre düzeltme yapılabilsin diye popülerliğe göre
   sıralı):
   ```sql
   SELECT p.id, p.full_name, COUNT(h.id) as kayit_sayisi
   FROM players p
   LEFT JOIN player_team_history h ON h.player_id = p.id
   GROUP BY p.id, p.full_name
   HAVING COUNT(h.id) <= 1
   ORDER BY p.popularity_score DESC;
   ```
5. Bu sorgudan çıkan "yüksek popülerlik + düşük kayıt sayısı" grubu için,
   **sadece bu şüpheli gruba özel** bir Wikipedia infobox fallback
   script'i yazılsın: Wikipedia'nın `parse` API'si üzerinden ilgili
   sayfanın "Senior career" infobox tablosu çekilip parse edilsin. Bu
   ağır bir işlem olduğu için **tüm oyuncu veritabanına değil, sadece bu
   şüpheli gruba** uygulanmalı.
6. Bu script sonrası etkilenen oyuncuların popülerlik puanları otomatik
   yeniden hesaplansın (bkz. 1.4 — elle sayı girilmez).

---

## Antigravity'ye Verilecek Örnek Görev Promptu

> "AGENTS.md dosyasını oku. Bu dokümandaki (`REVIEW_AND_ACTIONS.md`)
> Öncelik 1 maddelerini sırayla incele: (1) matchmaking kodunda gerçekten
> ELO kullanılıyor mu yoksa saf FIFO mu, kontrol et ve dokümantasyonu
> koda göre düzelt; (2) round timeout sonrası doğru cevabın gösterilip
> gösterilmediğini kontrol et, gösterilmiyorsa ekle; (3) yanlış cevap
> sonrası input'un otomatik temizlenip fokuslandığını doğrula, değilse
> ekle; (4) `popularityScore` alanına elle yazılmış herhangi bir değer
> olup olmadığını tarat, varsa formülle yeniden hesapla ve kod tabanında
> elle atama yapan yer varsa kaldır; (5) `player_team_history` tablosunun
> yıllara göre dağılım analizini çıkar (season_start'a göre GROUP BY);
> (6) kulüp dedup script'ini şehir eki temizleme desteğiyle güncelleyip
> tüm veritabanı üzerinde tekrar çalıştır; (7) Wikidata import script'ine
> sayfalama (LIMIT/OFFSET döngüsü) ekle, zaman filtresi mantığını kontrol
> et, sıfırdan tekrar çalıştır, sonra düşük-kayıt/yüksek-popülerlik
> grubunu tespit edip Wikipedia infobox fallback'i sadece bu gruba
> uygula. Her madde için ne bulduğunu ve ne değiştirdiğini özetle."
