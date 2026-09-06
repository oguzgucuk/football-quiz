/**
 * ADIM 2: Modern EA Sports FC 24/25/26 İkon ve Hero Kalibrasyonu.
 * 
 * 2005 öncesi şişirilmiş 97-98 reytingleri ve eski TOTS kalıntılarını
 * resmî modern EA Sports FC standartlarına (Buffon 91, Bale 88, Hazard 89,
 * Henry 91, Zidane 94, R9 94, Cruyff 93, Maldini 92 vb.) eşitler.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../../lib/db/client";
import { normalizePlayerName } from "../../lib/overall/normalizePlayerName";
import { FifaPlayerRecord } from "../../lib/overall/fifaTypes";

interface IconHeroEntry {
  name: string;
  dob: string;
  nationality: string;
  overall: number;
  positions: string[];
}

function loadIconHeroDataset(): IconHeroEntry[] {
  const filePath = path.join(process.cwd(), "data", "fc-icons-heroes.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(`fc-icons-heroes.json bulunamadı: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadPrimeDatabase(): FifaPlayerRecord[] {
  const filePath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function updatePrimeDatabaseFile(icons: IconHeroEntry[]): void {
  const records = loadPrimeDatabase();
  if (records.length === 0) return;

  const iconMap = new Map<string, IconHeroEntry>();
  for (const icon of icons) {
    iconMap.set(normalizePlayerName(icon.name), icon);
  }

  let updatedCount = 0;
  for (const rec of records) {
    const norm = normalizePlayerName(rec.longName || rec.shortName);
    const match = iconMap.get(norm);
    if (match) {
      rec.maxOverall = match.overall;
      rec.positions = match.positions;
      updatedCount++;
    }
  }

  const filePath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
  console.log(`   💾 fifa-prime-database.json içinde ${updatedCount} efsane kalibre edildi.`);
}

async function calibrateDatabaseIcons(icons: IconHeroEntry[]): Promise<number> {
  let updatedInDb = 0;

  for (const icon of icons) {
    const normName = normalizePlayerName(icon.name);
    
    // Doğum tarihi ve isme göre eşleştir
    const candidates = await prisma.player.findMany({
      where: {
        OR: [
          { birthDate: icon.dob },
          { fullName: { contains: icon.name, mode: "insensitive" } },
        ],
      },
    });

    const target = candidates.find((c) => {
      if (icon.dob && c.birthDate === icon.dob) return true;
      const cNorm = normalizePlayerName(c.fullName);
      return cNorm === normName || cNorm.includes(normName) || normName.includes(cNorm);
    });

    if (target) {
      await prisma.player.update({
        where: { id: target.id },
        data: {
          overallPrime: icon.overall,
          positions: icon.positions,
        },
      });
      console.log(`   ✨ [Kalibre] ${target.fullName}: ${target.overallPrime ?? "null"} -> ${icon.overall} OVR (${icon.positions.join("/")})`);
      updatedInDb++;
    }
  }

  return updatedInDb;
}

export async function calibrateIconsAndHeroes(): Promise<void> {
  console.log("🌟 [ADIM 2] Modern EA Sports FC İkon & Hero Kalibrasyonu Başlatılıyor...\n");
  const startTime = Date.now();

  const icons = loadIconHeroDataset();
  console.log(`📖 [1/3] ${icons.length} adet resmî FC İkon ve Hero verisi yüklendi.`);

  console.log("\n💿 [2/3] Veritabanı kayıtları EA Sports FC standartlarına eşitleniyor...");
  const updatedCount = await calibrateDatabaseIcons(icons);
  console.log(`   ✅ Veritabanında ${updatedCount} oyuncu güncellendi.`);

  console.log("\n📂 [3/3] fifa-prime-database.json güncelleniyor...");
  updatePrimeDatabaseFile(icons);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [ADIM 2 BAŞARILI] Tüm İkon ve Herolar Kalibre Edildi! (${duration}s)`);
}

if (require.main === module) {
  calibrateIconsAndHeroes().catch(console.error);
}
