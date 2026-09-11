/**
 * Wikidata SPARQL üzerinden Türkiye Süper Lig, TFF 1. Lig ve Avrupa'nın 5 Büyük Liginin
 * (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) tüm kulüplerinin 2026 güncel kadrolarını çeker.
 * 
 * Kurallar (GEMINI.md Kural 9 & Kural 12):
 * 1. Oyuncu isimleri temizlenir: Parantez ekleri silinir, "Soyad, Ad" düzeltilir.
 * 2. Çift kayıt önleme: wikidataId, normalize(fullName) ve birthDate kontrolü yapılır.
 * 3. Kulüpler isim ve alias üzerinden DB'deki mevcut takımlara bağlanır.
 * 4. Aktif oyuncu filtresi: 1984 ve sonrası doğumlu, ayrılış tarihi olmayan oyuncular 2026 kadrosuna işlenir.
 */

import { prisma } from "../../lib/db/client";
import { normalizeText } from "../../lib/validation/normalizeText";

export interface TargetClub {
  qid: string;
  name: string;
  league: string;
  country: string;
}

export const TARGET_CLUBS: TargetClub[] = [
  // ==========================================
  // --- TÜRKİYE SÜPER LİG (19 TAKIM - TAM LİSTE) ---
  // ==========================================
  { qid: "Q49529", name: "Galatasaray", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q49522", name: "Fenerbahçe", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q41470", name: "Beşiktaş", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q18656", name: "Trabzonspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q53562", name: "İstanbul Başakşehir", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q281896", name: "Eyüpspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q1423118", name: "Göztepe", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q138259", name: "Samsunspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q372599", name: "Sivasspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q138230", name: "Kasımpaşa", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q49700", name: "Antalyaspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q1636019", name: "Alanyaspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q513840", name: "Konyaspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q608122", name: "Kayserispor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q272712", name: "Çaykur Rizespor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q824850", name: "Gaziantep FK", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q1110567", name: "Hatayspor", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q6029341", name: "Bodrum FK", league: "Süper Lig", country: "Türkiye" },
  { qid: "Q352528", name: "Adana Demirspor", league: "Süper Lig", country: "Türkiye" },

  // ==========================================
  // --- TÜRKİYE TRENDYOL 1. LİG (20 TAKIM - TAM LİSTE) ---
  // ==========================================
  { qid: "Q138243", name: "Kocaelispor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q138258", name: "Sakaryaspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q547844", name: "MKE Ankaragücü", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q49704", name: "Gençlerbirliği", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q1398111", name: "Fatih Karagümrük", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q1530932", name: "Pendikspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q138240", name: "İstanbulspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q15104273", name: "Ümraniyespor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q6576662", name: "Amed SK", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q806334", name: "Bandırmaspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q891679", name: "Boluspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q6089333", name: "Çorum FK", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q24266857", name: "Erzurumspor FK", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q113483981", name: "Iğdır FK", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q6078716", name: "Ankara Keçiörengücü", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q6078696", name: "Manisa FK", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q388506", name: "Şanlıurfaspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q1647492", name: "Yeni Malatyaspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q352618", name: "Adanaspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q6078704", name: "Esenler Erokspor", league: "TFF 1. Lig", country: "Türkiye" },
  { qid: "Q206381", name: "Bursaspor", league: "TFF 2. Lig", country: "Türkiye" },

  // ==========================================
  // --- İNGİLTERE PREMIER LEAGUE (20 TAKIM - TAM LİSTE) ---
  // ==========================================
  { qid: "Q50602", name: "Manchester City", league: "Premier League", country: "England" },
  { qid: "Q9617", name: "Arsenal", league: "Premier League", country: "England" },
  { qid: "Q11308", name: "Liverpool", league: "Premier League", country: "England" },
  { qid: "Q18711", name: "Aston Villa", league: "Premier League", country: "England" },
  { qid: "Q18741", name: "Tottenham Hotspur", league: "Premier League", country: "England" },
  { qid: "Q9616", name: "Chelsea", league: "Premier League", country: "England" },
  { qid: "Q18716", name: "Newcastle United", league: "Premier League", country: "England" },
  { qid: "Q18656", name: "Manchester United", league: "Premier League", country: "England" },
  { qid: "Q18747", name: "West Ham United", league: "Premier League", country: "England" },
  { qid: "Q19467", name: "Crystal Palace", league: "Premier League", country: "England" },
  { qid: "Q19470", name: "Brighton & Hove Albion", league: "Premier League", country: "England" },
  { qid: "Q19586", name: "AFC Bournemouth", league: "Premier League", country: "England" },
  { qid: "Q18708", name: "Fulham", league: "Premier League", country: "England" },
  { qid: "Q19478", name: "Wolverhampton Wanderers", league: "Premier League", country: "England" },
  { qid: "Q5794", name: "Everton", league: "Premier League", country: "England" },
  { qid: "Q19571", name: "Brentford", league: "Premier League", country: "England" },
  { qid: "Q19490", name: "Nottingham Forest", league: "Premier League", country: "England" },
  { qid: "Q19481", name: "Leicester City", league: "Premier League", country: "England" },
  { qid: "Q9653", name: "Ipswich Town", league: "Premier League", country: "England" },
  { qid: "Q18732", name: "Southampton", league: "Premier League", country: "England" },

  // ==========================================
  // --- İSPANYA LA LIGA (20 TAKIM - TAM LİSTE) ---
  // ==========================================
  { qid: "Q8682", name: "Real Madrid", league: "La Liga", country: "Spain" },
  { qid: "Q7156", name: "FC Barcelona", league: "La Liga", country: "Spain" },
  { qid: "Q26915", name: "Girona FC", league: "La Liga", country: "Spain" },
  { qid: "Q8701", name: "Atlético Madrid", league: "La Liga", country: "Spain" },
  { qid: "Q8687", name: "Athletic Bilbao", league: "La Liga", country: "Spain" },
  { qid: "Q10315", name: "Real Sociedad", league: "La Liga", country: "Spain" },
  { qid: "Q8723", name: "Real Betis", league: "La Liga", country: "Spain" },
  { qid: "Q12297", name: "Villarreal CF", league: "La Liga", country: "Spain" },
  { qid: "Q10329", name: "Valencia CF", league: "La Liga", country: "Spain" },
  { qid: "Q22365", name: "Deportivo Alavés", league: "La Liga", country: "Spain" },
  { qid: "Q10286", name: "CA Osasuna", league: "La Liga", country: "Spain" },
  { qid: "Q8812", name: "Getafe CF", league: "La Liga", country: "Spain" },
  { qid: "Q8749", name: "Celta de Vigo", league: "La Liga", country: "Spain" },
  { qid: "Q8932", name: "Sevilla FC", league: "La Liga", country: "Spain" },
  { qid: "Q8835", name: "RCD Mallorca", league: "La Liga", country: "Spain" },
  { qid: "Q8818", name: "UD Las Palmas", league: "La Liga", country: "Spain" },
  { qid: "Q10300", name: "Rayo Vallecano", league: "La Liga", country: "Spain" },
  { qid: "Q856119", name: "CD Leganés", league: "La Liga", country: "Spain" },
  { qid: "Q10311", name: "Real Valladolid", league: "La Liga", country: "Spain" },
  { qid: "Q8780", name: "RCD Espanyol", league: "La Liga", country: "Spain" },

  // ==========================================
  // --- İTALYA SERIE A (20 TAKIM - TAM LİSTE) ---
  // ==========================================
  { qid: "Q631", name: "Inter Milan", league: "Serie A", country: "Italy" },
  { qid: "Q1543", name: "AC Milan", league: "Serie A", country: "Italy" },
  { qid: "Q1225", name: "Juventus", league: "Serie A", country: "Italy" },
  { qid: "Q1886", name: "Atalanta", league: "Serie A", country: "Italy" },
  { qid: "Q2470", name: "Bologna FC 1909", league: "Serie A", country: "Italy" },
  { qid: "Q2739", name: "AS Roma", league: "Serie A", country: "Italy" },
  { qid: "Q2629", name: "SS Lazio", league: "Serie A", country: "Italy" },
  { qid: "Q4611", name: "ACF Fiorentina", league: "Serie A", country: "Italy" },
  { qid: "Q2764", name: "Torino FC", league: "Serie A", country: "Italy" },
  { qid: "Q2625", name: "SSC Napoli", league: "Serie A", country: "Italy" },
  { qid: "Q2079", name: "Genoa CFC", league: "Serie A", country: "Italy" },
  { qid: "Q29478", name: "AC Monza", league: "Serie A", country: "Italy" },
  { qid: "Q8639", name: "Hellas Verona", league: "Serie A", country: "Italy" },
  { qid: "Q13380", name: "US Lecce", league: "Serie A", country: "Italy" },
  { qid: "Q2798", name: "Udinese Calcio", league: "Serie A", country: "Italy" },
  { qid: "Q1900", name: "Cagliari Calcio", league: "Serie A", country: "Italy" },
  { qid: "Q6703", name: "Empoli FC", league: "Serie A", country: "Italy" },
  { qid: "Q2693", name: "Parma Calcio 1913", league: "Serie A", country: "Italy" },
  { qid: "Q8619", name: "Como 1907", league: "Serie A", country: "Italy" },
  { qid: "Q843232", name: "Venezia FC", league: "Serie A", country: "Italy" },

  // ==========================================
  // --- ALMANYA BUNDESLIGA (18 TAKIM - TAM LİSTE) ---
  // ==========================================
  { qid: "Q104761", name: "Bayer 04 Leverkusen", league: "Bundesliga", country: "Germany" },
  { qid: "Q4512", name: "VfB Stuttgart", league: "Bundesliga", country: "Germany" },
  { qid: "Q15789", name: "FC Bayern München", league: "Bundesliga", country: "Germany" },
  { qid: "Q702455", name: "RB Leipzig", league: "Bundesliga", country: "Germany" },
  { qid: "Q41420", name: "Borussia Dortmund", league: "Bundesliga", country: "Germany" },
  { qid: "Q38245", name: "Eintracht Frankfurt", league: "Bundesliga", country: "Germany" },
  { qid: "Q22702", name: "TSG 1899 Hoffenheim", league: "Bundesliga", country: "Germany" },
  { qid: "Q162253", name: "1. FC Heidenheim", league: "Bundesliga", country: "Germany" },
  { qid: "Q51974", name: "SV Werder Bremen", league: "Bundesliga", country: "Germany" },
  { qid: "Q106394", name: "SC Freiburg", league: "Bundesliga", country: "Germany" },
  { qid: "Q15755", name: "FC Augsburg", league: "Bundesliga", country: "Germany" },
  { qid: "Q101859", name: "VfL Wolfsburg", league: "Bundesliga", country: "Germany" },
  { qid: "Q105254", name: "1. FSV Mainz 05", league: "Bundesliga", country: "Germany" },
  { qid: "Q101959", name: "Borussia Mönchengladbach", league: "Bundesliga", country: "Germany" },
  { qid: "Q141971", name: "1. FC Union Berlin", league: "Bundesliga", country: "Germany" },
  { qid: "Q105861", name: "VfL Bochum", league: "Bundesliga", country: "Germany" },
  { qid: "Q106577", name: "FC St. Pauli", league: "Bundesliga", country: "Germany" },
  { qid: "Q166504", name: "Holstein Kiel", league: "Bundesliga", country: "Germany" },

  // ==========================================
  // --- FRANSA LIGUE 1 (18 TAKIM - TAM LİSTE) ---
  // ==========================================
  { qid: "Q483020", name: "Paris Saint-Germain", league: "Ligue 1", country: "France" },
  { qid: "Q180305", name: "AS Monaco", league: "Ligue 1", country: "France" },
  { qid: "Q218386", name: "Stade Brestois 29", league: "Ligue 1", country: "France" },
  { qid: "Q19516", name: "Lille OSC", league: "Ligue 1", country: "France" },
  { qid: "Q214374", name: "OGC Nice", league: "Ligue 1", country: "France" },
  { qid: "Q704", name: "Olympique Lyonnais", league: "Ligue 1", country: "France" },
  { qid: "Q192666", name: "RC Lens", league: "Ligue 1", country: "France" },
  { qid: "Q132885", name: "Olympique de Marseille", league: "Ligue 1", country: "France" },
  { qid: "Q208226", name: "Stade de Reims", league: "Ligue 1", country: "France" },
  { qid: "Q19511", name: "Stade Rennais", league: "Ligue 1", country: "France" },
  { qid: "Q19513", name: "Toulouse FC", league: "Ligue 1", country: "France" },
  { qid: "Q211333", name: "RC Strasbourg", league: "Ligue 1", country: "France" },
  { qid: "Q19503", name: "Montpellier HSC", league: "Ligue 1", country: "France" },
  { qid: "Q192071", name: "FC Nantes", league: "Ligue 1", country: "France" },
  { qid: "Q328658", name: "Le Havre AC", league: "Ligue 1", country: "France" },
  { qid: "Q182876", name: "AJ Auxerre", league: "Ligue 1", country: "France" },
  { qid: "Q845137", name: "Angers SCO", league: "Ligue 1", country: "France" },
  { qid: "Q19512", name: "AS Saint-Étienne", league: "Ligue 1", country: "France" },

  // ==========================================
  // --- PORTEKİZ, HOLLANDA, SUUDİ & MLS DEVLERİ ---
  // ==========================================
  { qid: "Q131499", name: "SL Benfica", league: "Liga Portugal", country: "Portugal" },
  { qid: "Q10835", name: "FC Porto", league: "Liga Portugal", country: "Portugal" },
  { qid: "Q75729", name: "Sporting CP", league: "Liga Portugal", country: "Portugal" },
  { qid: "Q81888", name: "AFC Ajax", league: "Eredivisie", country: "Netherlands" },
  { qid: "Q11993", name: "PSV Eindhoven", league: "Eredivisie", country: "Netherlands" },
  { qid: "Q131500", name: "Feyenoord", league: "Eredivisie", country: "Netherlands" },
  { qid: "Q74051", name: "Al-Hilal SFC", league: "Saudi Pro League", country: "Saudi Arabia" },
  { qid: "Q74048", name: "Al-Nassr FC", league: "Saudi Pro League", country: "Saudi Arabia" },
  { qid: "Q74053", name: "Al-Ittihad Club", league: "Saudi Pro League", country: "Saudi Arabia" },
  { qid: "Q55614486", name: "Inter Miami CF", league: "Major League Soccer", country: "United States" },
];

/**
 * Wikidata'dan dönen ham ismi temizler:
 * - Parantez içindeki Wikipedia/Wikidata açıklamalarını kaldırır: "(footballer, born 1987)" -> ""
 * - "Soyadı, Adı" virgüllü yazımı düzeltir: "Icardi, Mauro" -> "Mauro Icardi"
 * - Fazla tırnak ve boşlukları temizler.
 */
export function cleanWikidataPlayerName(rawName: string): string {
  if (!rawName) return "";
  return rawName
    .replace(/\s*\([^)]*\)/g, "") // Parantez içlerini sil: "(footballer, born 1987)" -> ""
    .replace(/^([^,]+),\s*(.+)$/, "$2 $1") // "Icardi, Mauro" -> "Mauro Icardi"
    .replace(/["“”'’]/g, "") // Tırnak işaretlerini temizle
    .replace(/\s+/g, " ") // Çoklu boşlukları teke indir
    .trim();
}

/**
 * Oyuncu adını arama ve eşleştirme parmak izine (fingerprint) dönüştürür.
 * Aksanları, Türkçe karakterleri ve gereksiz sembolleri kaldırır.
 */
export function getPlayerFingerprint(name: string): string {
  if (!name) return "";
  return normalizeText(cleanWikidataPlayerName(name));
}

interface WikidataSquadBinding {
  player: { value: string };
  playerName: { value: string };
  birthDate?: { value: string };
  deathDate?: { value: string };
  nationalityName?: { value: string };
  positionName?: { value: string };
  team: { value: string };
  teamName: { value: string };
  startTime?: { value: string };
  endTime?: { value: string };
}

interface WikidataResponse {
  results: {
    bindings: WikidataSquadBinding[];
  };
}

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

/**
 * Belirtilen kulüplerin oyuncu kayıtlarını çeker.
 * Hızlı yanıt için JOIN filtreleri Blazegraph üzerinde değil, Node.js tarafında işlenir.
 */
async function fetchSquadsFromWikidata(clubQids: string[]): Promise<WikidataSquadBinding[]> {
  const valuesClause = clubQids.map((id) => `wd:${id}`).join(" ");

  const query = `
    SELECT DISTINCT ?player ?playerName ?birthDate ?deathDate ?nationalityName ?positionName ?team ?teamName ?startTime ?endTime WHERE {
      VALUES ?team { ${valuesClause} }
      
      ?player p:P54 ?statement .
      ?statement ps:P54 ?team .
      
      OPTIONAL { ?statement pq:P580 ?startTime . }
      OPTIONAL { ?statement pq:P582 ?endTime . }
      OPTIONAL { ?player wdt:P569 ?birthDate . }
      OPTIONAL { ?player wdt:P570 ?deathDate . }
      OPTIONAL {
        ?player wdt:P27 ?nationality .
        ?nationality rdfs:label ?nationalityName FILTER(LANG(?nationalityName) = "en" || LANG(?nationalityName) = "tr") .
      }
      OPTIONAL {
        ?player wdt:P413 ?position .
        ?position rdfs:label ?positionName FILTER(LANG(?positionName) = "en" || LANG(?positionName) = "tr") .
      }
      
      ?player rdfs:label ?playerName FILTER(LANG(?playerName) = "tr" || LANG(?playerName) = "en") .
      ?team rdfs:label ?teamName FILTER(LANG(?teamName) = "tr" || LANG(?teamName) = "en") .
    }
    LIMIT 10000
  `;

  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "FootballQuizApp/1.0 (contact: admin@footballquiz.local)",
      Accept: "application/sparql-results+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as WikidataResponse;
  return data.results.bindings;
}

export async function syncSquads2026() {
  console.log("🚀 2026 Kapsamlı Kadro Senkronizasyonu Başlatılıyor...");
  console.log(`📋 Toplam ${TARGET_CLUBS.length} hedef kulüp işlenecek (Avrupa 5 Büyük Lig + TR Süper Lig & 1. Lig).`);
  const startTime = Date.now();

  // 1. Veritabanındaki tüm kulüpleri ve alias'larını yükle
  console.log("📚 Veritabanındaki kulüpler taranıyor...");
  const allDbTeams = await prisma.team.findMany({
    select: { id: true, name: true, aliases: true, externalRef: true },
  });

  const teamLookup = new Map<string, string>(); // key: normalized string -> teamId
  for (const t of allDbTeams) {
    const norm = normalizeText(t.name);
    if (norm) teamLookup.set(norm, t.id);
    for (const a of t.aliases) {
      const normA = normalizeText(a);
      if (normA) teamLookup.set(normA, t.id);
    }
    if (t.externalRef) {
      teamLookup.set(t.externalRef.toLowerCase(), t.id);
    }
  }

  // Target clubs listesindeki isim ve QID'leri DB takımlarına eşleştir
  const clubIdMap = new Map<string, string>(); // QID -> teamId
  let matchedClubsCount = 0;

  for (const club of TARGET_CLUBS) {
    const qidKey = club.qid.toLowerCase();
    let matchedId =
      teamLookup.get(`wikidata:${qidKey}`) ||
      teamLookup.get(qidKey) ||
      teamLookup.get(normalizeText(club.name));

    if (!matchedId) {
      // Kısmi / esnek isim eşleştirme
      for (const [key, id] of teamLookup.entries()) {
        if (key.includes(normalizeText(club.name)) || normalizeText(club.name).includes(key)) {
          matchedId = id;
          break;
        }
      }
    }

    if (matchedId) {
      clubIdMap.set(club.qid, matchedId);
      matchedClubsCount++;
    } else {
      console.warn(`   ⚠️ Kulüp DB'de bulunamadı: ${club.name} (${club.qid})`);
    }
  }

  console.log(`   ✓ ${matchedClubsCount}/${TARGET_CLUBS.length} hedef kulüp DB ile başarıyla eşleştirildi.\n`);

  // 2. Veritabanındaki tüm oyuncuları hafızaya al
  console.log("👥 Mevcut oyuncu veritabanı hafızaya yükleniyor...");
  const allDbPlayers = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      birthDate: true,
      wikidataId: true,
    },
  });

  const playerByWiki = new Map<string, string>(); // wikidataId -> playerId
  const playerByFingerprint = new Map<string, string>(); // fingerprint -> playerId
  const playerByFingerprintAndYear = new Map<string, string>(); // fingerprint_birthYear -> playerId

  for (const p of allDbPlayers) {
    if (p.wikidataId) {
      playerByWiki.set(p.wikidataId, p.id);
    }
    const fp = getPlayerFingerprint(p.fullName);
    if (fp) {
      playerByFingerprint.set(fp, p.id);
      if (p.birthDate) {
        const year = p.birthDate.getFullYear();
        playerByFingerprintAndYear.set(`${fp}_${year}`, p.id);
      }
    }
  }
  console.log(`   ✓ Toplam ${allDbPlayers.length} mevcut oyuncu indekslendi.\n`);

  // 3. Mevcut PlayerTeamHistory ilişkilerini al
  console.log("📜 Mevcut transfer geçmişleri kontrol ediliyor...");
  const existingHistories = await prisma.playerTeamHistory.findMany({
    select: { playerId: true, teamId: true },
  });
  const historySet = new Set<string>();
  for (const h of existingHistories) {
    historySet.add(`${h.playerId}_${h.teamId}`);
  }

  // 4. Kulüpleri 6'şarlı gruplar halinde Wikidata'dan çek
  const BATCH_SIZE = 6;
  const clubQids = Array.from(clubIdMap.keys());
  const allBindings: WikidataSquadBinding[] = [];

  console.log(`📡 Toplam ${clubQids.length} kulüp için Wikidata sorguları gönderiliyor...`);
  for (let i = 0; i < clubQids.length; i += BATCH_SIZE) {
    const chunk = clubQids.slice(i, i + BATCH_SIZE);
    const groupNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalGroups = Math.ceil(clubQids.length / BATCH_SIZE);

    process.stdout.write(`   Grup [${groupNum}/${totalGroups}] (${chunk.length} kulüp)... `);
    try {
      const bindings = await fetchSquadsFromWikidata(chunk);
      console.log(`✓ ${bindings.length} ham kayıt alındı.`);
      allBindings.push(...bindings);
    } catch (err) {
      console.log(`❌ Hata: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Rate limit yememek için kısa bekleme
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n📥 Toplam ${allBindings.length} ham kayıt toplandı.`);
  console.log("🧹 Aktif oyuncu filtresi (1984+ doğum yılı, bitiş tarihi yok, hayatta olanlar) uygulanıyor...");

  // 5. Node.js Tarafında Kesin Aktif Oyuncu Filtreleme & Normalizasyon
  let updatedWikiCount = 0;
  let newPlayersCount = 0;
  let newHistoriesCount = 0;

  const newPlayersToInsert: {
    fullName: string;
    wikidataId: string;
    nationality: string | null;
    birthDate: Date | null;
    popularityScore: number;
  }[] = [];

  const seenWikiIds = new Set<string>();
  const pendingHistoryLinks: { playerWikiId: string; playerId?: string; teamId: string }[] = [];

  let filteredOutCount = 0;

  for (const b of allBindings) {
    // 1. Ayrılış tarihi (endTime) varsa bu oyuncu aktif değildir, atla
    if (b.endTime?.value) {
      filteredOutCount++;
      continue;
    }

    // 2. Vefat etmişse atla
    if (b.deathDate?.value) {
      filteredOutCount++;
      continue;
    }

    // 3. Doğum tarihi kontrolü: 2026 yılı için en fazla 42 yaşında (1984 ve sonrası doğumlu) olmalı
    const birthDateStr = b.birthDate?.value;
    const birthDate = birthDateStr ? new Date(birthDateStr) : null;
    const validBirthDate = birthDate && !isNaN(birthDate.getTime()) ? birthDate : null;
    const birthYear = validBirthDate ? validBirthDate.getFullYear() : null;

    if (!birthYear || birthYear < 1984 || birthYear > 2011) {
      filteredOutCount++;
      continue; // Tarihi/emekli veya geçersiz oyuncular elenir!
    }

    const playerWikiId = b.player.value.split("/").pop()!;
    const teamQid = b.team.value.split("/").pop()!;
    const teamId = clubIdMap.get(teamQid);
    if (!teamId) continue;

    const cleanedName = cleanWikidataPlayerName(b.playerName.value);
    const fingerprint = getPlayerFingerprint(cleanedName);
    if (!fingerprint || fingerprint.length < 2) continue;

    // Oyuncu veritabanında var mı kontrolü (GEMINI.md Kural 9 De-duplication):
    let matchedPlayerId: string | undefined = undefined;

    // 1. wikidataId ile doğrudan eşleşme
    if (playerByWiki.has(playerWikiId)) {
      matchedPlayerId = playerByWiki.get(playerWikiId);
    }
    // 2. İsim + Doğum Yılı eşleşmesi
    else if (playerByFingerprintAndYear.has(`${fingerprint}_${birthYear}`)) {
      matchedPlayerId = playerByFingerprintAndYear.get(`${fingerprint}_${birthYear}`);
    }
    // 3. Tam isim (fingerprint) eşleşmesi
    else if (playerByFingerprint.has(fingerprint)) {
      matchedPlayerId = playerByFingerprint.get(fingerprint);
    }

    if (matchedPlayerId) {
      // Oyuncu zaten DB'de var! Eğer wikidataId'si boş idiyse güncelle
      if (!playerByWiki.has(playerWikiId)) {
        playerByWiki.set(playerWikiId, matchedPlayerId);
        await prisma.player.update({
          where: { id: matchedPlayerId },
          data: { wikidataId: playerWikiId },
        });
        updatedWikiCount++;
      }
      pendingHistoryLinks.push({ playerWikiId, playerId: matchedPlayerId, teamId });
    } else {
      // Oyuncu henüz DB'de YOK. Yeni oyuncu listesine al
      if (!seenWikiIds.has(playerWikiId)) {
        seenWikiIds.add(playerWikiId);
        newPlayersToInsert.push({
          fullName: cleanedName,
          wikidataId: playerWikiId,
          nationality: b.nationalityName?.value || null,
          birthDate: validBirthDate,
          popularityScore: 55,
        });
      }
      pendingHistoryLinks.push({ playerWikiId, teamId });
    }
  }

  console.log(`   ✓ ${filteredOutCount} tarihi/emekli kayıt elendi, sadece aktif 2026 kadro oyuncuları kaldı.`);

  // 6. Yeni Oyuncuları Toplu Ekle
  if (newPlayersToInsert.length > 0) {
    console.log(`➕ ${newPlayersToInsert.length} yeni genç/yabancı oyuncu tespit edildi, DB'ye ekleniyor...`);
    const INSERT_CHUNK = 500;
    for (let i = 0; i < newPlayersToInsert.length; i += INSERT_CHUNK) {
      const slice = newPlayersToInsert.slice(i, i + INSERT_CHUNK);
      await prisma.player.createMany({
        data: slice,
        skipDuplicates: true,
      });
    }
    newPlayersCount = newPlayersToInsert.length;

    // Eklenen yeni oyuncuları id'lerini almak için tekrar çek
    const newlyCreated = await prisma.player.findMany({
      where: { wikidataId: { in: Array.from(seenWikiIds) } },
      select: { id: true, wikidataId: true },
    });
    for (const p of newlyCreated) {
      if (p.wikidataId) {
        playerByWiki.set(p.wikidataId, p.id);
      }
    }
  }

  // 7. 2026 Kulüp Geçmişlerini (PlayerTeamHistory) Toplu Ekle / Güncelle
  console.log("🔗 2026 Aktif kulüp eşleşmeleri işleniyor...");
  const historiesToInsert: {
    playerId: string;
    teamId: string;
    seasonStart: number;
    isNationalTeam: boolean;
  }[] = [];

  const seenHistoriesThisRun = new Set<string>();

  for (const item of pendingHistoryLinks) {
    const playerId = item.playerId || playerByWiki.get(item.playerWikiId);
    if (!playerId) continue;

    const pairKey = `${playerId}_${item.teamId}`;
    if (historySet.has(pairKey) || seenHistoriesThisRun.has(pairKey)) {
      continue;
    }

    seenHistoriesThisRun.add(pairKey);
    historySet.add(pairKey);

    historiesToInsert.push({
      playerId,
      teamId: item.teamId,
      seasonStart: 2026, // 2026 güncel transferi/kadrosu
      isNationalTeam: false,
    });
  }

  if (historiesToInsert.length > 0) {
    console.log(`📝 ${historiesToInsert.length} yeni 2026 kulüp bağlantısı kaydediliyor...`);
    const HIST_CHUNK = 1000;
    for (let i = 0; i < historiesToInsert.length; i += HIST_CHUNK) {
      const slice = historiesToInsert.slice(i, i + HIST_CHUNK);
      await prisma.playerTeamHistory.createMany({
        data: slice,
        skipDuplicates: true,
      });
    }
    newHistoriesCount = historiesToInsert.length;
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log("\n==========================================");
  console.log("✅ 2026 Kadro Senkronizasyonu Tamamlandı!");
  console.log(`⏱️ Süre: ${durationSec} saniye`);
  console.log(`🆕 Eklenen Yeni Oyuncu: ${newPlayersCount}`);
  console.log(`🆔 Eşleştirilen/Güncellenen WikidataId: ${updatedWikiCount}`);
  console.log(`⚽ Yeni Eklenen 2026 Kulüp Bağlantısı: ${newHistoriesCount}`);
  console.log("==========================================\n");
}

// Doğrudan CLI'dan çalıştırıldığında:
if (require.main === module) {
  syncSquads2026()
    .catch((err) => {
      console.error("❌ Hata:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
