/**
 * EA Sports FC 24 (CSV) ve FC 25 (XML) açık kaynak arşivlerinden
 * 67+ modern oyuncuları çekip mevcut FIFA Prime veritabanıyla (fifa-prime-database.json)
 * konsolide eder.
 * 
 * Mantık: Math.max(eskiZirve, yeniZirve) + Pozisyonların Birleşimi
 */

import fs from "fs";
import path from "path";
import https from "https";
import readline from "readline";
import { normalizePlayerName } from "../../lib/overall/normalizePlayerName";
import { FifaPlayerRecord } from "../../lib/overall/fifaTypes";

const XML_POS_MAP: Record<string, string> = {
  striker: "ST",
  "center forward": "CF",
  "left wing": "LW",
  "right wing": "RW",
  "left winger": "LW",
  "right winger": "RW",
  "center attacking midfielder": "CAM",
  "attacking midfielder": "CAM",
  "center midfielder": "CM",
  "central midfielder": "CM",
  "center defensive midfielder": "CDM",
  "defensive midfielder": "CDM",
  "left midfielder": "LW",
  "right midfielder": "RW",
  "left back": "LB",
  "right back": "RB",
  "center back": "CB",
  "central defender": "CB",
  goalkeeper: "GK",
};

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

function parseXmlPositions(rawPositions: string[]): string[] {
  const set = new Set<string>();
  for (const raw of rawPositions) {
    const key = raw.trim().toLowerCase();
    if (XML_POS_MAP[key]) {
      set.add(XML_POS_MAP[key]);
    }
  }
  return Array.from(set);
}

function cleanCsvPositions(rawPos: string): string[] {
  if (!rawPos) return [];
  const parts = rawPos.replace(/["\s]/g, "").split(",");
  const valid = new Set<string>();
  const mapping: Record<string, string> = {
    ST: "ST", CF: "CF", LW: "LW", RW: "RW",
    CAM: "CAM", CM: "CM", CDM: "CDM", LM: "LW", RM: "RW",
    CB: "CB", LB: "LB", RB: "RB", LWB: "LB", RWB: "RB",
    GK: "GK",
  };
  for (const p of parts) {
    const upper = p.toUpperCase();
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

async function processFc24Csv(map: Map<string, FifaPlayerRecord>): Promise<number> {
  console.log("\n📦 [1/2] EA Sports FC 24 verisi çekiliyor (GitHub: BafanaCode)...");
  const url = "https://raw.githubusercontent.com/BafanaCode/Advanced-Data-Analysis-and-Visualization-fc24-analysis/main/male_players.csv";
  const stream = await httpsGetStream(url);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  let headerParsed = false;
  let shortIdx = 5;
  let longIdx = 6;
  let posIdx = 7;
  let overallIdx = 8;
  let dobIdx = 13;
  let natIdx = 27;

  for await (const line of rl) {
    if (!headerParsed) {
      const headers = line.split(",");
      shortIdx = headers.indexOf("short_name");
      longIdx = headers.indexOf("long_name");
      posIdx = headers.indexOf("player_positions");
      overallIdx = headers.indexOf("overall");
      dobIdx = headers.indexOf("dob");
      natIdx = headers.indexOf("nationality_name");
      headerParsed = true;
      continue;
    }
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const overall = parseInt(cols[overallIdx]?.trim(), 10) || 0;
    if (overall < 67) continue;

    const shortName = cols[shortIdx]?.replace(/"/g, "").trim() || "";
    const longName = cols[longIdx]?.replace(/"/g, "").trim() || "";
    const dob = cols[dobIdx]?.trim() || "";
    const nationality = cols[natIdx]?.replace(/"/g, "").trim() || "";
    const positions = cleanCsvPositions(cols[posIdx] || "");

    if (!dob || (!shortName && !longName)) continue;

    mergeIntoMap(map, {
      shortName: shortName || longName,
      longName: longName || shortName,
      dob,
      nationality,
      maxOverall: overall,
      positions,
    });
    count++;
  }
  console.log(`   ✅ FC 24 tamamlandı: ${count} kayıt işlendi.`);
  return count;
}

async function processFc25Xml(map: Map<string, FifaPlayerRecord>): Promise<number> {
  console.log("\n📦 [2/2] EA Sports FC 25 verisi çekiliyor (GitHub: ivbeck/wdi-project)...");
  const url = "https://raw.githubusercontent.com/ivbeck/wdi-project/main/data/input/targetEAFC.xml";
  const stream = await httpsGetStream(url);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  let curName = "";
  let curDob = "";
  let curNat = "";
  let curOverall = 0;
  let curPositions: string[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.startsWith("<player>")) {
      curName = "";
      curDob = "";
      curNat = "";
      curOverall = 0;
      curPositions = [];
    } else if (trimmed.startsWith("<playerName>")) {
      curName = trimmed.replace(/<\/?playerName>/g, "").trim();
    } else if (trimmed.startsWith("<playerBirthdate>")) {
      curDob = trimmed.replace(/<\/?playerBirthdate>/g, "").trim();
    } else if (trimmed.startsWith("<position>")) {
      const pos = trimmed.replace(/<\/?position>/g, "").trim();
      if (pos) curPositions.push(pos);
    } else if (trimmed.startsWith("<playerNationality>")) {
      curNat = trimmed.replace(/<\/?playerNationality>/g, "").trim();
    } else if (trimmed.startsWith("<playerOverallRating>")) {
      curOverall = parseInt(trimmed.replace(/<\/?playerOverallRating>/g, "").trim(), 10) || 0;
    } else if (trimmed.startsWith("</player>")) {
      if (curOverall >= 67 && curName && curDob) {
        mergeIntoMap(map, {
          shortName: curName,
          longName: curName,
          dob: curDob,
          nationality: curNat,
          maxOverall: curOverall,
          positions: parseXmlPositions(curPositions),
        });
        count++;
      }
    }
  }
  console.log(`   ✅ FC 25 tamamlandı: ${count} kayıt işlendi.`);
  return count;
}

async function run() {
  console.log("🚀 [FC 24 & FC 25 Entegrasyonu Başlatılıyor]...\n");
  const startTime = Date.now();

  // 1. Mevcut fifa-prime-database.json dosyasını yükle
  const dbPath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  const existingRecords: FifaPlayerRecord[] = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  console.log(`📂 Mevcut FIFA 10-23 kayıtları: ${existingRecords.length} oyuncu.`);

  const playerMap = new Map<string, FifaPlayerRecord>();
  for (const r of existingRecords) {
    const normLong = normalizePlayerName(r.longName || r.shortName);
    const key = r.dob ? `${r.dob}_${normLong}` : `name_${normLong}`;
    playerMap.set(key, { ...r, positions: [...r.positions] });
  }

  // 2. FC 24 ve FC 25'i çekip birleştir
  await processFc24Csv(playerMap);
  await processFc25Xml(playerMap);

  // 3. Dosyayı yeniden kaydet
  const finalRecords = Array.from(playerMap.values()).sort((a, b) => b.maxOverall - a.maxOverall);
  fs.writeFileSync(dbPath, JSON.stringify(finalRecords, null, 2), "utf-8");

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [BAŞARILI] FIFA 10-23 + FC 24 + FC 25 konsolidasyonu tamamlandı! (${duration}s)`);
  console.log(`📊 Toplam 67+ Peak Oyuncu: ${finalRecords.length} (Eski: ${existingRecords.length}, Yeni/Gelişen: +${finalRecords.length - existingRecords.length})`);
  console.log(`💾 Güncellenen dosya: ${dbPath}`);
}

run().catch(console.error);
