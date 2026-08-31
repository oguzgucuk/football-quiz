/**
 * BULK WIKIDATA HISTORICAL FOOTBALL PIPELINE
 * 
 * Türkiye ve Avrupa'nın en büyük 80+ kulübünde son 50 yılda oynamış
 * TÜM tarihi/emekli futbolcuları ve kariyerlerindeki tüm takımları
 * Wikidata'dan otomatik olarak çeker ve DB'ye bağlar.
 */

import { prisma } from "../lib/db/client";

// En çok oynanan ve tarihi olan 80+ elit kulüp QID'leri
const TARGET_ELITE_CLUBS = [
  // Türkiye
  { qid: "Q41470", name: "Beşiktaş" },
  { qid: "Q49522", name: "Fenerbahçe" },
  { qid: "Q49529", name: "Galatasaray" },
  { qid: "Q18656", name: "Trabzonspor" },
  { qid: "Q206381", name: "Bursaspor" },
  { qid: "Q49704", name: "Gençlerbirliği" },
  { qid: "Q138234", name: "Eskişehirspor" },
  { qid: "Q138258", name: "Sakaryaspor" },
  { qid: "Q138243", name: "Kocaelispor" },
  { qid: "Q547844", name: "MKE Ankaragücü" },
  { qid: "Q138240", name: "İstanbulspor" },
  { qid: "Q434440", name: "Altay" },
  { qid: "Q1148259", name: "Karşıyaka" },
  { qid: "Q283556", name: "Göztepe" },
  { qid: "Q435345", name: "İstanbul Başakşehir" },
  { qid: "Q49702", name: "Denizlispor" },
  { qid: "Q332212", name: "Samsunspor" },
  { qid: "Q780829", name: "Kayserispor" },
  { qid: "Q856239", name: "Konyaspor" },
  { qid: "Q49708", name: "Antalyaspor" },
  { qid: "Q49706", name: "Sivasspor" },
  { qid: "Q138237", name: "Gaziantepspor" },
  { qid: "Q138245", name: "Malatyaspor" },

  // İspanya
  { qid: "Q8682", name: "Real Madrid" },
  { qid: "Q7156", name: "FC Barcelona" },
  { qid: "Q8701", name: "Atlético Madrid" },
  { qid: "Q10315", name: "Real Sociedad" },
  { qid: "Q12294", name: "Villarreal CF" },
  { qid: "Q8951", name: "Valencia CF" },
  { qid: "Q8970", name: "Sevilla FC" },
  { qid: "Q8687", name: "Real Betis" },
  { qid: "Q8684", name: "Athletic Bilbao" },
  { qid: "Q8723", name: "RCD Espanyol" },
  { qid: "Q8704", name: "Deportivo La Coruña" },
  { qid: "Q8758", name: "Celta de Vigo" },
  { qid: "Q8823", name: "RCD Mallorca" },
  { qid: "Q10309", name: "Málaga CF" },

  // İngiltere
  { qid: "Q18656", name: "Manchester United" },
  { qid: "Q1130849", name: "Liverpool FC" },
  { qid: "Q9617", name: "Arsenal FC" },
  { qid: "Q9616", name: "Chelsea FC" },
  { qid: "Q50602", name: "Manchester City" },
  { qid: "Q18741", name: "Tottenham Hotspur" },
  { qid: "Q18716", name: "Newcastle United" },
  { qid: "Q5794", name: "Everton FC" },
  { qid: "Q18721", name: "Aston Villa" },
  { qid: "Q19446", name: "Leeds United" },
  { qid: "Q19607", name: "West Ham United" },
  { qid: "Q19449", name: "Blackburn Rovers" },
  { qid: "Q18736", name: "Leicester City" },
  { qid: "Q19456", name: "Southampton FC" },

  // İtalya
  { qid: "Q1574", name: "Juventus" },
  { qid: "Q12261", name: "Inter Milan" },
  { qid: "Q1543", name: "AC Milan" },
  { qid: "Q2739", name: "AS Roma" },
  { qid: "Q2609", name: "SS Lazio" },
  { qid: "Q2625", name: "SSC Napoli" },
  { qid: "Q2897", name: "ACF Fiorentina" },
  { qid: "Q2764", name: "Torino FC" },
  { qid: "Q2697", name: "Parma Calcio" },
  { qid: "Q2470", name: "UC Sampdoria" },
  { qid: "Q2687", name: "Udinese Calcio" },
  { qid: "Q2807", name: "Bologna FC" },
  { qid: "Q2672", name: "Atalanta BC" },

  // Almanya
  { qid: "Q15789", name: "Bayern München" },
  { qid: "Q41420", name: "Borussia Dortmund" },
  { qid: "Q104761", name: "Bayer 04 Leverkusen" },
  { qid: "Q4578", name: "FC Schalke 04" },
  { qid: "Q17011", name: "SV Werder Bremen" },
  { qid: "Q3824", name: "Eintracht Frankfurt" },
  { qid: "Q51974", name: "Hamburger SV" },
  { qid: "Q4138", name: "VfB Stuttgart" },
  { qid: "Q101859", name: "Borussia Mönchengladbach" },
  { qid: "Q102450", name: "1. FC Köln" },
  { qid: "Q102428", name: "1. FC Kaiserslautern" },
  { qid: "Q101852", name: "VfL Wolfsburg" },

  // Fransa
  { qid: "Q483020", name: "Paris Saint-Germain" },
  { qid: "Q132885", name: "Olympique de Marseille" },
  { qid: "Q704", name: "Olympique Lyonnais" },
  { qid: "Q180305", name: "AS Monaco" },
  { qid: "Q2805", name: "LOSC Lille" },
  { qid: "Q19516", name: "Girondins de Bordeaux" },
  { qid: "Q2702", name: "AS Saint-Étienne" },

  // Hollanda, Portekiz, İskoçya ve Diğerleri
  { qid: "Q81888", name: "AFC Ajax" },
  { qid: "Q11993", name: "PSV Eindhoven" },
  { qid: "Q25424", name: "Feyenoord" },
  { qid: "Q128446", name: "FC Porto" },
  { qid: "Q131499", name: "SL Benfica" },
  { qid: "Q75729", name: "Sporting CP" },
  { qid: "Q19593", name: "Celtic FC" },
  { qid: "Q19597", name: "Rangers FC" },
  { qid: "Q17294", name: "RSC Anderlecht" },
  { qid: "Q18535", name: "Club Brugge" },
  { qid: "Q206013", name: "Olympiacos FC" },
  { qid: "Q201584", name: "Panathinaikos FC" },
  { qid: "Q172470", name: "FC Dynamo Kyiv" },
  { qid: "Q172969", name: "FC Shakhtar Donetsk" },
  { qid: "Q191158", name: "Boca Juniors" },
  { qid: "Q15799", name: "River Plate" },
  { qid: "Q17479", name: "Santos FC" },
  { qid: "Q18081", name: "CR Flamengo" },
  { qid: "Q18073", name: "São Paulo FC" },
];

