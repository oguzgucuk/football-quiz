/**
 * Veritabanındaki Hatalı / Buglı Pozisyonları Temizleme Scripti.
 *
 * 1. Darren Ambrose: 11 mevkili (GK dahil) bug düzeltilir -> ["CAM", "CM", "RM", "RW"], OVR: 76
 * 2. Pozisyonu 'Goalkeeper' olan oyunculardan kaleci dışındaki mevkiler ayıklanır (yalnızca ["GK"]).
 * 3. Pozisyonu 'Midfield', 'Defender', 'Attack' olan saha içi oyunculardan hatalı eklenmiş 'GK' mevkisi ayıklanır.
 */

import { prisma } from "../lib/db/client";

async function main() {
  console.log("🧹 [CleanPositions] Hatalı oyuncu mevkileri taranıyor...");

  // 1. Darren Ambrose Düzeltmesi
  const ambrose = await prisma.player.findFirst({
    where: { fullName: { contains: "Darren Ambrose", mode: "insensitive" } },
  });

  if (ambrose) {
    await prisma.player.update({
      where: { id: ambrose.id },
      data: {
        positions: ["CAM", "CM", "RM", "RW"],
        overallPrime: 76,
        position: "Midfield",
      },
    });
    console.log(`✅ [CleanPositions] Darren Ambrose düzeltildi: ["CAM", "CM", "RM", "RW"], OVR: 76`);
  }

  // 2. Sadece overallPrime'ı olan ve mevkileri bariz hatalı oyuncular taranır
  const players = await prisma.player.findMany({
    where: { overallPrime: { not: null } },
    select: { id: true, fullName: true, positions: true, position: true },
  });

  const anomalous = players.filter(
    (p) =>
      p.positions.length > 6 ||
      (p.positions.includes("GK") && p.positions.length > 1 && p.position !== "Goalkeeper") ||
      (p.position === "Goalkeeper" && p.positions.some((pos) => pos !== "GK"))
  );

  console.log(`🔍 [CleanPositions] Düzeltilecek oyuncu sayısı: ${anomalous.length}`);

  for (const p of anomalous) {
    let cleaned: string[];
    if (p.position === "Goalkeeper") {
      cleaned = ["GK"];
    } else {
      cleaned = p.positions.filter((pos) => pos !== "GK");
      if (cleaned.length === 0) {
        cleaned = [p.position === "Defender" ? "CB" : p.position === "Attack" ? "ST" : "CM"];
      }
      if (cleaned.length > 5) {
        cleaned = cleaned.slice(0, 4);
      }
    }

    await prisma.player.update({
      where: { id: p.id },
      data: { positions: cleaned },
    });
  }

  console.log(`✅ [CleanPositions] ${anomalous.length} oyuncunun mevkileri başarıyla temizlendi.`);
}

main()
  .catch((err) => {
    console.error("❌ [CleanPositions] Hata:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

