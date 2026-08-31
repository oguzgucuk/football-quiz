/**
 * Oyunda takım seçimi (TeamPicker), rastgele takım üretimi ve Bot seçim havuzu için
 * izin verilen seçkin lig ve ülke filtreleri.
 * 
 * İzin Verilenler:
 * 1. Türkiye Ligleri (Süper Lig, 1. Lig, Köklü Kulüpler)
 * 2. Tüm Avrupa Ligleri (İngiltere, İspanya, İtalya, Almanya, Fransa, Portekiz, Hollanda, Belçika, İskoçya, Yunanistan vb.)
 * 3. Arjantin & Brezilya Ligleri (Boca, River, Flamengo, Palmeiras, Santos, Corinthians vb.)
 * 4. Çin Süper Ligi (Chinese Super League)
 * 5. Suudi Arabistan Pro Ligi (Saudi Pro League)
 * 6. ABD & Kanada (Major League Soccer - MLS)
 */

export const ALLOWED_GAME_COUNTRIES = new Set([
  // Türkiye
  "türkiye",
  "turkey",

  // Avrupa (Top 5 + Tüm Avrupa)
  "england",
  "united kingdom",
  "birleşik krallık",
  "scotland",
  "spain",
  "ispanya",
  "italy",
  "italya",
  "germany",
  "almanya",
  "france",
  "fransa",
  "portugal",
  "portekiz",
  "netherlands",
  "hollanda",
  "belgium",
  "belçika",
  "greece",
  "yunanistan",
  "austria",
  "avusturya",
  "switzerland",
  "isviçre",
  "denmark",
  "danimarka",
  "norway",
  "norveç",
  "sweden",
  "isveç",
  "croatia",
  "hırvatistan",
  "serbia",
  "sırbistan",
  "czech republic",
  "çekya",
  "poland",
  "polonya",
  "russia",
  "rusya",
  "ukraine",
  "ukrayna",
  "romania",
  "romanya",
  "ireland",
  "irlanda",
  "hungary",
  "macaristan",

  // Güney Amerika (Sadece Arjantin & Brezilya)
  "argentina",
  "arjantin",
  "brazil",
  "brezilya",

  // Kullanıcının Özel İstediği Ek Ligler
  "united states",
  "usa",
  "canada",
  "kanada",
  "saudi arabia",
  "suudi arabistan",
  "people's republic of china",
  "china",
  "çin",
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
