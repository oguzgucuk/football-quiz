/**
 * Canlı WebSocket Üzerinden Faul ve Otomatik Seçim Yapılmadığını Doğrulayan Test.
 */
import { WebSocket } from "ws";

const WS_URL = "ws://localhost:1999/parties/game/room_5s_live_foul_test";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ [HATA] ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ [GECTI] ${msg}`);
  }
}

async function runLiveFoulTest() {
  console.log("--- CANLI WEBSOCKET FAUL & OTOMATİK SEÇİLMEME TESTİ ---");
  const ws = new WebSocket(WS_URL);

  let foulReceived = false;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Zaman aşımı: Sunucudan faul yanıtı gelmedi"));
    }, 10000);

    ws.on("open", () => {
      console.log("WebSocket bağlandı. PLAYER_JOIN ve ADD_BOT gönderiliyor (roundDuration: 5s)...");
      ws.send(
        JSON.stringify({
          type: "PLAYER_JOIN",
          userId: "user_foul_tester",
          username: "FaulTestci",
          roundDuration: 5,
        })
      );
      ws.send(JSON.stringify({ type: "ADD_BOT" }));
    });

    ws.on("message", (raw) => {
      const data = JSON.parse(raw.toString());

      if (data.type === "FOUL_APPLIED") {
        console.log("📢 FOUL_APPLIED mesajı alındı:", data.foulsApplied);
        foulReceived = true;
        assert(data.state.player1?.fouls === 1, "P1 ilk faulünü başarıyla aldı (1/3)");
        assert(data.state.roundStatus === "picking_teams", "Otomatik seçim yapılmadı, durum picking_teams kaldı");
        assert(!data.state.team1, "P1 için takım otomatik atanmadı, null kaldı");
        clearTimeout(timeout);
        ws.close();
        resolve();
      }
    });
  });

  assert(foulReceived, "Canlı sunucuda faul mekanizması başarıyla çalıştı ve otomatik takım seçimi engellendi");
  console.log("\n🎉 CANLI TEST BAŞARIYLA TAMAMLANDI!");
  process.exit(0);
}

runLiveFoulTest().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
