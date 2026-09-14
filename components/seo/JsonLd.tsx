import React from "react";

interface JsonLdProps {
  baseUrl?: string;
}

export function JsonLd({ baseUrl = "https://alimball.com" }: JsonLdProps) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AlimBALL — Futbol Quiz & Scout Arena",
    alternateName: ["AlimBALL", "AlimBall", "AlimBALL Quiz"],
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/players?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const videoGameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "AlimBALL — Futbol Quiz & Scout Arena",
    description:
      "Gerçek zamanlı 1v1 futbol bilgi yarışı, transfer pazarı müzayedesi ve kadro simülasyon oyunu.",
    genre: ["Sports Game", "Trivia", "Strategy", "Card Game"],
    gamePlatform: ["Web Browser", "Mobile", "Desktop"],
    playMode: ["MultiPlayer", "SinglePlayer"],
    applicationCategory: "GameApplication",
    inLanguage: "tr",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
      availability: "https://schema.org/InStock",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "AlimBALL Futbol Quiz nedir ve nasıl oynanır?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AlimBALL, iki oyuncunun karşı karşıya geldiği gerçek zamanlı bir futbol bilgi yarışmasıdır. Ekranda beliren 2 kulüpte de forma giymiş ortak futbolcuyu en hızlı yazıp Enter'a basan oyuncu turu ve puanı kazanır.",
        },
      },
      {
        "@type": "Question",
        name: "Millet-Takım Modu nedir?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Her tur sırayla bir oyuncunun millet, diğerinin kulüp seçtiği ve bu iki kritere uyan (o milletten olup o kulüpte oynamış) futbolcuyu en hızlı bulanın kazandığı düello modudur.",
        },
      },
      {
        "@type": "Question",
        name: "Müzayede (Auction) Modunda kadro nasıl kurulur?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oyuncular 100M€ bütçeyle açık artırmaya çıkan dünya yıldızlarına pey sürer. Toplanan kartlarla 11 kişilik dengeli bir kadro ve diziliş yapılarak maç simülasyonlarında lig şampiyonluğu hedeflenir.",
        },
      },
      {
        "@type": "Question",
        name: "AlimBALL oynamak ücretsiz mi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Evet, AlimBALL tamamen ücretsiz bir web oyunudur. Kayıt olarak veya misafir olarak hemen oynamaya başlayabilirsiniz.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
