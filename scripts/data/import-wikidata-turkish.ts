/**
 * Türk kulüpleri için Wikidata SPARQL üzerinden tarihi oyuncu ve transfer
 * geçmişlerini çeken ve veritabanını yüksek performanslı toplu (bulk) olarak zenginleştiren script.
 * 
 * GEMINI.md Kural 9:
 * - Yeni kulüp oluşturulmaz, mevcut kulüpler isim ve alias üzerinden eşleştirilir.
 * - Oyuncular normalize(fullName) ve wikidataId üzerinden tekilleştirilir.
 */

import { prisma } from "../../lib/db/client";
import { normalizeText } from "../../lib/validation/normalizeText";

interface WikidataBinding {
  player: { value: string };
  playerName: { value: string };
  birthDate?: { value: string };
  nationalityName?: { value: string };
  team: { value: string };
  teamName: { value: string };
}

interface WikidataResponse {
  results: {
    bindings: WikidataBinding[];
  };
}

const TURKISH_CLUBS = [
  { qid: "Q1110567", name: "Hatayspor" },
  { qid: "Q643107", name: "Denizlispor" },
  { qid: "Q138230", name: "Kasımpaşa" },
  { qid: "Q1636019", name: "Alanyaspor" },
  { qid: "Q1423118", name: "Göztepe" },
  { qid: "Q372599", name: "Sivasspor" },
  { qid: "Q608122", name: "Kayserispor" },
  { qid: "Q824850", name: "Gaziantep FK" },
  { qid: "Q513840", name: "Konyaspor" },
  { qid: "Q272712", name: "Çaykur Rizespor" },
  { qid: "Q352528", name: "Adana Demirspor" },
  { qid: "Q1398111", name: "Fatih Karagümrük" },
  { qid: "Q281896", name: "Eyüpspor" },
  { qid: "Q138259", name: "Samsunspor" },
  { qid: "Q49700", name: "Antalyaspor" },
  { qid: "Q138240", name: "İstanbulspor" },
  { qid: "Q1530932", name: "Pendikspor" },
  { qid: "Q15104273", name: "Ümraniyespor" },
  { qid: "Q1526848", name: "Giresunspor" },
  { qid: "Q49704", name: "Gençlerbirliği" },
  { qid: "Q547844", name: "MKE Ankaragücü" },
  { qid: "Q206381", name: "Bursaspor" },
  { qid: "Q138234", name: "Eskişehirspor" },
  { qid: "Q417685", name: "Akhisarspor" },
  { qid: "Q1647492", name: "Yeni Malatyaspor" },
  { qid: "Q6029341", name: "Bodrum FK" },
  { qid: "Q138258", name: "Sakaryaspor" },
  { qid: "Q138243", name: "Kocaelispor" },
  { qid: "Q434440", name: "Altay" },
  { qid: "Q24266857", name: "Erzurumspor FK" },
  { qid: "Q138239", name: "Kardemir Karabükspor" },
  { qid: "Q805886", name: "Balıkesirspor" },
  { qid: "Q891632", name: "Boluspor" },
  { qid: "Q128148", name: "Manisaspor" },
  { qid: "Q630348", name: "Bucaspor" },
  { qid: "Q1148259", name: "Karşıyaka" },
  { qid: "Q352656", name: "Adanaspor" },
  { qid: "Q1127498", name: "Elazığspor" },
  { qid: "Q610667", name: "Mersin Talimyurdu SK" },
];

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

