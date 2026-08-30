/**
 * Güvenli Transaction Tabanlı Mükerrer Futbolcu Birleştirme Scripti.
 * İsim + Doğum Tarihi eşleşen gerçek mükerrer oyuncuları kanonik kayda bağlar.
 */

import { PrismaClient } from "@prisma/client";
import { normalizeText } from "../lib/validation/normalizeText";

const prisma = new PrismaClient();

interface DuplicatePair {
  canonicalId: string;
  duplicateId: string;
  name: string;
  birthDate: string;
}

async function main() {
  console.log("⚡ [Oyuncu Birleştirme] Başlatılıyor...\n");

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

  const dateGroups = new Map<string, typeof players>();

  for (const p of players) {
    if (!p.birthDate) continue;
    const dateStr = p.birthDate.toISOString().slice(0, 10);
    if (!dateGroups.has(dateStr)) dateGroups.set(dateStr, []);
    dateGroups.get(dateStr)!.push(p);
  }

  const pairsToMerge: DuplicatePair[] = [];

  for (const [dateStr, list] of dateGroups.entries()) {
    if (list.length < 2) continue;

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const p1 = list[i];
        const p2 = list[j];

        // İsimleri parantez ve eklerden temizle
        const clean1 = p1.fullName.replace(/\(.*?\)/g, "").trim();
        const clean2 = p2.fullName.replace(/\(.*?\)/g, "").trim();

        const norm1 = normalizeText(clean1);
        const norm2 = normalizeText(clean2);

        // İkiz kardeşleri ayır: İlk kelimeleri farklıysa (Halil != Hamit, Dani != Javi, Lucas != Luan) BİRLEŞTİRME!
        const words1 = norm1.split(" ");
        const words2 = norm2.split(" ");

        const isExactSame = norm1 === norm2;
        const isTranscriptionSame =
          words1.length === words2.length &&
          words1[0] === words2[0] &&
          (norm1.replace(/s/g, "sh").replace(/c/g, "ch") === norm2.replace(/s/g, "sh").replace(/c/g, "ch"));

        if (isExactSame || isTranscriptionSame) {
          // Kanonik olarak en çok takım geçmişi olanı veya externalRef olanı seç
          const canonical = p1._count.teamsHistory >= p2._count.teamsHistory ? p1 : p2;
          const duplicate = canonical.id === p1.id ? p2 : p1;

          pairsToMerge.push({
            canonicalId: canonical.id,
            duplicateId: duplicate.id,
            name: canonical.fullName,
            birthDate: dateStr,
          });
        }
      }
    }
  }

  console.log(`📋 Birleştirilecek Doğrulanmış Mükerrer Oyuncu Sayısı: ${pairsToMerge.length}\n`);

  let mergedCount = 0;

  for (const pair of pairsToMerge) {
    try {
      // 1. Mükerrer oyuncunun takımlarını al
      const dupHistories = await prisma.playerTeamHistory.findMany({
        where: { playerId: pair.duplicateId },
      });

      // 2. Kanonik oyuncunun mevcut takımlarını al
      const canHistories = await prisma.playerTeamHistory.findMany({
        where: { playerId: pair.canonicalId },
      });
      const existingTeamIds = new Set(canHistories.map((h) => h.teamId));

      await prisma.$transaction(async (tx) => {
        // Kanonikte olmayan takımları kanoniğe aktar
        for (const h of dupHistories) {
          if (!existingTeamIds.has(h.teamId)) {
            await tx.playerTeamHistory.update({
              where: { id: h.id },
              data: { playerId: pair.canonicalId },
            });
            existingTeamIds.add(h.teamId);
          } else {
            // Zaten varsa mükerrer history satırını sil
            await tx.playerTeamHistory.delete({
              where: { id: h.id },
            });
          }
        }

        // Mükerrer oyuncu kaydını sil
        await tx.player.delete({
          where: { id: pair.duplicateId },
        });
      });

      console.log(`✓ [Birleştirildi] ${pair.name} (Doğum: ${pair.birthDate}) [${pair.duplicateId} ➔ ${pair.canonicalId}]`);
      mergedCount++;
    } catch (err) {
      console.error(`❌ [Hata] ${pair.name} birleştirilemedi:`, err);
    }
  }

  console.log(`\n🎉 Toplam ${mergedCount} mükerrer oyuncu kaydı başarıyla ana kayıtla birleştirildi.`);
}

main()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
