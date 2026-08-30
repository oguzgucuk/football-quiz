/**
 * Dünyanın ve Türk futbolunun en efsanevi oyuncularını kesin Wikidata Q-ID'leri ile sorgular,
 * oynadıkları tüm takımları (gençlik, A takım, transferler) eksiksiz veritabanına bağlar.
 */

import { prisma } from "../lib/db/client";

const LEGEND_QIDS: { qId: string; canonicalName: string }[] = [
  // --- DÜNYA EFSANELERİ ---
  { qId: "Q1835", canonicalName: "Zinédine Zidane" },
  { qId: "Q768", canonicalName: "Ronaldinho" },
  { qId: "Q1050", canonicalName: "Pelé" },
  { qId: "Q10264", canonicalName: "Diego Maradona" },
  { qId: "Q17263", canonicalName: "Johan Cruyff" },
  { qId: "Q5292", canonicalName: "Ronaldo" },
  { qId: "Q80444", canonicalName: "Luís Figo" },
  { qId: "Q10520", canonicalName: "David Beckham" },
  { qId: "Q45901", canonicalName: "Thierry Henry" },
  { qId: "Q18645", canonicalName: "Dennis Bergkamp" },
  { qId: "Q483577", canonicalName: "Rivaldo" },
  { qId: "Q531814", canonicalName: "Kaká" },
  { qId: "Q179854", canonicalName: "Roberto Carlos" },
  { qId: "Q178665", canonicalName: "Cafu" },
  { qId: "Q21262", canonicalName: "Roberto Baggio" },
  { qId: "Q48362", canonicalName: "Paolo Maldini" },
  { qId: "Q41244", canonicalName: "Andriy Shevchenko" },
  { qId: "Q178877", canonicalName: "Ruud Gullit" },
  { qId: "Q483629", canonicalName: "Marco van Basten" },
  { qId: "Q18683", canonicalName: "Frank Rijkaard" },
  { qId: "Q173139", canonicalName: "George Weah" },
  { qId: "Q11571", canonicalName: "Raúl" },
  { qId: "Q11584", canonicalName: "Iker Casillas" },
  { qId: "Q17500", canonicalName: "Xavi" },
  { qId: "Q44182", canonicalName: "Andrés Iniesta" },
  { qId: "Q4434", canonicalName: "Carles Puyol" },
  { qId: "Q48332", canonicalName: "Sergio Ramos" },
  { qId: "Q5613", canonicalName: "Gerard Piqué" },
  { qId: "Q172721", canonicalName: "Dani Alves" },
  { qId: "Q134183", canonicalName: "Marcelo" },
  { qId: "Q70122", canonicalName: "Karim Benzema" },
  { qId: "Q1512", canonicalName: "Robert Lewandowski" },
  { qId: "Q26517", canonicalName: "Luis Suárez" },
  { qId: "Q142794", canonicalName: "Neymar" },
  { qId: "Q21621995", canonicalName: "Kylian Mbappé" },
  { qId: "Q55760019", canonicalName: "Erling Haaland" },
  { qId: "Q312724", canonicalName: "Harry Kane" },
  { qId: "Q160538", canonicalName: "Wesley Sneijder" },
  { qId: "Q48892", canonicalName: "Didier Drogba" },
  { qId: "Q193074", canonicalName: "Nicolas Anelka" },
  { qId: "Q17797", canonicalName: "Robin van Persie" },
  { qId: "Q186414", canonicalName: "Dirk Kuyt" },
  { qId: "Q295627", canonicalName: "Pierre van Hooijdonk" },
  { qId: "Q192994", canonicalName: "Guti" },
  { qId: "Q188241", canonicalName: "Ricardo Quaresma" },
  { qId: "Q483868", canonicalName: "Pepe" },

  // --- TÜRK FUTBOL EFSANELERİ ---
  { qId: "Q21295", canonicalName: "Gheorghe Hagi" },
  { qId: "Q314981", canonicalName: "Gheorghe Popescu" },
  { qId: "Q312878", canonicalName: "Alex de Souza" },
  { qId: "Q188981", canonicalName: "Hakan Şükür" },
  { qId: "Q208573", canonicalName: "Rüştü Reçber" },
  { qId: "Q354228", canonicalName: "Sergen Yalçın" },
  { qId: "Q217457", canonicalName: "Emre Belözoğlu" },
  { qId: "Q219954", canonicalName: "Nihat Kahveci" },
  { qId: "Q318020", canonicalName: "Tugay Kerimoğlu" },
  { qId: "Q361581", canonicalName: "İlhan Mansız" },
  { qId: "Q221295", canonicalName: "Tuncay Şanlı" },
  { qId: "Q187178", canonicalName: "Arda Turan" },
  { qId: "Q34987", canonicalName: "Burak Yılmaz" },
  { qId: "Q482701", canonicalName: "Cenk Tosun" },
  { qId: "Q1386733", canonicalName: "Hakan Çalhanoğlu" },
  { qId: "Q27049187", canonicalName: "Cengiz Ünder" },
  { qId: "Q28731737", canonicalName: "Yusuf Yazıcı" },
  { qId: "Q101248408", canonicalName: "Kerem Aktürkoğlu" },
  { qId: "Q108695022", canonicalName: "Arda Güler" },
  { qId: "Q113575459", canonicalName: "Kenan Yıldız" },
  { qId: "Q26704987", canonicalName: "Ferdi Kadıoğlu" },
  { qId: "Q108534063", canonicalName: "Barış Alper Yılmaz" },
  { qId: "Q117751996", canonicalName: "Semih Kılıçsoy" },
];

