/**
 * TÜM VERİTABANI İÇİN OTOMATİK POPÜLERLİK HESAPLAMA MOTORU
 * 
 * Veriden türetilir, hiçbir elle müdahaleye izin verilmez.
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db/client";
import {
  calculatePlayerPopularity,
  calculateTeamPopularity,
} from "../lib/popularity/calculatePopularity";

async function runFastPopularityCalculation() {
  console.log("🚀 [Popularity Engine] Otomatik Hesaplama Başlatılıyor...\n");
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

  const teamUpdates: string[] = [];
  for (const team of allTeams) {
    const stats = teamSquadValues.get(team.id) || { squadValue: 0, playerCount: 0 };
    const teamPopularity = calculateTeamPopularity({
      squadValueEur: stats.squadValue,
      maxSquadValueInDb: maxSquadValue,
      playerCount: stats.playerCount,
    });

    teamPopularityMap.set(team.id, teamPopularity);
    teamUpdates.push(`('${team.id}', ${teamPopularity})`);
  }

  if (teamUpdates.length > 0) {
    const query = `
      UPDATE teams AS t
      SET popularity_score = c.score::int
      FROM (VALUES ${teamUpdates.join(",")}) AS c(id, score)
      WHERE t.id = c.id;
    `;
    await prisma.$executeRawUnsafe(query);
  }
  console.log(`   ✅ ${allTeams.length} kulübün popülerlik puanı kaydedildi.`);

  // ADIM 3: Oyuncu Popülerlik Puanlarını Hesapla
  console.log("\n⚽ [3/4] Oyuncu Popülerlik Puanları Hesaplanıyor...");

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

  const playerUpdates: string[] = [];

  for (const player of allPlayers) {
    const kId = player.kaggleId;
    const marketValue = (kId && playerMarketValues.get(kId)) || player.marketValueEur || 0;

    let maxClubScore = 10;
    for (const th of player.teamsHistory) {
      const clubPop = teamPopularityMap.get(th.teamId) || 10;
      if (clubPop > maxClubScore) {
        maxClubScore = clubPop;
      }
    }

    const finalScore = calculatePlayerPopularity({
      marketValueEur: marketValue,
      transferCount: player.teamsHistory.length,
      maxClubPrestige: maxClubScore,
    });

    playerUpdates.push(`('${player.id}', ${finalScore}, ${marketValue})`);
  }

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
  console.log(`\n\n🎉 [4/4 TAMAMLANDI] ${allPlayers.length} Oyuncu ve ${allTeams.length} Takım ${durationSec} saniyede Başarıyla Otomatik Hesaplandı!`);
}

runFastPopularityCalculation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
