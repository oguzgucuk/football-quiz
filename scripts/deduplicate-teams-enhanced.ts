/**
 * GELİŞMİŞ KULÜP TEKİLLEŞTİRME MOTORU (ŞEHİR & KULÜP EKİ TEMİZLEME)
 * 
 * "Fenerbahçe Istanbul", "Beşiktaş JK", "Real Madrid CF", "FC Bayern München" gibi
 * mükerrer kulüpleri tek bir ana kulüpte birleştirir ve transfer kayıtlarını taşır.
 */

import { prisma } from "../lib/db/client";

// Temizlenecek yaygın şehir ve kulüp ekleri
const CITY_SUFFIXES = [
  "istanbul", "ankara", "izmir", "bursa", "trabzon", "adana", "konya", "antalya",
  "madrid", "munich", "munchen", "münchen", "milan", "milano", "rome", "roma",
  "london", "paris", "lisbon", "lisboa", "porto", "sevilla", "manchester", "liverpool",
  "barcelona", "valencia", "turin", "torino", "berlin", "amsterdam", "rotterdam"
];

const CLUB_AFFIXES = [
  "fc", "cf", "fk", "sk", "as", "ac", "sc", "ssc", "bk", "jk", "cd", "ud", "rcd",
  "sv", "vfb", "vfl", "bvb", "tsv", "de", "del", "la", "el", "the", "club", "calcio",
  "futbol", "football", "spor", "kulubu", "kulübü", "team", "sad"
];

function advancedNormalizeTeamName(name: string): string {
  let clean = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();

  // Kelimeleri böl ve ekleri temizle
  let words = clean.split(/\s+/).filter(Boolean);

  // Kulüp eklerini temizle (en az 2 harfli ana kelime kalacaksa)
  words = words.filter((w) => !CLUB_AFFIXES.includes(w) || words.length <= 1);

  // Şehir eklerini temizle (en az 1 ana isim kalacaksa, örn: "fenerbahce istanbul" -> "fenerbahce")
  if (words.length > 1) {
    words = words.filter((w) => !CITY_SUFFIXES.includes(w));
  }

  return words.join(" ").trim();
}

async function runAdvancedTeamDeduplication() {
  console.log("🛠️ [Gelişmiş Kulüp Tekilleştirme] Başlatılıyor...\n");

  const allTeams = await prisma.team.findMany({
    include: {
      _count: {
        select: {
          playersHistory: true,
        },
      },
    },
  });

  console.log(`📊 Toplam ${allTeams.length} kulüp inceleniyor...`);

  // Normalleştirilmiş isme göre grupla
  const grouped = new Map<string, typeof allTeams>();

  for (const team of allTeams) {
    const normalized = advancedNormalizeTeamName(team.name);
    if (!normalized || normalized.length < 3) continue;

    const existing = grouped.get(normalized) || [];
    existing.push(team);
    grouped.set(normalized, existing);
  }

  let mergedCount = 0;
  let deletedCount = 0;

  for (const [key, teams] of grouped.entries()) {
    if (teams.length <= 1) continue;

    // Aynı ülke veya genel çakışma kontrolü
    // En çok transfer kaydı veya popülerlik puanı olanı ANA kulüp seç
    const sorted = [...teams].sort((a, b) => {
      // 1. Popülerlik puanı
      if (b.popularityScore !== a.popularityScore) {
        return b.popularityScore - a.popularityScore;
      }
      // 2. Transfer geçmişi sayısı
      return b._count.playersHistory - a._count.playersHistory;
    });

    const primaryTeam = sorted[0];
    const duplicates = sorted.slice(1);

    console.log(`\n🔗 Çakışma Grubu: "${key}"`);
    console.log(`   🏆 Ana Kulüp: ${primaryTeam.name} (ID: ${primaryTeam.id}, Transfer: ${primaryTeam._count.playersHistory}, Pop: ${primaryTeam.popularityScore})`);

    for (const dup of duplicates) {
      console.log(`   ↳ Birleştirilecek: ${dup.name} (ID: ${dup.id}, Transfer: ${dup._count.playersHistory})`);

      // 1. Mükerrer kulübün transferlerini ana kulübe taşı
      const dupHistories = await prisma.playerTeamHistory.findMany({
        where: { teamId: dup.id },
      });

      for (const h of dupHistories) {
        const exists = await prisma.playerTeamHistory.findFirst({
          where: { playerId: h.playerId, teamId: primaryTeam.id },
        });

        if (!exists) {
          await prisma.playerTeamHistory.create({
            data: { playerId: h.playerId, teamId: primaryTeam.id },
          });
        }
        await prisma.playerTeamHistory.delete({ where: { id: h.id } });
      }

      // 2. Ana kulübün aliases listesine mükerrer kulübün adını ekle
      const newAliases = Array.from(new Set([...primaryTeam.aliases, dup.name, ...dup.aliases]));
      await prisma.team.update({
        where: { id: primaryTeam.id },
        data: { aliases: newAliases },
      });

      // 3. Mükerrer kulübü güvenle sil
      await prisma.team.delete({ where: { id: dup.id } });
      deletedCount++;
    }

    mergedCount++;
  }

  console.log(`\n🎉 [TAMAMLANDI] ${mergedCount} Kulüp Grubu Başarıyla Tekilleştirildi! ${deletedCount} Mükerrer Kulüp Silindi.`);
}

runAdvancedTeamDeduplication()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
