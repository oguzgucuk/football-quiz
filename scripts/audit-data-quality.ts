/**
 * Veritabanındaki tüm veri kalitesi sorunlarını raporlar:
 * - Duplicate takımlar (aynı isim, farklı kayıt)
 * - Ülke normalizasyon tutarsızlıkları
 * - Boş/null alan dağılımı
 */

import { prisma } from "@/lib/db/client";

async function auditDataQuality() {
  console.log("🔍 Veri Kalitesi Denetimi Başlatılıyor...\n");

  // 1. Ülke normalizasyon sorunları
  const allCountries = await prisma.team.groupBy({
    by: ["country"],
    _count: true,
    orderBy: { _count: { country: "desc" } },
  });

  console.log("🌍 TÜM ÜLKE DEĞERLERİ (normalizasyon sorunları):");
  for (const c of allCountries) {
    console.log(`  "${c.country ?? "(null)"}" → ${c._count} takım`);
  }

  // 2. İngilizce/Türkçe çakışmaları (UK örneği)
  const englandVariants = allCountries.filter((c) =>
    ["United Kingdom", "Birleşik Krallık", "England", "İngiltere", "Scotland", "Wales"].includes(c.country ?? "")
  );
  console.log("\n🇬🇧 İngiltere/UK Varyantları:");
  for (const v of englandVariants) {
    console.log(`  "${v.country}" → ${v._count} takım`);
  }

  const turkeyVariants = allCountries.filter((c) =>
    ["Turkey", "Türkiye", "Turkiye"].includes(c.country ?? "")
  );
  console.log("\n🇹🇷 Türkiye Varyantları:");
  for (const v of turkeyVariants) {
    console.log(`  "${v.country}" → ${v._count} takım`);
  }

  // 3. Duplicate isimler (aynı normalize isim, farklı ID)
  console.log("\n👥 DUPLICATE İSİMLER (aynı isim, birden fazla kayıt):");
  const allTeams = await prisma.team.findMany({
    select: { id: true, name: true, country: true, league: true },
  });

  const nameMap = new Map<string, typeof allTeams>();
  for (const t of allTeams) {
    const key = t.name.toLowerCase().trim();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(t);
  }

  let dupCount = 0;
  for (const [key, teams] of nameMap.entries()) {
    if (teams.length > 1) {
      dupCount++;
      if (dupCount <= 30) {
        console.log(`  "${key}" → ${teams.length} kayıt:`);
        for (const t of teams) {
          console.log(`    - ID: ${t.id} | Ülke: ${t.country ?? "(null)"} | Lig: ${t.league ?? "(null)"}`);
        }
      }
    }
  }
  console.log(`\n  Toplam duplicate isim grubu: ${dupCount}`);

  // 4. Boş alan istatistikleri
  const nullCountry = await prisma.team.count({ where: { country: null } });
  const nullLeague = await prisma.team.count({ where: { league: null } });
  const nullPopularity = await prisma.team.count({ where: { popularityScore: null } });

  console.log("\n📋 BOŞ ALAN İSTATİSTİKLERİ:");
  console.log(`  country null: ${nullCountry}`);
  console.log(`  league null: ${nullLeague}`);
  console.log(`  popularityScore null: ${nullPopularity}`);

  await prisma.$disconnect();
}

auditDataQuality();