async function importAllSuperstarsByQid() {
  console.log("🌟 [Kesin Q-ID Efsaneler Yükleyici] Başlatılıyor...");

  const qIdsClause = LEGEND_QIDS.map((l) => `wd:${l.qId}`).join(" ");

  const query = `
    SELECT DISTINCT ?player ?team ?teamName ?countryName ?birthDate ?nationalityName WHERE {
      VALUES ?player { ${qIdsClause} }
      
      ?player p:P54 ?statement .
      ?statement ps:P54 ?team .
      ?team rdfs:label ?teamName FILTER(LANG(?teamName) = "tr" || LANG(?teamName) = "en") .
      
      OPTIONAL { ?player wdt:P569 ?birthDate . }
      OPTIONAL {
        ?player wdt:P27 ?nationality .
        ?nationality rdfs:label ?nationalityName FILTER(LANG(?nationalityName) = "tr" || LANG(?nationalityName) = "en") .
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
  console.log(`➡️ ${bindings.length} efsane transfer ve kulüp kaydı alındı.`);

  const qIdToCanonical = new Map<string, string>();
  for (const l of LEGEND_QIDS) {
    qIdToCanonical.set(l.qId, l.canonicalName);
  }

  // DB takımları ve oyuncuları al
  const [teams, players, histories] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, externalRef: true } }),
    prisma.player.findMany({ select: { id: true, fullName: true, externalRef: true } }),
    prisma.playerTeamHistory.findMany({ select: { playerId: true, teamId: true } }),
  ]);

  const teamRefMap = new Map<string, string>();
  const teamNameMap = new Map<string, string>();
  for (const t of teams) {
    if (t.externalRef) teamRefMap.set(t.externalRef, t.id);
    teamNameMap.set(t.name.trim().toLowerCase(), t.id);
  }

  const playerRefMap = new Map<string, string>();
  const playerNameMap = new Map<string, string>();
  for (const p of players) {
    if (p.externalRef) playerRefMap.set(p.externalRef, p.id);
    playerNameMap.set(p.fullName.trim().toLowerCase(), p.id);
  }

  const historySet = new Set<string>();
  for (const h of histories) {
    historySet.add(`${h.playerId}_${h.teamId}`);
  }

  let addedPlayers = 0;
  let addedTeams = 0;
  const newHistories: { playerId: string; teamId: string; isNationalTeam: boolean }[] = [];

  for (const b of bindings) {
    const playerQid = b.player.value.split("/").pop()!;
    const teamQid = b.team.value.split("/").pop()!;
    const canonicalName = qIdToCanonical.get(playerQid) || "Efsane Oyuncu";
    const teamName = b.teamName.value.trim();
    const country = b.countryName?.value.trim() || "International";
    const nationality = b.nationalityName?.value.trim() || null;

    // Takımı bul veya oluştur
    let dbTeamId = teamRefMap.get(`wikidata:${teamQid}`) || teamNameMap.get(teamName.toLowerCase());
    if (!dbTeamId) {
      const newT = await prisma.team.create({
        data: { name: teamName, country, league: "Club", externalRef: `wikidata:${teamQid}` },
      });
      dbTeamId = newT.id;
      teamRefMap.set(`wikidata:${teamQid}`, dbTeamId);
      teamNameMap.set(teamName.toLowerCase(), dbTeamId);
      addedTeams++;
    }

    // Oyuncuyu bul veya oluştur
    let dbPlayerId = playerRefMap.get(`wikidata:${playerQid}`) || playerNameMap.get(canonicalName.toLowerCase());
    if (!dbPlayerId) {
      const birth = b.birthDate ? new Date(b.birthDate.value) : null;
      const newP = await prisma.player.create({
        data: {
          fullName: canonicalName,
          nationality,
          birthDate: isNaN(birth?.getTime() ?? NaN) ? null : birth,
          externalRef: `wikidata:${playerQid}`,
        },
      });
      dbPlayerId = newP.id;
      playerRefMap.set(`wikidata:${playerQid}`, dbPlayerId);
      playerNameMap.set(canonicalName.toLowerCase(), dbPlayerId);
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

  console.log(`➡️ ${newHistories.length} yeni transfer geçmişi yazılıyor...`);
  const BATCH = 2000;
  for (let i = 0; i < newHistories.length; i += BATCH) {
    await prisma.playerTeamHistory.createMany({
      data: newHistories.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  console.log(`🎉 [Q-ID Efsaneler Yüklendi] Yeni Takım: ${addedTeams}, Yeni Oyuncu: ${addedPlayers}, Yeni Eşleşme: ${newHistories.length}`);
}

importAllSuperstarsByQid()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
