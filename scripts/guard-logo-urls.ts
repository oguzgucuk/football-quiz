/**
 * Logo URL Güvenlik ve Bütünlük Koruyucusu (CI / Build Guard)
 * 
 * Amaç:
 * 1. Veritabanındaki tüm takımların `logoUrl` alanlarını denetler; yerel `/team-logos/` kalmadığını doğrular.
 * 2. Kaynak kod (`app/`, `components/`, `party/`, `lib/`, `hooks/`) içerisindeki sabitleri tarar;
 *    Supabase Storage CDN harici yerel `/team-logos/` kullanımını engeller.
 * 3. Herhangi bir ihlal durumunda build sürecini hata kodu (1) ile durdurur.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../lib/db/client";

const SCAN_DIRECTORIES = ["app", "components", "party", "lib", "hooks", "types"];
const LOCAL_LOGO_PATTERN = /["']\/team-logos\/[^"']*["']/g;

async function checkDatabaseLogos(): Promise<number> {
  console.log("🔍 [Guard Logos] 1. Veritabanı takımları taranıyor...");

  // logoUrl yerel yol olan (http ile başlamayan) kayıtları bul
  const invalidTeams = await prisma.team.findMany({
    where: {
      OR: [
        { logoUrl: { startsWith: "/team-logos/" } },
        { logoUrl: { startsWith: "team-logos/" } },
      ],
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
    },
  });

  if (invalidTeams.length > 0) {
    console.error(`❌ [Guard Logos] Veritabanında ${invalidTeams.length} adet yerel logo yolu bulundu!`);
    invalidTeams.slice(0, 5).forEach((t) => {
      console.error(`   - [${t.id}] ${t.name} -> logoUrl: "${t.logoUrl}"`);
    });
    if (invalidTeams.length > 5) {
      console.error(`   ... ve ${invalidTeams.length - 5} takım daha.`);
    }
    return invalidTeams.length;
  }

  const totalTeamsWithLogo = await prisma.team.count({
    where: { logoUrl: { not: null } },
  });

  console.log(`   ✅ DB Kontrolü Temiz: ${totalTeamsWithLogo} logolu takımın tümü CDN/harici URL kullanıyor.`);
  return 0;
}

function scanDirectoryForLocalLogos(dirPath: string): { file: string; line: number; content: string }[] {
  const violations: { file: string; line: number; content: string }[] = [];

  if (!fs.existsSync(dirPath)) return violations;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      violations.push(...scanDirectoryForLocalLogos(fullPath));
    } else if (entry.isFile()) {
      // Sadece kaynak kod dosyalarını incele (.ts, .tsx, .js, .jsx, .json)
      const ext = path.extname(entry.name);
      if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;

      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Yerel /team-logos/ referansı ara (http veya supabase içermeyen)
        if (LOCAL_LOGO_PATTERN.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), fullPath),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }
  }

  return violations;
}

async function checkCodebaseLogos(): Promise<number> {
  console.log("🔍 [Guard Logos] 2. Kaynak kod dosyaları taranıyor...");
  const allViolations: { file: string; line: number; content: string }[] = [];

  for (const dir of SCAN_DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir);
    const violations = scanDirectoryForLocalLogos(dirPath);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    console.error(`❌ [Guard Logos] Kaynak kodda ${allViolations.length} adet yerel /team-logos/ kullanımı tespit edildi!`);
    allViolations.forEach((v) => {
      console.error(`   - ${v.file}:${v.line} -> ${v.content}`);
    });
    return allViolations.length;
  }

  console.log(`   ✅ Kaynak Kod Temiz: [${SCAN_DIRECTORIES.join(", ")}] dizinlerinde yerel /team-logos/ bulunamadı.`);
  return 0;
}

async function runGuard() {
  console.log("\n=================================================");
  console.log("🛡️ LOGO URL BÜTÜNLÜK VE BUILD GUARD DENETİMİ");
  console.log("=================================================\n");

  let totalViolations = 0;

  try {
    totalViolations += await checkDatabaseLogos();
    totalViolations += await checkCodebaseLogos();

    console.log("\n=================================================");
    if (totalViolations === 0) {
      console.log("🎉 [Guard Logos] Bütünlük testi BAŞARILI! Sıfır kırık logo referansı.\n");
      process.exit(0);
    } else {
      console.error(`🚨 [Guard Logos] Toplam ${totalViolations} ihlal bulundu. Build durduruldu!\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ [Guard Logos] Beklenmeyen hata:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runGuard();
