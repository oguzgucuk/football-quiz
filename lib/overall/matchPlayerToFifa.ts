/**
 * Veritabanındaki bir oyuncuyu FIFA Prime veritabanı kayıtlarıyla
 * doğum tarihi, normalize isim ve uyruk üzerinden akıllıca eşleştirir.
 */

import { normalizePlayerName } from "./normalizePlayerName";
import { DbPlayerRecord, FifaPlayerRecord } from "./fifaTypes";

export interface FifaIndices {
  dobMap: Map<string, FifaPlayerRecord[]>;
  nameMap: Map<string, FifaPlayerRecord[]>;
}

export function buildFifaIndices(records: FifaPlayerRecord[]): FifaIndices {
  const dobMap = new Map<string, FifaPlayerRecord[]>();
  const nameMap = new Map<string, FifaPlayerRecord[]>();

  for (const rec of records) {
    if (rec.dob) {
      const list = dobMap.get(rec.dob) ?? [];
      list.push(rec);
      dobMap.set(rec.dob, list);
    }
    const nLong = normalizePlayerName(rec.longName);
    const nShort = normalizePlayerName(rec.shortName);
    for (const n of [nLong, nShort]) {
      if (!n) continue;
      const list = nameMap.get(n) ?? [];
      list.push(rec);
      nameMap.set(n, list);
    }
  }

  for (const list of dobMap.values()) {
    list.sort((a, b) => b.maxOverall - a.maxOverall);
  }
  for (const list of nameMap.values()) {
    list.sort((a, b) => b.maxOverall - a.maxOverall);
  }

  return { dobMap, nameMap };
}

function getPossibleDobStrings(date: Date | null): string[] {
  if (!date) return [];
  const rawUtc = date.toISOString().slice(0, 10);
  // Veritabanındaki tarihler gece yarısının UTC karşılığı (21:00 / 22:00) olabildiği için
  // 12 saat eklenerek takvim günü UTC hizalanır.
  const shifted = new Date(date.getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (rawUtc === shifted) return [rawUtc];
  return [shifted, rawUtc];
}

function calculateNameScore(dbNorm: string, cand: FifaPlayerRecord): number {
  const nLong = normalizePlayerName(cand.longName);
  const nShort = normalizePlayerName(cand.shortName);

  if ((!nLong || nLong.length < 3) && (!nShort || nShort.length < 3)) return 0;

  if (dbNorm === nLong || dbNorm === nShort) return 100;
  if (nLong && (nLong.includes(dbNorm) || dbNorm.includes(nLong))) return 80;
  if (nShort && (nShort.includes(dbNorm) || dbNorm.includes(nShort))) return 70;

  const dbWords = dbNorm.split(" ").filter((w) => w.length >= 3);
  const candWords = `${nLong} ${nShort}`.split(" ").filter((w) => w.length >= 3);
  const matchCount = dbWords.filter((w) => candWords.includes(w)).length;

  if (matchCount >= 2) return 60;
  return 0;
}

function isNationalityMatch(dbNat: string | null, fifaNat: string): boolean {
  if (!dbNat || !fifaNat) return true;
  const n1 = normalizePlayerName(dbNat);
  const n2 = normalizePlayerName(fifaNat);
  return n1.includes(n2) || n2.includes(n1) || (n1.includes("turk") && n2.includes("turk"));
}

function areBirthYearsCompatible(dbDate: Date | null, fifaDob: string): boolean {
  if (!dbDate || !fifaDob) return true;
  const dbYear = dbDate.getUTCFullYear();
  const fifaYear = parseInt(fifaDob.slice(0, 4), 10);
  if (isNaN(fifaYear)) return true;
  return Math.abs(dbYear - fifaYear) <= 1;
}

export function matchPlayerToFifa(
  player: DbPlayerRecord,
  indices: FifaIndices
): FifaPlayerRecord | null {
  const normDbName = normalizePlayerName(player.fullName);
  if (!normDbName) return null;

  const dobCandidates = getPossibleDobStrings(player.birthDate);

  // 1. Adım: Doğum Tarihi ile kesin aday kümesini daraltma
  for (const dobStr of dobCandidates) {
    if (indices.dobMap.has(dobStr)) {
      const candidates = indices.dobMap.get(dobStr)!;
      let bestMatch: FifaPlayerRecord | null = null;
      let highestScore = 0;

      for (const cand of candidates) {
        let score = calculateNameScore(normDbName, cand);
        if (score > 0 && isNationalityMatch(player.nationality, cand.nationality)) {
          score += 20;
        }
        if (score > highestScore && score >= 50) {
          highestScore = score;
          bestMatch = cand;
        }
      }
      if (bestMatch) return bestMatch;
    }
  }

  // 2. Adım: Doğum tarihi eşleşmediyse sadece doğum tarihi uyumlu olan veya doğum tarihi olmayanlara fallback
  const byName = indices.nameMap.get(normDbName);
  if (byName && byName.length > 0) {
    for (const cand of byName) {
      if (areBirthYearsCompatible(player.birthDate, cand.dob) && isNationalityMatch(player.nationality, cand.nationality)) {
        return cand;
      }
    }
  }

  return null;
}
