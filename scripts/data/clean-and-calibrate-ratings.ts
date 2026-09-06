/**
 * ADIM 1 & 2: TOTS/TOTW Temizliği ve Modern EA FC İkon/Hero Kalibrasyonu.
 * 
 * 1. Adım: kafagy/fifa-FUT-Data kaynaklı TOTS/TOTW (Bale 93, Huntelaar 93,
 *    Van Persie 94, Messi 99, Ronaldo 98, Villa 93 vb.) ve NO_DOB kayıtlarını temizler;
 *    tüm aktif/kariyer oyuncularını saf kariyer modundaki zirvesine döndürür.
 * 
 * 2. Adım: 2005 dönemi aşırı şişirilmiş 97-98 puanlarını (Henry 97, Buffon 97 vb.)
 *    resmî EA FC 24/25/26 İkon ve Hero standartlarına (Buffon 91, Henry 91,
 *    Bale 88, Hazard 89, Zidane 94, R9 94, Cruyff 93 vb.) kalibre eder.
 * 
 * Ardından Postgres veritabanını ve static oyuncu indeksini günceller.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../../lib/db/client";
import { normalizePlayerName } from "../../lib/overall/normalizePlayerName";
import { FifaPlayerRecord } from "../../lib/overall/fifaTypes";
import { buildFifaIndices, matchPlayerToFifa } from "../../lib/overall/matchPlayerToFifa";

interface IconHero {
  name: string;
  dob: string;
  nationality: string;
  overall: number;
  positions: string[];
}

// Saf Kariyer Modu Zirve Tavanları (TOTS/TOTW Şişirmelerini Düzeltme)
const CAREER_BASE_PEAKS: Record<string, { maxOverall: number; positions?: string[] }> = {
  "lionel messi": { maxOverall: 96, positions: ["RW", "CF", "CAM", "ST"] },
  "cristiano ronaldo": { maxOverall: 96, positions: ["ST", "LW", "CF", "RW"] },
  "klaas-jan huntelaar": { maxOverall: 85, positions: ["ST"] },
  "k huntelaar": { maxOverall: 85, positions: ["ST"] },
  "arjen robben": { maxOverall: 90, positions: ["RW", "RM"] },
  "zlatan ibrahimovic": { maxOverall: 90, positions: ["ST"] },
  "luis suarez": { maxOverall: 92, positions: ["ST"] },
  "andres iniesta": { maxOverall: 91, positions: ["CM", "CAM", "LW"] },
  "radamel falcao": { maxOverall: 89, positions: ["ST"] },
  "nemanja vidic": { maxOverall: 89, positions: ["CB"] },
  "thiago silva": { maxOverall: 90, positions: ["CB"] },
  "sergio ramos": { maxOverall: 91, positions: ["CB", "RB"] },
  "manuel neuer": { maxOverall: 92, positions: ["GK"] },
  "luka modric": { maxOverall: 91, positions: ["CM"] },
  "karim benzema": { maxOverall: 91, positions: ["CF", "ST"] },
  "robert lewandowski": { maxOverall: 92, positions: ["ST"] },
  "neymar": { maxOverall: 92, positions: ["LW", "CAM"] },
  "neymar jr": { maxOverall: 92, positions: ["LW", "CAM"] },
  "francesco totti": { maxOverall: 90, positions: ["CF", "CAM", "ST"] },
  "oliver kahn": { maxOverall: 91, positions: ["GK"] },
  "adriano": { maxOverall: 88, positions: ["ST"] },
  "roy makaay": { maxOverall: 88, positions: ["ST"] },
  "ruud van nistelrooy": { maxOverall: 90, positions: ["ST"] },
};

function loadIconHeroes(): IconHero[] {
  const filePath = path.join(process.cwd(), "data", "fc-icons-heroes.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadFifaPrimeDb(): FifaPlayerRecord[] {
  const filePath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function cleanAndCalibrateRecords(
  records: FifaPlayerRecord[],
  icons: IconHero[]
): FifaPlayerRecord[] {
  const iconMap = new Map<string, IconHero>();
  for (const icon of icons) {
    iconMap.set(normalizePlayerName(icon.name), icon);
  }

  const cleaned: FifaPlayerRecord[] = [];
  const seen = new Set<string>();

  for (const r of records) {
    const norm = normalizePlayerName(r.longName || r.shortName);
    
    // 1. NO_DOB olan tüm FUT kaynaklı hayalet/TOTS kartlarını filtrele
    if (!r.dob && !iconMap.has(norm)) {
      continue;
    }
    // 1987-02-14 hatalı doğum tarihiyle eklenmiş 99 Messi TOTS kartını filtrele
    if (norm === "lionel messi" && r.dob === "1987-02-14") {
      continue;
    }
    // Efsane Pelé dışındaki (1940 doğumlu olmayan) Pelé isimli oyuncuların şişirilmesini engelle
    if (norm === "pele" && r.dob !== "1940-10-23") {
      continue;
    }

    // 2. İkon / Hero kalibrasyonu uygula
    const iconMatch = iconMap.get(norm);
    if (iconMatch) {
      r.maxOverall = iconMatch.overall;
      r.positions = iconMatch.positions;
    } else {
      // 3. Huntelaar ve özel isim kontrolleri
      if (norm.includes("huntelaar")) {
        r.maxOverall = 85;
      }
      // 4. Saf Kariyer Modu Zirve Tavanını uygula (TOTS/TOTW Düzeltmesi)
      const peak = CAREER_BASE_PEAKS[norm];
      if (peak && r.maxOverall > peak.maxOverall) {
        r.maxOverall = peak.maxOverall;
        if (peak.positions) r.positions = peak.positions;
      }
    }

    const key = r.dob ? `${r.dob}_${norm}` : `name_${norm}`;
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(r);
    }
  }

  // fc-icons-heroes.json içindeki tüm efsanelerin prime DB'de var olduğundan emin ol
  for (const icon of icons) {
    const norm = normalizePlayerName(icon.name);
    const key = icon.dob ? `${icon.dob}_${norm}` : `name_${norm}`;
    if (!seen.has(key)) {
      cleaned.push({
        shortName: icon.name,
        longName: icon.name,
        dob: icon.dob,
        nationality: icon.nationality,
        maxOverall: icon.overall,
        positions: icon.positions,
      });
      seen.add(key);
    }
  }

  return cleaned;
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

async function updatePostgresDatabase(calibratedRecords: FifaPlayerRecord[]): Promise<void> {
  console.log("\n💿 [Veritabanı Senkronizasyonu] PostgreSQL güncelleniyor...");
  const indices = buildFifaIndices(calibratedRecords);
  
  const dbPlayers = await prisma.player.findMany({
    select: { id: true, fullName: true, birthDate: true, nationality: true },
  });

  interface PlayerUpdate {
    id: string;
    overallPrime: number | null;
    positions: string[];
  }

  const updates: PlayerUpdate[] = [];
  for (const p of dbPlayers) {
    const matched = matchPlayerToFifa(p, indices);
    updates.push({
      id: p.id,
      overallPrime: matched ? matched.maxOverall : null,
      positions: matched ? matched.positions : [],
    });
  }

  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const values = batch.map((item) => {
      const posArray = item.positions.length > 0
        ? `ARRAY[${item.positions.map((p) => `'${escapeSqlString(p)}'`).join(",")}]::text[]`
        : `ARRAY[]::text[]`;
      const ovrVal = item.overallPrime === null ? "NULL" : `${item.overallPrime}`;
      return `('${escapeSqlString(item.id)}'::text, ${ovrVal}::int, ${posArray}::text[])`;
    }).join(",\n");

    const sql = `
      UPDATE players AS p
      SET 
        overall_prime = c.overall_prime,
        positions = c.positions
      FROM (VALUES
${values}
      ) AS c(id, overall_prime, positions)
      WHERE p.id = c.id;
    `;
    await prisma.$executeRawUnsafe(sql);
  }

  console.log(`   ✅ ${updates.length} oyuncunun reyting ve pozisyonları veritabanına işlendi!`);
}

export async function executeCleanAndCalibrate(): Promise<void> {
  console.log("🧹 [ADIM 1 & 2] TOTS Temizliği ve Resmî FC Kalibrasyonu Başlatılıyor...\n");
  const startTime = Date.now();

  const icons = loadIconHeroes();
  const rawRecords = loadFifaPrimeDb();
  console.log(`📊 Orijinal Ham Kayıt Sayısı: ${rawRecords.length}`);

  const calibrated = cleanAndCalibrateRecords(rawRecords, icons);
  console.log(`✨ Temizlenmiş & Kalibre Edilmiş Kayıt: ${calibrated.length}`);

  const outPath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  fs.writeFileSync(outPath, JSON.stringify(calibrated, null, 2), "utf-8");
  console.log("💾 fifa-prime-database.json başarıyla kaydedildi.");

  await updatePostgresDatabase(calibrated);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [BAŞARILI] Tüm Veritabanı ve JSON Kalibre Edildi! (${duration}s)`);
}

if (require.main === module) {
  executeCleanAndCalibrate().catch(console.error).finally(() => prisma.$disconnect());
}
