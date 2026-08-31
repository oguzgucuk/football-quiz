import { prisma } from "../lib/db/client";

async function addNihatDirectly() {
  console.log("🔍 Nihat Kahveci Wikidata Doğrudan Çekiliyor...");

  const url = "https://www.wikidata.org/wiki/Special:EntityData/Q297500.json";
  const res = await fetch(url);
  const data = await res.json();
  const entity = data.entities["Q297500"];

  const name = entity.labels.tr?.value || entity.labels.en?.value || "Nihat Kahveci";
  console.log("İsim:", name);

  // Doğum tarihi (P569)
  const birthClaim = entity.claims.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  const birthDate = birthClaim ? new Date(birthClaim.replace("+", "")) : new Date("1979-11-23");
  console.log("Doğum Tarihi:", birthDate);

  // Kulüpler (P54)
  const clubClaims = entity.claims.P54 || [];
  const clubQids = clubClaims.map((c: any) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
  console.log("Kulüp QID'leri:", clubQids);

  // Kulüp isimlerini çöz
  const clubNames: Record<string, string> = {
    "Q41470": "Beşiktaş",
    "Q10315": "Real Sociedad",
    "Q12294": "Villarreal CF",
  };

  // Oyuncuyu oluştur / bul
  let player = await prisma.player.findFirst({
    where: {
      OR: [
        { fullName: { contains: "Nihat Kahveci", mode: "insensitive" } },
        { wikidataId: "Q297500" },
      ],
    },
  });

  if (!player) {
    player = await prisma.player.create({
      data: {
        fullName: "Nihat Kahveci",
        wikidataId: "Q297500",
        birthDate,
        nationality: "Türkiye",
        position: "Forward",
      },
    });
    console.log("✅ Nihat Kahveci Oyuncusu Oluşturuldu:", player.id);
  }

  // Kulüpleri bağla
  for (const qid of ["Q41470", "Q10315", "Q12294"]) {
    const clubName = clubNames[qid];
    
    // DB'deki mevcut takımı bul
    let team = await prisma.team.findFirst({
      where: {
        OR: [
          { externalRef: qid },
          { name: { contains: clubName, mode: "insensitive" } },
          { aliases: { has: clubName } },
        ],
      },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: clubName,
          externalRef: qid,
          country: qid === "Q41470" ? "Türkiye" : "Spain",
          league: qid === "Q41470" ? "Süper Lig" : "La Liga",
        },
      });
      console.log(`🏟️ Takım Oluşturuldu: ${team.name}`);
    }

    const existingHistory = await prisma.playerTeamHistory.findFirst({
      where: {
        playerId: player.id,
        teamId: team.id,
      },
    });

    if (!existingHistory) {
      await prisma.playerTeamHistory.create({
        data: {
          playerId: player.id,
          teamId: team.id,
        },
      });
      console.log(`🔗 Bağlandı: Nihat Kahveci -> ${team.name} (${team.id})`);
    } else {
      console.log(`✓ Zaten Bağlı: Nihat Kahveci -> ${team.name}`);
    }
  }

  console.log("🎉 NİHAT KAHVECİ BAŞARIYLA EKLENDİ VE BAĞLANDI!");
}

addNihatDirectly()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
