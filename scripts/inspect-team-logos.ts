import fs from "fs";
import path from "path";
import { prisma } from "../lib/db/client";

async function inspectLogosAndDatabase() {
  const logosDir = path.join(process.cwd(), "public", "team-logos");
  let totalBytes = 0;
  let fileCount = 0;
  let svgCount = 0;
  let pngCount = 0;

  if (fs.existsSync(logosDir)) {
    const files = fs.readdirSync(logosDir);
    fileCount = files.length;
    for (const file of files) {
      const stat = fs.statSync(path.join(logosDir, file));
      totalBytes += stat.size;
      if (file.endsWith(".svg")) svgCount++;
      if (file.endsWith(".png")) pngCount++;
    }
  }

  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  // DB Sorguları
  const totalTeams = await prisma.team.count();
  const teamsWithLogo = await prisma.team.count({
    where: { logoUrl: { not: null } },
  });

  // Ülke bazlı logolar
  const countries = ["Türkiye", "Spain", "England", "Italy", "Germany", "France", "Portugal", "Brazil", "Argentina"];
  const countryBreakdown: Record<string, { total: number; withLogo: number; sampleWithLogo: string[]; sampleWithoutLogo: string[] }> = {};

  for (const c of countries) {
    const total = await prisma.team.count({ where: { country: c } });
    const withLogoTeams = await prisma.team.findMany({
      where: { country: c, logoUrl: { not: null } },
      select: { name: true, logoUrl: true },
      take: 5,
    });
    const withoutLogoTeams = await prisma.team.findMany({
      where: { country: c, logoUrl: null },
      select: { name: true },
      take: 5,
    });

    const withLogoCount = await prisma.team.count({
      where: { country: c, logoUrl: { not: null } },
    });

    countryBreakdown[c] = {
      total,
      withLogo: withLogoCount,
      sampleWithLogo: withLogoTeams.map((t) => t.name),
      sampleWithoutLogo: withoutLogoTeams.map((t) => t.name),
    };
  }

  console.log("=== LOGO VE VERİTABANI ANALİZ RAPORU ===");
  console.log(`📁 public/team-logos/ Toplam Dosya: ${fileCount} (${svgCount} SVG, ${pngCount} PNG)`);
  console.log(`💾 Toplam Disk Boyutu: ${totalMB} MB (${totalBytes} bytes)`);
  console.log(`📊 DB Toplam Takım Sayısı: ${totalTeams}`);
  console.log(`🛡️ Logolu Takım Sayısı: ${teamsWithLogo}`);
  console.log(`\n=== ÜLKE BAZLI DAĞILIM ===`);
  for (const [c, data] of Object.entries(countryBreakdown)) {
    console.log(`\n📌 ${c}: Toplam ${data.total} kulüp -> ${data.withLogo} logolu (%${((data.withLogo / (data.total || 1)) * 100).toFixed(1)})`);
    console.log(`   Logosu Olanlar (Örnek): ${data.sampleWithLogo.join(", ") || "Yok"}`);
    console.log(`   Fallback Olanlar (Örnek): ${data.sampleWithoutLogo.join(", ") || "Yok"}`);
  }
}

inspectLogosAndDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
