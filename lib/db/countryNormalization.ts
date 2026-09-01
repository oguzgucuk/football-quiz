/**
 * Veritabanındaki country alanını İngilizce ISO 3166-1 standardına normalize eden eşleme tablosu.
 * Kaynak: Kaggle ve Wikidata import'larından gelen Türkçe/karışık dil değerleri.
 *
 * Kullanım: normalize-country-names.ts scripti bu haritayı kullanarak toplu UPDATE yapar.
 */

export const COUNTRY_NORMALIZATION_MAP: Record<string, string> = {
  // ── Türkiye ──────────────────────────────────────────────
  "Türkiye": "Turkey",
  "Turkiye": "Turkey",

  // ── İngiltere / UK ────────────────────────────────────────
  // England ve Scotland'daki kulüpler için canonical değer "United Kingdom".
  // Lig bilgisi zaten "premier-league" / "scottish" gibi keyword'ler içeriyor.
  "Birleşik Krallık": "United Kingdom",
  "England": "United Kingdom",
  "Scotland": "United Kingdom",
  "Wales": "United Kingdom",
  "Northern Ireland": "United Kingdom",

  // ── İspanya ───────────────────────────────────────────────
  "İspanya": "Spain",

  // ── Almanya ───────────────────────────────────────────────
  "Almanya": "Germany",

  // ── Fransa ────────────────────────────────────────────────
  "Fransa": "France",

  // ── İtalya ────────────────────────────────────────────────
  "İtalya": "Italy",

  // ── Portekiz ──────────────────────────────────────────────
  "Portekiz": "Portugal",

  // ── Hollanda ──────────────────────────────────────────────
  "Hollanda": "Netherlands",

  // ── Belçika ───────────────────────────────────────────────
  "Belçika": "Belgium",

  // ── Brezilya ──────────────────────────────────────────────
  "Brezilya": "Brazil",

  // ── Arjantin ──────────────────────────────────────────────
  "Arjantin": "Argentina",

  // ── Amerika BK ────────────────────────────────────────────
  "Amerika Birleşik Devletleri": "United States",
  "USA": "United States",

  // ── Avustralya ────────────────────────────────────────────
  "Avustralya": "Australia",

  // ── Avusturya ─────────────────────────────────────────────
  "Avusturya": "Austria",

  // ── Danimarka ─────────────────────────────────────────────
  "Danimarka": "Denmark",

  // ── Norveç ────────────────────────────────────────────────
  "Norveç": "Norway",

  // ── İsveç ─────────────────────────────────────────────────
  "İsveç": "Sweden",

  // ── Yunanistan ────────────────────────────────────────────
  "Yunanistan": "Greece",

  // ── Macaristan ────────────────────────────────────────────
  "Macaristan": "Hungary",

  // ── İrlanda ───────────────────────────────────────────────
  "İrlanda": "Ireland",

  // ── İzlanda ───────────────────────────────────────────────
  "İzlanda": "Iceland",

  // ── İsrail ────────────────────────────────────────────────
  "İsrail": "Israel",

  // ── Polonya ───────────────────────────────────────────────
  "Polonya": "Poland",

  // ── Rusya ─────────────────────────────────────────────────
  "Rusya": "Russia",

  // ── Ukrayna ───────────────────────────────────────────────
  "Ukrayna": "Ukraine",

  // ── Romanya ───────────────────────────────────────────────
  "Romanya": "Romania",

  // ── Meksika ───────────────────────────────────────────────
  "Meksika": "Mexico",

  // ── Şili ──────────────────────────────────────────────────
  "Şili": "Chile",

  // ── Güney Afrika ──────────────────────────────────────────
  "Güney Afrika": "South Africa",

  // ── Gürcistan ─────────────────────────────────────────────
  "Gürcistan": "Georgia",

  // ── Ermenistan ────────────────────────────────────────────
  "Ermenistan": "Armenia",

  // ── Azerbaycan ────────────────────────────────────────────
  "Azerbaycan": "Azerbaijan",

  // ── Slovenya ──────────────────────────────────────────────
  "Slovenya": "Slovenia",

  // ── Slovakya ──────────────────────────────────────────────
  "Slovakya": "Slovakia",

  // ── Karadağ ───────────────────────────────────────────────
  "Karadağ": "Montenegro",

  // ── Litvanya ──────────────────────────────────────────────
  "Litvanya": "Lithuania",

  // ── Finlandiya ────────────────────────────────────────────
  "Finlandiya": "Finland",

  // ── Katar ─────────────────────────────────────────────────
  "Katar": "Qatar",

  // ── Çekya ─────────────────────────────────────────────────
  "Çekya": "Czech Republic",

  // ── Cezayir ───────────────────────────────────────────────
  "Cezayir": "Algeria",

  // ── Yeni Zelanda ──────────────────────────────────────────
  "Yeni Zelanda": "New Zealand",

  // ── Kanada ────────────────────────────────────────────────
  "Kanada": "Canada",

  // ── Trinidad ve Tobago ────────────────────────────────────
  "Trinidad ve Tobago": "Trinidad and Tobago",

  // ── Format tutarsızlıkları ────────────────────────────────
  "Korea, South": "South Korea",
  "People's Republic of China": "China",

  // ── Geçmişte var olmayan devletler (artık mevcut değil) ──
  // Bu takımlar DB'de kalabilir ama oyun dışı sayılır (allowedTeams zaten filtreler).
  // "Soviet Union" → olduğu gibi bırak
  // "Federal Republic of Yugoslavia" → olduğu gibi bırak
};
