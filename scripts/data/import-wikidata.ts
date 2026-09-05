/**
 * Wikidata SPARQL API üzerinden Türkiye, Brezilya, Arjantin ve Avrupa devlerinde
 * forma giymiş tarihi futbolcuları ve kariyer geçmişlerini toplu (bulk) ve yüksek
 * performanslı şekilde veritabanına aktarır.
 */

import { prisma } from "../lib/db/client";

interface WikidataBinding {
  player: { value: string };
  playerName: { value: string };
  birthDate?: { value: string };
  nationalityName?: { value: string };
  team: { value: string };
  teamName: { value: string };
  countryName?: { value: string };
}

interface WikidataResponse {
  results: {
    bindings: WikidataBinding[];
  };
}

const TARGET_CLUBS: { id: string; name: string; country: string; league: string }[] = [
  // --- TÜRKİYE: SÜPER LİG & 1. LİG & 2. LİG & TARİHİ KULÜPLER ---
  { id: "Q49529", name: "Galatasaray", country: "Türkiye", league: "Süper Lig" },
  { id: "Q49522", name: "Fenerbahçe", country: "Türkiye", league: "Süper Lig" },
  { id: "Q41470", name: "Beşiktaş", country: "Türkiye", league: "Süper Lig" },
  { id: "Q18656", name: "Trabzonspor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q206381", name: "Bursaspor", country: "Türkiye", league: "TFF 2. Lig" },
  { id: "Q138243", name: "Kocaelispor", country: "Türkiye", league: "TFF 1. Lig" },
  { id: "Q138258", name: "Sakaryaspor", country: "Türkiye", league: "TFF 1. Lig" },
  { id: "Q49704", name: "Gençlerbirliği", country: "Türkiye", league: "TFF 1. Lig" },
  { id: "Q138234", name: "Eskişehirspor", country: "Türkiye", league: "TFF 3. Lig" },
  { id: "Q49709", name: "Göztepe", country: "Türkiye", league: "Süper Lig" },
  { id: "Q1148259", name: "Karşıyaka", country: "Türkiye", league: "TFF 3. Lig" },
  { id: "Q434440", name: "Altay", country: "Türkiye", league: "TFF 2. Lig" },
  { id: "Q547844", name: "MKE Ankaragücü", country: "Türkiye", league: "TFF 1. Lig" },
  { id: "Q138259", name: "Samsunspor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q49700", name: "Antalyaspor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q352528", name: "Adana Demirspor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q49706", name: "Kayserispor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q138264", name: "Sivasspor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q49707", name: "Konyaspor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q138237", name: "Gaziantepspor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q338668", name: "Çaykur Rizespor", country: "Türkiye", league: "Süper Lig" },
  { id: "Q49702", name: "Denizlispor", country: "Türkiye", league: "TFF 2. Lig" },
  { id: "Q53562", name: "İstanbul Başakşehir", country: "Türkiye", league: "Süper Lig" },
  { id: "Q53564", name: "Kasımpaşa", country: "Türkiye", league: "Süper Lig" },
  { id: "Q138240", name: "İstanbulspor", country: "Türkiye", league: "TFF 1. Lig" },

  // --- BREZİLYA: SÉRIE A & SÉRIE B ---
  { id: "Q17479", name: "Flamengo", country: "Brazil", league: "Série A" },
  { id: "Q80958", name: "Santos FC", country: "Brazil", league: "Série A" },
  { id: "Q80962", name: "Palmeiras", country: "Brazil", league: "Série A" },
  { id: "Q80970", name: "Corinthians", country: "Brazil", league: "Série A" },
  { id: "Q80975", name: "São Paulo FC", country: "Brazil", league: "Série A" },
  { id: "Q80966", name: "Grêmio", country: "Brazil", league: "Série A" },
  { id: "Q80968", name: "Internacional", country: "Brazil", league: "Série A" },
  { id: "Q80965", name: "Fluminense", country: "Brazil", league: "Série A" },
  { id: "Q80980", name: "Vasco da Gama", country: "Brazil", league: "Série A" },
  { id: "Q80963", name: "Cruzeiro", country: "Brazil", league: "Série A" },
  { id: "Q80960", name: "Atlético Mineiro", country: "Brazil", league: "Série A" },
  { id: "Q80956", name: "Botafogo", country: "Brazil", league: "Série A" },
  { id: "Q80954", name: "Athletico Paranaense", country: "Brazil", league: "Série A" },

  // --- ARJANTİN: PRIMERA DIVISIÓN ---
  { id: "Q170703", name: "Boca Juniors", country: "Argentina", league: "Primera División" },
  { id: "Q150772", name: "River Plate", country: "Argentina", league: "Primera División" },
  { id: "Q218520", name: "Racing Club", country: "Argentina", league: "Primera División" },
  { id: "Q214940", name: "Independiente", country: "Argentina", league: "Primera División" },
  { id: "Q218274", name: "San Lorenzo", country: "Argentina", league: "Primera División" },
  { id: "Q212624", name: "Newell's Old Boys", country: "Argentina", league: "Primera División" },
  { id: "Q218285", name: "Rosario Central", country: "Argentina", league: "Primera División" },
  { id: "Q215163", name: "Estudiantes de La Plata", country: "Argentina", league: "Primera División" },
  { id: "Q215175", name: "Vélez Sarsfield", country: "Argentina", league: "Primera División" },
  { id: "Q219665", name: "Argentinos Juniors", country: "Argentina", league: "Primera División" },

  // --- AVRUPA DEVLERİ (EFSANELER) ---
  { id: "Q8682", name: "Real Madrid", country: "Spain", league: "La Liga" },
  { id: "Q7156", name: "FC Barcelona", country: "Spain", league: "La Liga" },
  { id: "Q8701", name: "Atlético Madrid", country: "Spain", league: "La Liga" },
  { id: "Q10329", name: "Valencia CF", country: "Spain", league: "La Liga" },
  { id: "Q8932", name: "Sevilla FC", country: "Spain", league: "La Liga" },
  { id: "Q1225", name: "Juventus", country: "Italy", league: "Serie A" },
  { id: "Q1543", name: "AC Milan", country: "Italy", league: "Serie A" },
  { id: "Q631", name: "Inter Milan", country: "Italy", league: "Serie A" },
  { id: "Q2739", name: "AS Roma", country: "Italy", league: "Serie A" },
  { id: "Q2629", name: "SS Lazio", country: "Italy", league: "Serie A" },
  { id: "Q2625", name: "SSC Napoli", country: "Italy", league: "Serie A" },
  { id: "Q4611", name: "ACF Fiorentina", country: "Italy", league: "Serie A" },
  { id: "Q2693", name: "Parma Calcio 1913", country: "Italy", league: "Serie A" },
  { id: "Q1458", name: "Sampdoria", country: "Italy", league: "Serie B" },
  { id: "Q6651", name: "Brescia Calcio", country: "Italy", league: "Serie B" },
  { id: "Q18656", name: "Manchester United", country: "England", league: "Premier League" },
  { id: "Q50602", name: "Manchester City", country: "England", league: "Premier League" },
  { id: "Q11308", name: "Liverpool FC", country: "England", league: "Premier League" },
  { id: "Q9617", name: "Arsenal FC", country: "England", league: "Premier League" },
  { id: "Q9616", name: "Chelsea FC", country: "England", league: "Premier League" },
  { id: "Q18741", name: "Tottenham Hotspur", country: "England", league: "Premier League" },
  { id: "Q15789", name: "FC Bayern München", country: "Germany", league: "Bundesliga" },
  { id: "Q41420", name: "Borussia Dortmund", country: "Germany", league: "Bundesliga" },
  { id: "Q104761", name: "Bayer 04 Leverkusen", country: "Germany", league: "Bundesliga" },
  { id: "Q483020", name: "Paris Saint-Germain", country: "France", league: "Ligue 1" },
  { id: "Q132885", name: "Olympique de Marseille", country: "France", league: "Ligue 1" },
  { id: "Q704", name: "Olympique Lyonnais", country: "France", league: "Ligue 1" },
  { id: "Q180305", name: "AS Monaco", country: "France", league: "Ligue 1" },
  { id: "Q81888", name: "AFC Ajax", country: "Netherlands", league: "Eredivisie" },
  { id: "Q11993", name: "PSV Eindhoven", country: "Netherlands", league: "Eredivisie" },
  { id: "Q131499", name: "Feyenoord", country: "Netherlands", league: "Eredivisie" },
  { id: "Q131499", name: "SL Benfica", country: "Portugal", league: "Liga Portugal" },
  { id: "Q10835", name: "FC Porto", country: "Portugal", league: "Liga Portugal" },
  { id: "Q75729", name: "Sporting CP", country: "Portugal", league: "Liga Portugal" },
];

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

