# Futbol Quiz Platformu — Gelecek Planları ve Tasarım Yol Haritası

Bu doküman, platformun MVP aşamasından tam kapsamlı bir futbol oyun merkezine (Arcade Hub) dönüştürülmesi için planlanan arayüz, oyun modları ve geliştirme aşamalarını içerir.

---

## 1. Tasarım Dili ve Arayüz Konsepti

### 1.1. Renk Paleti ve Tema
* **Temel Atmosfer:** Gece stadyumu koyuluğu ve neon saha yeşili kontrastı.
* **Ana Zemin:** Koyu antrasit / gece mavisi tonları (`#0A0F18`, `#111A28`).
* **Vurgu Rengi:** Elektrikli çim yeşili (`#00E676`, `#10B981`) — butonlar, sayaçlar, aktif seçimler ve galibiyet anları için.
* **Metin ve Çizgiler:** Tebeşir beyazı (`#FFFFFF`, `#F1F5F9`) — saha çizgilerini andıran temiz kart sınırları.
* **Kartlar:** Hafif buzlu cam (Glassmorphism) efektli koyu paneller.

### 1.2. Maskot ve Logo
* **Konsept:** Kalın çerçeveli siyah gözlük takmış, zeki sırıtan futbol topu karakteri ("Futbol Geeki / Scout").
* **Kullanım:** Marka logosu, favicon, bekleme ekranları ve oyun içi avatar/tepki görselleri.

---

## 2. Sayfa Mimarisi (League of Legends Client Tarzı)

Uygulama, klasik bir web sitesi gibi dikey kaydırma yerine, tek ekranda toplanmış modüler bir oyun istemcisi düzeninde çalışır.

### 2.1. Üst Kontrol Çubuğu (Top Navigation)
* **Sol Taraf:** Maskot logo + Belirgin ve parlayan "OYNA" butonu.
* **Orta Taraf:** Ana mod sekmeleri (Ana Sayfa, Arenalar, Transfer Pazarı, Sıralama/Liderlik).
* **Sağ Taraf:** Kullanıcı mini bilgisi (Seviye, Bakiye/Coin), ses açma/kapama ve ayarlar.

### 2.2. Orta Alan (Dinamik Oyun Sahnesi)
* Aktif olan oyun modu veya lobi burada tam ekran olarak yer alır.
* Oyun modu seçim kartları (1v1 Düello, Açık Arttırma, Ülke-Takım, Logo Quiz).
* Canlı maç akışları, günün özel eşleşmeleri veya aktif oyun ekranı.

### 2.3. Sağ Panel (Sosyal ve Profil Alanı)
* **Profil Özeti:** Avatar, ELO puanı, rütbe unvanı (Amatör, Scout, Taktisyen, Efsane), galibiyet serisi.
* **Parti / Lobi Alanı:** Birlikte oynadığın arkadaşların ve hazır durumları.
* **Arkadaş Listesi:** Çevrimiçi/çevrimdışı arkadaşlar, mevcut durumları ("Lobide", "Oyunda") ve tek tıkla "Davet Gönder" butonu.
* **Haftalık Liderlik:** En yüksek puanlı ilk 5 oyuncu.

---

## 3. Planlanan Oyun Modları

### 3.1. Ortak Futbolcu Düellosu (Mevcut 1v1 Modu)
* İki oyuncu bağımsız olarak birer kulüp seçer (veya rastgele gelir).
* Her iki kulüpte de oynamış ortak oyuncuyu ilk yazan turu kazanır.
* Hızlı eşleşme (Ranked) ve Arkadaşla Oyna seçenekleri.

### 3.2. Açık Arttırma ve Kadro Kurma (Auction Draft + Simülasyon)
* **Oyuncu Sayısı:** 4 ile 8 kişi arasında canlı çok oyunculu oda.
* **Bütçe:** Her oyuncuya eşit sanal para verilir (örn. 100$).
* **Müzayede:** 
  * Sırayla rastgele futbolcu kartları tahtaya gelir (OVR puanı ve mevkisi ile birlikte).
  * İlk oyuncu 1$ ile açar, 10 saniyelik sayaç içinde oyuncular pey sürer.
  * En yüksek teklifi veren oyuncuyu kadrosuna katar.
* **Kadro:** 11 pozisyonu (1 Kaleci, 4 Defans, 3 Orta Saha, 3 Forvet) tamamlayan kadrosunu kilitler.
* **Maç Simülasyonu:**
  * Kadrolar oluştuktan sonra turnuva/lig usulü mini simülasyon başlar.
  * Hücum Gücü, Savunma Gücü ve Kimya (aynı lig/ülke uyumu) değerlerine göre maçlar hesaplanır.
  * Canlı spiker metinleri ve mini 2D saha üzerinde maçların sonucu izlenir, şampiyon belirlenir.

### 3.3. Ülke x Takım Modu (Grid / Tic-Tac-Toe)
* Bir ülke ve bir takım eşleştirilir (Örn: *Brezilya + Real Madrid* veya *Fransa + Arsenal*).
* Oyuncular o ülkeden olup o takımda forma giymiş futbolcuları bulmaya çalışır.
* Tek oyunculu süreye karşı ya da 1v1 sıra tabanlı oynanabilir.

### 3.4. Logo Bilmece
* Ekrana piksellenmiş veya silüet haline getirilmiş kulüp logosu gelir.
* Süre aktıkça logo yavaş yavaş netleşir; doğru kulübü en erken yazan puanı alır.

---

## 4. Gerekli Veri ve Altyapı İhtiyaçları

1. **Oyuncu Overall (OVR) ve Mevki Verisi:**
   * Açık arttırma ve simülasyon modunun çalışabilmesi için futbolculara 1-99 arası güç puanı ve mevkileri (GK, CB, CM, ST vb.) atanmalıdır.
   * Bu veriler EA FC / FIFA açık kaynak veri setlerinden otomatik olarak eşleştirilip veritabanına aktarılacaktır.

2. **Gerçek Zamanlı Müzayede Motoru:**
   * PartyKit üzerinde açık arttırma odası mantığı (sıra, sayaç, teklif artırma, bütçe kontrolü).

3. **İstatistiksel Simülasyon Motoru:**
   * İki kadronun OVR ve pozisyon puanlarını karşılaştırıp gol dakikalarını, kartları ve maç sonucunu üreten hafif matematiksel algoritma.

---

## 5. Uygulama Aşamaları

* **Faz 1 — Arayüz İskeleti:** LoL Client yapısında üst navigasyon, sağ sosyal/profil paneli ve koyu stadyum temasının kurulması.
* **Faz 2 — Mevcut Oyunun Entegrasyonu:** 1v1 ortak oyuncu modunun yeni lobi ve arena tasarımına taşınması.
* **Faz 3 — Veri Zenginleştirme:** Futbolculara OVR puanı, mevki ve kart istatistiklerinin eklenmesi.
* **Faz 4 — Açık Arttırma & Simülasyon:** Çok oyunculu müzayede odasının ve maç simülasyon ekranının kodlanması.
* **Faz 5 — Ek Modlar:** Ülke-Takım ve Logo Quiz modlarının eklenmesi.
