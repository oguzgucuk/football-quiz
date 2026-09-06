/**
 * FIFA 10-14 (GitHub) ve FIFA 15-23 (Hugging Face) açık kaynak arşivlerini
 * stream olarak indirip 67+ overall barajıyla tekilleştirir (deduplicate).
 * 
 * Çıktı: data/fifa-prime-database.json
 */

import fs from "fs";
import path from "path";
import https from "https";
import readline from "readline";
import { normalizePlayerName } from "../../lib/overall/normalizePlayerName";

interface PrimePlayerRecord {
  shortName: string;
  longName: string;
  dob: string; // YYYY-MM-DD
  nationality: string;
  maxOverall: number;
  positions: string[];
}

function httpsGetStream(url: string): Promise<NodeJS.ReadableStream> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpsGetStream(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      resolve(res);
    }).on("error", reject);
  });
}

function cleanPositions(rawPos: string): string[] {
  if (!rawPos) return [];
  const parts = rawPos.replace(/["\s]/g, "").split(",");
  const valid = new Set<string>();
  const mapping: Record<string, string> = {
    ST: "ST", CF: "CF", LW: "LW", RW: "RW",
    CAM: "CAM", CM: "CM", CDM: "CDM", LM: "LW", RM: "RW",
    CB: "CB", LB: "LB", RB: "RB", LWB: "LB", RWB: "RB",
    GK: "GK"
  };

  for (const p of parts) {
    const upper = p.toUpperCase();
    if (mapping[upper]) {
      valid.add(mapping[upper]);
    }
  }
  return Array.from(valid);
}

async function run() {
  console.log("🚀 [FIFA Prime Database Compiler] Başlatılıyor...\n");
  const startTime = Date.now();
  const playerMap = new Map<string, PrimePlayerRecord>();

  // 1. İkonlar ve Tarihsel Efsaneleri Ekle
  const iconsPath = path.join(process.cwd(), "data", "fifa-icons.json");
  if (fs.existsSync(iconsPath)) {
    console.log("⭐ [1/3] FIFA Icons & Efsaneler yükleniyor...");
    const icons = JSON.parse(fs.readFileSync(iconsPath, "utf-8"));
    for (const icon of icons) {
      const key = `${icon.dob}_${normalizePlayerName(icon.name)}`;
      playerMap.set(key, {
        shortName: icon.name,
        longName: icon.name,
        dob: icon.dob,
        nationality: icon.nationality,
        maxOverall: icon.overall,
        positions: icon.positions,
      });
    }
    console.log(`   ✅ ${icons.length} Efsane eklendi.`);
  }

  // 2. FIFA 10 - 14 Nostalji Arşivini Ekle (GitHub)
  console.log("\n📼 [2/3] FIFA 10 - 14 Nostalji Arşivi taranıyor...");
  for (let year = 10; year <= 14; year++) {
    const url = `https://raw.githubusercontent.com/kafagy/fifa-FUT-Data/master/FIFA${year}.csv`;
    try {
      const stream = await httpsGetStream(url);
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      let rowCount = 0;
      for await (const line of rl) {
        if (rowCount === 0) { rowCount++; continue; } // Header
        const cols = line.split(",");
        if (cols.length < 6) continue;

        const name = cols[0]?.trim();
        const rawPos = cols[3]?.trim();
        const overall = parseInt(cols[5]?.trim(), 10) || 0;

        if (name && overall >= 67) {
          const norm = normalizePlayerName(name);
          const key = `name_${norm}`;
          const existing = playerMap.get(key);
          const posList = cleanPositions(rawPos);

          if (!existing) {
            playerMap.set(key, {
              shortName: name,
              longName: name,
              dob: "",
              nationality: "",
              maxOverall: overall,
              positions: posList,
            });
          } else {
            if (overall > existing.maxOverall) {
              existing.maxOverall = overall;
            }
            posList.forEach(p => {
              if (!existing.positions.includes(p)) existing.positions.push(p);
            });
          }
        }
        rowCount++;
      }
      console.log(`   ✓ FIFA ${year} tamamlandı.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`   ⚠️ FIFA ${year} okunamadı:`, msg);
    }
  }

  // 3. FIFA 15 - 23 Modern Arşivi (Hugging Face)
  console.log("\n🌐 [3/3] FIFA 15 - 23 Hugging Face verisi taranıyor...");
  const hfUrl = "https://huggingface.co/datasets/jsulz/FIFA23/resolve/main/male_players.csv";
  try {
    const hfStream = await httpsGetStream(hfUrl);
    const rl = readline.createInterface({ input: hfStream, crlfDelay: Infinity });
    let count = 0;
    let headerParsed = false;
    let shortNameIdx = 5;
    let longNameIdx = 6;
    let posIdx = 7;
    let overallIdx = 8;
    let dobIdx = 13;
    let natIdx = 27;

    for await (const line of rl) {
      if (!headerParsed) {
        const headers = line.split(",");
        shortNameIdx = headers.indexOf("short_name");
        longNameIdx = headers.indexOf("long_name");
        posIdx = headers.indexOf("player_positions");
        overallIdx = headers.indexOf("overall");
        dobIdx = headers.indexOf("dob");
        natIdx = headers.indexOf("nationality_name");
        headerParsed = true;
        continue;
      }

      // Hızlı parse: virgüle göre split (tırnak içi virgüle karşı toleranslı)
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const overall = parseInt(cols[overallIdx]?.trim(), 10) || 0;
      if (overall < 67) continue; // 67 altını baştan ele

      const shortName = cols[shortNameIdx]?.replace(/"/g, "").trim() || "";
      const longName = cols[longNameIdx]?.replace(/"/g, "").trim() || "";
      const dob = cols[dobIdx]?.trim() || "";
      const nationality = cols[natIdx]?.replace(/"/g, "").trim() || "";
      const positions = cleanPositions(cols[posIdx] || "");

      if (!dob || (!shortName && !longName)) continue;

      const key = `${dob}_${normalizePlayerName(longName || shortName)}`;
      const existing = playerMap.get(key);

      if (!existing) {
        playerMap.set(key, {
          shortName,
          longName,
          dob,
          nationality,
          maxOverall: overall,
          positions,
        });
      } else {
        if (overall > existing.maxOverall) {
          existing.maxOverall = overall;
        }
        positions.forEach(p => {
          if (!existing.positions.includes(p)) existing.positions.push(p);
        });
      }

      count++;
      if (count % 20000 === 0) {
        process.stdout.write(`\r   ⏳ İşlenen satır: ${count} | Tekil 67+ Oyuncu: ${playerMap.size}`);
      }
    }
    console.log(`\n   ✅ Hugging Face tamamlandı. Toplam tekil oyuncu: ${playerMap.size}`);
  } catch (err) {
    console.error("❌ Hugging Face indirme hatası:", err);
  }

  // 4. JSON olarak kaydet
  const outputPath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  const finalArray = Array.from(playerMap.values()).filter(p => p.maxOverall >= 67);
  fs.writeFileSync(outputPath, JSON.stringify(finalArray, null, 2), "utf-8");

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [TAMAMLANDI] ${finalArray.length} adet 67+ Prime Oyuncu derlendi! (${duration}s)`);
  console.log(`📂 Kaydedilen dosya: ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);
}

run().catch(console.error);
