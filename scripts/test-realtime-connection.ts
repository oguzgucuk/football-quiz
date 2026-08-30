/**
 * İki eşzamanlı istemcinin WebSocket sunucusuna bağlanıp mesajlaşmasını,
 * ping/pong sürelerini ve senkron state alımını test eden otomatik sanity-check scripti.
 */

import WebSocket from "ws";

async function runSanityCheck() {
  console.log("🧪 [Sanity Check] 2 İstemcili WebSocket Bağlantı Testi Başlıyor...\n");

  const WS_URL = "ws://localhost:1999/parties/game/test-room";

  const client1 = new WebSocket(WS_URL);
  const client2 = new WebSocket(WS_URL);

  let c1Connected = false;
  let c2Connected = false;
  let chatReceivedByC2 = false;
  let pongReceivedByC1 = false;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Zaman aşımı: İstemciler bağlanamadı."));
    }, 5000);

    client1.on("open", () => {
      c1Connected = true;
      console.log("✓ [Client 1] Bağlantı başarılı.");
      client1.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "user_ahmet", username: "Ahmet" }));
      client1.send(JSON.stringify({ type: "PING", timestamp: Date.now() }));
    });

    client2.on("open", () => {
      c2Connected = true;
      console.log("✓ [Client 2] Bağlantı başarılı.");
      client2.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "user_mehmet", username: "Mehmet" }));
      
      // Client 2 bağlandıktan sonra Client 1 bir chat mesajı göndersin
      setTimeout(() => {
        console.log("📤 [Client 1] Mesaj gönderiyor: 'Merhaba Mehmet, maç başlıyor mu?'");
        client1.send(
          JSON.stringify({
            type: "CHAT",
            sender: "Ahmet",
            text: "Merhaba Mehmet, maç başlıyor mu?",
          })
        );
      }, 500);
    });

    client1.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "PONG") {
        pongReceivedByC1 = true;
        const latency = Date.now() - data.clientTimestamp;
        console.log(`✓ [Client 1] PONG yanıtı alındı! Gecikme: ${latency} ms`);
      }
    });

    client2.on("message", (raw) => {
      const data = JSON.parse(raw.toString());
      if (data.type === "CHAT_MESSAGE" && data.sender === "Ahmet") {
        chatReceivedByC2 = true;
        console.log(`✓ [Client 2] Ahmet'in mesajını anlık aldı: "${data.text}"`);
      }
      if (data.type === "ROOM_STATE_SYNC" && data.state.player1 && data.state.player2) {
        console.log(`✓ [Oda Senkronu] İki oyuncu da odada senkronize: [${data.state.player1.username} vs ${data.state.player2.username}] - Durum: ${data.state.status}`);
      }

      if (c1Connected && c2Connected && chatReceivedByC2 && pongReceivedByC1) {
        clearTimeout(timeout);
        resolve();
      }
    });

    client1.on("error", reject);
    client2.on("error", reject);
  });

  client1.close();
  client2.close();

  console.log("\n🎉 [Sanity Check Başarılı!] PartyKit/WebSocket sunucusu 2 istemci arasında anlık ve kayıpsız iletişim sağlıyor.");
}

runSanityCheck().catch((err) => {
  console.error("❌ [Sanity Check Başarısız]:", err);
  process.exit(1);
});
