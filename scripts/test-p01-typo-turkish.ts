import fs from "fs";
import path from "path";
import Fuse from "fuse.js";

// Proje içindeki statik indeksi oku
const indexPath = path.join(process.cwd(), "public", "data", "players-index.json");
const rawData = fs.readFileSync(indexPath, "utf-8");
const players = JSON.parse(rawData);

// Web Worker'daki aynı Fuse konfigürasyonu
const fuse = new Fuse(players, {
  keys: ["name", "asciiName"],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

const normalizeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/İ/g, "I").toLowerCase();
};

function calculateScore(player: any, fuseScore: number, query: string): number {
  const normalizedPop = Math.min(100, Math.max(0, player.popularityScore)) / 100;
  const matchScore = 1 - fuseScore;

  const lowerQuery = query.toLowerCase().trim();
  const asciiQuery = normalizeAccents(query).trim();

  const lowerName = player.name.toLowerCase();
  const asciiName = (player.asciiName || lowerName).toLowerCase();

  const exactWordMatch = lowerName.split(/\s+/).some((w: string) => w.startsWith(lowerQuery)) ||
                         asciiName.split(/\s+/).some((w: string) => w.startsWith(asciiQuery));

  const containsBonus = lowerName.includes(lowerQuery) || asciiName.includes(asciiQuery) ? 0.2 : 0;
  const wordBonus = exactWordMatch ? 0.15 : 0;

  return matchScore * 0.4 + normalizedPop * 0.4 + wordBonus + containsBonus;
}

function searchPlayers(query: string, limit: number = 6) {
  const start = performance.now();
  const asciiQuery = normalizeAccents(query).trim();
  const fuseResults = fuse.search(asciiQuery, { limit: 30 });

  const scoredResults = fuseResults.map((result) => {
    const score = calculateScore(result.item, result.score || 0, query);
    return { ...result.item, score, fuseScore: result.score };
  });

  scoredResults.sort((a, b) => b.score - a.score);
  const time = performance.now() - start;

  return { results: scoredResults.slice(0, limit), time };
}

const testCases = [
  { query: "ronado", expected: "Cristiano Ronaldo", desc: "Typo Tolerance (ronado -> ronaldo)" },
  { query: "hakan sukur", expected: "Hakan Şükür", desc: "Türkçe Karakter (sukur -> şükür)" },
  { query: "ibrahimoviç", expected: "Zlatan Ibrahimović", desc: "Aksan/Türkçe Karakter (viç -> vić)" },
  { query: "guler", expected: "Arda Güler", desc: "Türkçe Karakter (guler -> güler)" },
  { query: "calhanoglu", expected: "Hakan Çalhanoğlu", desc: "Türkçe Karakter (calhanoglu -> çalhanoğlu)" },
  { query: "cengiz under", expected: "Cengiz Ünder", desc: "Türkçe Karakter (under -> ünder)" }
];

console.log("\n=================================================");
console.log("🔡 P0-1 YAZIM HATASI VE TÜRKÇE KARAKTER TESTİ");
console.log("=================================================\n");

let passed = 0;

testCases.forEach((tc) => {
  const { results, time } = searchPlayers(tc.query);
  const firstResult = results[0];
  
  // Basit normalize (tüm aksanları at, küçült, boşlukları sil)
  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const expectedNorm = normalize(tc.expected);
  
  // Sadece ilk sonucu değil, top 3'ü kontrol et. Çünkü Fuse ile typo toleransı çalışırken skorlar çok yakın olabilir.
  const isMatch = results.slice(0, 3).some(r => normalize(r.name).includes(expectedNorm) || expectedNorm.includes(normalize(r.name)));

  const checkMark = isMatch ? "✅" : "❌";
  if (isMatch) passed++;

  console.log(`🔍 Sorgu: "${tc.query}" (${tc.desc})`);
  console.log(`   ${checkMark} Beklenen: "${tc.expected}" | İlk Sonuç: "${firstResult?.name || 'BULUNAMADI'}" | Süre: ${time.toFixed(2)}ms`);
  if (!firstResult || normalize(firstResult.name) !== expectedNorm) {
      console.log(`   👉 Top 3 Öneriler: ${results.slice(0,3).map(r => r.name).join(', ')}`);
  }
  console.log("-----------------------------------------");
});

console.log(`\n📊 Sonuç: ${passed}/${testCases.length} Test Başarılı\n`);
