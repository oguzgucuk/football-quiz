import sharp from "sharp";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { prisma } from "../lib/db/client";

export interface AuditResult {
  file: string;
  teamId: string;
  teamName: string;
  country: string;
  league: string;
  suspicious: boolean;
  reasons: string[];
  width: number;
  height: number;
  ratio: number;
  format: string;
  sizeBytes: number;
  hasAlpha: boolean;
}

async function auditLogo(filePath: string, teamMap: Map<string, any>): Promise<AuditResult> {
  const fileName = path.basename(filePath);
  const teamId = path.parse(fileName).name;
  const team = teamMap.get(teamId) || { name: "Bilinmeyen Kulüp", country: "-", league: "-" };

  const reasons: string[] = [];
  const fileStat = await stat(filePath);
  const sizeBytes = fileStat.size;

  let width = 0;
  let height = 0;
  let ratio = 1;
  let format = "";
  let hasAlpha = false;

  try {
    const metadata = await sharp(filePath).metadata();
    width = metadata.width ?? 0;
    height = metadata.height ?? 0;
    ratio = height > 0 ? width / height : 1;
    format = metadata.format ?? (fileName.endsWith(".svg") ? "svg" : "unknown");
    hasAlpha = !!metadata.hasAlpha;

    // 1. En-boy oranı kontrolü: gerçek amblemler genelde kare veya dikey/yatay hafifçe orantılıdır (0.70 - 1.40).
    // Dikdörtgen fotoğraf / panorama kontrolü:
    if (ratio > 1.35 || ratio < 0.65) {
      reasons.push(`Şüpheli en-boy oranı: ${ratio.toFixed(2)} (${width}x${height}px) - amblem beklenmez`);
    }

    // 2. Format ve Alpha kanalı kontrolü:
    // PNG formatında fotoğraf olup alpha kanalı olmayanlar (opak dikdörtgen fotoğraflar):
    if (format === "png" && !hasAlpha) {
      reasons.push("PNG formatında ama saydamlık (alpha) yok — opak fotoğraf olabilir");
    }

    if (format === "jpeg" || format === "jpg") {
      reasons.push("JPG formatı — amblemler SVG/PNG olmalı, stadyum/maç fotoğrafı olabilir");
    }

    // 3. Dosya boyutu kontrolü (> 1 MB raster veya anormal büyük dosyalar)
    if (sizeBytes > 1024 * 1024) {
      reasons.push(`Aşırı büyük dosya boyutu: ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`);
    }

    // 4. SVG içi raster embed kontrolü (bazı SVG'ler stadyum fotoğrafını base64 gömer)
    if (fileName.endsWith(".svg")) {
      const svgText = await readFile(filePath, "utf-8");
      if (svgText.includes("<image") || svgText.includes("data:image/jpeg") || svgText.includes("data:image/png")) {
        reasons.push("SVG içine gömülü raster/fotoğraf öğesi (<image>) bulundu");
      }
    }
  } catch (err: any) {
    reasons.push(`Görsel okuma hatası: ${err.message}`);
  }

  return {
    file: fileName,
    teamId,
    teamName: team.name,
    country: team.country,
    league: team.league,
    suspicious: reasons.length > 0,
    reasons,
    width,
    height,
    ratio,
    format,
    sizeBytes,
    hasAlpha,
  };
}

async function createContactSheet(suspiciousItems: AuditResult[], outputPath: string) {
  if (suspiciousItems.length === 0) return;

  const thumbSize = 160;
  const padding = 20;
  const cols = 4;
  const rows = Math.ceil(suspiciousItems.length / cols);
  const cardWidth = thumbSize + padding * 2;
  const cardHeight = thumbSize + 70; // 70px for text label

  const sheetWidth = cols * cardWidth;
  const sheetHeight = rows * cardHeight;

  // Render cards
  const compositeList: { input: Buffer; top: number; left: number }[] = [];

  for (let i = 0; i < suspiciousItems.length; i++) {
    const item = suspiciousItems[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * cardWidth + padding;
    const top = row * cardHeight + padding;

    const filePath = path.join(process.cwd(), "public/team-logos", item.file);

    try {
      const resizedImg = await sharp(filePath)
        .resize(thumbSize, thumbSize, { fit: "contain", background: { r: 30, g: 41, b: 59, alpha: 1 } })
        .png()
        .toBuffer();

      // SVG text label overlay
      const cleanName = item.teamName.replace(/[<>&'"]/g, "");
      const cleanReason = (item.reasons[0] || "").slice(0, 30).replace(/[<>&'"]/g, "");
      const labelSvg = `
        <svg width="${thumbSize}" height="50">
          <rect width="100%" height="100%" fill="#0f172a" rx="4" />
          <text x="50%" y="20" font-size="11" font-family="sans-serif" font-weight="bold" fill="#f8fafc" text-anchor="middle">${cleanName}</text>
          <text x="50%" y="38" font-size="9" font-family="sans-serif" fill="#f87171" text-anchor="middle">${cleanReason}</text>
        </svg>
      `;

      compositeList.push({ input: resizedImg, left, top });
      compositeList.push({
        input: Buffer.from(labelSvg),
        left,
        top: top + thumbSize + 6,
      });
    } catch (e) {
      console.error(`Contact sheet thumbnail error (${item.file}):`, e);
    }
  }

  // Base background
  const baseImg = sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    },
  });

  await baseImg.composite(compositeList).png().toFile(outputPath);
  console.log(`\n🖼️  Contact Sheet oluşturuldu: ${outputPath}`);
}

async function runAudit() {
  console.log("🔍 [Audit Logo Quality] Tüm logolar inceleniyor...\n");

  const teams = await prisma.team.findMany({
    select: { id: true, name: true, country: true, league: true },
  });
  const teamMap = new Map<string, any>();
  for (const t of teams) {
    teamMap.set(t.id, t);
  }

  const dir = path.join(process.cwd(), "public/team-logos");
  const files = await readdir(dir);

  const results: AuditResult[] = [];
  for (const file of files) {
    const res = await auditLogo(path.join(dir, file), teamMap);
    results.push(res);
  }

  const suspicious = results.filter((r) => r.suspicious);
  const valid = results.filter((r) => !r.suspicious);

  console.log(`========================================`);
  console.log(`📊 Toplam İncelenen: ${results.length} logo`);
  console.log(`✅ Temiz / Normal: ${valid.length} logo`);
  console.log(`⚠️  Şüpheli / Hatalı: ${suspicious.length} logo`);
  console.log(`========================================\n`);

  for (const r of suspicious) {
    console.log(`⚠️  [${r.teamName}] (${r.country} - ${r.league}) Dosya: ${r.file}`);
    console.log(`   Boyut: ${(r.sizeBytes / 1024).toFixed(1)} KB | Format: ${r.format} | Çözünürlük: ${r.width}x${r.height} (Oran: ${r.ratio.toFixed(2)}) | Alpha: ${r.hasAlpha}`);
    for (const reason of r.reasons) {
      console.log(`   - ❌ ${reason}`);
    }
    console.log("");
  }

  // Contact Sheet oluştur
  const contactSheetPath = path.join(process.cwd(), "public/suspicious-logos-contact-sheet.png");
  if (suspicious.length > 0) {
    await createContactSheet(suspicious, contactSheetPath);
  }

  return { suspicious, valid };
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