async function executeSparqlQuery(clubIds: string[]): Promise<WikidataBinding[]> {
  const valuesClause = clubIds.map((id) => `wd:${id}`).join(" ");

  const query = `
    SELECT DISTINCT ?player ?playerName ?birthDate ?nationalityName ?team ?teamName ?countryName WHERE {
      VALUES ?targetClub { ${valuesClause} }
      
      # Hedef kulüpte oynamış futbolcular
      ?player p:P54 ?targetStatement .
      ?targetStatement ps:P54 ?targetClub .
      
      # Futbolcunun tüm kariyer takımları
      ?player p:P54 ?allStatement .
      ?allStatement ps:P54 ?team .
      
      # İsim ve etiketler
      ?player rdfs:label ?playerName FILTER(LANG(?playerName) = "en" || LANG(?playerName) = "tr") .
      ?team rdfs:label ?teamName FILTER(LANG(?teamName) = "en" || LANG(?teamName) = "tr") .
      
      OPTIONAL { ?player wdt:P569 ?birthDate . }
      OPTIONAL {
        ?player wdt:P27 ?nationality .
        ?nationality rdfs:label ?nationalityName FILTER(LANG(?nationalityName) = "en" || LANG(?nationalityName) = "tr") .
      }
      OPTIONAL {
        ?team wdt:P17 ?country .
        ?country rdfs:label ?countryName FILTER(LANG(?countryName) = "en") .
      }
    }
    LIMIT 10000
  `;

  const url = `${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "FootballQuizApp/1.0 (https://github.com/oguzgucuk/football-quiz; support@footballquiz.app)",
      Accept: "application/sparql-results+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata SPARQL Hatası (${response.status}): ${response.statusText}`);
  }

  const data = (await response.json()) as WikidataResponse;
  return data.results.bindings;
}

