/**
 * FIFA 05 - FIFA 09 (2004–2009 Nostalji Dönemi) oyuncu verilerini
 * (GitHub: lbenz730/fifa_model) stream ederek 67+ barajıyla mevcut
 * prime veritabanına ekler ve konsolide eder.
 * 
 * Amaç: Thierry Henry (97), Ronaldinho (95), van Nistelrooy (95), Shevchenko (94),
 * Adriano (92), Tuncay Şanlı, Hakan Şükür gibi 2004-2009 arası zirvesini yaşayan
 * efsanelerin orijinal FIFA puanlarını sisteme kazandırmak.
 */

import fs from "fs";
import path from "path";
import https from "https";
import readline from "readline";
import { normalizePlayerName } from "../../lib/overall/normalizePlayerName";
import { FifaPlayerRecord } from "../../lib/overall/fifaTypes";
import { consolidateFifaRecords } from "./consolidate-fifa-prime-db";

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

function cleanFifa05Positions(rawPos: string): string[] {
  if (!rawPos || rawPos === "NA") return [];
  const parts = rawPos.split(/[\/,]/);
  const valid = new Set<string>();
  const mapping: Record<string, string> = {
    ST: "ST", CF: "CF", LW: "LW", RW: "RW",
    CAM: "CAM", CM: "CM", CDM: "CDM", LM: "LW", RM: "RW",
    CB: "CB", LB: "LB", RB: "RB", LWB: "LB", RWB: "RB",
    GK: "GK",
  };
  for (const p of parts) {
    const upper = p.trim().toUpperCase();
    if (mapping[upper]) valid.add(mapping[upper]);
  }
  return Array.from(valid);
}

function mergeIntoMap(map: Map<string, FifaPlayerRecord>, candidate: FifaPlayerRecord): void {
  if (candidate.maxOverall < 67) return;
  const normLong = normalizePlayerName(candidate.longName || candidate.shortName);
  const key = candidate.dob ? `${candidate.dob}_${normLong}` : `name_${normLong}`;

  const existing = map.get(key);
  if (!existing) {
    map.set(key, candidate);
  } else {
    if (candidate.maxOverall > existing.maxOverall) {
      existing.maxOverall = candidate.maxOverall;
    }
    for (const pos of candidate.positions) {
      if (!existing.positions.includes(pos)) existing.positions.push(pos);
    }
    if (!existing.dob && candidate.dob) existing.dob = candidate.dob;
    if (!existing.nationality && candidate.nationality) existing.nationality = candidate.nationality;
  }
}

async function run() {
  console.log("🚀 [FIFA 05–09 (2004–2009) Nostalji Entegrasyonu Başlatılıyor]...\n");
  const startTime = Date.now();

  // 1. Mevcut veritabanını yükle
  const dbPath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  const existingRecords: FifaPlayerRecord[] = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  console.log(`📂 Mevcut (2010–2025) kayıt sayısı: ${existingRecords.length} oyuncu.`);

  const playerMap = new Map<string, FifaPlayerRecord>();
  for (const r of existingRecords) {
    const normLong = normalizePlayerName(r.longName || r.shortName);
    const key = r.dob ? `${r.dob}_${normLong}` : `name_${normLong}`;
    playerMap.set(key, { ...r, positions: [...r.positions] });
  }

  // 2. FIFA 05-09 (lbenz730/fifa_model) stream et
  console.log("\n📦 FIFA 05–09 arşivi taranıyor (GitHub: lbenz730/fifa_model)...");
  const url = "https://raw.githubusercontent.com/lbenz730/fifa_model/master/player_stats.csv";
  const stream = await httpsGetStream(url);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  let headerParsed = false;
  let nameIdx = 1;
  let yearIdx = 3;
  let ratingIdx = 6;
  let natIdx = 8;
  let dobIdx = 12;
  let posIdx = 15;

  for await (const line of rl) {
    if (!headerParsed) {
      const headers = line.split(",");
      nameIdx = headers.indexOf("name");
      yearIdx = headers.indexOf("year");
      ratingIdx = headers.indexOf("rating");
      natIdx = headers.indexOf("nationality");
      dobIdx = headers.indexOf("birthdate");
      posIdx = headers.indexOf("preferred_positions");
      headerParsed = true;
      continue;
    }

    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const overall = parseInt(cols[ratingIdx]?.trim(), 10) || 0;
    if (overall < 67) continue;

    const name = cols[nameIdx]?.replace(/"/g, "").trim() || "";
    const dob = cols[dobIdx]?.replace(/"/g, "").trim() || "";
    const nationality = cols[natIdx]?.replace(/"/g, "").trim() || "";
    const positions = cleanFifa05Positions(cols[posIdx] || "");

    if (!name) continue;

    mergeIntoMap(playerMap, {
      shortName: name,
      longName: name,
      dob,
      nationality,
      maxOverall: overall,
      positions,
    });
    count++;
    if (count % 20000 === 0) {
      process.stdout.write(`\r   ⏳ İşlenen 67+ kayıt: ${count}`);
    }
  }

  console.log(`\n   ✅ FIFA 05–09 tamamlandı: ${count} kayıt tarandı.`);

  // 3. Konsolide et ve kaydet
  console.log("\n🧠 Veritabanı konsolide ediliyor...");
  const consolidated = consolidateFifaRecords(Array.from(playerMap.values()));
  fs.writeFileSync(dbPath, JSON.stringify(consolidated, null, 2), "utf-8");

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [BAŞARILI] 2004–2025 Arşivi birleştirildi! (${duration}s)`);
  console.log(`📊 Toplam 67+ Peak Oyuncu: ${consolidated.length} (Eski: ${existingRecords.length}, Fark: +${consolidated.length - existingRecords.length})`);
  console.log(`💾 Güncellenen dosya: ${dbPath}`);
}

run().catch(console.error);
