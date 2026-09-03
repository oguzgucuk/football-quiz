/**
 * P1-7: Reconnect & Session Token Mimarisi Uçtan Uca Test Scripti
 *
 * Test Edilen Senaryolar:
 * 1. Oturum Belirteci (SESSION_GRANTED) Tahsisi
 * 2. 10 Saniyelik Grace Period ve Yeniden Bağlanma (REJOIN_SUCCESS, PLAYER_RECONNECTED)
 * 3. 10 Saniye Dolduğunda Hükmen Galibiyet (PLAYER_FORFEIT, match_finished)
 * 4. Geçersiz SessionToken ile Sahte REJOIN Girişiminin Engellenmesi (REJOIN_FAILED)
 */

import WebSocket from "ws";

const WS_BASE_URL = "ws://127.0.0.1:1999/parties/game/";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// TEST 1: REJOIN (10 saniye içinde başarıyla geri dönme)
// ---------------------------------------------------------------------------
async function testGracefulRejoin(): Promise<boolean> {
  console.log("\n=======================================================");
  console.log("🧪 TEST 1: 10 Saniyelik Grace Period & Başarılı REJOIN");
  console.log("=======================================================");

  const roomId = `test_rejoin_${Date.now()}`;
  let p1Token = "";
  let p2Token = "";
  let p2ReceivedDisconnect = false;
  let p2ReceivedReconnect = false;
  let p1RejoinSuccess = false;

  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Test 1 zaman aşımına uğradı (15s)"));
    }, 15000);

    const ws1 = new WebSocket(`${WS_BASE_URL}${roomId}`);
    const ws2 = new WebSocket(`${WS_BASE_URL}${roomId}`);

    ws1.on("open", () => {
      console.log("1.1. 🟢 Oyuncu 1 bağlandı, PLAYER_JOIN gönderiliyor...");
      ws1.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "user_p1", username: "Oyuncu 1" }));
    });

    ws1.on("message", async (raw: string) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "SESSION_GRANTED") {
        p1Token = msg.sessionToken;
        console.log("1.2. 🔑 Oyuncu 1 SESSION_GRANTED aldı:", p1Token);
      }
    });

    ws2.on("open", () => {
      console.log("1.3. 🟢 Oyuncu 2 bağlandı, PLAYER_JOIN gönderiliyor...");
      ws2.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "user_p2", username: "Oyuncu 2" }));
    });

    ws2.on("message", async (raw: string) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "SESSION_GRANTED") {
        p2Token = msg.sessionToken;
        console.log("1.4. 🔑 Oyuncu 2 SESSION_GRANTED aldı:", p2Token);
      }

      if (msg.type === "ROOM_STATE_SYNC" && msg.state.status === "in_round" && p1Token && !p2ReceivedDisconnect) {
        console.log("1.5. ⚔️ Maç başladı! Oyuncu 1 bağlantıyı aniden koparıyor (simülasyon)...");
        ws1.close();
      }

      if (msg.type === "PLAYER_DISCONNECTED") {
        p2ReceivedDisconnect = true;
        console.log(`1.6. ⚠️ Oyuncu 2 bildirim aldı: [PLAYER_DISCONNECTED] (${msg.graceSeconds}s grace period başladı)`);

        // 1.5 saniye bekle ve Oyuncu 1 yeni bir soketle REJOIN göndersin
        await wait(1500);
        console.log("1.7. 🔄 Oyuncu 1 yeni bağlantı açıyor ve REJOIN mesajı atıyor...");

        const ws1Rejoin = new WebSocket(`${WS_BASE_URL}${roomId}`);
        ws1Rejoin.on("open", () => {
          ws1Rejoin.send(
            JSON.stringify({
              type: "REJOIN",
              roomId,
              sessionToken: p1Token,
              userId: "user_p1",
              username: "Oyuncu 1",
            })
          );
        });

        ws1Rejoin.on("message", (rejoinRaw: string) => {
          const rejoinMsg = JSON.parse(rejoinRaw.toString());
          if (rejoinMsg.type === "REJOIN_SUCCESS") {
            p1RejoinSuccess = true;
            console.log("1.8. ✅ Oyuncu 1 REJOIN_SUCCESS aldı! Maç state'i eksiksiz kurtarıldı.");
          }
        });
      }

      if (msg.type === "PLAYER_RECONNECTED") {
        p2ReceivedReconnect = true;
        console.log("1.9. 🎉 Oyuncu 2 bildirim aldı: [PLAYER_RECONNECTED] (Grace period iptal edildi)");

        if (p1RejoinSuccess && p2ReceivedDisconnect && p2ReceivedReconnect) {
          clearTimeout(timeout);
          ws2.close();
          console.log("👉 TEST 1 SONUCU: BAŞARILI (Graceful Rejoin Çalışıyor) ✅\n");
          resolve(true);
        }
      }
    });
  });
}

