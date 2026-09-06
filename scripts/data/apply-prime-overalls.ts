/**
 * FIFA Prime veritabanını (data/fifa-prime-database.json) veritabanındaki
 * oyuncularla eşleştirip `overall_prime` ve `positions` alanlarını toplu günceller.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../../lib/db/client";
import { FifaPlayerRecord } from "../../lib/overall/fifaTypes";
import { buildFifaIndices, matchPlayerToFifa } from "../../lib/overall/matchPlayerToFifa";

interface PlayerUpdate {
  id: string;
  overallPrime: number;
  positions: string[];
}

function loadFifaData(): FifaPlayerRecord[] {
  const filePath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`FIFA Prime veritabanı bulunamadı: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

function buildBatchSql(batch: PlayerUpdate[]): string {
  const values = batch.map((item) => {
    const posArray = item.positions.length > 0
      ? `ARRAY[${item.positions.map((p) => `'${escapeSqlString(p)}'`).join(",")}]::text[]`
      : `ARRAY[]::text[]`;
    return `('${escapeSqlString(item.id)}'::text, ${item.overallPrime}::int, ${posArray}::text[])`;
  }).join(",\n");

  return `
    UPDATE players AS p
    SET 
      overall_prime = c.overall_prime,
      positions = c.positions
    FROM (VALUES
${values}
    ) AS c(id, overall_prime, positions)
    WHERE p.id = c.id;
  `;
}

async function executeBatchUpdates(updates: PlayerUpdate[], batchSize = 500): Promise<void> {
  console.log(`\n💾 ${updates.length} oyuncu veritabanına yazılıyor (Batch boyutu: ${batchSize})...`);
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const sql = buildBatchSql(batch);
    await prisma.$executeRawUnsafe(sql);
    const progress = Math.min(i + batchSize, updates.length);
    process.stdout.write(`\r   ⏳ Güncellendi: ${progress} / ${updates.length}`);
  }
  console.log("\n   ✅ Tüm güncellemeler başarıyla veritabanına işlendi!");
}

async function run() {
  console.log("⚡ [Apply Prime Overalls] Başlatılıyor...\n");
  const startTime = Date.now();

  console.log("📂 [1/4] FIFA Prime veritabanı yükleniyor...");
  const fifaRecords = loadFifaData();
  console.log(`   ✅ ${fifaRecords.length} adet 67+ FIFA oyuncusu yüklendi.`);

  console.log("\n🧠 [2/4] Arama indeksleri inşa ediliyor...");
  const indices = buildFifaIndices(fifaRecords);
  console.log(`   ✅ İndeksler hazır (DOB Map: ${indices.dobMap.size} gün, Name Map: ${indices.nameMap.size} isim).`);

  console.log("\n🔍 [3/4] Veritabanındaki oyuncular taranıyor...");
  const dbPlayers = await prisma.player.findMany({
    select: { id: true, fullName: true, birthDate: true, nationality: true },
  });
  console.log(`   ✅ Veritabanında toplam ${dbPlayers.length} oyuncu bulundu.`);

  const updates: PlayerUpdate[] = [];
  let matchCount = 0;

  for (const p of dbPlayers) {
    const matched = matchPlayerToFifa(p, indices);
    if (matched) {
      matchCount++;
      updates.push({
        id: p.id,
        overallPrime: matched.maxOverall,
        positions: matched.positions,
      });
    }
  }

  console.log(`\n📊 [Eşleşme Sonuçları]`);
  console.log(`   - Toplam Oyuncu: ${dbPlayers.length}`);
  console.log(`   - Eşleşen 67+ Prime: ${matchCount} (%${((matchCount / dbPlayers.length) * 100).toFixed(1)})`);
  console.log(`   - 67 Altı veya FIFA Dışı (null kalan): ${dbPlayers.length - matchCount}`);

  if (updates.length > 0) {
    console.log("\n🚀 [4/4] Veritabanı güncellemesi yapılıyor...");
    await executeBatchUpdates(updates);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✨ [BİTTİ] Prime Overall atama işlemi tamamlandı! (${duration}s)`);
}

run()
  .catch((err) => {
    console.error("❌ Hata:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
