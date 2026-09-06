/**
 * 2005 Dönemi Enflasyonunu Kırma ve Kalibrasyon Scripti.
 * 
 * 1. 2000'lerin yıldızlarına modern EA Sports FC İkon/Hero ve gerçek kariyer puanlarını uygular.
 * 2. Sahte/placeholder kayıtları (Marcelo M, 29 Şubat) temizler.
 * 3. 2004-2008 döneminden kalan orantısız 89+ puanları deflasyon eğrisiyle gerçek değerine çeker.
 * 4. PostgreSQL ve oyuncu indeksini günceller.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../../lib/db/client";
import { normalizePlayerName } from "../../lib/overall/normalizePlayerName";
import { FifaPlayerRecord } from "../../lib/overall/fifaTypes";
import { buildFifaIndices, matchPlayerToFifa } from "../../lib/overall/matchPlayerToFifa";

interface IconHero {
  name: string;
  dob: string;
  nationality: string;
  overall: number;
  positions: string[];
}

interface CalibrationRule {
  match: (s: string, l: string, dob: string) => boolean;
  overall: number;
  positions?: string[];
}

const FAKE_DOBS = new Set([
  "1978-01-01", "1978-01-24", "1983-01-24", "1985-09-22",
  "1979-06-20", "1981-08-05", "1982-07-27", "1975-01-14",
  "1984-07-02", "1985-08-25", "1992-01-11"
]);

const FAKE_NAMES = new Set([
  "hans de noteboom", "petrovici teodor", "andrei murgu"
]);

const CALIBRATION_RULES: CalibrationRule[] = [
  { match: (s, l) => s.includes("valeron") || l.includes("valeron"), overall: 85, positions: ["CAM", "CM"] },
  { match: (s, l) => s.includes("aimar") || l.includes("aimar"), overall: 88, positions: ["CAM", "CF", "CM"] },
  { match: (s, l, dob) => s.includes("ze roberto") || (l.includes("roberto") && l.includes("silva") && dob === "1974-07-06"), overall: 89, positions: ["CAM", "LB", "LW", "CM"] },
  { match: (s, l) => s.includes("morientes") || l.includes("morientes"), overall: 88, positions: ["ST", "CF"] },
  { match: (s, l, dob) => s.includes("juninho") && dob === "1975-01-30", overall: 87, positions: ["CAM", "CM"] },
  { match: (s, l, dob) => s.includes("vicente") && dob === "1981-07-16", overall: 85, positions: ["LW", "LM"] },
  { match: (s, l) => s.includes("vidal") && l.includes("arturo"), overall: 87, positions: ["CM", "CDM"] },
  { match: (s, l) => s.includes("robinho") || l.includes("robson de souza"), overall: 86, positions: ["LW", "CAM", "ST"] },
  { match: (s, l, dob) => s.includes("david silva") || (l.includes("david") && l.includes("silva") && dob === "1986-01-08"), overall: 89, positions: ["CAM", "CM", "LW"] },
  { match: (s, l) => s.includes("gotze") || l.includes("gotze"), overall: 86, positions: ["CAM", "CF"] },
  { match: (s, l) => s.includes("farfan") || l.includes("farfan"), overall: 84, positions: ["RW", "ST"] },
  { match: (s, l) => s.includes("marcelinho paraiba") || l.includes("marcelo dos santos"), overall: 83, positions: ["CAM", "ST"] },
  { match: (s, l) => s.includes("stilian petrov") || l.includes("stilian petrov"), overall: 82, positions: ["CM"] },
  { match: (s, l) => s.includes("rui costa") || l.includes("rui costa"), overall: 88, positions: ["CAM"] },
  { match: (s, l) => s.includes("worns") || l.includes("worns"), overall: 83, positions: ["CB"] },
  { match: (s, l) => s.includes("mahamadou diarra") || l.includes("mahamadou diarra"), overall: 84, positions: ["CDM", "CM"] },
  { match: (s, l) => s.includes("canizares") || l.includes("canizares"), overall: 86, positions: ["GK"] },
  { match: (s, l, dob) => s.includes("lauren") && dob === "1977-01-19", overall: 83, positions: ["RB", "RWB"] },
  { match: (s, l) => s.includes("ljungberg") || l.includes("ljungberg"), overall: 86, positions: ["RM", "RW", "LM"] },
  { match: (s, l, dob) => s.includes("deco") && dob === "1977-08-27", overall: 88, positions: ["CAM", "CM"] },
  { match: (s, l, dob) => s.includes("samuel") && dob === "1978-03-23", overall: 87, positions: ["CB"] },
  { match: (s, l) => s.includes("nikopolidis") || l.includes("nikopolidis"), overall: 83, positions: ["GK"] },
  { match: (s, l, dob) => s.includes("ayala") && dob === "1973-04-14", overall: 87, positions: ["CB"] },
  { match: (s, l, dob) => s.includes("ferrara") && dob === "1967-02-11", overall: 86, positions: ["CB"] },
  { match: (s, l) => s.includes("deisler") || l.includes("deisler"), overall: 84, positions: ["RM", "RW", "CAM"] },
  { match: (s, l, dob) => s.includes("denilson") && dob === "1977-08-24", overall: 84, positions: ["LW", "LM"] },
  { match: (s, l, dob) => s.includes("david james") && dob === "1970-08-01", overall: 81, positions: ["GK"] },
  { match: (s, l, dob) => s.includes("balde") && dob === "1975-10-13", overall: 79, positions: ["CB"] },
  { match: (s, l) => s.includes("seitaridis") || l.includes("seitaridis"), overall: 80, positions: ["RB"] },
  { match: (s, l) => s.includes("mintal") || l.includes("mintal"), overall: 81, positions: ["CAM", "ST"] },
  { match: (s, l) => s.includes("hildebrand") || l.includes("hildebrand"), overall: 82, positions: ["GK"] },
  { match: (s, l, dob) => s.includes("reyes") && dob === "1983-09-01", overall: 84, positions: ["LW", "LM", "ST"] },
  { match: (s, l, dob) => s.includes("meira") && dob === "1978-06-05", overall: 81, positions: ["CB"] },
  { match: (s, l, dob) => s.includes("tomasson") && dob === "1976-08-29", overall: 83, positions: ["ST", "CF"] },
  { match: (s, l, dob) => s.includes("nowotny") && dob === "1974-01-11", overall: 83, positions: ["CB"] },
  { match: (s, l, dob) => s.includes("bordon") && dob === "1976-01-07", overall: 82, positions: ["CB"] },
  { match: (s, l, dob) => s.includes("helguera") && dob === "1975-03-28", overall: 84, positions: ["CB", "CDM"] },
  { match: (s, l, dob) => s.includes("molina") && dob === "1970-08-08", overall: 82, positions: ["GK"] },
  { match: (s, l, dob) => s.includes("nene") && dob === "1975-06-06", overall: 82, positions: ["LW", "CAM"] },
  { match: (s, l) => s.includes("rosicky") || l.includes("rosicky"), overall: 86, positions: ["CAM", "CM"] },
  { match: (s, l) => s.includes("roy keane") || l.includes("roy keane"), overall: 86, positions: ["CM", "CDM"] },
  { match: (s, l) => s.includes("zambrotta") || l.includes("zambrotta"), overall: 86, positions: ["RB", "LB"] },
  { match: (s, l) => s.includes("vieri") || l.includes("vieri"), overall: 88, positions: ["ST"] },
  { match: (s, l) => s.includes("inzaghi") || l.includes("inzaghi"), overall: 88, positions: ["ST"] },
  { match: (s, l) => s.includes("cisse") && (s.includes("djibril") || l.includes("djibril")), overall: 85, positions: ["ST"] },
  { match: (s, l) => s.includes("giuly") || l.includes("giuly"), overall: 86, positions: ["RW", "RM"] },
  { match: (s, l) => s.includes("given") && (s.includes("shay") || l.includes("shay")), overall: 84, positions: ["GK"] },
  { match: (s, l) => s.includes("cudicini") || l.includes("cudicini"), overall: 82, positions: ["GK"] },
  { match: (s, l) => s.includes("coupet") || l.includes("coupet"), overall: 84, positions: ["GK"] },
  { match: (s, l) => s.includes("barthez") || l.includes("barthez"), overall: 86, positions: ["GK"] },
  { match: (s, l) => s.includes("karagounis") || l.includes("karagounis"), overall: 80, positions: ["CM", "CAM"] },
  { match: (s, l) => s.includes("anelka") || l.includes("anelka"), overall: 86, positions: ["ST"] },
  { match: (s, l) => s.includes("cassano") || l.includes("cassano"), overall: 85, positions: ["CF", "ST"] },
  { match: (s, l) => s.includes("miccoli") || l.includes("miccoli"), overall: 84, positions: ["CF", "ST"] },
  { match: (s, l) => s.includes("metzelder") || l.includes("metzelder"), overall: 82, positions: ["CB"] },
  { match: (s, l) => s.includes("van buyten") || l.includes("van buyten"), overall: 82, positions: ["CB"] },
  { match: (s, l) => s.includes("cris") && (s === "cris" || l === "cris"), overall: 83, positions: ["CB"] },
  { match: (s, l) => s.includes("landreau") || l.includes("landreau"), overall: 83, positions: ["GK"] },
  { match: (s, l) => s.includes("wiltord") || l.includes("wiltord"), overall: 84, positions: ["ST", "RW"] },
  { match: (s, l) => s.includes("muller") && (s.includes("thomas") || l.includes("thomas")), overall: 87, positions: ["CAM", "CF", "ST"] },
  { match: (s, l) => s.includes("ozil") || l.includes("ozil"), overall: 89, positions: ["CAM"] },
  { match: (s, l) => s.includes("reus") || l.includes("reus"), overall: 88, positions: ["CAM", "LW"] },
  { match: (s, l) => s.includes("kagawa") || l.includes("kagawa"), overall: 83, positions: ["CAM"] },
  { match: (s, l, dob) => s.includes("chiellini") || l.includes("chiellini"), overall: 89, positions: ["CB"] },
  { match: (s, l, dob) => s.includes("john terry") || l.includes("john terry"), overall: 88, positions: ["CB"] },
  // Lakap / Mononym çakışmaları
  { match: (s, l, dob) => (s === "cafu" || l.includes("ribeiro dias")) && dob.startsWith("1993"), overall: 74, positions: ["RB", "RWB", "CDM", "CM"] },
  { match: (s, l, dob) => s === "pele" && dob.startsWith("1991"), overall: 76, positions: ["CDM", "CM"] },
  { match: (s, l, dob) => s === "pele" && dob.startsWith("1987"), overall: 74, positions: ["CDM", "CM"] },
  { match: (s, l, dob) => (s === "carlos alberto" || l.includes("gomes de jesus")) && dob.startsWith("1984"), overall: 81, positions: ["CAM", "CF", "LW"] },
  { match: (s, l, dob) => s === "ronaldo" && dob.startsWith("1996"), overall: 72, positions: ["CDM", "CM"] },
  { match: (s, l, dob) => s === "kaka" && dob.startsWith("1991"), overall: 71, positions: ["CAM", "LW"] },
  { match: (s, l, dob) => (s === "maicon" || l.includes("pereira roque")) && dob.startsWith("1988"), overall: 81, positions: ["CB"] },
  { match: (s, l, dob) => (s === "maicon" || l.includes("bittencourt")) && dob.startsWith("1990"), overall: 76, positions: ["RW", "LW"] },
  { match: (s, l, dob) => (s === "raul" || l.includes("melo da silva")) && dob.startsWith("1989"), overall: 79, positions: ["CB"] },
  // Messias / Messiah / Messiniti / Gamba / Lupoli / Farnolle
  { match: (s, l) => s.includes("junior messias") || l.includes("junior walter messias"), overall: 78, positions: ["RW", "CAM", "ST", "CF"] },
  { match: (s, l, dob) => (s === "messias" || l.includes("messias rodrigues")) && dob.startsWith("1994"), overall: 76, positions: ["CB", "LB"] },
  { match: (s, l) => s.includes("messiah bright") || l.includes("messiah bright"), overall: 73, positions: ["ST", "LW"] },
  { match: (s, l) => s.includes("messiniti") || l.includes("messiniti"), overall: 67, positions: ["ST"] },
  { match: (s, l) => s.includes("gamba") || l.includes("gamba"), overall: 76, positions: ["ST", "LW", "RW"] },
  { match: (s, l) => s.includes("lupoli") || l.includes("lupoli"), overall: 72, positions: ["ST", "CF"] },
  { match: (s, l) => s.includes("farnolle") || l.includes("farnolle"), overall: 68, positions: ["GK"] },
];

function loadIconHeroes(): IconHero[] {
  const filePath = path.join(process.cwd(), "data", "fc-icons-heroes.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadFifaPrimeDb(): FifaPlayerRecord[] {
  const filePath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function deflate2005Records(
  records: FifaPlayerRecord[],
  icons: IconHero[]
): FifaPlayerRecord[] {
  const iconMap = new Map<string, IconHero>();
  for (const icon of icons) {
    iconMap.set(normalizePlayerName(icon.name), icon);
  }

  const cleaned: FifaPlayerRecord[] = [];
  const seen = new Set<string>();

  for (const r of records) {
    const sNorm = normalizePlayerName(r.shortName);
    const lNorm = normalizePlayerName(r.longName);

    // 1. Sahte M (Marcelo) generic kaydını temizle
    if (r.dob === "1992-02-29" && (r.shortName === "M" || lNorm === "marcelo") && r.maxOverall >= 85) {
      continue;
    }

    // 2. Sahte isimler ve hatalı kopyaları temizle
    if (FAKE_NAMES.has(lNorm) || FAKE_NAMES.has(sNorm)) {
      continue;
    }
    if (r.dob && FAKE_DOBS.has(r.dob)) {
      continue;
    }

    // 3. Kalibrasyon kurallarını uygula
    let calibrated = false;
    for (const rule of CALIBRATION_RULES) {
      if (rule.match(sNorm, lNorm, r.dob)) {
        r.maxOverall = rule.overall;
        if (rule.positions) r.positions = rule.positions;
        calibrated = true;
        break;
      }
    }

    // 4. İkon/Hero eşleşmesi varsa uygula (Doğum yılı farkı en fazla 2 yıl olmalı)
    if (!calibrated) {
      const iconMatch = iconMap.get(lNorm) || iconMap.get(sNorm);
      if (iconMatch) {
        let isDobMatch = true;
        if (r.dob && iconMatch.dob) {
          const rYear = parseInt(r.dob.slice(0, 4), 10);
          const iconYear = parseInt(iconMatch.dob.slice(0, 4), 10);
          if (!isNaN(rYear) && !isNaN(iconYear) && Math.abs(rYear - iconYear) > 2) {
            isDobMatch = false;
          }
        }
        if (isDobMatch) {
          r.maxOverall = iconMatch.overall;
          r.positions = iconMatch.positions;
        }
      }
    }

    // 5. Lionel Messi ve Cristiano Ronaldo her zaman 96 (Kesin eşleşme)
    const isMessi = (r.dob === "1987-06-24" && (lNorm.includes("messi") || sNorm.includes("messi"))) ||
                    (lNorm.includes("lionel") && lNorm.includes("messi"));
    if (isMessi) {
      r.maxOverall = 96;
    }

    const isRonaldo = (r.dob === "1985-02-05" && (lNorm.includes("ronaldo") || sNorm.includes("ronaldo"))) ||
                      (lNorm.includes("cristiano") && lNorm.includes("ronaldo"));
    if (isRonaldo) {
      r.maxOverall = 96;
    }

    const key = r.dob ? `${r.dob}_${lNorm || sNorm}` : `name_${lNorm || sNorm}`;
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(r);
    }
  }

  return cleaned;
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

async function syncPostgres(records: FifaPlayerRecord[]): Promise<void> {
  console.log("\n💿 [PostgreSQL Güncellemesi] Veriler senkronize ediliyor...");
  const indices = buildFifaIndices(records);

  const dbPlayers = await prisma.player.findMany({
    select: { id: true, fullName: true, birthDate: true, nationality: true },
  });

  const updates: { id: string; overallPrime: number | null; positions: string[] }[] = [];
  for (const p of dbPlayers) {
    const matched = matchPlayerToFifa(p, indices);
    updates.push({
      id: p.id,
      overallPrime: matched ? matched.maxOverall : null,
      positions: matched ? matched.positions : [],
    });
  }

  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const values = batch.map((item) => {
      const posArray = item.positions.length > 0
        ? `ARRAY[${item.positions.map((x) => `'${escapeSql(x)}'`).join(",")}]::text[]`
        : `ARRAY[]::text[]`;
      const ovrVal = item.overallPrime === null ? "NULL" : `${item.overallPrime}`;
      return `('${escapeSql(item.id)}'::text, ${ovrVal}::int, ${posArray}::text[])`;
    }).join(",\n");

    const sql = `
      UPDATE players AS p
      SET 
        overall_prime = c.overall_prime,
        positions = c.positions
      FROM (VALUES
${values}
      ) AS c(id, overall_prime, positions)
      WHERE p.id = c.id;
    `;
    await prisma.$executeRawUnsafe(sql);
  }

  // Messi ve Ronaldo'yu garanti 96 yap
  await prisma.player.updateMany({
    where: { fullName: { contains: "Lionel Messi", mode: "insensitive" } },
    data: { overallPrime: 96 },
  });
  await prisma.player.updateMany({
    where: {
      AND: [
        { fullName: { contains: "Cristiano", mode: "insensitive" } },
        { fullName: { contains: "Ronaldo", mode: "insensitive" } },
      ],
    },
    data: { overallPrime: 96 },
  });

  // Messias ve Junior Messias'ı kesin olarak kendi orijinal seviyelerine çek
  await prisma.player.updateMany({
    where: { fullName: "Junior Messias" },
    data: { overallPrime: 78 },
  });
  await prisma.player.updateMany({
    where: { fullName: "Messias", nationality: "Brazil" },
    data: { overallPrime: 76 },
  });

  console.log(`   ✅ ${updates.length} oyuncu başarıyla güncellendi!`);
}

async function run() {
  console.log("⚡ [2005 Deflasyon & Kalibrasyon] Başlatılıyor...\n");
  const startTime = Date.now();

  const icons = loadIconHeroes();
  const rawRecords = loadFifaPrimeDb();

  const deflated = deflate2005Records(rawRecords, icons);

  const outPath = path.join(process.cwd(), "data", "fifa-prime-database.json");
  fs.writeFileSync(outPath, JSON.stringify(deflated, null, 2), "utf-8");
  console.log("💾 fifa-prime-database.json kaydedildi.");

  await syncPostgres(deflated);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [BAŞARILI] 2005 Dönemi Kalibrasyonu Tamamlandı! (${duration}s)`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
