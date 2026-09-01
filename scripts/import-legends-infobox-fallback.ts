/**
 * MADDE 1.8: POPÜLER EFSANELER İÇİN WIKIDATA / WIKIPEDIA INFOBOX FALLBACK MOTORU
 * 
 * Kaggle'da sadece son kulübü kayıtlı kalan efsanelerin (Eden Hazard, Wayne Rooney,
 * Gonzalo Higuaín, Andrés Iniesta, Fernando Torres, Marcelo, Cesc Fàbregas, Carlos Tevez,
 * David Villa, Zlatan, Nihat Kahveci vb.) tüm kariyer geçmişini Wikidata P54'ten çeker
 * ve veritabanındaki ana kulüplere bağlar.
 */

import { prisma } from "../lib/db/client";
import { calculatePlayerPopularity } from "../lib/popularity/calculatePopularity";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Oyuncunun Wikidata Entity IDsini bul
async function findWikidataEntity(playerName: string, wikidataId?: string | null): Promise<string | null> {
  if (wikidataId && wikidataId.startsWith("Q")) return wikidataId;

  // Hem orijinal hem normalize isimle dene
  const normalizedName = playerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const searchTerms = Array.from(new Set([playerName, normalizedName]));

  for (const term of searchTerms) {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      term
    )}&language=en&format=json`;

    try {
      await sleep(150);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "FootballQuizBot/1.0 (https://github.com/oguzgucuk/football-quiz; admin@example.com)",
          Accept: "application/json",
        },
      });

      if (!res.ok) continue;
      const text = await res.text();
      if (!text.startsWith("{")) continue;
      const data = JSON.parse(text);
      const results = data.search as { id: string; description?: string }[];

      if (!results || results.length === 0) continue;

      const match = results.find(
        (r) =>
          r.description?.toLowerCase().includes("football") ||
          r.description?.toLowerCase().includes("futbol") ||
          r.description?.toLowerCase().includes("association football") ||
          r.description?.toLowerCase().includes("soccer")
      );

      if (match) return match.id;
      if (results[0]) return results[0].id;
    } catch {
      continue;
    }
  }

  return null;
}

// QID'den tüm P54 kulüp QID'lerini ve isimlerini getir
async function getPlayerCareerClubs(qid: string): Promise<string[]> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;

  try {
    await sleep(150);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FootballQuizBot/1.0 (https://github.com/oguzgucuk/football-quiz; admin@example.com)",
        Accept: "application/json",
      },
    });

    if (!res.ok) return [];
    const text = await res.text();
    if (!text.startsWith("{")) return [];
    const data = JSON.parse(text);
    const entity = data.entities?.[qid];
    if (!entity || !entity.claims?.P54) return [];

    const clubQids: string[] = [];
    for (const claim of entity.claims.P54) {
      const targetId = claim.mainsnak?.datavalue?.value?.id;
      if (targetId && targetId.startsWith("Q")) {
        clubQids.push(targetId);
      }
    }

    return clubQids;
  } catch {
    return [];
  }
}

// Kulüp QID'sini DB'deki kulüple eşleştir
async function matchClubInDb(clubQid: string): Promise<{ id: string; name: string; popularityScore: number } | null> {
  // 1. externalRef veya aliases içinde var mı?
  const direct = await prisma.team.findFirst({
    where: {
      OR: [{ externalRef: clubQid }, { aliases: { has: clubQid } }],
    },
    select: { id: true, name: true, popularityScore: true },
  });
  if (direct) return direct;

  // 2. Wikidata'dan kulüp ismini al ve DB'de ara
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${clubQid}.json`;
  try {
    await sleep(100);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FootballQuizBot/1.0 (https://github.com/oguzgucuk/football-quiz; admin@example.com)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const d = await res.json();
    const ce = d.entities?.[clubQid];
    if (!ce) return null;

    const trName = ce.labels?.tr?.value;
    const enName = ce.labels?.en?.value;
    const aliases = (ce.aliases?.en || []).map((a: { value: string }) => a.value);

    const candidates = [trName, enName, ...aliases].filter(Boolean) as string[];

    for (const cName of candidates) {
      const matched = await prisma.team.findFirst({
        where: {
          OR: [
            { name: { equals: cName, mode: "insensitive" } },
            { aliases: { has: cName } },
          ],
        },
        select: { id: true, name: true, popularityScore: true },
      });

      if (matched) {
        // Kulübün aliases listesine QID'yi kaydet ki bir daha sormasın
        await prisma.team.update({
          where: { id: matched.id },
          data: { aliases: { push: clubQid } },
        });
        return matched;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function runInfoboxFallback() {
  console.log("🚀 [Madde 1.8 Fallback Motoru] Eksik Kulüplü Popüler Efsaneler Kurtarılıyor...\n");

  // Yüksek popülerlikli veya piyasa değerli olup <= 1 kulübü olan futbolcuları seç
  const suspiciousPlayers = await prisma.$queryRaw<
    { id: string; full_name: string; popularity_score: number; market_value_eur: number; wikidata_id: string | null }[]
  >`
    SELECT 
      p.id, 
      p.full_name, 
      p.popularity_score, 
      p.market_value_eur,
      p.wikidata_id
    FROM players p
    LEFT JOIN player_team_history h ON h.player_id = p.id
    GROUP BY p.id, p.full_name, p.popularity_score, p.market_value_eur, p.wikidata_id
    HAVING COUNT(h.id) <= 1
    ORDER BY p.popularity_score DESC
    LIMIT 60;
  `;

  console.log(`📋 İncelenecek ${suspiciousPlayers.length} Popüler Futbolcu Belirlendi:\n`);

  let totalLinked = 0;

  for (const player of suspiciousPlayers) {
    console.log(`⚽ Futbolcu: ${player.full_name} (Puan: ${player.popularity_score}/100)`);

    const qid = await findWikidataEntity(player.full_name, player.wikidata_id);
    if (!qid) {
      console.log(`   ⚠️ Wikidata Entity bulunamadı.`);
      continue;
    }

    const clubQids = await getPlayerCareerClubs(qid);
    console.log(`   🔎 Wikidata'da ${clubQids.length} kulüp kaydı bulundu.`);

    let addedClubs = 0;
    for (const cQid of clubQids) {
      const dbClub = await matchClubInDb(cQid);
      if (dbClub) {
        const exists = await prisma.playerTeamHistory.findFirst({
          where: { playerId: player.id, teamId: dbClub.id },
        });

        if (!exists) {
          await prisma.playerTeamHistory.create({
            data: {
              playerId: player.id,
              teamId: dbClub.id,
            },
          });
          console.log(`     🔗 Bağlandı: ${player.full_name} -> ${dbClub.name}`);
          addedClubs++;
          totalLinked++;
        }
      }
    }

    // Popülerlik puanını formülle güncelle
    const updatedHistory = await prisma.playerTeamHistory.findMany({
      where: { playerId: player.id },
      include: { team: true },
    });

    let maxPrestige = 10;
    for (const th of updatedHistory) {
      if (th.team.popularityScore > maxPrestige) {
        maxPrestige = th.team.popularityScore;
      }
    }

    const newScore = calculatePlayerPopularity({
      marketValueEur: player.market_value_eur || 0,
      transferCount: updatedHistory.length,
      maxClubPrestige: maxPrestige,
    });

    try {
      await prisma.player.update({
        where: { id: player.id },
        data: {
          wikidataId: qid,
          popularityScore: newScore,
        },
      });
    } catch {
      await prisma.player.update({
        where: { id: player.id },
        data: {
          popularityScore: newScore,
        },
      });
    }

    console.log(`   📈 Otomatik Yeni Popülerlik Puanı: ${newScore}/100 (${updatedHistory.length} Kulüp)\n`);
  }

  console.log(`🎉 [TAMAMLANDI] Toplam ${totalLinked} Eksik Transfer Başarıyla Veritabanına Eklendi!`);
}

runInfoboxFallback()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