// ---------------------------------------------------------------------------
// TEST 2: FORFEIT (10 saniye boyunca dönmeyince hükmen galibiyet)
// ---------------------------------------------------------------------------
async function testForfeitOnTimeout(): Promise<boolean> {
  console.log("\n=======================================================");
  console.log("🧪 TEST 2: 10 Saniye Dolunca Hükmen Galibiyet (FORFEIT)");
  console.log("=======================================================");

  const roomId = `test_forfeit_${Date.now()}`;
  let p1Closed = false;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Test 2 zaman aşımına uğradı (16s)"));
    }, 16000);

    const ws1 = new WebSocket(`${WS_BASE_URL}${roomId}`);
    const ws2 = new WebSocket(`${WS_BASE_URL}${roomId}`);

    ws1.on("open", () => {
      ws1.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "leaver_p1", username: "Ayrılan Oyuncu" }));
    });

    ws2.on("open", () => {
      ws2.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "staying_p2", username: "Bekleyen Oyuncu" }));
    });

    ws2.on("message", (raw: string) => {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "ROOM_STATE_SYNC" && msg.state.status === "in_round" && !p1Closed) {
        p1Closed = true;
        console.log("2.1. ⚔️ Maç başladı! Oyuncu 1 oyunu terk ediyor...");
        ws1.close();
      }

      if (msg.type === "PLAYER_DISCONNECTED") {
        console.log(`2.2. ⏱️ Rakip koptu. 10 saniyelik geri sayım başladı...`);
      }

      if (msg.type === "DISCONNECT_TICK") {
        process.stdout.write(`⏱️ Kalan süre: ${msg.secondsLeft}s `);
      }

      if (msg.type === "PLAYER_FORFEIT") {
        console.log("\n2.3. 🏆 [PLAYER_FORFEIT] mesajı alındı!");
        console.log(`     Kazanan: ${msg.winnerUserId}`);
        console.log(`     Ayrılan: ${msg.forfeitUserId}`);
        console.log(`     Sebep: ${msg.reason}`);

        if (msg.winnerUserId === "staying_p2" && msg.forfeitUserId === "leaver_p1") {
          clearTimeout(timeout);
          ws2.close();
          console.log("👉 TEST 2 SONUCU: BAŞARILI (Hükmen Galibiyet Çalışıyor) ✅\n");
          resolve(true);
        } else {
          reject(new Error("Hükmen galibiyet kazanan eşleşmesi hatalı!"));
        }
      }
    });
  });
}

// ---------------------------------------------------------------------------
// TEST 3: GÜVENLİK (Geçersiz/Sahte Token Koruması)
// ---------------------------------------------------------------------------
async function testInvalidTokenProtection(): Promise<boolean> {
  console.log("\n=======================================================");
  console.log("🧪 TEST 3: Güvenlik - Sahte/Geçersiz Token Reddi");
  console.log("=======================================================");

  const roomId = `test_security_${Date.now()}`;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Test 3 zaman aşımına uğradı (5s)"));
    }, 5000);

    const ws = new WebSocket(`${WS_BASE_URL}${roomId}`);

    ws.on("open", () => {
      console.log("3.1. 🛡️ Sahte sessionToken ile REJOIN deneniyor...");
      ws.send(
        JSON.stringify({
          type: "REJOIN",
          roomId,
          sessionToken: "00000000-fake-token-0000-000000000000",
          userId: "attacker_user",
        })
      );
    });

    ws.on("message", (raw: string) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "REJOIN_FAILED") {
        console.log("3.2. 🛡️ Sunucu sahte token'ı başarıyla reddetti:", msg.reason);
        clearTimeout(timeout);
        ws.close();
        console.log("👉 TEST 3 SONUCU: BAŞARILI (Yetkisiz Rejoin Engellendi) ✅\n");
        resolve(true);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// MAIN RUNNER
// ---------------------------------------------------------------------------
async function main() {
  console.log("🚀 P1-7 RECONNECT & SESSION TOKEN TEST PAKETİ BAŞLATILIYOR...\n");
  try {
    await testGracefulRejoin();
    await testForfeitOnTimeout();
    await testInvalidTokenProtection();

    console.log("=======================================================");
    console.log("🎉 TÜM P1-7 TESTLERİ BAŞARIYLA TAMAMLANDI! (3/3 PASS)");
    console.log("=======================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ TEST BAŞARISIZ OLDU:", err);
    process.exit(1);
  }
}

main();
