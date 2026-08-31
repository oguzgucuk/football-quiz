import { WebSocket } from "ws";

async function testPartyKitCloud() {
  console.log("🌐 PartyKit Cloud Canlı Bağlantı Testi Başlatılıyor...\n");

  const host = "football-quiz.oguzgucuk.partykit.dev";

  // TEST 1: Matchmaking Bağlantısı
  console.log("1️⃣ Matchmaking Kuyruğu Testi (/parties/matchmaking/queue)...");
  const mmUrl = `wss://${host}/parties/matchmaking/queue`;
  
  await new Promise<void>((resolve, reject) => {
    const ws1 = new WebSocket(mmUrl);
    const ws2 = new WebSocket(mmUrl);

    let ws1Matched = false;
    let ws2Matched = false;

    ws1.on("open", () => {
      console.log("   ✅ Oyuncu 1 Matchmaking kuyruğuna bağlandı.");
      ws1.send(JSON.stringify({ type: "MATCHMAKING_JOIN", userId: "test_user_1", username: "Oyuncu 1", eloRating: 1200 }));
    });

    ws2.on("open", () => {
      console.log("   ✅ Oyuncu 2 Matchmaking kuyruğuna bağlandı.");
      ws2.send(JSON.stringify({ type: "MATCHMAKING_JOIN", userId: "test_user_2", username: "Oyuncu 2", eloRating: 1250 }));
    });

    ws1.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log("   📩 Oyuncu 1 Mesaj Aldı:", msg.type);
      if (msg.type === "MATCH_FOUND") {
        ws1Matched = true;
        console.log(`   🎉 Oyuncu 1 Eşleşti! Oda ID: ${msg.matchId}, Rakip: ${msg.opponent.username}`);
      }
    });

    ws2.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log("   📩 Oyuncu 2 Mesaj Aldı:", msg.type);
      if (msg.type === "MATCH_FOUND") {
        ws2Matched = true;
        console.log(`   🎉 Oyuncu 2 Eşleşti! Oda ID: ${msg.matchId}, Rakip: ${msg.opponent.username}`);
      }
      if (ws1Matched && ws2Matched) {
        ws1.close();
        ws2.close();
        resolve();
      }
    });

    ws1.on("error", (err) => {
      console.error("   ❌ Oyuncu 1 WS Hatası:", err);
      reject(err);
    });

    ws2.on("error", (err) => {
      console.error("   ❌ Oyuncu 2 WS Hatası:", err);
      reject(err);
    });

    setTimeout(() => {
      ws1.close();
      ws2.close();
      if (!ws1Matched || !ws2Matched) {
        console.log("   ⚠️ Zaman aşımı: Eşleşme tamamlanamadı.");
      }
      resolve();
    }, 6000);
  });

  // TEST 2: Game Room Bağlantısı
  console.log("\n2️⃣ Oyun Odası Testi (/parties/game/test_room_cloud)...");
  const gameUrl = `wss://${host}/parties/game/test_room_cloud`;

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(gameUrl);

    ws.on("open", () => {
      console.log("   ✅ Oyun odasına başarıyla bağlanıldı.");
      ws.send(JSON.stringify({ type: "PLAYER_JOIN", userId: "player_test", username: "Bulut Oyuncu" }));
    });

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log("   📩 Oda Durumu Senkronize Edildi:", msg.type, `(Tur: ${msg.state?.currentRound})`);
      ws.close();
      resolve();
    });

    ws.on("error", (err) => {
      console.error("   ❌ Oyun Odası WS Hatası:", err);
      reject(err);
    });

    setTimeout(() => {
      ws.close();
      resolve();
    }, 4000);
  });

  console.log("\n🎉 TÜM CANLI BULUT TESTLERİ TAMAMLANDI!");
}

testPartyKitCloud().catch(console.error);
