/**
 * Alex de Souza isim/kulüp düzeltmesi ve efsane Jairzinho'nun eklenmesi.
 */

import { prisma } from "../../lib/db/client";

async function main() {
  console.log("🛠️ [Alex de Souza ve Jairzinho Entegrasyonu Başlatılıyor]...\n");

  // 1. Alex de Souza Düzeltmesi
  const alex = await prisma.player.findFirst({
    where: {
      OR: [
        { fullName: "Alex", nationality: "Brazil" },
        { id: "cmtfrb52c01tdu6k47ur8v8qa" },
      ],
    },
  });

  if (alex) {
    await prisma.player.update({
      where: { id: alex.id },
      data: {
        fullName: "Alex de Souza",
        overallPrime: Math.max(alex.overallPrime || 85, 88),
        positions: ["CAM", "CF", "CM"],
      },
    });
    console.log(`✅ Alex -> "Alex de Souza" olarak güncellendi (OVR: 88, CAM, CF, CM).`);

    // Kulüpleri: Cruzeiro, Palmeiras, Coritiba
    const extraClubNames = ["Cruzeiro Esporte Clube", "Palmeiras", "Coritiba Foot Ball Club"];
    for (const clubName of extraClubNames) {
      const club = await prisma.team.findFirst({
        where: { name: { equals: clubName, mode: "insensitive" } },
      });
      if (club) {
        await prisma.playerTeamHistory.upsert({
          where: { playerId_teamId: { playerId: alex.id, teamId: club.id } },
          create: { playerId: alex.id, teamId: club.id },
          update: {},
        });
        console.log(`   ⚽ Alex de Souza -> ${club.name} bağlandı.`);
      }
    }
  }

  // 2. Jairzinho (Jair Ventura Filho) Ekle / Güncelle
  let jairzinho = await prisma.player.findFirst({
    where: {
      OR: [
        { fullName: { equals: "Jairzinho", mode: "insensitive" } },
        { externalRef: "wikidata:Q210102" },
      ],
    },
  });

  if (!jairzinho) {
    jairzinho = await prisma.player.create({
      data: {
        fullName: "Jairzinho",
        birthDate: new Date("1944-12-25"),
        nationality: "Brazil",
        position: "Forward",
        popularityScore: 94,
        overallPrime: 92,
        positions: ["RW", "RM", "ST", "CF", "CAM"],
        externalRef: "wikidata:Q210102",
        wikidataId: "Q210102",
      },
    });
    console.log(`\n✨ Jairzinho oluşturuldu (ID: ${jairzinho.id}, OVR: 92 Icon).`);
  } else {
    await prisma.player.update({
      where: { id: jairzinho.id },
      data: {
        fullName: "Jairzinho",
        overallPrime: 92,
        positions: ["RW", "RM", "ST", "CF", "CAM"],
        popularityScore: 94,
      },
    });
    console.log(`\n🔄 Jairzinho güncellendi (OVR: 92 Icon).`);
  }

  // Jairzinho Kulüpleri: Botafogo, Cruzeiro, Olympique Marseille, Brezilya
  const jairClubs = [
    "S. A. F. Botafogo",
    "Cruzeiro Esporte Clube",
    "Olympique Marseille",
    "Brazil men's national football team",
    "Brezilya millî futbol takımı",
  ];

  for (const cName of jairClubs) {
    const club = await prisma.team.findFirst({
      where: {
        OR: [
          { name: { equals: cName, mode: "insensitive" } },
          { name: { contains: cName, mode: "insensitive" } },
        ],
      },
      orderBy: { popularityScore: "desc" },
    });
    if (club) {
      await prisma.playerTeamHistory.upsert({
        where: { playerId_teamId: { playerId: jairzinho.id, teamId: club.id } },
        create: { playerId: jairzinho.id, teamId: club.id },
        update: {},
      });
      console.log(`   ⚽ Jairzinho -> ${club.name} bağlandı.`);
    }
  }

  console.log("\n🎉 İşlem tamamlandı!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
