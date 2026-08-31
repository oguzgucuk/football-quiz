import { prisma } from "../lib/db/client";
import { matchPlayerAnswer } from "../lib/validation/matchPlayerAnswer";

async function testCurrentVerificationEngine() {
  console.log("🧪 Güncel Cevap Doğrulama Motoru Testi (Aksan, Typo, Büyük/Küçük Harf)\n");

  const testCases = [
    {
      t1Name: "Real Madrid",
      t2Name: "Tottenham Hotspur",
      input: "gareth bale",
      expectedPlayer: "Gareth Bale",
    },
    {
      t1Name: "Real Madrid",
      t2Name: "Tottenham Hotspur",
      input: "Bale",
      expectedPlayer: "Gareth Bale",
    },
    {
      t1Name: "Real Madrid",
      t2Name: "Tottenham Hotspur",
      input: "modric",
      expectedPlayer: "Luka Modrić",
    },
    {
      t1Name: "Fenerbahçe",
      t2Name: "FC Barcelona",
      input: "rustu recber",
      expectedPlayer: "Rüştü Reçber",
    },
    {
      t1Name: "Fenerbahçe",
      t2Name: "FC Barcelona",
      input: "recber",
      expectedPlayer: "Rüştü Reçber",
    },
    {
      t1Name: "Real Madrid",
      t2Name: "FC Barcelona",
      input: "figo",
      expectedPlayer: "Luís Figo",
    },
    {
      t1Name: "Real Madrid",
      t2Name: "FC Barcelona",
      input: "luis figo",
      expectedPlayer: "Luís Figo",
    },
    {
      t1Name: "Real Madrid",
      t2Name: "FC Barcelona",
      input: "ronaldo",
      expectedPlayer: "Ronaldo Nazário",
    },
    {
      t1Name: "Fenerbahçe",
      t2Name: "Real Madrid",
      input: "arda guler",
      expectedPlayer: "Arda Güler",
    },
    {
      t1Name: "Borussia Dortmund",
      t2Name: "Real Madrid",
      input: "bellingham",
      expectedPlayer: "Jude Bellingham",
    },
  ];

  let passed = 0;

  for (const tc of testCases) {
    const t1 = await prisma.team.findFirst({ where: { name: tc.t1Name } });
    const t2 = await prisma.team.findFirst({ where: { name: tc.t2Name } });

    if (!t1 || !t2) {
      console.log(`❌ Takım bulunamadı: ${tc.t1Name} veya ${tc.t2Name}`);
      continue;
    }

    const commonPlayers = await prisma.player.findMany({
      where: {
        teamsHistory: { some: { teamId: t1.id } },
        AND: [{ teamsHistory: { some: { teamId: t2.id } } }],
      },
      select: { id: true, fullName: true, nationality: true },
    });

    const match = matchPlayerAnswer(tc.input, commonPlayers);

    if (match && match.fullName.toLowerCase().includes(tc.expectedPlayer.toLowerCase())) {
      console.log(`✅ [BAŞARILI] "${tc.input}" -> ${match.fullName} (${tc.t1Name} & ${tc.t2Name})`);
      passed++;
    } else {
      console.log(`❌ [BAŞARISIZ] "${tc.input}" -> Eşleşmedi! (Beklenen: ${tc.expectedPlayer}, Ortak Oyuncular: [${commonPlayers.map(p => p.fullName).join(", ")}])`);
    }
  }

  console.log(`\nSonuç: ${passed}/${testCases.length} test başarılı.`);
}

testCurrentVerificationEngine().finally(() => prisma.$disconnect());
