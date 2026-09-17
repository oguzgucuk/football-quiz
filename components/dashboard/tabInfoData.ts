/**
 * Dashboard Sekme Bilgileri & SEO Açıklamaları.
 * Her sekmenin amacını, içeriklerini ve anahtar kelimelerini açıklar.
 */

import { DashboardTab } from "./types";

export interface TabInfoContent {
  tabId: DashboardTab;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  features: {
    title: string;
    desc: string;
    icon: string;
  }[];
  keywords: string[];
  tips: string;
}

export const TAB_INFO_MAP: Record<DashboardTab, TabInfoContent> = {
  home: {
    tabId: "home",
    tabLabel: "Pano",
    badge: "Liderlik & Güncellemeler",
    title: "Liderlik Panosu, ELO Sıralamaları & Yama Notları",
    subtitle: "Sezon hedefleri, dereceli istatistikler ve son oyun güncellemeleri tek ekranda.",
    description:
      "Pano sekmesi; küresel oyuncu sıralamalarını, haftalık lig mücadelelerini, mevcut ELO derecenizi ve AlimBALL platformuna eklenen en son yama notlarını (Yama 0.1) takip edebileceğiniz ana haber merkezidir.",
    features: [
      {
        icon: "🏆",
        title: "Küresel & Haftalık Liderlik",
        desc: "Dünyanın dört bir yanından futbolseverlerle yarışın; Bronz'dan Şampiyon kademesine kadar lig atlayın.",
      },
      {
        icon: "📈",
        title: "Kişisel ELO Takibi",
        desc: "Dereceli maçlarda aldığınız galibiyetler ve ELO puanınız güvenle kaydedilir, sezon sıralamanızı belirler.",
      },
      {
        icon: "📜",
        title: "Yama Notları (Patch Notes)",
        desc: "Oyuna eklenen yeni mekanikler (Müzayede Ligi, Kaleyi Görünce Vur taktiği, dengelemeler) detaylarıyla listelenir.",
      },
    ],
    keywords: [
      "Futbol Quiz Liderlik Tablosu",
      "Futbolcu Bilgi Yarışması Sıralama",
      "ELO Derecesi",
      "Yama Notları",
      "Futbol Oyunu Güncellemeleri",
    ],
    tips: "Dereceli maçlar kazanarak ELO puanınızı yükseltin; 1. Sezon açıldığında liderlik panosunun zirvesinde yerinizi alın.",
  },

  play: {
    tabId: "play",
    tabLabel: "Oyna",
    badge: "Oyun Modları & Arenalar",
    title: "1v1 Futbol Quiz Düelloları & Müzayede Ligi",
    subtitle: "Farklı oyun formatlarında bilginizi sınayın, arkadaşlarınıza meydan okuyun.",
    description:
      "Oyna sekmesi; ister anlık rastgele rakiplerle eşleşebileceğiniz, ister oda koduyla arkadaşlarınızı davet edebileceğiniz 4 temel oyun arenasına ev sahipliği yapar.",
    features: [
      {
        icon: "⚡",
        title: "Ortak Oyuncu Modu (1v1)",
        desc: "Ekranda çıkan iki kulüpte de kariyerinde forma giymiş ortak futbolcuyu rakibinizden önce yazıp Enter'layın.",
      },
      {
        icon: "🌍",
        title: "Millet - Kulüp Modu",
        desc: "Her tur sırayla bir oyuncu millet, diğeri kulüp seçer; kriterlere uyan futbolcuyu ilk yazan puanı kapar.",
      },
      {
        icon: "🔨",
        title: "Müzayede Modu (Açık Artırma & Simülasyon)",
        desc: "100M€ bütçeyle dünya yıldızlarına pey sürün, taktiğinizi belirleyin ve 90 dakikalık canlı maç simülasyonunda yarışın.",
      },
      {
        icon: "📚",
        title: "Futbolcu Gezgini & Antrenman",
        desc: "18.000'den fazla futbolcunun kulüp geçmişini inceleyerek maçlara çıkmadan önce hafızanızı tazeleyin.",
      },
    ],
    keywords: [
      "İki Takımda Oynamış Futbolcular",
      "Ortak Futbolcu Bulma Oyunu",
      "Futbolcu Müzayede Ligi",
      "Canlı Futbol Quiz",
      "Futbolcu Tahmin Etme",
    ],
    tips: "Müzayede modunda 'Kaleyi Görünce Vur' veya 'Kanattan Hücum' gibi koridor taktikleriyle rakibinizi şaşırtabilirsiniz.",
  },

  profile: {
    tabId: "profile",
    tabLabel: "Profil",
    badge: "Kariyer & İstatistikler",
    title: "Kişisel Futbol Kariyeri, İstatistikler & Vitrin",
    subtitle: "Kazanma oranınız, ELO geçmişiniz ve sergilediğiniz vitrin kupaları.",
    description:
      "Profil sekmesinde; katıldığınız düellolardan aldığınız galibiyetler, seriler, en hızlı doğru cevap rekorlarınız ve kazandığınız unvanlar detaylı grafiklerle listelenir.",
    features: [
      {
        icon: "📊",
        title: "Detaylı Maç İstatistikleri",
        desc: "Toplam maç, galibiyet/mağlubiyet oranı, beraberlikler ve doğru yanıt hızınız kayıt altındadır.",
      },
      {
        icon: "🎖️",
        title: "Kariyer Derecesi & Rozetler",
        desc: "Bronz, Gümüş, Altın, Platin, Elmas ve Şampiyon lig rozetleriyle ustalığınızı sergileyin.",
      },
      {
        icon: "⭐",
        title: "Kupa & Başarım Vitrini",
        desc: "Müzayede Ligi şampiyonlukları ve özel etkinliklerde kazandığınız başarımlar profilinizde parıldar.",
      },
    ],
    keywords: [
      "Futbol Quiz Oyuncu Profili",
      "Futbol Bilgi İstatistikleri",
      "Kazanma Oranı",
      "Futbol Rozetleri",
    ],
    tips: "Profilinizi zenginleştirmek için arkadaşlarınızla özel maçlar yapabilir veya dereceli modda seri galibiyetler alabilirsiniz.",
  },

  store: {
    tabId: "store",
    tabLabel: "Mağaza",
    badge: "Kozmetik & Özelleştirme",
    title: "Özel Kart Çerçeveleri, Temalar & VIP Unvanlar",
    subtitle: "Kazandığınız galibiyet puanlarıyla tarzınızı sahaya yansıtın.",
    description:
      "Mağaza sekmesinde; oyun içi başarılarınızla elde ettiğiniz paraları kullanarak benzersiz futbolcu kart çerçeveleri, neon stadyum temaları ve sohbet unvanları edinebilirsiniz.",
    features: [
      {
        icon: "🎴",
        title: "Nadir Kart Çerçeveleri",
        desc: "Altın, Zümrüt, Alev ve Karbon fiber kart çerçeveleri ile kadronuzdaki oyuncuları parlatın.",
      },
      {
        icon: "🏟️",
        title: "Stadyum & Görsel Temalar",
        desc: "Gece ışıklandırmalı mabetlerden tarihi stadyum arka planlarına kadar görsel özelleştirmeler.",
      },
      {
        icon: "🏷️",
        title: "Özel Oyuncu Unvanları",
        desc: "'Transfer Sihirbazı', 'Scout Ustası', 'Ansiklopedi' gibi prestijli unvanları kuşanabilirsiniz.",
      },
    ],
    keywords: [
      "Futbol Oyunu Mağaza",
      "Futbolcu Kart Çerçeveleri",
      "Kozmetik Özelleştirme",
      "Oyun İçi Unvanlar",
    ],
    tips: "Mağazadaki tüm eşyalar tamamen kozmetiktir; oyunda asla 'pay-to-win' avantaj sağlamaz.",
  },

  players: {
    tabId: "players",
    tabLabel: "Futbolcular",
    badge: "Devasa Veritabanı",
    title: "18.000+ Futbolcu & Kulüp Transfer Veritabanı",
    subtitle: "Dünya futbolunun efsaneleri ve güncel yıldızları parmaklarınızın ucunda.",
    description:
      "Futbolcular sekmesi; 18.000'den fazla futbolcunun kariyer zirve reytinglerini, oynadığı tüm kulüpleri, mevkisel güçlerini ve transfer tarihlerini arayıp inceleyebileceğiniz canlı bir futbol ansiklopedisidir.",
    features: [
      {
        icon: "🔍",
        title: "Hızlı İsim & Kulüp Arama",
        desc: "Tek tuşla hem efsaneleri (Zidane, Ronaldo, Maradona) hem de güncel yıldızları anında bulun.",
      },
      {
        icon: "📋",
        title: "Transfer Kariyer Ağacı",
        desc: "Bir futbolcunun kiralık ve altyapı dahil forma giydiği tüm takımların kronolojik listesini görün.",
      },
      {
        icon: "⚡",
        title: "Mevkisel Reytingler (Prime OVR)",
        desc: "Oyuncuların hücum, orta saha, savunma ve kalecilik taban güçlerini inceleyin.",
      },
    ],
    keywords: [
      "Futbolcu Arama Motoru",
      "Hangi Takımlarda Oynadı",
      "Futbolcu Transfer Geçmişi",
      "Ortak Takımlar Veritabanı",
      "Futbolcu Reytingleri",
    ],
    tips: "Ortak oyuncu maçlarında zorlandığınız kulüp çiftlerini (örn: Arsenal & Juventus) burada aratarak ortak isimleri hafızanıza alabilirsiniz.",
  },

  settings: {
    tabId: "settings",
    tabLabel: "Ayarlar",
    badge: "Tercihler & Güvenlik",
    title: "Oyun Deneyimi, Ses Efektleri & Hesap Ayarları",
    subtitle: "Platformu kendi tercihlerinize ve cihazınıza göre kişiselleştirin.",
    description:
      "Ayarlar sekmesinde; stadyum atmosfer seslerini, geri sayım efektlerini, grafik akıcılığını ve hesap güvenlik bilgilerinizi kolayca yapılandırabilirsiniz.",
    features: [
      {
        icon: "🔊",
        title: "Ses & Atmosfer Seviyeleri",
        desc: "Düdük sesleri, doğru cevap jingle'ları ve arka plan stadyum uğultusunu isteğinize göre ayarlayın.",
      },
      {
        icon: "✨",
        title: "Grafik & Performans",
        desc: "Düşük donanımlı cihazlar veya mobil tarayıcılar için hafifletilmiş animasyon modu.",
      },
      {
        icon: "🔒",
        title: "Hesap & Gizlilik",
        desc: "Kullanıcı adı, şifre ve arkadaşlık istekleri gibi gizlilik tercihlerinizi yönetin.",
      },
    ],
    keywords: [
      "Futbol Quiz Ayarlar",
      "Ses Efektleri",
      "Grafik Performansı",
      "Hesap Güvenliği",
    ],
    tips: "Daha odaklanmış bir rekabet deneyimi için ses efektlerini açık tutup kulaklıkla oynamayı deneyin.",
  },
};
