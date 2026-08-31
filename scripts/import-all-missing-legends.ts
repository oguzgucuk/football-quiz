/**
 * Eksik kalan ikonik Türk ve Dünya futbol efsanelerini (Nihat Kahveci, Zidane, Figo,
 * Zlatan, Tugay, Nuri Şahin, Hamit Altıntop, Ballack, Crespo, Forlan, Kaká, Rivaldo vb.)
 * Wikidata'dan tüm kulüp kariyerleriyle birlikte çeker ve DB'ye ekler.
 */

import { prisma } from "../lib/db/client";

const ICONIC_LEGEND_QIDS = [
  { qid: "Q297500", name: "Nihat Kahveci" },
  { qid: "Q1835", name: "Zinedine Zidane" },
  { qid: "Q8024", name: "Luís Figo" },
  { qid: "Q46896", name: "Zlatan Ibrahimović" },
  { qid: "Q449419", name: "Tugay Kerimoğlu" },
  { qid: "Q207431", name: "Nuri Şahin" },
  { qid: "Q13494", name: "Hamit Altıntop" },
  { qid: "Q154271", name: "Halil Altıntop" },
  { qid: "Q11935", name: "Michael Ballack" },
  { qid: "Q160549", name: "Hernán Crespo" },
  { qid: "Q155378", name: "Diego Forlán" },
  { qid: "Q483577", name: "Rivaldo" },
  { qid: "Q10584", name: "Ronaldinho" },
  { qid: "Q531814", name: "Kaká" },
  { qid: "Q173021", name: "Patrick Vieira" },
  { qid: "Q43913", name: "Arjen Robben" },
  { qid: "Q312664", name: "Alpay Özalan" },
  { qid: "Q344583", name: "İlhan Mansız" },
  { qid: "Q316498", name: "Ümit Davala" },
  { qid: "Q361303", name: "Hasan Şaş" },
  { qid: "Q435345", name: "Okan Buruk" },
  { qid: "Q349970", name: "Tayfun Korkut" },
];

async function importMissingLegends() {
  console.log("⭐ [Efsaneler Aktarımı] Wikidata üzerinden çekiliyor...\n");

  const qidFilter = ICONIC_LEGEND_QIDS.map((l) => `wd:${l.qid}`).join(" ");

  const query = `
    SELECT DISTINCT ?player ?playerName ?birthDate ?nationalityName ?team ?teamName ?countryName WHERE {
      VALUES ?player { ${qidFilter} }
      
      ?player p:P54 ?statement .
      ?statement ps:P54 ?team .
      
      ?player rdfs:label ?playerName FILTER(LANG(?playerName) = "tr" || LANG(?playerName) = "en") .
      ?team rdfs:label ?teamName FILTER(LANG(?teamName) = "tr" || LANG(?teamName) = "en") .
      
      OPTIONAL { ?player wdt:P569 ?birthDate . }
      OPTIONAL {
        ?player wdt:P27 ?nationality .
        ?nationality rdfs:label ?nationalityName FILTER(LANG(?nationalityName) = "tr" || LANG(?nationalityName) = "en") .
      }
      OPTIONAL {
        ?team wdt:P17 ?country .
        ?country rdfs:label ?countryName FILTER(LANG(?countryName) = "tr" || LANG(?countryName) = "en") .
      }
    }
  `;

  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "FootballQuizApp/1.0 (https://github.com/oguzgucuk/football-quiz; support@footballquiz.app)",
    },
  });

  if (!res.ok) {
    throw new Error(`Wikidata SPARQL HTTP error: ${res.status}`);
  }

  const json = await res.json();
  const bindings = json.results?.bindings || [];

  console.log(`📦 Wikidata'dan ${bindings.length} adet transfer kaydı geldi. DB'ye aktarılıyor...\n`);

  // Oyuncuları grupla
  const playersMap = new Map<string, {
    qid: string;
    fullName: string;
    birthDate: Date | null;
    nationality: string | null;
    teams: Array<{ qid: string; name: string; country: string | null }>;
  }>();

  for (const row of bindings) {
    const playerQid = row.player.value.split("/").pop()!;
    const teamQid = row.team.value.split("/").pop()!;
    const playerName = row.playerName?.value || "Bilinmeyen";
    const teamName = row.teamName?.value || "Bilinmeyen";
    const birthDate = row.birthDate?.value ? new Date(row.birthDate.value) : null;
    const nationality = row.nationalityName?.value || null;
    const country = row.countryName?.value || null;

    if (!playersMap.has(playerQid)) {
      playersMap.set(playerQid, {
        qid: playerQid,
        fullName: playerName,
        birthDate,
        nationality,
        teams: [],
      });
    }

    const p = playersMap.get(playerQid)!;
    if (!p.teams.some((t) => t.qid === teamQid)) {
      p.teams.push({ qid: teamQid, name: teamName, country });
    }
  }

  // Kulüpleri ve oyuncuları DB'ye ekle / bağla
  for (const [pQid, pData] of playersMap) {
    console.log(`⚽ İşleniyor: ${pData.fullName} (${pData.teams.length} Kulüp)...`);

    // 1. Oyuncuyu bul veya oluştur
    let player = await prisma.player.findFirst({
      where: {
        OR: [
          { wikidataId: pQid },
          { fullName: { equals: pData.fullName, mode: "insensitive" } },
        ],
      },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          fullName: pData.fullName,
          wikidataId: pQid,
          birthDate: pData.birthDate,
          nationality: pData.nationality,
        },
      });
      console.log(`   ✨ Yeni Oyuncu Eklendi: ${player.fullName}`);
    } else {
      if (!player.wikidataId) {
        await prisma.player.update({
          where: { id: player.id },
          data: { wikidataId: pQid },
        });
      }
    }

    // 2. Takımları ve transfer geçmişini bağla
    for (const t of pData.teams) {
      // Milli takımları kulüp olarak ekleme
      const lowerName = t.name.toLowerCase();
      if (
        lowerName.includes("national") ||
        lowerName.includes("millî") ||
        lowerName.includes("milli") ||
        lowerName.includes("under-") ||
        lowerName.includes("yaş altı")
      ) {
        continue;
      }

      // Kulübü bul veya oluştur
      let team = await prisma.team.findFirst({
        where: {
          OR: [
            { externalRef: t.qid },
            { name: { equals: t.name, mode: "insensitive" } },
            { aliases: { has: t.name } },
          ],
        },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: t.name,
            externalRef: t.qid,
            country: t.country || "Dünya",
            league: "Historical / Classic",
          },
        });
        console.log(`   🏟️ Yeni Kulüp Eklendi: ${team.name}`);
      }

      // Transfer geçmişine ekle
      const existingHistory = await prisma.playerTeamHistory.findFirst({
        where: {
          playerId: player.id,
          teamId: team.id,
        },
      });

      if (!existingHistory) {
        await prisma.playerTeamHistory.create({
          data: {
            playerId: player.id,
            teamId: team.id,
          },
        });
        console.log(`   🔗 Bağlandı: ${player.fullName} -> ${team.name}`);
      }
    }
  }

  console.log("\n🎉 TÜM EFSANE FUTBOLCULAR BAŞARIYLA EKLENDİ VE BAĞLANDI!");
}

importMissingLegends()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
