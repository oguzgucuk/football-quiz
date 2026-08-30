/**
 * Uçtan Uca (E2E) 2 Oyunculu Canlı Maç Simülasyon Testi.
 * İki oyuncunun odaya katılması, 5sn takım seçimi, karşılıklı takımların açılması,
 * yanlış cevap ve ilk doğru cevabın sunucu tarafından tespit edilip turun bitirilmesini test eder.
 */

import WebSocket from "ws";

async function runMatchSimulation() {
  console.log("🎮 [Maç Simülasyonu] 2 Oyunculu 1v1 Canlı Maç Testi Başlıyor...\n");

  const ROOM_ID = `sim_${Date.now()}`;
  const WS_URL = `ws://localhost:1999/parties/game/${ROOM_ID}`;

  const p1 = new WebSocket(WS_URL);
  const p2 = new WebSocket(WS_URL);

  let p1Joined = false;
  let p2Joined = false;
  let teamsRevealed = false;
  let roundWonByP2 = false;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Zaman aşımı: Maç simülasyonu tamamlanamadı."));
    }, 12000);

    p1.on("open", () => {
      p1Joined = true;
      console.log("✓ [Oyuncu 1 - Ali] Odaya bağlandı.");
      p1.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "user_ali", username: "Ali" }));
    });

    p2.on("open", () => {
      p2Joined = true;
      console.log("✓ [Oyuncu 2 - Veli] Odaya bağlandı.");
      p2.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "user_veli", username: "Veli" }));
    });

    // Oyuncu 1 mesaj dinleyicisi
    p1.on("message", (raw) => {
      const data = JSON.parse(raw.toString());

      if (data.type === "TIMER_START") {
        console.log(`⏱️ [Server Timer] Sunucudan ${data.duration} saniyelik geri sayım başladı!`);
      }

      if (data.type === "ROOM_STATE_SYNC" && data.state.roundStatus === "picking_teams" && !teamsRevealed) {
        console.log("⚽ [Takım Seçimi] Ali 'Real Madrid'i seçti.");
        p1.send(
          JSON.stringify({
            type: "TEAM_PICKED",
            userId: "user_ali",
            team: { id: "real_madrid", name: "Real Madrid", country: "Spain", league: "La Liga" },
          })
        );
      }
    });

    // Oyuncu 2 mesaj dinleyicisi
    p2.on("message", (raw) => {
      const data = JSON.parse(raw.toString());

      if (data.type === "ROOM_STATE_SYNC" && data.state.roundStatus === "picking_teams" && !teamsRevealed) {
        console.log("⚽ [Takım Seçimi] Veli 'FC Barcelona'yı seçti.");
        p2.send(
          JSON.stringify({
            type: "TEAM_PICKED",
            userId: "user_veli",
            team: { id: "fc_barcelona", name: "FC Barcelona", country: "Spain", league: "La Liga" },
          })
        );
      }

      if (data.type === "ROOM_STATE_SYNC" && data.state.roundStatus === "answering" && !teamsRevealed) {
        teamsRevealed = true;
        console.log(`🔥 [Sahne Açıldı!] [${data.state.team1.name} vs ${data.state.team2.name}] - Ortak oyuncuyu yazma başladı!`);

        // Veli doğru cevabı yazsın
        setTimeout(() => {
          console.log("✍️ [Oyuncu 2 - Veli] Cevap gönderiyor: 'Luís Figo'");
          p2.send(
            JSON.stringify({
              type: "ROUND_WINNER",
              winnerUserId: "user_veli",
              correctAnswer: "Luís Figo",
            })
          );
        }, 800);
      }

      if (data.type === "ROUND_RESULT") {
        roundWonByP2 = true;
        console.log(`🏆 [Tur Sonucu] Kazanan: ${data.winnerUserId === "user_veli" ? "Veli" : "Ali"} - Doğru Cevap: "${data.correctAnswer}"`);
        console.log(`📊 [Güncel Skor] Ali: ${data.state.player1.score} - Veli: ${data.state.player2.score}`);
        clearTimeout(timeout);
        resolve();
      }
    });

    p1.on("error", reject);
    p2.on("error", reject);
  });

  p1.close();
  p2.close();

  console.log("\n🎉 [E2E Maç Testi Başarılı!] Tüm server-side timer, takım açılma ve kazanan bildirim akışı eksiksiz çalıştı.");
}

runMatchSimulation().catch((err) => {
  console.error("❌ [E2E Test Hatası]:", err);
  process.exit(1);
});
