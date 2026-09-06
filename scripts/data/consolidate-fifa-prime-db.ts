/**
 * data/fifa-prime-database.json dosyasını okuyup FIFA 10-23, FC 24 ve FC 25 kayıtlarını
 * tekilleştirir, aynı oyuncunun farklı sezonlardaki reytinglerinin en yükseğini (Peak)
 * ve tüm pozisyonlarını birleştirir.
 */

import fs from "fs";
import path from "path";
import { normalizePlayerName } from "../../lib/overall/normalizePlayerName";
import { FifaPlayerRecord } from "../../lib/overall/fifaTypes";

function isSamePersonOnSameDob(a: FifaPlayerRecord, b: FifaPlayerRecord): boolean {
  const aLong = normalizePlayerName(a.longName);
  const aShort = normalizePlayerName(a.shortName);
  const bLong = normalizePlayerName(b.longName);
  const bShort = normalizePlayerName(b.shortName);

  if (aLong === bLong || aLong === bShort || aShort === bLong || aShort === bShort) return true;
  if (aLong && bLong && (aLong.includes(bLong) || bLong.includes(aLong))) return true;
  if (aShort && bShort && (aShort.includes(bShort) || bShort.includes(aShort))) return true;

  const aWords = `${aLong} ${aShort}`.split(" ").filter((w) => w.length >= 3);
  const bWords = `${bLong} ${bShort}`.split(" ").filter((w) => w.length >= 3);
  const matchCount = aWords.filter((w) => bWords.includes(w)).length;
  return matchCount >= 2;
}

function mergePlayerInto(target: FifaPlayerRecord, source: FifaPlayerRecord): void {
  target.maxOverall = Math.max(target.maxOverall, source.maxOverall);
  for (const pos of source.positions) {
    if (!target.positions.includes(pos)) target.positions.push(pos);
  }
  if (!target.dob && source.dob) target.dob = source.dob;
  if (!target.nationality && source.nationality) target.nationality = source.nationality;
}

export function consolidateFifaRecords(records: FifaPlayerRecord[]): FifaPlayerRecord[] {
  // 1. DOB'a göre grupla ve aynı doğum günündeki örtüşen isimleri tekilleştir
  const byDob = new Map<string, FifaPlayerRecord[]>();
  const noDob: FifaPlayerRecord[] = [];

  for (const p of records) {
    if (!p.dob) {
      noDob.push(p);
      continue;
    }
    const group = byDob.get(p.dob) ?? [];
    let merged = false;
    for (const existing of group) {
      if (isSamePersonOnSameDob(existing, p)) {
        mergePlayerInto(existing, p);
        merged = true;
        break;
      }
    }
    if (!merged) {
      group.push({ ...p, positions: [...p.positions] });
      byDob.set(p.dob, group);
    }
  }

  const consolidatedWithDob = Array.from(byDob.values()).flat();

  // 2. DOB'u olmayan eski FIFA kayıtlarını, aynı isimdeki DOB'lu kayıtlarla birleştir
  const finalRecords: FifaPlayerRecord[] = [...consolidatedWithDob];
  const byNameMap = new Map<string, FifaPlayerRecord[]>();

  for (const p of consolidatedWithDob) {
    const norm = normalizePlayerName(p.longName || p.shortName);
    const list = byNameMap.get(norm) ?? [];
    list.push(p);
    byNameMap.set(norm, list);
  }

  for (const legacy of noDob) {
    const norm = normalizePlayerName(legacy.longName || legacy.shortName);
    const matches = byNameMap.get(norm);
    if (matches && matches.length === 1) {
      mergePlayerInto(matches[0], legacy);
    } else {
      finalRecords.push({ ...legacy, positions: [...legacy.positions] });
    }
  }

  return finalRecords.sort((a, b) => b.maxOverall - a.maxOverall);
}

function run() {
  const filePath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  console.log("📂 [Consolidate] Kayıtlar okunuyor:", filePath);
  const records: FifaPlayerRecord[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`   - Orijinal kayıt sayısı: ${records.length}`);

  const consolidated = consolidateFifaRecords(records);
  console.log(`   - Konsolide tekil oyuncu sayısı: ${consolidated.length}`);

  fs.writeFileSync(filePath, JSON.stringify(consolidated, null, 2), "utf-8");
  console.log(`✅ [Consolidate] Dosya başarıyla güncellendi: ${filePath}`);
}

if (require.main === module) {
  run();
}
