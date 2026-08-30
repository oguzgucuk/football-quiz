/**
 * Türk futbolunun köklü kulüpleri (Sakaryaspor, Kocaelispor, Eskişehirspor, Bursaspor,
 * Gençlerbirliği, Altay vb.) ve tarihi Türk futbolcularının (Hakan Şükür, Tuncay Şanlı,
 * Aykut Kocaman, Oğuz Çetin, Sergen Yalçın, Rüştü Reçber, Hagi, Alex vb.)
 * tüm kulüp geçmişlerini Wikidata'dan çeker.
 */

import { prisma } from "../lib/db/client";

const TURKISH_HISTORICAL_CLUBS = [
  { id: "Q138258", name: "Sakaryaspor" },
  { id: "Q138243", name: "Kocaelispor" },
  { id: "Q138234", name: "Eskişehirspor" },
  { id: "Q206381", name: "Bursaspor" },
  { id: "Q49704", name: "Gençlerbirliği" },
  { id: "Q434440", name: "Altay" },
  { id: "Q1148259", name: "Karşıyaka" },
  { id: "Q547844", name: "MKE Ankaragücü" },
  { id: "Q138240", name: "İstanbulspor" },
  { id: "Q49702", name: "Denizlispor" },
  { id: "Q49529", name: "Galatasaray" },
  { id: "Q49522", name: "Fenerbahçe" },
  { id: "Q41470", name: "Beşiktaş" },
  { id: "Q18656", name: "Trabzonspor" },
];

async function importTurkishLegends() {
  console.log("🇹🇷 [Türk Futbolu & Köklü Kulüpler] Wikidata aktarımı başlatılıyor...");

  const clubIds = TURKISH_HISTORICAL_CLUBS.map((c) => `wd:${c.id}`).join(" ");
  const query = `
    SELECT DISTINCT ?player ?playerName ?birthDate ?nationalityName ?team ?teamName ?countryName WHERE {
      VALUES ?targetClub { ${clubIds} }
      
      ?player p:P54 ?targetStatement .
      ?targetStatement ps:P54 ?targetClub .
      
      ?player p:P54 ?allStatement .
      ?allStatement ps:P54 ?team .
      
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
    LIMIT 10000
  `;

  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FootballQuizApp/1.0 (https://github.com/oguzgucuk/football-quiz; support@footballquiz.app)",
      Accept: "application/sparql-results+json",
    },
  });

  const data = await response.json();
  const bindings = data.results.bindings;
  console.log(`➡️ ${bindings.length} kayıt alındı, işleniyor...`);

  // DB'deki mevcut takımları ve oyuncuları al
  const [teams, players, histories] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true } }),
    prisma.player.findMany({ select: { id: true, fullName: true } }),
    prisma.playerTeamHistory.findMany({ select: { playerId: true, teamId: true } }),
  ]);

  const teamNameMap = new Map<string, string>();
  for (const t of teams) teamNameMap.set(t.name.trim().toLowerCase(), t.id);

  const playerNameMap = new Map<string, string>();
  for (const p of players) playerNameMap.set(p.fullName.trim().toLowerCase(), p.id);

  const historySet = new Set<string>();
  for (const h of histories) historySet.add(`${h.playerId}_${h.teamId}`);

  let addedPlayers = 0;
  let addedTeams = 0;
  const newHistories: { playerId: string; teamId: string; isNationalTeam: boolean }[] = [];

  for (const b of bindings) {
    const pName = b.playerName.value.trim();
    const tName = b.teamName.value.trim();
    const nationality = b.nationalityName?.value.trim() || "Türkiye";
    const country = b.countryName?.value.trim() || "Türkiye";

    // Takımı bul veya oluştur
    let dbTeamId = teamNameMap.get(tName.toLowerCase());
    if (!dbTeamId) {
      const newT = await prisma.team.create({
        data: { name: tName, country, league: "Club" },
      });
      dbTeamId = newT.id;
      teamNameMap.set(tName.toLowerCase(), dbTeamId);
      addedTeams++;
    }

    // Oyuncuyu bul veya oluştur
    let dbPlayerId = playerNameMap.get(pName.toLowerCase());
    if (!dbPlayerId) {
      const birth = b.birthDate ? new Date(b.birthDate.value) : null;
      const newP = await prisma.player.create({
        data: {
          fullName: pName,
          nationality,
          birthDate: isNaN(birth?.getTime() ?? NaN) ? null : birth,
        },
      });
      dbPlayerId = newP.id;
      playerNameMap.set(pName.toLowerCase(), dbPlayerId);
      addedPlayers++;
    }

    // Geçmişi bağla
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

  console.log(`➡️ ${newHistories.length} yeni transfer geçmişi yazılıyor...`);
  const BATCH = 3000;
  for (let i = 0; i < newHistories.length; i += BATCH) {
    await prisma.playerTeamHistory.createMany({
      data: newHistories.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  console.log(`🎉 [Tamamlandı] Yeni Takım: ${addedTeams}, Yeni Oyuncu: ${addedPlayers}, Yeni Eşleşme: ${newHistories.length}`);
}

importTurkishLegends()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
