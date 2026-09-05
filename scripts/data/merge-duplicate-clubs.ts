/**
 * Kulüp tekilleştirme motoru:
 * Benzer isimli ve aynı ülkedeki kulüp kopyalarını (örn: "A.C. Milan" -> "AC Milan",
 * "FC Internazionale Milano" -> "Inter Milan") tek bir ana kulüpte birleştirir.
 * Tüm oyuncu geçmişlerini aktarır ve alternatif isimleri 'aliases' alanına ekler.
 */

import { prisma } from "../../lib/db/client";

function cleanClubName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(football club|futbol kulübü|futebol clube|club de fútbol|jimnastik kulübü|spor kulübü|derneği)\b/gi, "")
    .replace(/\b(f\.c\.|f\.c|fc|c\.f\.|c\.f|cf|s\.k\.|sk|j\.k\.|jk|a\.ş\.|a\.s\.|as|gsk|kd|fk|e\. v\.|e\.v\.|a\.c\.|a\.c|ac)\b/gi, "")
    .replace(/[^a-z0-9\sğüşıöçáéíóúâêîôûãõñ]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Özel bilinen eşleşmeler (Örn: Inter Milan <-> Internazionale)
const SPECIAL_MERGE_PAIRS: [string, string][] = [
  ["FC Internazionale Milano", "Inter Milan"],
  ["A.C. Milan", "AC Milan"],
];

export async function mergeDuplicateClubs(): Promise<{ mergedCount: number; historiesTransferred: number }> {
  console.log("🔄 Kulüp tekilleştirme işlemi başlatılıyor...");

  let mergedCount = 0;
  let historiesTransferred = 0;

  // 1. Özel eşleşmeler
  for (const [dupName, primaryName] of SPECIAL_MERGE_PAIRS) {
    const dup = await prisma.team.findFirst({
      where: { name: dupName },
      include: { playersHistory: true },
    });
    const primary = await prisma.team.findFirst({
      where: { name: primaryName },
      include: { playersHistory: true },
    });

    if (dup && primary && dup.id !== primary.id) {
      for (const h of dup.playersHistory) {
        await prisma.playerTeamHistory.upsert({
          where: {
            playerId_teamId: {
              playerId: h.playerId,
              teamId: primary.id,
            },
          },
          create: {
            playerId: h.playerId,
            teamId: primary.id,
            seasonStart: h.seasonStart,
            seasonEnd: h.seasonEnd,
            isNationalTeam: h.isNationalTeam,
          },
          update: {},
        });
        historiesTransferred++;
      }

      // Aliases güncelle
      const currentAliases = primary.aliases || [];
      const newAliases = Array.from(new Set([...currentAliases, dup.name, ...(dup.aliases || [])]));
      await prisma.team.update({
        where: { id: primary.id },
        data: { aliases: newAliases },
      });

      await prisma.playerTeamHistory.deleteMany({ where: { teamId: dup.id } });
      await prisma.team.delete({ where: { id: dup.id } });
      mergedCount++;
      console.log(`  ✓ Özel eşleşme: '${dup.name}' -> '${primary.name}' (${dup.playersHistory.length} oyuncu aktarıldı)`);
    }
  }

  // 2. İsim benzerliği eşleşmeleri
  const allTeams = await prisma.team.findMany({
    include: {
      playersHistory: true,
    },
  });

  const groupMap = new Map<string, typeof allTeams>();
  for (const team of allTeams) {
    const cleaned = cleanClubName(team.name);
    if (!cleaned || cleaned.length < 3) continue;

    const groupKey = `${team.country?.toLowerCase() || "unknown"}:${cleaned}`;
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, []);
    }
    groupMap.get(groupKey)!.push(team);
  }

  for (const [key, teamsInGroup] of groupMap.entries()) {
    if (teamsInGroup.length <= 1) continue;

    // En çok oyuncu geçmişine veya en yüksek popülerliğe sahip olanı ana kulüp yap
    const primaryTeam = teamsInGroup.reduce((prev, curr) => {
      if (curr.playersHistory.length !== prev.playersHistory.length) {
        return curr.playersHistory.length > prev.playersHistory.length ? curr : prev;
      }
      return (curr.popularityScore || 0) >= (prev.popularityScore || 0) ? curr : prev;
    });

    const duplicateTeams = teamsInGroup.filter((t) => t.id !== primaryTeam.id);

    for (const dup of duplicateTeams) {
      for (const h of dup.playersHistory) {
        try {
          await prisma.playerTeamHistory.upsert({
            where: {
              playerId_teamId: {
                playerId: h.playerId,
                teamId: primaryTeam.id,
              },
            },
            create: {
              playerId: h.playerId,
              teamId: primaryTeam.id,
              seasonStart: h.seasonStart,
              seasonEnd: h.seasonEnd,
              isNationalTeam: h.isNationalTeam,
            },
            update: {},
          });
          historiesTransferred++;
        } catch {
          // Zaten mevcutsa atla
        }
      }

      // Aliases birleştir
      const currentAliases = primaryTeam.aliases || [];
      const newAliases = Array.from(new Set([...currentAliases, dup.name, ...(dup.aliases || [])]));
      await prisma.team.update({
        where: { id: primaryTeam.id },
        data: { aliases: newAliases },
      });

      await prisma.playerTeamHistory.deleteMany({ where: { teamId: dup.id } });
      await prisma.team.delete({ where: { id: dup.id } });
      mergedCount++;
      console.log(`  ✓ Otomatik eşleşme: '${dup.name}' -> '${primaryTeam.name}' (${dup.playersHistory.length} oyuncu aktarıldı)`);
    }
  }

  console.log(`✅ Tekilleştirme tamamlandı: ${mergedCount} kopya kulüp birleştirildi, ${historiesTransferred} geçmiş aktarıldı.`);
  return { mergedCount, historiesTransferred };
}

if (require.main === module) {
  mergeDuplicateClubs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
