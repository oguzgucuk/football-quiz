import { prisma } from "../lib/db/client";
import Fuse from "fuse.js";

async function testPopularitySearch() {
  console.log("🔍 Popülerlik Bazlı Arama Testi Başlatılıyor...\n");

  const players = await prisma.player.findMany({
    select: { id: true, fullName: true, popularityScore: true, marketValueEur: true },
    orderBy: { popularityScore: "desc" },
  });

  const fuse = new Fuse(players, {
    keys: ["fullName"],
    includeScore: true,
    threshold: 0.4,
  });

  function search(query: string) {
    const lowerQuery = query.toLowerCase().trim();
    const results = fuse.search(query, { limit: 16 });

    const scored = results.map((r) => {
      const textMatchScore = 1 - (r.score ?? 1);
      const normalizedPopularity = (r.item.popularityScore ?? 0) / 100;

      const lowerName = r.item.fullName.toLowerCase();
      const words = lowerName.split(/\s+/);
      const exactWordMatch = words.some((w) => w.startsWith(lowerQuery));
      const wordBonus = exactWordMatch ? 0.15 : 0;

      const finalScore = textMatchScore * 0.55 + normalizedPopularity * 0.35 + wordBonus;
      return { item: r.item, finalScore, popScore: r.item.popularityScore, textScore: textMatchScore.toFixed(2) };
    });

    return scored.sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
  }

  const queries = ["ronaldo", "arda", "hakan", "nihat", "messi", "alex"];

  for (const q of queries) {
    console.log(`\n🔎 Arama Sorgusu: "${q}"`);
    const results = search(q);
    results.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.item.fullName.padEnd(25)} (Popülerlik: ${r.popScore}/100, Piyasa: €${r.item.marketValueEur || 0}, Nihai Skor: ${r.finalScore.toFixed(3)})`);
    });
  }
}

testPopularitySearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
