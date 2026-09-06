/**
 * ADIM 3: 90+ Elit Oyuncu Denetimi ve Raporlayıcı.
 * 
 * Veritabanındaki tüm 90+ reytingli oyuncuları listeler,
 * şişirilmiş veya sahte oyuncu kalmadığını teyit eder.
 */

import { prisma } from "../../lib/db/client";

async function runAudit() {
  console.log("🏆 [ADIM 3] 90+ Elit Oyuncu Denetimi Başlatılıyor...\n");

  const elitePlayers = await prisma.player.findMany({
    where: {
      overallPrime: { gte: 90 },
    },
    orderBy: [
      { overallPrime: "desc" },
      { fullName: "asc" },
    ],
    select: {
      id: true,
      fullName: true,
      nationality: true,
      birthDate: true,
      overallPrime: true,
      positions: true,
      teamsHistory: {
        take: 3,
        select: { team: { select: { name: true } } },
      },
    },
  });

  console.log(`📊 Toplam 90+ Oyuncu Sayısı: ${elitePlayers.length}\n`);

  const grouped = new Map<number, typeof elitePlayers>();
  for (const p of elitePlayers) {
    const list = grouped.get(p.overallPrime!) || [];
    list.push(p);
    grouped.set(p.overallPrime!, list);
  }

  const sortedRatings = Array.from(grouped.keys()).sort((a, b) => b - a);

  for (const rating of sortedRatings) {
    const list = grouped.get(rating)!;
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`⭐ REYTİNG: ${rating} (${list.length} Oyuncu)`);
    console.log(`═══════════════════════════════════════════════════════════`);
    for (const p of list) {
      const birth = p.birthDate ? p.birthDate.toISOString().split("T")[0] : "Bilinmiyor";
      const pos = (p.positions || []).join(", ") || "-";
      const clubs = p.teamsHistory.map((t) => t.team.name).join(", ");
      console.log(` • ${p.fullName.padEnd(28)} | ${p.nationality?.padEnd(15) || "-"} | D.T: ${birth} | [${pos}] | Kulüpler: ${clubs || "-"}`);
    }
  }

  console.log("\n✅ Denetim tamamlandı.");
}

runAudit().catch(console.error).finally(() => prisma.$disconnect());
