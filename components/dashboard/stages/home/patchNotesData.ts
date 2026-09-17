/**
 * Yama Notları (Patch Notes) Veri Kaynağı.
 * Oyuncuların okuyabileceği, şeffaf ve anlaşılır başlıklarla sürüm güncellemeleri.
 */

export interface PatchNoteCategory {
  title: string;
  badge: string;
  icon: string; // Emoji
  summary: string;
  changes: string[];
}

export interface PatchRelease {
  version: string;
  codeName: string;
  releaseDate: string;
  isLatest: boolean;
  highlightSummary: string;
  categories: PatchNoteCategory[];
}

export const PATCH_RELEASES: PatchRelease[] = [
  {
    version: "Yama 0.1",
    codeName: "Büyük Lansman & Taktiksel Simülasyon Devrimi",
    releaseDate: "17 Eylül 2026",
    isLatest: true,
    highlightSummary:
      "Müzayede Ligi canlı maç simülasyonu, 3 koridorlu taktik motoru, Kaleyi Görünce Vur mekaniği, F5 yenileme koruması ve dengelenmiş mevkisel güçlerle AlimBALL ilk büyük güncellemesine kavuştu!",
    categories: [
      {
        title: "Müzayede Ligi & Eş Zamanlı 90 Dakika Simülasyonu",
        badge: "Yeni Oyun Modu",
        icon: "🏟️",
        summary:
          "Açık artırmada toplanan 11 kişilik kadrolar artık otomatik lig fikstürü ile birbirleriyle eşleşiyor ve kıyasıya bir lig şampiyonluğu mücadelesi veriyor.",
        changes: [
          "Lig Fikstürü: Katılımcı sayısına göre otomatik lig takvimi oluşturulur, her takım birbiriyle tek maç yapar.",
          "Hızlı & Canlı Simülasyon: 90 dakikalık futbol maçı 30 saniye içinde canlı pozisyonlarla ekranınıza gelir.",
          "Sıfır Spoiler Sistemi: Oynanmamış maçların skorları ve puanları önceden görünmez, heyecan son düdüğe kadar sürer.",
          "Lig Şampiyonluk Kürsüsü: Tüm turlar tamamlandığında şampiyon takım özel kupa seremonisi ile ilan edilir.",
        ],
      },
      {
        title: "3 Koridorlu Taktik Tahtası & 'Kaleyi Görünce Vur'",
        badge: "Taktik Derinlik",
        icon: "🧠",
        summary:
          "Futbol sahası Sol Kanat, Merkez ve Sağ Kanat olarak 3 koridora ayrıldı. Takımınızın taktiğine göre maçın kaderi değişiyor.",
        changes: [
          "Kaleyi Görünce Vur Taktiği: Bu taktik seçildiğinde hücumcular %70 ihtimalle uzaktan şut dener ve ceza sahası kalabalığını delmeye çalışır.",
          "Koridor Eşleşmeleri: Sol bekiniz rakibin sağ açığıyla, merkez orta sahanız rakip göbekle doğrudan eşleşerek güç savaşı verir.",
          "Kanattan Hücum: Kanat oyunu seçildiğinde bekler ve açıklar koridoru zorlayarak içeri kilit pas veya tehlikeli orta dener.",
          "4 Boyutlu Taktik Ayarı: Tempo, Oyun Kurma, Pres ve Hücum Yönü kararlarınız koridor güçlerinizi doğrudan etkiler.",
        ],
      },
      {
        title: "Mevkisel Güç Dengeleri & Savunma Hiyerarşisi",
        badge: "Dengeleme",
        icon: "🛡️",
        summary:
          "Gerçek futbola uygun mevkisel taban güçleri ve pres katkıları tek doğruluk kaynağında dengelendi.",
        changes: [
          "Orta Saha Savunma Hiyerarşisi: CDM (Ön Libero: 0.90x) > CM (Merkez: 0.65x) > CAM (Ofansif: 0.20x) savunma katkısı kuralı kesinleştirildi.",
          "Pres & Savunma Katkısı: Bekler (LB/RB: 0.30x) ve Kanat Forvetler (LW/RW: 0.25x) kanat koridorundaki savunmaya aktif güç katar.",
          "Yüksek Pres Bonusu: Önde pres taktiği takımın merkez top kapma puanını net %25 artırır.",
        ],
      },
      {
        title: "Canlı Maçta F5 / Yenileme Koruması (Anti-Desync)",
        badge: "Altyapı & Kararlılık",
        icon: "⚡",
        summary:
          "Canlı maç simülasyonu oynanırken herhangi bir oyuncu sayfayı yenilediğinde (F5) maçın sıfırlanma sorunu tamamen giderildi.",
        changes: [
          "Merkezi Zamanlayıcı: Maç dakikası artık doğrudan sunucu tarafından yönetilir; istemciler anlık geçen süreyi eş zamanlı takip eder.",
          "Kesintisiz Reconnect: F5 atan oyuncu saniyeler içinde odaya döndüğünde maçın kaldığı gerçek dakikadan oyunu sürdürür.",
          "Oda Koruması: Bir oyuncu kopsa bile diğer oyuncuların ekranındaki maç durmaz veya sıfırlanmaz.",
        ],
      },
      {
        title: "Canlı Maç Merkezi, Spiker & İstatistikler",
        badge: "Arayüz & Deneyim",
        icon: "🎙️",
        summary:
          "Kullanıcı çizimine tam sadık 4 kolonlu canlı maç ekranında heyecan verici canlı spiker anlatımı ve anlık istatistikler.",
        changes: [
          "Anlık Pozisyon Anlatımı: Her şut, kurtarış, korner ve gol, spiker akışında dakika dakika canlı olarak dökülür.",
          "Eş Zamanlı Krallık Tablosu: Ligin en çok gol atan ve asist yapan oyuncuları maç oynandıkça canlı sıralanır.",
          "Rakip Taktik Analizi: Bir sonraki rakibin bir önceki maçta uyguladığı diziliş ve taktikler scouting paneline yansır.",
        ],
      },
      {
        title: "Hallmark Tasarım Standartları & Performans",
        badge: "Görsel Tasarım",
        icon: "🎨",
        summary:
          "Anti-AI-slop tasarım ilkeleriyle inşa edilen arayüz; şeffaf kartlar, pürüzsüz stadyum arka planı ve mobil uyumlu responsive yapı kazandı.",
        changes: [
          "Zümrüt Yeşili & Gece Stadyumu: Gözü yormayan premium karanlık tema ve özel neon vuruşlar.",
          "Mobil & Masaüstü Uyum: Küçük ekranlardan geniş monitörlere kadar dikey sahalar ve taktik kartları otomatik ölçeklenir.",
        ],
      },
    ],
  },
];
