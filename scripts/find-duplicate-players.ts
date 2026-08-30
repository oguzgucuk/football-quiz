/**
 * İsim + Doğum Tarihi parmak izi ve Doğum Tarihi + Levenshtein benzerliğiyle mükerrer futbolcuları bulan gelişmiş tespit scripti.
 */

import { PrismaClient } from "@prisma/client";
import { normalizeText } from "../lib/validation/normalizeText";
import { isTypoMatch } from "../lib/validation/levenshtein";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 [Gelişmiş Mükerrer Oyuncu Tespiti] Veritabanı taranıyor...\n");

  const players = await prisma.player.findMany({
    select: {
      id: true,
      fullName: true,
      birthDate: true,
      nationality: true,
      externalRef: true,
      _count: {
        select: {
          teamsHistory: true,
        },
      },
    },
  });

  console.log(`📊 Toplam Oyuncu Sayısı: ${players.length}`);

  // 1. Doğum tarihine göre grupla
  const dateGroups = new Map<string, typeof players>();

  for (const p of players) {
    if (!p.birthDate) continue;
    const dateStr = p.birthDate.toISOString().slice(0, 10);
    if (!dateGroups.has(dateStr)) dateGroups.set(dateStr, []);
    dateGroups.get(dateStr)!.push(p);
  }

  const duplicates: Array<{ canonical: typeof players[0]; duplicate: typeof players[0]; reason: string }> = [];

  for (const [dateStr, list] of dateGroups.entries()) {
    if (list.length < 2) continue;

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const p1 = list[i];
        const p2 = list[j];

        const norm1 = normalizeText(p1.fullName);
        const norm2 = normalizeText(p2.fullName);

        if (norm1 === norm2) {
          duplicates.push({ canonical: p1, duplicate: p2, reason: "Birebir İsim + Doğum Tarihi" });
        } else if (isTypoMatch(norm1, norm2, 2) || (norm1.length >= 5 && norm2.startsWith(norm1)) || (norm2.length >= 5 && norm1.startsWith(norm2))) {
          duplicates.push({ canonical: p1, duplicate: p2, reason: "Benzer İsim / Aksan / Typo + Doğum Tarihi" });
        }
      }
    }
  }

  console.log(`\n✅ [Tespit Edilen Mükerrer Oyuncu Çiftleri]: ${duplicates.length} çift:\n`);
  for (const d of duplicates) {
    console.log(` • [${d.reason}] [Doğum: ${d.canonical.birthDate?.toISOString().slice(0, 10)}]`);
    console.log(`    A: [${d.canonical.id}] ${d.canonical.fullName} (${d.canonical.nationality || "Bilinmiyor"}) [${d.canonical._count.teamsHistory} takım] (ref: ${d.canonical.externalRef || "yok"})`);
    console.log(`    B: [${d.duplicate.id}] ${d.duplicate.fullName} (${d.duplicate.nationality || "Bilinmiyor"}) [${d.duplicate._count.teamsHistory} takım] (ref: ${d.duplicate.externalRef || "yok"})\n`);
  }
}

main()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
