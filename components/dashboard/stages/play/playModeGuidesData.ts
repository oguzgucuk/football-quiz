/**
 * Oyun modları kılavuz verileri (Play Mode Guides Data).
 * Her modun amacı, adım adım oynanışı, taktik ipuçları ve SEO terimleri.
 */

export interface GuideInfo {
  title: string;
  subtitle: string;
  goal: string;
  steps: string[];
  newFeatures?: string[];
  tip: string;
  keywords: string[];
}

export const MODE_GUIDES: Record<string, GuideInfo> = {
  common_player: {
    title: "Ortak Oyuncu Modu (1v1)",
    subtitle: "İki Kulüp Arasındaki Ortak Futbolcuyu İlk Sen Bul",
    goal: "Ekranda beliren 2 farklı kulüpte (örn: Real Madrid & Inter, Arsenal & Juventus) kariyerinde resmi maça çıkmış ortak bir futbolcuyu rakibinden önce yazarak puan kazanmak.",
    steps: [
      "Tur başladığında iki kulübün resmi armaları ve isimleri ekranda canlanır.",
      "Input alanına aklına gelen futbolcunun ismini yazmaya başla (Hafif hafıza asistanı arama önerileri sunar).",
      "Doğru futbolcuyu ilk yazıp Enter'a basan oyuncu turu kapar; yanlış cevapta input anında temizlenir ve yeni deneme hakkı verilir.",
      "Kiralık ve altyapı dahil kariyerinin herhangi bir döneminde her iki kulüpte oynamış tüm oyuncular geçerlidir.",
    ],
    tip: "Yalnızca süper yıldızlara odaklanmayın; altyapıda veya kiralık forma giymiş genç yetenekler ve unutulmuş transferler maçı kazandırır!",
    keywords: [
      "Ortak Futbolcu Bulma",
      "Futbol Transfer Hafızası",
      "İki Takımda Oynamış Futbolcular",
      "1v1 Futbol Quiz Düellosu",
      "Canlı ELO Sıralaması",
    ],
  },
  grid: {
    title: "Millet - Kulüp Modu",
    subtitle: "Bir Oyuncu Ülke, Diğeri Kulüp Seçer",
    goal: "Her tur sırayla bir oyuncunun belirlediği milletten olup diğer oyuncunun seçtiği kulüpte forma giymiş futbolcuyu ilk yazan oyuncu olmak.",
    steps: [
      "İlk turda kimin milleti, kimin kulübü seçeceğine sistem kura ile karar verir.",
      "Her tur seçim rolleri sırayla değişir (1. tur sen millet rakip kulüp, 2. tur sen kulüp rakip millet).",
      "Seçilen milletten olup o kulüpte oynamış futbolcuyu Enter'layarak ilk yazan oyuncu turu kazanır.",
      "5 tur üzerinden oynanır; en çok puanı toplayan oyuncu maçı galibiyetle tamamlar.",
    ],
    tip: "Rakibin seçtiği zorlu bir millete (örn: Brezilya veya Hollanda) karşı o ülkeden bol transfer yapmış kulüpleri seçerek avantaj yakalayın.",
    keywords: [
      "Millet Kulüp Futbol Quiz",
      "Ülke ve Takım Eşleştirme",
      "Futbolcu Bilgi Yarışması",
      "Brezilyalı Futbolcular",
      "Taktiksel Kura Modu",
    ],
  },
  auction: {
    title: "Müzayede Ligi & Simülasyon",
    subtitle: "Canlı Açık Artırma, Taktik Tahtası & 90 Dk Lig Simülasyonu",
    goal: "100M€ bütçeyle dünya yıldızlarını açık artırmada toplayıp 11'ini kurmak; taktiksel koridor savaşlarıyla 90 dakikalık lig simülasyonunda şampiyon olmak.",
    steps: [
      "Canlı Açık Artırma: Transfer pazarına çıkan yıldızlara bütçenizi yöneterek pey sürün; en yüksek teklifi veren oyuncuyu kadrosuna katar.",
      "Taktik Tahtası & Diziliş: 11'inizi sahaya dizin. 4 boyutlu taktikler (Tempo, Oyun Kurma, Pres, Hücum Yönü) belirleyin.",
      "3 Koridorlu Maç Simülasyonu: Sol kanat, merkez ve sağ koridorda güçler çarpışır; 30 saniyelik canlı 90 dakika maçı izleyin.",
      "Lig Şampiyonluğu: Herkesin birbiriyle oynadığı fikstür sonunda liderlik tablosunun zirvesindeki oyuncu şampiyon olur.",
    ],
    newFeatures: [
      "Kaleyi Görünce Vur: Hücumcular ceza sahasına girmeden %70 ihtimalle uzaktan şut deneyip savunma bloğunu delmeye çalışır.",
      "Anti-Desync (F5 Koruması): Canlı maçta sayfa yenilense bile maç sıfırlanmaz, anlık dakikadan kesintisiz devam eder.",
      "Canlı Spiker & Krallık: Dakika dakika pozisyon anlatımları, canlı Gol ve Asist krallığı yarışları.",
    ],
    tip: "Tüm paranızı tek bir forvete yatırmayın! Kaleci ve savunma mevkileriniz zayıf kalırsa koridor savaşlarında ağır yenilgi alabilirsiniz.",
    keywords: [
      "Futbolcu Müzayedesi",
      "Açık Artırma Kadro Kurma",
      "Canlı Maç Simülasyonu",
      "Kaleyi Görünce Vur",
      "Futbol Taktik Tahtası",
      "Müzayede Ligi",
    ],
  },
  training: {
    title: "Futbolcu Gezgini & Antrenman",
    subtitle: "18.000+ Futbolcu Kütüphanesini İncele ve Pratik Yap",
    goal: "Dünya futbolunun 18.000'den fazla yıldızının prime reytinglerini, oynadığı tüm takımları ve transfer geçmişlerini inceleyerek hafızanızı güçlendirmek.",
    steps: [
      "Futbolcular sekmesine geçerek devasa transfer kütüphanesine adım atın.",
      "Arama kutusuna oyuncu veya kulüp adı yazarak filtreleme yapın.",
      "Kariyer sekmesinde bir futbolcunun forma giydiği tüm takımları kronolojik olarak inceleyin.",
      "Maçlara çıkmadan önce iki takımda da forma giymiş gizli yıldızları keşfedin!",
    ],
    tip: "Özellikle Avrupa'nın 5 büyük liginde dolaşmış gezgin oyuncuları (örn: Zlatan, Anelka, Morata) incelemek maçlarda büyük hız kazandırır.",
    keywords: [
      "Futbolcu Arama Motoru",
      "Futbol Transfer Geçmişi",
      "Hangi Kulüplerde Oynadı",
      "Futbolcu Prime Reytingleri",
      "Futbolcu Veritabanı",
    ],
  },
};
