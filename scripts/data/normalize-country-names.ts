/**
 * Veritabanındaki `teams.country` alanını İngilizce ISO 3166-1 standardına normalize eder.
 * COUNTRY_NORMALIZATION_MAP'teki her eşleme için toplu UPDATE yapar.
 *
 * Güvenli: Sadece haritada tanımlı değerleri günceller, bilinmeyenlere dokunmaz.
 * İdempotent: Birden fazla çalıştırılabilir, tekrar etmez.
 *
 * Örnek: "Türkiye" (50 kayıt) + "Turkey" (33 kayıt) → tümü "Turkey" olur.
 */

import { prisma } from "@/lib/db/client";
import { COUNTRY_NORMALIZATION_MAP } from "@/lib/db/countryNormalization";

async function normalizeCountryNames() {
  console.log("🌍 Ülke Adı Normalizasyonu Başlatılıyor...\n");

  let totalUpdated = 0;
  const results: Array<{ from: string; to: string; count: number }> = [];

  for (const [wrongValue, correctValue] of Object.entries(COUNTRY_NORMALIZATION_MAP)) {
    // Aynı değere map ediliyorsa atla (zaten doğru)
    if (wrongValue === correctValue) continue;

    const affected = await prisma.team.count({
      where: { country: wrongValue },
    });

    if (affected === 0) continue;

    const { count } = await prisma.team.updateMany({
      where: { country: wrongValue },
      data: { country: correctValue },
    });

    totalUpdated += count;
    results.push({ from: wrongValue, to: correctValue, count });
    console.log(`  ✅ "${wrongValue}" → "${correctValue}" (${count} takım)`);
  }

  console.log(`\n📊 Özet:`);
  console.log(`  Toplam güncellenen kayıt: ${totalUpdated}`);
  console.log(`  Güncellenen ülke varyantı: ${results.length}`);

  // Normalizasyon sonrası kalan distinct ülke sayısı
  const distinctCountries = await prisma.team.groupBy({
    by: ["country"],
    _count: true,
    orderBy: { _count: { country: "desc" } },
  });

  console.log(`\n  Normalize sonrası distinct ülke sayısı: ${distinctCountries.length}`);
  console.log("\n  Top 20 Ülke (normalize sonrası):");
  for (const c of distinctCountries.slice(0, 20)) {
    console.log(`    "${c.country ?? "(null)"}" → ${c._count} takım`);
  }

  await prisma.$disconnect();
}

normalizeCountryNames();
