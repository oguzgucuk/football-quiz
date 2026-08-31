import { prisma } from "../lib/db/client";
import Fuse from "fuse.js";

async function testRonaldoSearch() {
  const players = await prisma.player.findMany({
    select: { id: true, fullName: true, popularityScore: true, marketValueEur: true },
    orderBy: { popularityScore: "desc" },
  });

  // ignoreLocation: true eklenmiş akıllı Fuse.js
  const fuse = new Fuse(players, {
    keys: ["fullName"],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true, // İSİM İÇERİSİNDE NEREDE OLURSA OLSUN (SOYAD DAHİL) CEZA YEMEZ
  });

  function search(query: string) {
    const lowerQuery = query.toLowerCase().trim();
    const results = fuse.search(query, { limit: 30 });

    const scored = results.map((r) => {
      const textMatchScore = 1 - (r.score ?? 1);
      const normalizedPopularity = (r.item.popularityScore ?? 0) / 100;

      // Kelime başlangıcı veya tam içerme kontrolü
      const lowerName = r.item.fullName.toLowerCase();
      const words = lowerName.split(/\s+/);
      const exactWordMatch = words.some((w) => w.startsWith(lowerQuery));
      const containsBonus = lowerName.includes(lowerQuery) ? 0.2 : 0;
      const wordBonus = exactWordMatch ? 0.15 : 0;

      // Popülerliğe ve tam kelime eşleşmesine yüksek ağırlık
      const finalScore = textMatchScore * 0.4 + normalizedPopularity * 0.4 + wordBonus + containsBonus;
      return { item: r.item, finalScore, popScore: r.item.popularityScore, textMatch: textMatchScore.toFixed(2) };
    });

    return scored.sort((a, b) => b.finalScore - a.finalScore).slice(0, 8);
  }

  const queries = ["ronaldo", "messi", "arda", "hakan", "alex", "benzema", "lewandowski"];

  for (const q of queries) {
    console.log(`\n🔎 Arama Sorgusu: "${q}"`);
    const results = search(q);
    results.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.item.fullName.padEnd(25)} (Popülerlik: ${r.popScore}/100, Piyasa: €${r.item.marketValueEur || 0}, Skor: ${r.finalScore.toFixed(3)})`);
    });
  }
}

testRonaldoSearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
