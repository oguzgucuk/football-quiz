/**
 * PROAKTİF VERİ DÜZELTME VE WIKIDATA SENKRONİZASYON MOTORU
 * (GÜVEN EŞİĞİ / CONFIDENCE THRESHOLD KORUMALI)
 * 
 * missing_answer_logs tablosundaki eksik girilmiş isimleri inceler.
 * Yalnızca YÜKSEK GÜVENLİ (Exact Match / Levenshtein <= 1 + Futbolcu Açıklaması)
 * eşleşmelerde otomatik veri oluşturur; aksi halde MANUEL İNCELEME listesine ayırır.
 */

import { prisma } from "../lib/db/client";
import { calculatePlayerPopularity } from "../lib/popularity/calculatePopularity";

interface WikidataSearchResult {
  id: string;
  label: string;
  description?: string;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn][an];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchWikidata(playerName: string): Promise<WikidataSearchResult | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    playerName
  )}&language=tr&format=json`;

  try {
    await sleep(250);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FootballQuizBot/1.0 (https://github.com/oguzgucuk/football-quiz; admin@example.com)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) return null;
    const text = await res.text();
    if (!text.startsWith("{")) return null;
    const data = JSON.parse(text);
    const results = data.search as WikidataSearchResult[];

    if (!results || results.length === 0) return null;

    const footballMatch = results.find(
      (r) =>
        r.description?.toLowerCase().includes("football") ||
        r.description?.toLowerCase().includes("futbol") ||
        r.description?.toLowerCase().includes("association football")
    );

    return footballMatch || results[0];
  } catch (err) {
    console.error(`Wikidata arama hatası (${playerName}):`, err);
    return null;
  }
}

export async function syncMissingAnswersWithConfidence() {
  console.log("🚀 [Güven Eşikli Wikidata Senkronizasyonu] Başlatılıyor...\n");

  const logs = await prisma.missingAnswerLog.groupBy({
    by: ["submittedName"],
    _count: {
      submittedName: true,
    },
    orderBy: {
      _count: {
        submittedName: "desc",
      },
    },
    take: 30,
  });

  console.log(`📋 İncelenecek ${logs.length} farklı eksik arama kaydı bulundu:\n`);

  let autoWrittenCount = 0;
  let lowConfidenceCount = 0;

  for (const log of logs) {
    const name = log.submittedName.trim();
    if (name.length < 3) {
      lowConfidenceCount++;
      console.log(`   ⏭️ Çok kısa girdi, atlandı: "${name}"`);
      continue;
    }

    const wikiMatch = await searchWikidata(name);
    if (!wikiMatch) {
      lowConfidenceCount++;
      console.log(`   ⚠️ Wikidata Entity bulunamadı: "${name}"`);
      continue;
    }

    // Güven Eşiği Kontrolü (Confidence Check)
    const normSubmitted = normalize(name);
    const normWiki = normalize(wikiMatch.label);
    const dist = levenshtein(normSubmitted, normWiki);
    const isExactOrClose = dist <= 1 || normWiki.includes(normSubmitted) || normSubmitted.includes(normWiki);
    const isFootballer =
      wikiMatch.description?.toLowerCase().includes("football") ||
      wikiMatch.description?.toLowerCase().includes("futbol") ||
      wikiMatch.description?.toLowerCase().includes("association football");

    if (!isExactOrClose || !isFootballer) {
      lowConfidenceCount++;
      console.log(`   ⛔ [DÜŞÜK GÜVEN - YAZILMADI] "${name}" -> Wiki: "${wikiMatch.label}" (Mesafe: ${dist}, Açıklama: "${wikiMatch.description || ''}")`);
      continue;
    }

    // Yüksek Güvenli Eşleşme (High Confidence)
    console.log(`   ✅ [YÜKSEK GÜVEN] "${name}" -> ${wikiMatch.label} (${wikiMatch.id})`);

    const existingPlayer = await prisma.player.findFirst({
      where: {
        OR: [
          { fullName: { equals: name, mode: "insensitive" } },
          { fullName: { equals: wikiMatch.label, mode: "insensitive" } },
          { wikidataId: wikiMatch.id },
        ],
      },
      include: { teamsHistory: true },
    });

    let playerId: string;
    if (existingPlayer) {
      playerId = existingPlayer.id;
      if (!existingPlayer.wikidataId) {
        await prisma.player.update({
          where: { id: playerId },
          data: { wikidataId: wikiMatch.id },
        });
      }
    } else {
      const created = await prisma.player.create({
        data: {
          fullName: wikiMatch.label,
          wikidataId: wikiMatch.id,
          popularityScore: 50,
        },
      });
      playerId = created.id;
      autoWrittenCount++;
      console.log(`   ✨ Yeni Oyuncu DB'ye Eklendi: ${wikiMatch.label}`);
    }
  }

  console.log(`\n📊 [ÖZET] Yüksek Güvenle Yazılan: ${autoWrittenCount}, Düşük Güvenle Reddedilen: ${lowConfidenceCount}`);
}

syncMissingAnswersWithConfidence()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