async function executeSparql(qids: string[]): Promise<WikidataBinding[]> {
  const valuesClause = qids.map((id) => `wd:${id}`).join(" ");
  const query = `
    SELECT DISTINCT ?player ?playerName ?birthDate ?nationalityName ?team ?teamName WHERE {
      VALUES ?targetClub { ${valuesClause} }
      ?player p:P54 ?targetStatement .
      ?targetStatement ps:P54 ?targetClub .
      ?player p:P54 ?allStatement .
      ?allStatement ps:P54 ?team .
      ?player rdfs:label ?playerName FILTER(LANG(?playerName) = "en" || LANG(?playerName) = "tr") .
      ?team rdfs:label ?teamName FILTER(LANG(?teamName) = "en" || LANG(?teamName) = "tr") .
      OPTIONAL { ?player wdt:P569 ?birthDate . }
      OPTIONAL {
        ?player wdt:P27 ?nationality .
        ?nationality rdfs:label ?nationalityName FILTER(LANG(?nationalityName) = "en" || LANG(?nationalityName) = "tr") .
      }
    }
    LIMIT 10000
  `;

  const url = `${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FootballQuizApp/1.0 (contact: info@footballquiz.app)",
      Accept: "application/sparql-results+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata SPARQL Hatası (${response.status}): ${response.statusText}`);
  }

  const data = (await response.json()) as WikidataResponse;
  return data.results.bindings;
}

