/**
 * MADDE 1.8 ANALİZİ: YÜKSEK POPÜLERLİK + DÜŞÜK KAYIT SAYISINA SAHİP OYUNCULARI BUL
 */

import { prisma } from "../lib/db/client";

async function findSuspiciousLegends() {
  console.log("🔍 [Madde 1.8 Analizi] Yüksek Popülerlikli & Eksik Kulüplü Oyuncular Taranıyor...\n");

  const results = await prisma.$queryRaw<
    { id: string; full_name: string; popularity_score: number; market_value_eur: number; kayit_sayisi: number }[]
  >`
    SELECT 
      p.id, 
      p.full_name, 
      p.popularity_score, 
      p.market_value_eur, 
      COUNT(h.id)::int as kayit_sayisi
    FROM players p
    LEFT JOIN player_team_history h ON h.player_id = p.id
    GROUP BY p.id, p.full_name, p.popularity_score, p.market_value_eur
    HAVING COUNT(h.id) <= 1
    ORDER BY p.popularity_score DESC
    LIMIT 30;
  `;

  console.log(`Bulunan Şüpheli Oyuncu Sayısı (İlk 30):`);
  console.log("----------------------------------------------------------------------");
  console.log("Futbolcu Adı                 | Popülerlik | Piyasa Değeri | Kayıtlı Kulüp");
  console.log("----------------------------------------------------------------------");
  for (const r of results) {
    const name = r.full_name.padEnd(28);
    const pop = (r.popularity_score + "/100").padEnd(10);
    const val = ("€" + (r.market_value_eur || 0).toLocaleString()).padEnd(13);
    console.log(`${name} | ${pop} | ${val} | ${r.kayit_sayisi}`);
  }
}

findSuspiciousLegends()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
