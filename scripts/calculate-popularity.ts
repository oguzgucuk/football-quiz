/**
 * YÜKSEK PERFORMANSLI POPÜLERLİK HESAPLAYICI (POPULARITY_RANKING.md Spesifikasyonu)
 * 
 * 1. Piyasa Değeri Sinyali (Logaritmik Normalizasyon, %50 ağırlık)
 * 2. Transfer ve Lig Zenginliği (%30 ağırlık)
 * 3. Kulüp Prestij Sinyali (%20 ağırlık)
 * 
 * Tamamen veriden türetilir.
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db/client";

function logNormalize(value: number, maxValue: number): number {
  if (value <= 0) return 0;
  return Math.log(value + 1) / Math.log(maxValue + 1);
}

function linearNormalize(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) return 0;
  return Math.min(value / maxValue, 1);
}

async function runFastPopularityCalculation() {
  console.log("🚀 [Popularity Engine] Yüksek Performanslı Hesaplama Başlatılıyor...\n");
  const startTime = Date.now();

  // ADIM 1: CSV'den Piyasa Değerlerini Oku
  const playersCsvPath = path.join(process.cwd(), "data", "players.csv");
  const playerMarketValues = new Map<string, number>();

  if (fs.existsSync(playersCsvPath)) {
    console.log("📂 [1/4] data/players.csv okunuyor...");
    const rawCsv = fs.readFileSync(playersCsvPath, "utf-8");
    const records = parse(rawCsv, {
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, string>[];

    for (const row of records) {
      const pId = row.player_id;
      const highestVal = parseInt(row.highest_market_value_in_eur, 10) || 0;
      const currentVal = parseInt(row.market_value_in_eur, 10) || 0;
      const val = Math.max(highestVal, currentVal);
      if (pId && val > 0) {
        playerMarketValues.set(pId, val);
      }
    }
    console.log(`   ✅ ${playerMarketValues.size} oyuncunun piyasa değeri okundu.`);
  }

  // ADIM 2: Kulüplerin Kadro Değerlerini ve Popülerliklerini Hesapla
  console.log("\n🏟️ [2/4] Kulüp Prestij Puanları Hesaplanıyor...");

  // Hafif sorgu: Sadece ID ve kaggleId
  const allHistories = await prisma.playerTeamHistory.findMany({
    select: {
      teamId: true,
      player: {
        select: {
          id: true,
          kaggleId: true,
          marketValueEur: true,
        },
      },
    },
  });

  const teamSquadValues = new Map<string, { squadValue: number; playerCount: number }>();

  for (const h of allHistories) {
    const kId = h.player.kaggleId;
    const val = (kId && playerMarketValues.get(kId)) || h.player.marketValueEur || 0;

    const current = teamSquadValues.get(h.teamId) || { squadValue: 0, playerCount: 0 };
    current.squadValue += val;
    current.playerCount += 1;
    teamSquadValues.set(h.teamId, current);
  }

  let maxSquadValue = 1;
  for (const stats of teamSquadValues.values()) {
    if (stats.squadValue > maxSquadValue) {
      maxSquadValue = stats.squadValue;
    }
  }

  const teamPopularityMap = new Map<string, number>();
  const allTeams = await prisma.team.findMany({ select: { id: true } });

  // Toplu SQL ile takımları güncelle
  const teamUpdates: string[] = [];
  for (const team of allTeams) {
    const stats = teamSquadValues.get(team.id) || { squadValue: 0, playerCount: 0 };
    const squadScore = logNormalize(stats.squadValue, maxSquadValue); // %70
    const countScore = linearNormalize(stats.playerCount, 200); // %30
    const rawScore = squadScore * 0.7 + countScore * 0.3;
    const teamPopularity = Math.min(100, Math.max(5, Math.round(rawScore * 100)));

    teamPopularityMap.set(team.id, teamPopularity);
    teamUpdates.push(`('${team.id}', ${teamPopularity})`);
  }

  // Postgres toplu UPDATE
  if (teamUpdates.length > 0) {
    const query = `
      UPDATE teams AS t
      SET popularity_score = c.score::int
      FROM (VALUES ${teamUpdates.join(",")}) AS c(id, score)
      WHERE t.id = c.id;
    `;
    await prisma.$executeRawUnsafe(query);
  }
  console.log(`   ✅ ${allTeams.length} kulübün popülerlik puanı 1 saniyede kaydedildi.`);

  // ADIM 3: Oyuncu Popülerlik Puanlarını Hesapla
  console.log("\n⚽ [3/4] Oyuncu Popülerlik Puanları Hesaplanıyor...");

  // Oyuncuları ve oynadıkları takım ID'lerini çek
  const allPlayers = await prisma.player.findMany({
    select: {
      id: true,
      kaggleId: true,
      marketValueEur: true,
      teamsHistory: {
        select: {
          teamId: true,
        },
      },
    },
  });

  const MAX_MARKET_VALUE = 200_000_000;
  const MAX_TRANSFERS = 15;

  const playerUpdates: string[] = [];

  for (const player of allPlayers) {
    const kId = player.kaggleId;
    const marketValue = (kId && playerMarketValues.get(kId)) || player.marketValueEur || 0;

    // 1. Piyasa Değeri Sinyali (Logaritmik, %50 ağırlık)
    const marketValueScore = logNormalize(marketValue, MAX_MARKET_VALUE);

    // 2. Transfer Sayısı Sinyali (%30 ağırlık)
    const transferCount = player.teamsHistory.length;
    const appearancesScore = linearNormalize(transferCount, MAX_TRANSFERS);

    // 3. En Yüksek Prestijli Kulübün Skoru (%20 ağırlık)
    let maxClubScore = 10;
    for (const th of player.teamsHistory) {
      const clubPop = teamPopularityMap.get(th.teamId) || 10;
      if (clubPop > maxClubScore) {
        maxClubScore = clubPop;
      }
    }
    const clubPrestigeScore = maxClubScore / 100;

    const rawPopularity =
      marketValueScore * 0.5 +
      appearancesScore * 0.3 +
      clubPrestigeScore * 0.2;

    const finalScore = Math.min(100, Math.max(1, Math.round(rawPopularity * 100)));

    playerUpdates.push(`('${player.id}', ${finalScore}, ${marketValue})`);
  }

  // 5.000'lik parçalar halinde toplu raw SQL ile güncelle
  const BATCH_SIZE = 4000;
  for (let i = 0; i < playerUpdates.length; i += BATCH_SIZE) {
    const batch = playerUpdates.slice(i, i + BATCH_SIZE);
    const query = `
      UPDATE players AS p
      SET 
        popularity_score = c.score::int,
        market_value_eur = CASE WHEN c.mval::int > 0 THEN c.mval::int ELSE p.market_value_eur END
      FROM (VALUES ${batch.join(",")}) AS c(id, score, mval)
      WHERE p.id = c.id;
    `;
    await prisma.$executeRawUnsafe(query);
    process.stdout.write(`\r   ⏳ Güncellendi: ${Math.min(i + BATCH_SIZE, playerUpdates.length)}/${playerUpdates.length} Oyuncu`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n🎉 [4/4 TAMAMLANDI] ${allPlayers.length} Oyuncu ve ${allTeams.length} Takım ${durationSec} saniyede Başarıyla Güncellendi!`);
}

runFastPopularityCalculation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
