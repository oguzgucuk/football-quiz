/**
 * VERİ KAPSAMI VE YILLARA GÖRE DAĞILIM (HISTOGRAM) ANALİZİ
 * 
 * Veritabanı ve Kaggle CSV dosyalarındaki transferlerin yıllara göre dağılımını inceler.
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db/client";

async function analyzeCoverage() {
  console.log("📊 [Veri Kapsamı Analizi] Başlatılıyor...\n");

  // 1. DB Genel Sayımları
  const totalPlayers = await prisma.player.count();
  const totalTeams = await prisma.team.count();
  const totalHistories = await prisma.playerTeamHistory.count();

  console.log("📈 Veritabanı Özeti:");
  console.log(`   - Toplam Futbolcu: ${totalPlayers.toLocaleString()}`);
  console.log(`   - Toplam Kulüp: ${totalTeams.toLocaleString()}`);
  console.log(`   - Toplam Oyuncu-Kulüp İlişkisi: ${totalHistories.toLocaleString()}`);

  // 2. data/transfers.csv Yıl Histogramı
  const transfersCsvPath = path.join(process.cwd(), "data", "transfers.csv");
  if (fs.existsSync(transfersCsvPath)) {
    console.log("\n📂 data/transfers.csv Yıllara Göre Transfer Dağılımı:");
    const raw = fs.readFileSync(transfersCsvPath, "utf-8");
    const records = parse(raw, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

    const seasonMap = new Map<string, number>();
    for (const r of records) {
      const season = r.transfer_season || r.season || "Bilinmiyor";
      seasonMap.set(season, (seasonMap.get(season) || 0) + 1);
    }

    const sortedSeasons = Array.from(seasonMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    console.log(`   Toplam Transfer Kaydı: ${records.length.toLocaleString()}\n`);
    console.log("   Sezon / Yıl   | Transfer Sayısı | Dağılım Grafiği");
    console.log("   -------------|-----------------|------------------");
    for (const [season, count] of sortedSeasons) {
      const bar = "█".repeat(Math.round(count / 1500));
      console.log(`   ${season.padEnd(12)} | ${count.toString().padStart(15)} | ${bar}`);
    }
  }

  // 3. data/players.csv Doğum Yılı Histogramı
  const playersCsvPath = path.join(process.cwd(), "data", "players.csv");
  if (fs.existsSync(playersCsvPath)) {
    console.log("\n📂 data/players.csv Futbolcu Doğum Yılı Dağılımı (Kuşaklar):");
    const raw = fs.readFileSync(playersCsvPath, "utf-8");
    const records = parse(raw, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

    const decadeMap = new Map<string, number>();
    for (const r of records) {
      if (r.date_of_birth) {
        const year = parseInt(r.date_of_birth.substring(0, 4), 10);
        if (!isNaN(year)) {
          const decade = `${Math.floor(year / 10) * 10}'lar (${Math.floor(year / 10) * 10}-${Math.floor(year / 10) * 10 + 9})`;
          decadeMap.set(decade, (decadeMap.get(decade) || 0) + 1);
        }
      }
    }

    const sortedDecades = Array.from(decadeMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    console.log("   Doğum Kuşağı   | Oyuncu Sayısı   | Dağılım Grafiği");
    console.log("   --------------|-----------------|------------------");
    for (const [decade, count] of sortedDecades) {
      const bar = "█".repeat(Math.round(count / 500));
      console.log(`   ${decade.padEnd(13)} | ${count.toString().padStart(15)} | ${bar}`);
    }
  }

  // 4. DB Lig Bazlı Takım Dağılımı
  const teams = await prisma.team.findMany({
    select: { league: true, country: true },
  });

  const leagueMap = new Map<string, number>();
  for (const t of teams) {
    const key = `${t.country || "Bilinmiyor"} - ${t.league || "Bilinmiyor"}`;
    leagueMap.set(key, (leagueMap.get(key) || 0) + 1);
  }

  console.log("\n🏟️ En Çok Kulüp Bulunan İlk 10 Lig/Kategori:");
  const topLeagues = Array.from(leagueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [league, count] of topLeagues) {
    console.log(`   - ${league.padEnd(35)}: ${count} Kulüp`);
  }
}

analyzeCoverage()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
