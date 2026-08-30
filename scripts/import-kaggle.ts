/**
 * Kaggle Transfermarkt veri setini (clubs, competitions, players, transfers)
 * parse edip PostgreSQL veritabanına toplu (bulk) ve performanslı şekilde aktarır.
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db/client";

interface CompetitionRow {
  competition_id: string;
  name: string;
  country_name: string;
}

interface ClubRow {
  club_id: string;
  name: string;
  domestic_competition_id: string;
  filename?: string;
  url?: string;
}

interface PlayerRow {
  player_id: string;
  name: string;
  country_of_citizenship?: string;
  date_of_birth?: string;
  position?: string;
  current_club_id?: string;
}

interface TransferRow {
  player_id: string;
  from_club_id?: string;
  to_club_id?: string;
  transfer_season?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const BATCH_SIZE = 3000;

function parseDateOrNull(dateString?: string): Date | null {
  if (!dateString || dateString.trim() === "") return null;
  const parsed = new Date(dateString.trim());
  return isNaN(parsed.getTime()) ? null : parsed;
}

async function runImport() {
  console.log("⚽ [Kaggle Import] Başlatılıyor...");
  const startTime = Date.now();

  // 1. competitions.csv
  console.log("📋 [1/4] Ligler ve ülkeler okunuyor...");
  const competitionsFile = path.join(DATA_DIR, "competitions.csv");
  const competitionsMap = new Map<string, { league: string; country: string }>();

  if (fs.existsSync(competitionsFile)) {
    const rawCompetitions = fs.readFileSync(competitionsFile, "utf-8");
    const competitionRows: CompetitionRow[] = parse(rawCompetitions, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    for (const row of competitionRows) {
      competitionsMap.set(row.competition_id, {
        league: row.name || "Domestic League",
        country: row.country_name || "Unknown",
      });
    }
  }

  // 2. clubs.csv
  console.log("🛡️ [2/4] Kulüpler işleniyor...");
  const clubsFile = path.join(DATA_DIR, "clubs.csv");
  if (!fs.existsSync(clubsFile)) {
    throw new Error(`clubs.csv dosyası bulunamadı: ${clubsFile}`);
  }

  const rawClubs = fs.readFileSync(clubsFile, "utf-8");
  const clubRows: ClubRow[] = parse(rawClubs, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  const clubDataToInsert = clubRows
    .filter((row) => row.club_id && row.name)
    .map((row) => {
      const comp = competitionsMap.get(row.domestic_competition_id);
      return {
        externalRef: row.club_id.trim(),
        name: row.name.trim(),
        country: comp?.country || "International",
        league: comp?.league || row.domestic_competition_id || "League",
        logoUrl: null,
      };
    });

  console.log(`➡️ ${clubDataToInsert.length} kulüp veritabanına ekleniyor...`);
  await prisma.team.createMany({
    data: clubDataToInsert,
    skipDuplicates: true,
  });

  // DB'deki tüm takımları alıp Map oluştur
  const allTeams = await prisma.team.findMany({
    select: { id: true, externalRef: true },
  });
  const clubRefToDbId = new Map<string, string>();
  for (const team of allTeams) {
    if (team.externalRef) {
      clubRefToDbId.set(team.externalRef, team.id);
    }
  }

  // 3. players.csv
  console.log("🏃 [3/4] Futbolcular işleniyor...");
  const playersFile = path.join(DATA_DIR, "players.csv");
  if (!fs.existsSync(playersFile)) {
    throw new Error(`players.csv dosyası bulunamadı: ${playersFile}`);
  }

  const rawPlayers = fs.readFileSync(playersFile, "utf-8");
  const playerRows: PlayerRow[] = parse(rawPlayers, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  const playerDataToInsert = playerRows
    .filter((row) => row.player_id && row.name)
    .map((row) => ({
      externalRef: row.player_id.trim(),
      fullName: row.name.trim(),
      nationality: row.country_of_citizenship?.trim() || null,
      position: row.position?.trim() || null,
      birthDate: parseDateOrNull(row.date_of_birth),
    }));

  console.log(`➡️ ${playerDataToInsert.length} futbolcu parçalar halinde ekleniyor...`);
  for (let i = 0; i < playerDataToInsert.length; i += BATCH_SIZE) {
    const chunk = playerDataToInsert.slice(i, i + BATCH_SIZE);
    await prisma.player.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    const progress = Math.min(i + BATCH_SIZE, playerDataToInsert.length);
    console.log(`   [Futbolcular] ${progress} / ${playerDataToInsert.length} eklendi.`);
  }

  // DB'deki tüm oyuncuları alıp Map oluştur
  console.log("🔍 Futbolcu kimlikleri eşleştiriliyor...");
  const allPlayers = await prisma.player.findMany({
    select: { id: true, externalRef: true },
  });
  const playerRefToDbId = new Map<string, string>();
  for (const p of allPlayers) {
    if (p.externalRef) {
      playerRefToDbId.set(p.externalRef, p.id);
    }
  }

  // 4. player_team_history (players.current_club_id + transfers.csv)
  console.log("🔄 [4/4] Transfer ve kariyer geçmişleri işleniyor...");
  const uniqueHistoryPairs = new Set<string>();
  const historyRecordsToInsert: { playerId: string; teamId: string; isNationalTeam: boolean }[] = [];

  // Mevcut kulüpleri ekle
  for (const row of playerRows) {
    if (!row.current_club_id) continue;
    const dbPlayerId = playerRefToDbId.get(row.player_id.trim());
    const dbTeamId = clubRefToDbId.get(row.current_club_id.trim());

    if (dbPlayerId && dbTeamId) {
      const pairKey = `${dbPlayerId}_${dbTeamId}`;
      if (!uniqueHistoryPairs.has(pairKey)) {
        uniqueHistoryPairs.add(pairKey);
        historyRecordsToInsert.push({
          playerId: dbPlayerId,
          teamId: dbTeamId,
          isNationalTeam: false,
        });
      }
    }
  }

  // transfers.csv oku
  const transfersFile = path.join(DATA_DIR, "transfers.csv");
  if (fs.existsSync(transfersFile)) {
    const rawTransfers = fs.readFileSync(transfersFile, "utf-8");
    const transferRows: TransferRow[] = parse(rawTransfers, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    for (const t of transferRows) {
      if (!t.player_id) continue;
      const dbPlayerId = playerRefToDbId.get(t.player_id.trim());
      if (!dbPlayerId) continue;

      if (t.from_club_id) {
        const fromDbTeamId = clubRefToDbId.get(t.from_club_id.trim());
        if (fromDbTeamId) {
          const pairKey = `${dbPlayerId}_${fromDbTeamId}`;
          if (!uniqueHistoryPairs.has(pairKey)) {
            uniqueHistoryPairs.add(pairKey);
            historyRecordsToInsert.push({
              playerId: dbPlayerId,
              teamId: fromDbTeamId,
              isNationalTeam: false,
            });
          }
        }
      }

      if (t.to_club_id) {
        const toDbTeamId = clubRefToDbId.get(t.to_club_id.trim());
        if (toDbTeamId) {
          const pairKey = `${dbPlayerId}_${toDbTeamId}`;
          if (!uniqueHistoryPairs.has(pairKey)) {
            uniqueHistoryPairs.add(pairKey);
            historyRecordsToInsert.push({
              playerId: dbPlayerId,
              teamId: toDbTeamId,
              isNationalTeam: false,
            });
          }
        }
      }
    }
  }

  console.log(`➡️ ${historyRecordsToInsert.length} kariyer/kulüp eşleşmesi veritabanına yazılıyor...`);
  for (let i = 0; i < historyRecordsToInsert.length; i += BATCH_SIZE) {
    const chunk = historyRecordsToInsert.slice(i, i + BATCH_SIZE);
    await prisma.playerTeamHistory.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    const progress = Math.min(i + BATCH_SIZE, historyRecordsToInsert.length);
    console.log(`   [Transfer Geçmişi] ${progress} / ${historyRecordsToInsert.length} eklendi.`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 [Kaggle Import] Başarıyla tamamlandı! (Süre: ${durationSec}s)`);
  console.log(`📊 Toplam Durum:`);
  console.log(`   - Kulüpler: ${await prisma.team.count()}`);
  console.log(`   - Futbolcular: ${await prisma.player.count()}`);
  console.log(`   - Kulüp-Oyuncu Eşleşmesi: ${await prisma.playerTeamHistory.count()}`);
}

runImport()
  .catch((err) => {
    console.error("❌ [Kaggle Import Hata]:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