export async function importWikidataTurkish() {
  console.log("🌐 [Wikidata Turkish Import] Başlatılıyor...");
  const startTime = Date.now();

  // 1. Mevcut takımları al ve haritalandır
  const allDbTeams = await prisma.team.findMany({
    select: { id: true, name: true, externalRef: true, aliases: true },
  });

  const teamLookup = new Map<string, string>(); // normName/ref -> teamId
  for (const t of allDbTeams) {
    if (t.externalRef) teamLookup.set(t.externalRef.toLowerCase(), t.id);
    const norm = normalizeText(t.name);
    if (norm) teamLookup.set(norm, t.id);
    for (const a of t.aliases) {
      const normA = normalizeText(a);
      if (normA) teamLookup.set(normA, t.id);
    }
  }

  // Kulüp QID eşleştirmeleri
  for (const club of TURKISH_CLUBS) {
    const matchedId =
      teamLookup.get(normalizeText(club.name)) ||
      teamLookup.get(`wikidata:${club.qid.toLowerCase()}`);
    if (matchedId) {
      teamLookup.set(club.qid.toLowerCase(), matchedId);
      teamLookup.set(`wikidata:${club.qid.toLowerCase()}`, matchedId);
    }
  }

  // 2. Mevcut oyuncuları al
  const allDbPlayers = await prisma.player.findMany({
    select: { id: true, fullName: true, wikidataId: true },
  });

  const playerByWiki = new Map<string, string>();
  const playerByName = new Map<string, string>();
  for (const p of allDbPlayers) {
    if (p.wikidataId) playerByWiki.set(p.wikidataId, p.id);
    const norm = normalizeText(p.fullName);
    if (norm) playerByName.set(norm, p.id);
  }

  // 3. Mevcut geçmişleri al
  const existingHistories = await prisma.playerTeamHistory.findMany({
    select: { playerId: true, teamId: true },
  });
  const historySet = new Set<string>();
  for (const h of existingHistories) {
    historySet.add(`${h.playerId}_${h.teamId}`);
  }

  // 4. Wikidata'dan gruplar halinde çek
  const BATCH_SIZE = 8;
  const clubQids = TURKISH_CLUBS.map((c) => c.qid);
  const allBindings: WikidataBinding[] = [];

  for (let i = 0; i < clubQids.length; i += BATCH_SIZE) {
    const chunk = clubQids.slice(i, i + BATCH_SIZE);
    const groupNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`📡 [Grup ${groupNum}/${Math.ceil(clubQids.length / BATCH_SIZE)}] ${chunk.length} kulüp çekiliyor...`);

    try {
      const bindings = await executeSparql(chunk);
      console.log(`   ✓ ${bindings.length} kayıt alındı.`);
      allBindings.push(...bindings);
    } catch (err) {
      console.warn(`   ⚠️ Grup ${groupNum} hata:`, err);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n📦 Toplam ${allBindings.length} ham kayıt işleniyor...`);

  // 5. Yeni oyuncuları tespit et ve toplu ekle
  const newPlayersToInsert: {
    fullName: string;
    wikidataId: string;
    nationality: string;
    birthDate: Date | null;
    popularityScore: number;
  }[] = [];

  const seenNewWikis = new Set<string>();

  for (const b of allBindings) {
    const playerWikiId = b.player.value.split("/").pop()!;
    const playerName = b.playerName.value.trim();
    const normPlayerName = normalizeText(playerName);
    if (!normPlayerName || normPlayerName.length < 3) continue;

    if (!playerByWiki.has(playerWikiId) && !playerByName.has(normPlayerName) && !seenNewWikis.has(playerWikiId)) {
      seenNewWikis.add(playerWikiId);
      const birthDateStr = b.birthDate?.value;
      const birthDate = birthDateStr ? new Date(birthDateStr) : null;
      const nationality = b.nationalityName?.value || "Türkiye";

      newPlayersToInsert.push({
        fullName: playerName,
        wikidataId: playerWikiId,
        nationality,
        birthDate: birthDate && !isNaN(birthDate.getTime()) ? birthDate : null,
        popularityScore: 55,
      });
    }
  }

  if (newPlayersToInsert.length > 0) {
    console.log(`   ➕ ${newPlayersToInsert.length} yeni oyuncu toplu ekleniyor...`);
    const BATCH = 1000;
    for (let i = 0; i < newPlayersToInsert.length; i += BATCH) {
      await prisma.player.createMany({
        data: newPlayersToInsert.slice(i, i + BATCH),
        skipDuplicates: true,
      });
    }

    // Eklenen oyuncuları belleğe al
    const refetched = await prisma.player.findMany({
      where: { wikidataId: { in: Array.from(seenNewWikis) } },
      select: { id: true, fullName: true, wikidataId: true },
    });
    for (const p of refetched) {
      if (p.wikidataId) playerByWiki.set(p.wikidataId, p.id);
      const norm = normalizeText(p.fullName);
      if (norm) playerByName.set(norm, p.id);
    }
  }

  // 6. Yeni kulüp-oyuncu geçmişlerini toplu ekle
  console.log("🔄 Kulüp-oyuncu eşleşmeleri oluşturuluyor...");
  const newHistories: { playerId: string; teamId: string; isNationalTeam: boolean }[] = [];

  for (const b of allBindings) {
    const playerWikiId = b.player.value.split("/").pop()!;
    const playerName = b.playerName.value.trim();
    const normPlayerName = normalizeText(playerName);

    const teamWikiId = b.team.value.split("/").pop()!;
    const teamName = b.teamName.value.trim();
    const normTeamName = normalizeText(teamName);

    const teamId =
      teamLookup.get(teamWikiId.toLowerCase()) ||
      teamLookup.get(`wikidata:${teamWikiId.toLowerCase()}`) ||
      teamLookup.get(normTeamName);

    if (!teamId) continue;

    const playerId = playerByWiki.get(playerWikiId) || playerByName.get(normPlayerName);
    if (!playerId) continue;

    const histKey = `${playerId}_${teamId}`;
    if (!historySet.has(histKey)) {
      historySet.add(histKey);
      newHistories.push({
        playerId,
        teamId,
        isNationalTeam: false,
      });
    }
  }

  if (newHistories.length > 0) {
    console.log(`   🔗 ${newHistories.length} yeni kulüp geçmişi toplu yazılıyor...`);
    const BATCH = 2000;
    for (let i = 0; i < newHistories.length; i += BATCH) {
      await prisma.playerTeamHistory.createMany({
        data: newHistories.slice(i, i + BATCH),
        skipDuplicates: true,
      });
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [Wikidata Zenginleştirme Tamamlandı!] (${durationSec}s)`);
  console.log(`   - Yeni Eklenen Oyuncu: ${newPlayersToInsert.length}`);
  console.log(`   - Yeni Eklenen Geçmiş: ${newHistories.length}`);
}

importWikidataTurkish()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
