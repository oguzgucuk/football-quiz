import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runE2ETest() {
  console.log("\n=================================================");
  console.log("🧪 P0-2 REALTIME WEBSOCKET & SUBMIT_ANSWER E2E TESTİ");
  console.log("=================================================\n");

  const wsUrl = "ws://127.0.0.1:1999/parties/game/test_room_" + Date.now();
  const ws = new WebSocket(wsUrl);

  const userId = "test_player_alpha";
  const username = "Alpha Tester ⚡";

  let roundStatus = "unknown";
  let team1: any = null;
  let team2: any = null;
  let wrongAnswerFeedbackReceived = false;
  let correctAnswerResultReceived = false;
  let scoreIncremented = false;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("E2E Test zaman aşımına uğradı (15 saniye)"));
    }, 15000);

    ws.on("open", () => {
      console.log("1. ✅ WebSocket bağlantısı başarıyla kuruldu:", wsUrl);

      // 1. Oyuncu lobiye katılır
      ws.send(
        JSON.stringify({
          type: "PLAYER_JOIN",
          userId,
          username,
          roundDuration: 15,
        })
      );
    });

    ws.on("message", async (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.type === "ROOM_STATE_SYNC") {
          roundStatus = data.state.roundStatus;
          team1 = data.state.team1;
          team2 = data.state.team2;

          // Eğer henüz bot eklenmediyse bot ekle
          if (!data.state.player2 && data.state.status === "waiting_for_players") {
            console.log("2. 🤖 Rakip olarak Bot oyuncu ekleniyor...");
            ws.send(JSON.stringify({ type: "ADD_BOT" }));
          }

          // Takım seçme aşamasındaysa ve takımımız yoksa Real Madrid seç
          if (data.state.roundStatus === "picking_teams" && !team1) {
            console.log("3. ⚽ Takım 1 (Real Madrid) seçiliyor...");
            ws.send(
              JSON.stringify({
                type: "TEAM_PICKED",
                userId,
                team: {
                  id: "cmtfrb40e00dtu6k4wklez572",
                  name: "Real Madrid",
                  country: "Spain",
                  league: "La Liga",
                },
              })
            );
          }

          // Cevaplama aşamasına geçildiyse test senaryolarını çalıştır
          if (data.state.roundStatus === "answering" && !wrongAnswerFeedbackReceived) {
            console.log(`4. 🎯 Cevaplama Aşaması Başladı! (${data.state.team1?.name} vs ${data.state.team2?.name})`);

            // A) Yanlış Cevap Gönder
            console.log("   👉 Yanlış cevap gönderiliyor: 'Alakasiz Oyuncu 999'...");
            ws.send(
              JSON.stringify({
                type: "SUBMIT_ANSWER",
                userId,
                name: "Alakasiz Oyuncu 999",
              })
            );
          }
        }

        if (data.type === "ANSWER_FEEDBACK") {
          if (!data.isCorrect) {
            console.log("5. ✅ Yanlış cevap için ANSWER_FEEDBACK (isCorrect: false) başarıyla alındı!");
            wrongAnswerFeedbackReceived = true;

            // B) Doğru Cevap Bul ve Gönder
            if (team1 && team2) {
              const commonPlayer = await prisma.player.findFirst({
                where: {
                  teamsHistory: { some: { teamId: team1.id } },
                  AND: [{ teamsHistory: { some: { teamId: team2.id } } }],
                },
                select: { fullName: true },
              });

              if (commonPlayer) {
                console.log(`6. 🎯 Doğru ortak oyuncu bulundu: "${commonPlayer.fullName}". Sunucuya gönderiliyor...`);
                ws.send(
                  JSON.stringify({
                    type: "SUBMIT_ANSWER",
                    userId,
                    name: commonPlayer.fullName,
                  })
                );
              } else {
                console.log("⚠️ Ortak oyuncu bulunamadı, Cristiano Ronaldo deneniyor...");
                ws.send(
                  JSON.stringify({
                    type: "SUBMIT_ANSWER",
                    userId,
                    name: "Cristiano Ronaldo",
                  })
                );
              }
            }
          }
        }

        if (data.type === "ROUND_RESULT") {
          console.log(`7. 🏆 ROUND_RESULT alındı! Kazanan: ${data.winnerUserId}, Doğru Cevap: "${data.correctAnswer}"`);
          if (data.winnerUserId === userId) {
            correctAnswerResultReceived = true;
          }
          if (data.state?.player1?.score > 0 || data.state?.player2?.score > 0) {
            scoreIncremented = true;
          }

          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      } catch (err) {
        console.error("Mesaj işleme hatası:", err);
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  console.log("\n=================================================");
  console.log("📋 P0-2 E2E TEST SONUÇLARI");
  console.log("=================================================");
  console.log(`   • Yanlış Cevap Feedback Testi: ${wrongAnswerFeedbackReceived ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   • Doğru Cevap Kazanan Doğrulaması: ${correctAnswerResultReceived ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   • Sunucu Taraflı Skor Artışı: ${scoreIncremented ? "✅ PASS" : "❌ FAIL"}`);
  console.log("=================================================\n");

  await prisma.$disconnect();

  if (wrongAnswerFeedbackReceived && correctAnswerResultReceived && scoreIncremented) {
    console.log("🎉 TÜM P0-2 E2E TESTLERİ BAŞARIYLA GEÇTİ!\n");
  } else {
    throw new Error("Bazı E2E kontrolleri başarısız oldu!");
  }
}

runE2ETest().catch((err) => {
  console.error("❌ Test Hatası:", err);
  process.exit(1);
});
