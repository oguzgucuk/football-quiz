/**
 * Oyunda takım seçimi (TeamPicker), rastgele takım üretimi ve Bot seçim havuzu için
 * izin verilen seçkin lig ve ülke filtreleri.
 *
 * İzin Verilenler:
 * 1. Türkiye Ligleri (Süper Lig, 1. Lig, Köklü Kulüpler)
 * 2. Tüm Avrupa Ligleri (İngiltere, İspanya, İtalya, Almanya, Fransa, Portekiz, Hollanda, Belçika, vb.)
 * 3. Arjantin & Brezilya Ligleri (Boca, River, Flamengo, Palmeiras, Santos, Corinthians vb.)
 * 4. Çin Süper Ligi (Chinese Super League)
 * 5. Suudi Arabistan Pro Ligi (Saudi Pro League)
 * 6. ABD & Kanada (Major League Soccer - MLS)
 *
 * NOT: normalize-country-names.ts çalıştırıldıktan sonra DB'deki tüm ülkeler
 * İngilizce ISO 3166-1 standardına normalize edilmiştir. Türkçe varyantlar artık gerekli değil.
 */

export const ALLOWED_GAME_COUNTRIES = new Set([
  // Türkiye
  "turkey",

  // Avrupa (Top 5 + Tüm Avrupa)
  // "England", "Scotland", "Birleşik Krallık" normalize sonrası → "united kingdom"
  "united kingdom",
  "spain",
  "italy",
  "germany",
  "france",
  "portugal",
  "netherlands",
  "belgium",
  "greece",
  "austria",
  "switzerland",
  "denmark",
  "norway",
  "sweden",
  "croatia",
  "serbia",
  "czech republic",
  "poland",
  "russia",
  "ukraine",
  "romania",
  "ireland",
  "hungary",
  "scotland", // güvenlik: normalizasyon sonrasında kalan nadir kayıtlar için
  "england",  // güvenlik: normalizasyon sonrasında kalan nadir kayıtlar için

  // Güney Amerika (Sadece Arjantin & Brezilya)
  "argentina",
  "brazil",

  // Ek Ligler
  "united states",
  "canada",
  "saudi arabia",
  "china",
  "south korea",    // "Korea, South" normalize edildi
  "australia",
  "mexico",
  "colombia",
  "chile",
  "uruguay",
]);

export const ALLOWED_LEAGUE_KEYWORDS = [
  "super-lig",
  "tff",
  "premier-league",
  "championship",
  "laliga",
  "segunda",
  "serie-a",
  "serie-b",
  "bundesliga",
  "ligue-1",
  "ligue-2",
  "liga-portugal",
  "eredivisie",
  "jupiler",
  "scottish",
  "super-league-1",
  "superliga",
  "torneo-apertura",
  "campeonato-brasileiro",
  "série a",
  "major-league-soccer",
  "mls",
  "saudi-pro-league",
  "super-league",
  "allsvenskan",
  "eliteserien",
  "pko-bp-ekstraklasa",
  "chance-liga",
  "supersport-hnl",
  "super-liga-srbije",
  "classic / historical",
  "historical / classic",
];

/**
 * Bir takımın oyunda seçilebilir olup olmadığını belirler.
 * Ülke kontrolü case-insensitive yapılır (DB normalize edildikten sonra lowercase dönüşümü yeterli).
 */
export function isTeamPlayableInGame(team: { country?: string | null; league?: string | null }): boolean {
  const country = (team.country || "").trim().toLowerCase();
  const league = (team.league || "").trim().toLowerCase();

  // 1. İzin verilen ülkelerden biri mi?
  if (ALLOWED_GAME_COUNTRIES.has(country)) {
    return true;
  }

  // 2. İzin verilen lig anahtar kelimelerinden birini içeriyor mu?
  if (ALLOWED_LEAGUE_KEYWORDS.some((kw) => league.includes(kw))) {
    return true;
  }

  return false;
}
