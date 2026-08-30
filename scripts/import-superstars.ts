/**
 * Dünyanın ve Türk futbolunun en ünlü efsanelerinin (Zidane, Zlatan, Figo, Ronaldinho,
 * Arda Turan, Burak Yılmaz, Sneijder, Drogba, Alex, Roberto Carlos, Henry, Beckham vb.)
 * tüm kulüp geçmişlerini Wikidata üzerinden eksiksiz çeker ve veritabanına işler.
 */

import { prisma } from "../lib/db/client";

const SUPERSTAR_NAMES = [
  "Zinédine Zidane", "Zlatan Ibrahimović", "Ronaldinho", "Ronaldo", "Luís Figo",
  "David Beckham", "Thierry Henry", "Dennis Bergkamp", "Wesley Sneijder", "Didier Drogba",
  "Roberto Carlos", "Alex", "Gheorghe Hagi", "Gheorghe Popescu", "Arda Turan",
  "Burak Yılmaz", "Burak Yilmaz", "Sergen Yalçın", "Rüştü Reçber", "Volkan Demirel",
  "Emre Belözoğlu", "Tuncay Şanlı", "Aykut Kocaman", "Oğuz Çetin", "Rıdvan Dilmen",
  "Tanju Çolak", "Fatih Terim", "Mustafa Denizli", "Şenol Güneş", "Selçuk İnan",
  "Samuel Eto'o", "Kaká", "Clarence Seedorf", "Andrea Pirlo", "Gianluigi Buffon",
  "Alessandro Del Piero", "Francesco Totti", "Paolo Maldini", "Andriy Shevchenko",
  "Ruud van Nistelrooy", "Robin van Persie", "Dirk Kuyt", "Pierre van Hooijdonk",
  "Nicolas Anelka", "Mario Gomez", "Guti", "Ricardo Quaresma", "Pepe", "Radamel Falcao",
  "Diego Forlán", "Edinson Cavani", "Luis Suárez", "Neymar", "Kylian Mbappé",
  "Erling Haaland", "Robert Lewandowski", "Karim Benzema", "Gareth Bale", "Mesut Özil",
  "İlkay Gündoğan", "Hakan Çalhanoğlu", "Cenk Tosun", "Enner Valencia", "Mauro Icardi",
  "Dries Mertens", "Edin Džeko", "Dušan Tadić", "Fred", "Lucas Torreira", "Fernando Muslera"
];

async function importSuperstars() {
  console.log("🌟 [Yıldızlar & Efsaneler Geçmişi] Wikidata sorgulanıyor...");

  const formattedValues = SUPERSTAR_NAMES.map((n) => `"${n}"@en "${n}"@tr`).join(" ");

  const query = `
    SELECT DISTINCT ?player ?playerName ?birthDate ?nationalityName ?team ?teamName ?countryName WHERE {
      VALUES ?targetName { ${formattedValues} }
      ?player rdfs:label ?targetName .
      ?player wdt:P106 wd:Q937857 .
      
      ?player p:P54 ?statement .
      ?statement ps:P54 ?team .
      
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

  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FootballQuizApp/1.0 (https://github.com/oguzgucuk/football-quiz; support@footballquiz.app)",
      Accept: "application/sparql-results+json",
    },
  });

  const data = await response.json();
  const bindings = data.results.bindings;
  console.log(`➡️ ${bindings.length} efsane kariyer kaydı alındı.`);

  // Mevcut takımlar ve oyuncular
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
    const nationality = b.nationalityName?.value.trim() || null;
    const country = b.countryName?.value.trim() || "International";

    let dbTeamId = teamNameMap.get(tName.toLowerCase());
    if (!dbTeamId) {
      const newT = await prisma.team.create({
        data: { name: tName, country, league: "Club" },
      });
      dbTeamId = newT.id;
      teamNameMap.set(tName.toLowerCase(), dbTeamId);
      addedTeams++;
    }

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

  console.log(`➡️ ${newHistories.length} yeni kulüp-oyuncu eşleşmesi ekleniyor...`);
  const BATCH = 2000;
  for (let i = 0; i < newHistories.length; i += BATCH) {
    await prisma.playerTeamHistory.createMany({
      data: newHistories.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  console.log(`🎉 [Efsaneler Tamamlandı] Yeni Takım: ${addedTeams}, Yeni Oyuncu: ${addedPlayers}, Yeni Eşleşme: ${newHistories.length}`);
}

importSuperstars()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
