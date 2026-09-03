import { prisma } from "../lib/db/client";
import { finalizeMatchAndPersistElo } from "../lib/db/matches";

async function testMatchPersistence() {
  console.log("🧪 [Test] ELO ve Maç Kalıcılaştırma servisi test ediliyor...");

  // 1. İki test kullanıcısı oluştur veya mevcut olanları al
  let user1 = await prisma.user.findFirst({ where: { username: "test_alpha" } });
  if (!user1) {
    user1 = await prisma.user.create({
      data: {
        username: "test_alpha",
        eloRating: 1000,
        rankTier: "bronze",
        matchesWon: 0,
        matchesLost: 0,
      },
    });
  }

  let user2 = await prisma.user.findFirst({ where: { username: "test_beta" } });
  if (!user2) {
    user2 = await prisma.user.create({
      data: {
        username: "test_beta",
        eloRating: 1000,
        rankTier: "bronze",
        matchesWon: 0,
        matchesLost: 0,
      },
    });
  }

  const initialP1Elo = user1.eloRating;
  const initialP2Elo = user2.eloRating;
  console.log(`📊 Başlangıç ELO Değerleri: ${user1.username}=${initialP1Elo}, ${user2.username}=${initialP2Elo}`);

  const testMatchId = `test_match_${Date.now()}`;

  // 2. finalizeMatchAndPersistElo servisini çağır (User 1 kazandı: 3 - 2)
  const result = await finalizeMatchAndPersistElo({
    matchId: testMatchId,
    player1Id: user1.id,
    player2Id: user2.id,
    player1Score: 3,
    player2Score: 2,
    mode: "team_vs_team",
    ranked: true,
    rounds: [
      { roundNumber: 1, entity1Id: "team1", entity2Id: "team2", winnerUserId: user1.id, answerGiven: "Ronaldo", timeTakenMs: 4200 },
      { roundNumber: 2, entity1Id: "team1", entity2Id: "team3", winnerUserId: user2.id, answerGiven: "Messi", timeTakenMs: 3500 },
      { roundNumber: 3, entity1Id: "team2", entity2Id: "team3", winnerUserId: user1.id, answerGiven: "Figo", timeTakenMs: 5100 },
      { roundNumber: 4, entity1Id: "team1", entity2Id: "team4", winnerUserId: user2.id, answerGiven: "Zidane", timeTakenMs: 4800 },
      { roundNumber: 5, entity1Id: "team3", entity2Id: "team4", winnerUserId: user1.id, answerGiven: "Benzema", timeTakenMs: 2900 },
    ],
  });

  console.log("✅ [Test] Servis sonucu:", result);

  // 3. Veritabanından doğrula
  const updatedUser1 = await prisma.user.findUnique({ where: { id: user1.id } });
  const updatedUser2 = await prisma.user.findUnique({ where: { id: user2.id } });
  const savedMatch = await prisma.match.findUnique({
    where: { id: testMatchId },
    include: { rounds: true },
  });

  console.log(`🏆 Güncel ELO Değerleri: ${updatedUser1?.username}=${updatedUser1?.eloRating} (Kazanılan: ${updatedUser1?.matchesWon}), ${updatedUser2?.username}=${updatedUser2?.eloRating} (Kaybedilen: ${updatedUser2?.matchesLost})`);
  console.log(`📁 Kaydedilen Maç ve Turlar: Maç ID=${savedMatch?.id}, Toplam Tur=${savedMatch?.rounds.length}`);

  if (
    updatedUser1 &&
    updatedUser1.eloRating > initialP1Elo &&
    updatedUser2 &&
    updatedUser2.eloRating < initialP2Elo &&
    savedMatch &&
    savedMatch.rounds.length === 5
  ) {
    console.log("🎉 [Test] ELO ve Maç Kalıcılaştırma servisi KUSURSUZ ÇALIŞTI!");
  } else {
    throw new Error("Veritabanı güncellemeleri beklenen değerlerle uyuşmuyor!");
  }

  // 4. Idempotency (çift kayıt) testi
  console.log("🔄 [Test] Idempotency (çift kayıt koruması) testi yapılıyor...");
  const duplicateResult = await finalizeMatchAndPersistElo({
    matchId: testMatchId,
    player1Id: user1.id,
    player2Id: user2.id,
    player1Score: 3,
    player2Score: 2,
    ranked: true,
    rounds: [],
  });

  if (duplicateResult.p1EloChange === 0 && duplicateResult.p2EloChange === 0) {
    console.log("🛡️ [Test] Idempotency koruması BAŞARILI! Tekrar eden istek yok sayıldı.");
  } else {
    throw new Error("Idempotency koruması çalışmadı!");
  }

  await prisma.$disconnect();
}

testMatchPersistence()
  .then(() => {
    console.log("✨ TÜM TESTLER BAŞARIYLA GEÇTİ!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Test Hatası:", err);
    process.exit(1);
  });