async function fetchWikidataBatch(clubQids: string[]) {
  const qidValues = clubQids.map((id) => `wd:${id}`).join(" ");

  const sparql = `
    SELECT DISTINCT ?player ?playerName ?birthDate ?nationalityName ?team ?teamName ?countryName WHERE {
      VALUES ?targetClub { ${qidValues} }
      
      # Hedef kulüplerden birinde oynamış oyuncular
      ?player p:P54 ?targetStatement .
      ?targetStatement ps:P54 ?targetClub .
      
      # Bu oyuncuların oynadığı TÜM kulüpler (tarihi kariyeri)
      ?player p:P54 ?allStatement .
      ?allStatement ps:P54 ?team .
      
      # İsimler
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

  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sparql);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FootballQuizApp/1.0 (https://github.com/oguzgucuk/football-quiz; support@footballquiz.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata HTTP Hatası: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.results?.bindings || [];
}

export async function runBulkHistoryImport() {
  console.log("🚀 [Bulk Wikidata Pipeline] Tarihi Kulüp ve Futbolcu Aktarımı Başlıyor...\n");

  // 10'arlı paketler halinde sorgulayalım (Wikidata timeout'una takılmamak için)
  const batchSize = 8;
  const allClubs = TARGET_ELITE_CLUBS;

  let totalNewPlayers = 0;
  let totalNewHistories = 0;
  let totalNewClubs = 0;

  for (let i = 0; i < allClubs.length; i += batchSize) {
    const batch = allClubs.slice(i, i + batchSize);
    const clubNames = batch.map((c) => c.name).join(", ");
    console.log(`\n📦 [Paket ${Math.floor(i / batchSize) + 1}/${Math.ceil(allClubs.length / batchSize)}] Sorgulanıyor: ${clubNames}`);

    try {
      const bindings = await fetchWikidataBatch(batch.map((c) => c.qid));
      console.log(`   📥 Wikidata'dan ${bindings.length} transfer satırı çekildi. DB'ye işleniyor...`);

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
        const playerName = row.playerName?.value;
        const teamName = row.teamName?.value;
        if (!playerName || !teamName) continue;

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

      console.log(`   ⚽ ${playersMap.size} tekil oyuncu bulundu. Veritabanına aktarılıyor...`);

      for (const [pQid, pData] of playersMap) {
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
          totalNewPlayers++;
        } else {
          if (!player.wikidataId) {
            await prisma.player.update({
              where: { id: player.id },
              data: { wikidataId: pQid },
            });
          }
        }

        // 2. Takımları ve transfer geçmişlerini bağla
        for (const t of pData.teams) {
          const lowerName = t.name.toLowerCase();
          if (
            lowerName.includes("national") ||
            lowerName.includes("millî") ||
            lowerName.includes("milli") ||
            lowerName.includes("under-") ||
            lowerName.includes("yaş altı") ||
            lowerName.includes("u-21") ||
            lowerName.includes("u-19")
          ) {
            continue;
          }

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
                league: "Classic / Historical",
              },
            });
            totalNewClubs++;
          }

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
            totalNewHistories++;
          }
        }
      }

      console.log(`   ✅ Paket tamamlandı. (Toplam Eklenen: +${totalNewPlayers} Oyuncu, +${totalNewHistories} Transfer)`);
    } catch (err) {
      console.error(`   ❌ Paket işlenirken hata oluştu:`, err);
    }

    // Wikidata rate limit'ine takılmamak için 2 sn ara ver
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n🎉 [TAMAMLANDI] Toplam +${totalNewPlayers} Yeni Oyuncu, +${totalNewClubs} Yeni Kulüp ve +${totalNewHistories} Yeni Transfer Geçmişi Veritabanına Eklendi!`);
}

// Doğrudan çağrılırsa çalıştır
if (require.main === module) {
  runBulkHistoryImport()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
