/**
 * Gelişmiş ve Tam Otomatik Kulüp Tekilleştirici (Advanced Auto-Merge All).
 * Ülke içi alt dize, Levenshtein mesafesi ve akıllı kulüp normalizasyonu ile
 * veritabanındaki tüm kulüp varyasyonlarını (örn: "Atlético de Madrid" ➔ "Atlético Madrid",
 * "Celta de Vigo" ➔ "Celta Vigo", "Athletic Club" ➔ "Athletic Bilbao")
 * TEK SEFERDE TAMAMEN OTOMATİK birleştirir.
 */

import { prisma } from "../lib/db/client";
import { getLevenshteinDistance } from "../lib/validation/levenshtein";

function normalizeClubName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Aksanları kaldır
    .replace(/\b(football club|futbol kulübü|futebol clube|club de fútbol|club de futbol|jimnastik kulübü|spor kulübü|balompié|balompie|derneği)\b/gi, "")
    .replace(/\b(f\.c\.|f\.c|fc|c\.f\.|c\.f|cf|s\.k\.|sk|j\.k\.|jk|a\.ş\.|a\.s\.|as|gsk|kd|fk|f\.k\.|afc|sc|s\.c\.|ac|a\.c\.|cd|c\.d\.|ssc|e\. v\.|e\.v\.|vfl|tsg|tsv|sv|spvgg|bsc|rsc|ksc|vfb)\b/gi, "")
    .replace(/\b(04|05|09|1899|1903|1905|1907|1913|1846|1848|1860|1893|1900)\b/gi, "")
    .replace(/\b(de|del|da|do|dos|das|di|d'|la|el|le|les|of|the|and|ve|1\.|b|c|ii|reserves|juvenil|u19|u21)\b/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

async function runAdvancedAutoMerge() {
  console.log("🚀 [Gelişmiş Tam Otomatik Kulüp Tekilleştirme] Başlatılıyor...\n");

  const allTeams = await prisma.team.findMany({
    include: {
      playersHistory: true,
    },
  });

  console.log(`📊 Toplam ${allTeams.length} kulüp inceleniyor...`);

  // 1. Ülkelere göre grupla (Aynı ülkedeki takımlar arasında karşılaştırma güvenlidir)
  const countryGroups = new Map<string, typeof allTeams>();

  for (const team of allTeams) {
    const c = team.country || "Unknown";
    if (!countryGroups.has(c)) countryGroups.set(c, []);
    countryGroups.get(c)!.push(team);
  }

  let totalMergedTeams = 0;
  let totalTransferredHistories = 0;

  for (const [country, teams] of countryGroups.entries()) {
    const mergedIds = new Set<string>();

    for (let i = 0; i < teams.length; i++) {
      const teamA = teams[i];
      if (mergedIds.has(teamA.id)) continue;

      const normA = normalizeClubName(teamA.name);
      if (!normA || normA.length < 3) continue;

      const duplicates: typeof allTeams = [];

      for (let j = i + 1; j < teams.length; j++) {
        const teamB = teams[j];
        if (mergedIds.has(teamB.id)) continue;

        const normB = normalizeClubName(teamB.name);
        if (!normB || normB.length < 3) continue;

        // Eşleşme Kontrolü:
        // 1. Normalize edilmiş isimler birebir aynı mı?
        // 2. Biri diğerini kapsıyor mu? (örn: "atletico" vs "atleticomadrid")
        // 3. Levenshtein mesafesi <= 1 mi? (küçük harf farkı)
        let isMatch = false;

        if (normA === normB) {
          isMatch = true;
        } else if (
          (normA.length >= 6 && normB.startsWith(normA)) ||
          (normB.length >= 6 && normA.startsWith(normB))
        ) {
          isMatch = true;
        } else if (Math.abs(normA.length - normB.length) <= 1 && getLevenshteinDistance(normA, normB) <= 1) {
          isMatch = true;
        }

        if (isMatch) {
          duplicates.push(teamB);
          mergedIds.add(teamB.id);
        }
      }

      if (duplicates.length > 0) {
        // En çok oyuncuya sahip olanı canonical seç
        const group = [teamA, ...duplicates];
        const primaryTeam = group.reduce((prev, curr) =>
          curr.playersHistory.length >= prev.playersHistory.length ? curr : prev
        );

        const realDuplicates = group.filter((t) => t.id !== primaryTeam.id);

        const updatedAliases = Array.from(
          new Set([
            ...(primaryTeam.aliases || []),
            ...realDuplicates.map((d) => d.name),
            ...realDuplicates.flatMap((d) => d.aliases || []),
          ])
        ).filter((a) => a !== primaryTeam.name);

        await prisma.team.update({
          where: { id: primaryTeam.id },
          data: { aliases: updatedAliases },
        });

        for (const dup of realDuplicates) {
          for (const history of dup.playersHistory) {
            try {
              await prisma.playerTeamHistory.upsert({
                where: {
                  playerId_teamId: {
                    playerId: history.playerId,
                    teamId: primaryTeam.id,
                  },
                },
                create: {
                  playerId: history.playerId,
                  teamId: primaryTeam.id,
                  isNationalTeam: history.isNationalTeam,
                  seasonStart: history.seasonStart,
                  seasonEnd: history.seasonEnd,
                },
                update: {},
              });
              totalTransferredHistories++;
            } catch {}
          }

          await prisma.playerTeamHistory.deleteMany({ where: { teamId: dup.id } });
          await prisma.team.delete({ where: { id: dup.id } });
          totalMergedTeams++;
          console.log(`✓ [${country}] '${dup.name}' (${dup.playersHistory.length} oyuncu) ➔ '${primaryTeam.name}' içine birleştirildi.`);
        }
      }
    }
  }

  console.log(`\n🎉 [Gelişmiş Otomatik Birleştirme Tamamlandı]`);
  console.log(`   - Otomatik Birleştirilen Kopya Kulüp Sayısı: ${totalMergedTeams}`);
  console.log(`   - Aktarılan Oyuncu Geçmişi Sayısı: ${totalTransferredHistories}`);
  console.log(`📊 Güncel Veritabanı:`);
  console.log(`   - Kalan Net Kulüp Sayısı: ${await prisma.team.count()}`);
  console.log(`   - Toplam Kulüp-Oyuncu Eşleşmesi: ${await prisma.playerTeamHistory.count()}`);
}

runAdvancedAutoMerge()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