function extractWikidataId(uri: string): string {
  const parts = uri.split("/");
  return parts[parts.length - 1];
}

async function runWikidataImport() {
  console.log("🌐 [Wikidata Import] Başlatılıyor...");
  const startTime = Date.now();

  // 1. DB'deki mevcut takımları, oyuncuları ve geçmişleri belleğe al (Yüksek hız için)
  console.log("⚡ [1/4] Mevcut veritabanı önbelleğe yükleniyor...");
  const [existingTeams, existingPlayers, existingHistories] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, externalRef: true } }),
    prisma.player.findMany({ select: { id: true, fullName: true, externalRef: true } }),
    prisma.playerTeamHistory.findMany({ select: { playerId: true, teamId: true } }),
  ]);

  const teamRefMap = new Map<string, string>();
  const teamNameMap = new Map<string, string>();
  for (const t of existingTeams) {
    if (t.externalRef) teamRefMap.set(t.externalRef, t.id);
    teamNameMap.set(t.name.trim().toLowerCase(), t.id);
  }

  const playerRefMap = new Map<string, string>();
  const playerNameMap = new Map<string, string>();
  for (const p of existingPlayers) {
    if (p.externalRef) playerRefMap.set(p.externalRef, p.id);
    playerNameMap.set(p.fullName.trim().toLowerCase(), p.id);
  }

  const historySet = new Set<string>();
  for (const h of existingHistories) {
    historySet.add(`${h.playerId}_${h.teamId}`);
  }

  // 2. Wikidata SPARQL gruplarını çek
  const CHUNK_SIZE = 10;
  const uniqueClubIds = Array.from(new Set(TARGET_CLUBS.map((c) => c.id)));
  const allBindings: WikidataBinding[] = [];

  console.log("📡 [2/4] Wikidata SPARQL sorguları çekiliyor...");
  for (let i = 0; i < uniqueClubIds.length; i += CHUNK_SIZE) {
    const chunkClubIds = uniqueClubIds.slice(i, i + CHUNK_SIZE);
    const groupNum = Math.floor(i / CHUNK_SIZE) + 1;
    const totalGroups = Math.ceil(uniqueClubIds.length / CHUNK_SIZE);

    try {
      console.log(`   ➡️ SPARQL Grup ${groupNum} / ${totalGroups} çekiliyor...`);
      const bindings = await executeSparqlQuery(chunkClubIds);
      allBindings.push(...bindings);
      console.log(`      ✓ ${bindings.length} kayıt alındı.`);
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (err) {
      console.warn(`      ⚠️ Grup ${groupNum} sorgusunda hata:`, err);
    }
  }

  console.log(`📦 [3/4] Toplam ${allBindings.length} ham kayıt işleniyor ve tekilleştiriliyor...`);

  // Yeni takımları tespit et
  const newTeamsMap = new Map<string, { externalRef: string; name: string; country: string; league: string }>();
  for (const b of allBindings) {
    const teamWikiId = extractWikidataId(b.team.value);
    const teamRef = `wikidata:${teamWikiId}`;
    const teamName = b.teamName.value.trim();
    const country = b.countryName?.value.trim() || "International";

    if (!teamRefMap.has(teamRef) && !teamNameMap.has(teamName.toLowerCase()) && !newTeamsMap.has(teamRef)) {
      newTeamsMap.set(teamRef, {
        externalRef: teamRef,
        name: teamName,
        country,
        league: "Club",
      });
    }
  }

  if (newTeamsMap.size > 0) {
    console.log(`   🛡️ ${newTeamsMap.size} yeni kulüp ekleniyor...`);
    await prisma.team.createMany({
      data: Array.from(newTeamsMap.values()),
      skipDuplicates: true,
    });
    // Yenilenen takımları Map'e al
    const updatedTeams = await prisma.team.findMany({ select: { id: true, name: true, externalRef: true } });
    for (const t of updatedTeams) {
      if (t.externalRef) teamRefMap.set(t.externalRef, t.id);
      teamNameMap.set(t.name.trim().toLowerCase(), t.id);
    }
  }

  // Yeni oyuncuları tespit et
  const newPlayersMap = new Map<string, { externalRef: string; fullName: string; nationality: string | null; birthDate: Date | null }>();
  for (const b of allBindings) {
    const playerWikiId = extractWikidataId(b.player.value);
    const playerRef = `wikidata:${playerWikiId}`;
    const playerName = b.playerName.value.trim();
    const nationality = b.nationalityName?.value.trim() || null;
    const birthDate = b.birthDate ? new Date(b.birthDate.value) : null;

    if (!playerRefMap.has(playerRef) && !playerNameMap.has(playerName.toLowerCase()) && !newPlayersMap.has(playerRef)) {
      newPlayersMap.set(playerRef, {
        externalRef: playerRef,
        fullName: playerName,
        nationality,
        birthDate: isNaN(birthDate?.getTime() ?? NaN) ? null : birthDate,
      });
    }
  }

  if (newPlayersMap.size > 0) {
    console.log(`   🏃 ${newPlayersMap.size} yeni tarihi futbolcu ekleniyor...`);
    const newPlayersList = Array.from(newPlayersMap.values());
    const BATCH = 3000;
    for (let i = 0; i < newPlayersList.length; i += BATCH) {
      await prisma.player.createMany({
        data: newPlayersList.slice(i, i + BATCH),
        skipDuplicates: true,
      });
    }
    // Yenilenen oyuncuları Map'e al
    const updatedPlayers = await prisma.player.findMany({ select: { id: true, fullName: true, externalRef: true } });
    for (const p of updatedPlayers) {
      if (p.externalRef) playerRefMap.set(p.externalRef, p.id);
      playerNameMap.set(p.fullName.trim().toLowerCase(), p.id);
    }
  }

  // 4. Yeni Kulüp-Oyuncu Eşleşmelerini Toplu Ekle
  console.log("🔄 [4/4] Kariyer geçmişleri eşleştiriliyor...");
  const newHistories: { playerId: string; teamId: string; isNationalTeam: boolean }[] = [];

  for (const b of allBindings) {
    const playerWikiId = extractWikidataId(b.player.value);
    const teamWikiId = extractWikidataId(b.team.value);
    const playerName = b.playerName.value.trim();
    const teamName = b.teamName.value.trim();

    const dbPlayerId = playerRefMap.get(`wikidata:${playerWikiId}`) || playerNameMap.get(playerName.toLowerCase());
    const dbTeamId = teamRefMap.get(`wikidata:${teamWikiId}`) || teamNameMap.get(teamName.toLowerCase());

    if (dbPlayerId && dbTeamId) {
      const key = `${dbPlayerId}_${dbTeamId}`;
      if (!historySet.has(key)) {
        historySet.add(key);
        newHistories.push({
          playerId: dbPlayerId,
          teamId: dbTeamId,
          isNationalTeam: false,
        });
      }
    }
  }

  console.log(`➡️ ${newHistories.length} yeni kariyer/kulüp eşleşmesi veritabanına yazılıyor...`);
  const BATCH = 3000;
  for (let i = 0; i < newHistories.length; i += BATCH) {
    await prisma.playerTeamHistory.createMany({
      data: newHistories.slice(i, i + BATCH),
      skipDuplicates: true,
    });
    const progress = Math.min(i + BATCH, newHistories.length);
    console.log(`   [Transfer Geçmişi] ${progress} / ${newHistories.length} eklendi.`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 [Wikidata Import] Başarıyla tamamlandı! (Süre: ${durationSec}s)`);
  console.log(`📊 Güncel Veritabanı Toplamı:`);
  console.log(`   - Kulüpler: ${await prisma.team.count()}`);
  console.log(`   - Futbolcular: ${await prisma.player.count()}`);
  console.log(`   - Kulüp-Oyuncu Eşleşmesi: ${await prisma.playerTeamHistory.count()}`);
}

runWikidataImport()
  .catch((err) => {
    console.error("❌ [Wikidata Import Hata]:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
