/**
 * Kulüp isimlerini ülke farkı gözetmeksizin (England / United Kingdom / Birleşik Krallık)
 * tamamen tekilleştiren evrensel temizleyici.
 */

import { prisma } from "../lib/db/client";

function cleanClubName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(football club|futbol kulübü|futebol clube|club de fútbol|jimnastik kulübü|spor kulübü|derneği)\b/gi, "")
    .replace(/\b(f\.c\.|f\.c|fc|c\.f\.|c\.f|cf|s\.k\.|sk|j\.k\.|jk|a\.ş\.|a\.s\.|as|gsk|kd|fk|e\. v\.|e\.v\.)\b/gi, "")
    .replace(/[^a-z0-9\sğüşıöçáéíóúâêîôûãõñ]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function runUniversalDedupe() {
  console.log("🔄 [Evrensel Kulüp Tekilleştirme - Global] Başlatılıyor...");

  const allTeams = await prisma.team.findMany({
    include: {
      playersHistory: true,
    },
  });

  console.log(`📊 Toplam ${allTeams.length} kulüp inceleniyor...`);

  // İsimleri doğrudan temizlenmiş ada göre grupla
  const groups = new Map<string, typeof allTeams>();

  for (const team of allTeams) {
    const cleaned = cleanClubName(team.name);
    if (!cleaned || cleaned.length < 3) continue;

    if (!groups.has(cleaned)) {
      groups.set(cleaned, []);
    }
    groups.get(cleaned)!.push(team);
  }

  let totalMergedTeams = 0;
  let totalTransferredHistories = 0;

  for (const [key, teamsInGroup] of groups.entries()) {
    if (teamsInGroup.length <= 1) continue;

    // En çok oyuncu geçmişine sahip olanı ana kulüp yap
    const primaryTeam = teamsInGroup.reduce((prev, curr) => {
      if (curr.playersHistory.length !== prev.playersHistory.length) {
        return curr.playersHistory.length > prev.playersHistory.length ? curr : prev;
      }
      return curr.name.length < prev.name.length ? curr : prev;
    });

    const duplicateTeams = teamsInGroup.filter((t) => t.id !== primaryTeam.id);

    for (const dup of duplicateTeams) {
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
    }

    console.log(`✓ '${primaryTeam.name}' (${primaryTeam.playersHistory.length} oyuncu) için ${duplicateTeams.length} kopya (${duplicateTeams.map((d) => d.name).join(", ")}) birleştirildi.`);
  }

  console.log(`\n🎉 [Global Birleştirme Tamamlandı]`);
  console.log(`   - Birleştirilen Kopya Kulüpler: ${totalMergedTeams}`);
  console.log(`   - Aktarılan Oyuncu Geçmişleri: ${totalTransferredHistories}`);
  console.log(`📊 Güncel Veritabanı:`);
  console.log(`   - Kalan Kulüpler: ${await prisma.team.count()}`);
  console.log(`   - Kulüp-Oyuncu Eşleşmesi: ${await prisma.playerTeamHistory.count()}`);
}

runUniversalDedupe()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
