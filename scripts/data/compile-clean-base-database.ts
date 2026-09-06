/**
 * ADIM 1: TOTS/TOTW Yanılsamalarından Arındırılmış Saf Kariyer Modu Veritabanı Derleyicisi.
 * 
 * Kaynaklar:
 * 1. data/fifa-icons.json (Tüm zamanlar efsaneleri)
 * 2. lbenz730/fifa_model (FIFA 05 - FIFA 14 SoFIFA Saf Kariyer Modu - 0 TOTS/TOTW)
 * 3. jsulz/FIFA23 (FIFA 15 - FIFA 23 SoFIFA Saf Kariyer Modu - 0 TOTS/TOTW)
 * 4. BafanaCode/Advanced-Data-Analysis-fc24 (EA FC 24 Saf Kariyer Modu)
 * 5. ivbeck/wdi-project (EA FC 25 Resmî Başlangıç Kadroları)
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

function cleanPositions(raw: string): string[] {
  if (!raw) return [];
  const parts = raw.split(/[\/,]/);
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
    map.set(key, { ...candidate, positions: [...candidate.positions] });
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

export async function compileCleanBaseDatabase(): Promise<FifaPlayerRecord[]> {
  console.log("🧹 [ADIM 1] Saf Kariyer Modu Derlemesi Başlatılıyor (TOTS/TOTW Filtreleniyor)...\n");
  const startTime = Date.now();
  const playerMap = new Map<string, FifaPlayerRecord>();

  // 1. İkonlar
  const iconsPath = path.join(process.cwd(), "data", "fifa-icons.json");
  if (fs.existsSync(iconsPath)) {
    const icons = JSON.parse(fs.readFileSync(iconsPath, "utf-8"));
    for (const icon of icons) {
      mergeIntoMap(playerMap, {
        shortName: icon.name,
        longName: icon.name,
        dob: icon.dob,
        nationality: icon.nationality,
        maxOverall: icon.overall,
        positions: icon.positions,
      });
    }
    console.log(`⭐ [1/5] FIFA Icons yüklendi (${icons.length} oyuncu).`);
  }

  // 2. lbenz730/fifa_model (FIFA 05 - FIFA 14 SoFIFA Saf Kariyer Modu)
  console.log("\n📼 [2/5] FIFA 05 - FIFA 14 SoFIFA Saf Kariyer Modu taranıyor (0 TOTS)...");
  const fifaModelUrl = "https://raw.githubusercontent.com/lbenz730/fifa_model/master/player_stats.csv";
  const stream1 = await httpsGetStream(fifaModelUrl);
  const rl1 = readline.createInterface({ input: stream1, crlfDelay: Infinity });

  let header1 = false;
  let [nIdx, yIdx, rIdx, natIdx, dobIdx, posIdx] = [1, 3, 6, 8, 12, 15];
  let c1 = 0;

  for await (const line of rl1) {
    if (!header1) {
      const h = line.split(",");
      nIdx = h.indexOf("name");
      yIdx = h.indexOf("year");
      rIdx = h.indexOf("rating");
      natIdx = h.indexOf("nationality");
      dobIdx = h.indexOf("birthdate");
      posIdx = h.indexOf("preferred_positions");
      header1 = true;
      continue;
    }
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const overall = parseInt(cols[rIdx]?.trim(), 10) || 0;
    if (overall < 67) continue;

    const name = cols[nIdx]?.replace(/"/g, "").trim() || "";
    const dob = cols[dobIdx]?.replace(/"/g, "").trim() || "";
    const nat = cols[natIdx]?.replace(/"/g, "").trim() || "";
    const positions = cleanPositions(cols[posIdx] || "");
    if (!name) continue;

    mergeIntoMap(playerMap, {
      shortName: name,
      longName: name,
      dob,
      nationality: nat,
      maxOverall: overall,
      positions,
    });
    c1++;
  }
  console.log(`   ✅ FIFA 05–14 tamamlandı (${c1} saf kayıt).`);

  // 3. jsulz/FIFA23 (FIFA 15 - FIFA 23 SoFIFA Saf Kariyer Modu)
  console.log("\n🌐 [3/5] FIFA 15 - FIFA 23 SoFIFA Saf Kariyer Modu taranıyor (Hugging Face)...");
  const hfUrl = "https://huggingface.co/datasets/jsulz/FIFA23/resolve/main/male_players.csv";
  const stream2 = await httpsGetStream(hfUrl);
  const rl2 = readline.createInterface({ input: stream2, crlfDelay: Infinity });

  let header2 = false;
  let [sNameIdx, lNameIdx, pIdx, ovrIdx, dIdx, n2Idx] = [5, 6, 7, 8, 13, 27];
  let c2 = 0;

  for await (const line of rl2) {
    if (!header2) {
      const h = line.split(",");
      sNameIdx = h.indexOf("short_name");
      lNameIdx = h.indexOf("long_name");
      pIdx = h.indexOf("player_positions");
      ovrIdx = h.indexOf("overall");
      dIdx = h.indexOf("dob");
      n2Idx = h.indexOf("nationality_name");
      header2 = true;
      continue;
    }
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const overall = parseInt(cols[ovrIdx]?.trim(), 10) || 0;
    if (overall < 67) continue;

    const shortName = cols[sNameIdx]?.replace(/"/g, "").trim() || "";
    const longName = cols[lNameIdx]?.replace(/"/g, "").trim() || "";
    const dob = cols[dIdx]?.trim() || "";
    const nat = cols[n2Idx]?.replace(/"/g, "").trim() || "";
    const positions = cleanPositions(cols[pIdx] || "");
    if (!dob || (!shortName && !longName)) continue;

    mergeIntoMap(playerMap, {
      shortName,
      longName,
      dob,
      nationality: nat,
      maxOverall: overall,
      positions,
    });
    c2++;
  }
  console.log(`   ✅ FIFA 15–23 tamamlandı (${c2} saf kayıt).`);

  // 4. EA Sports FC 24 (Kariyer Modu)
  console.log("\n🎮 [4/5] EA Sports FC 24 Saf Kariyer Modu taranıyor...");
  const fc24Url = "https://raw.githubusercontent.com/BafanaCode/Advanced-Data-Analysis-and-Visualization-fc24-analysis/master/male_players.csv";
  const stream3 = await httpsGetStream(fc24Url);
  const rl3 = readline.createInterface({ input: stream3, crlfDelay: Infinity });

  let header3 = false;
  let c3 = 0;
  for await (const line of rl3) {
    if (!header3) { header3 = true; continue; }
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const overall = parseInt(cols[ovrIdx]?.trim(), 10) || 0;
    if (overall < 67) continue;

    const shortName = cols[sNameIdx]?.replace(/"/g, "").trim() || "";
    const longName = cols[lNameIdx]?.replace(/"/g, "").trim() || "";
    const dob = cols[dIdx]?.trim() || "";
    const nat = cols[n2Idx]?.replace(/"/g, "").trim() || "";
    const positions = cleanPositions(cols[pIdx] || "");
    if (!dob || (!shortName && !longName)) continue;

    mergeIntoMap(playerMap, {
      shortName,
      longName,
      dob,
      nationality: nat,
      maxOverall: overall,
      positions,
    });
    c3++;
  }
  console.log(`   ✅ FC 24 tamamlandı (${c3} saf kayıt).`);

  // 5. EA Sports FC 25 XML
  console.log("\n🔥 [5/5] EA Sports FC 25 Resmî Başlangıç Kadroları taranıyor...");
  const fc25Url = "https://raw.githubusercontent.com/ivbeck/wdi-project/master/xml/targetEAFC.xml";
  const stream4 = await httpsGetStream(fc25Url);
  let xmlData = "";
  for await (const chunk of stream4) { xmlData += chunk; }

  const playerRegex = /<player\s+id="([^"]+)"\s+name="([^"]+)"\s+ovr="([^"]+)"\s+pos="([^"]+)"\s+country="([^"]+)"\s+dob="([^"]+)"/g;
  let match;
  let c4 = 0;
  while ((match = playerRegex.exec(xmlData)) !== null) {
    const [, , name, ovrStr, pos, country, dob] = match;
    const overall = parseInt(ovrStr, 10) || 0;
    if (overall < 67) continue;

    mergeIntoMap(playerMap, {
      shortName: name,
      longName: name,
      dob,
      nationality: country,
      maxOverall: overall,
      positions: cleanPositions(pos),
    });
    c4++;
  }
  console.log(`   ✅ FC 25 tamamlandı (${c4} saf kayıt).`);

  // Konsolidasyon ve Kayıt
  console.log("\n🧠 Veritabanı konsolide ediliyor...");
  const consolidated = consolidateFifaRecords(Array.from(playerMap.values()));
  const dbPath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  fs.writeFileSync(dbPath, JSON.stringify(consolidated, null, 2), "utf-8");

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [ADIM 1 BAŞARILI] Saf Kariyer Modu Veritabanı Üretildi! (${duration}s)`);
  console.log(`📊 Toplam Saf 67+ Peak Oyuncu: ${consolidated.length}`);
  return consolidated;
}

if (require.main === module) {
  compileCleanBaseDatabase().catch(console.error);
}
