import WebSocket from "ws";

async function testSubmitAnswer() {
  console.log("🧪 [Test] WebSocket SUBMIT_ANSWER testi başlatılıyor...");

  const roomId = `test_answer_${Date.now()}`;
  const wsUrl = `ws://localhost:1999/parties/game/${roomId}`;

  const ws = new WebSocket(wsUrl);

  await new Promise<void>((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });

  console.log("🔌 [Test] WebSocket bağlantısı açıldı.");

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Test zaman aşımına uğradı (10s)"));
    }, 10000);

    ws.on("message", (msg) => {
      const data = JSON.parse(msg.toString());

      if (data.type === "ROOM_STATE_SYNC") {
        const state = data.state;
        // Oyuncu 1 katıldıktan sonra bot ekle
        if (!state.player2 && state.player1?.userId === "test_user_1") {
          console.log("🤖 [Test] Bot ekleniyor...");
          ws.send(JSON.stringify({ type: "ADD_BOT" }));
        }

        // Takım seçimi fazı
        if (state.roundStatus === "picking_teams" && !state.player1?.selectedTeamId) {
          console.log("⚽ [Test] Real Madrid seçiliyor...");
          ws.send(
            JSON.stringify({
              type: "TEAM_PICKED",
              userId: "test_user_1",
              team: { id: "cmtfrb40e00dtu6k4wklez572", name: "Real Madrid" },
            })
          );
        }

        // Cevaplama fazına geçildiğinde sunucuya SUBMIT_ANSWER gönder
        if (state.roundStatus === "answering" && state.team1 && state.team2) {
          console.log(`🎯 [Test] Cevaplama fazı aktif: ${state.team1.name} vs ${state.team2.name}`);
          
          import("../lib/realtime/verifyPlayerAnswerInServer").then(({ getCommonPlayersForRound }) => {
            getCommonPlayersForRound(state.team1.id, state.team2.id).then((common) => {
              const targetPlayer = common[0]?.fullName || "Ronaldo";
              console.log(`📨 [Test] SUBMIT_ANSWER gönderiliyor: '${targetPlayer}'...`);

              ws.send(
                JSON.stringify({
                  type: "SUBMIT_ANSWER",
                  userId: "test_user_1",
                  name: targetPlayer,
                })
              );
            });
          });
        }
      }

      if (data.type === "ANSWER_FEEDBACK") {
        console.log("ℹ️ [Test] ANSWER_FEEDBACK alındı:", data);
      }

      if (data.type === "ROUND_RESULT") {
        console.log("🏆 [Test] BAŞARILI! ROUND_RESULT sunucu tarafından üretildi:", {
          winnerUserId: data.winnerUserId,
          correctAnswer: data.correctAnswer,
          scoreP1: data.state?.player1?.score,
        });
        clearTimeout(timeout);
        ws.close();
        resolve();
      }
    });

    // Oyuncu 1 olarak katıl
    ws.send(
      JSON.stringify({
        type: "PLAYER_JOIN",
        userId: "test_user_1",
        username: "Test Oyuncu 1",
        roundDuration: 15,
      })
    );
  });
}

testSubmitAnswer()
  .then(() => {
    console.log("🎉 [Test] Tüm doğrulamalar BAŞARIYLA tamamlandı!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ [Test] Hata:", err);
    process.exit(1);
  });
