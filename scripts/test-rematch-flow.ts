import { createInitialRoomState } from "../lib/realtime/roomState";
import {
  requestRematch,
  declineRematch,
  resetRoomForRematch,
} from "../lib/realtime/roomRematchManager";

function runRematchTests() {
  console.log("🧪 [Test] 1v1 Maç Sonu Rövanş Mantığı Test Ediliyor...\n");

  // 1. İnsan vs İnsan: Rövanş İsteği ve Bekleme Durumu
  let state = createInitialRoomState("test_room_1");
  state.status = "match_finished";
  state.player1 = {
    userId: "user_ali",
    username: "Ali",
    score: 3,
    fouls: 0,
    isReady: true,
  };
  state.player2 = {
    userId: "user_veli",
    username: "Veli",
    score: 1,
    fouls: 1,
    isReady: true,
  };

  const req1 = requestRematch(state, "user_ali");
  console.assert(!req1.autoAccepted, "Ali rövanş istediğinde hemen autoAccept olmamalı, Veli beklenmeli");
  console.assert(req1.state.rematch?.status === "pending", "Rövanş durumu 'pending' olmalı");
  console.assert(req1.state.rematch?.requestedBy === "user_ali", "Rövanş isteyen 'user_ali' olmalı");
  console.log("✅ 1. Ali rövanş teklifi gönderdi, bekleme durumu doğrulandı.");

  // 2. Veli Reddediyor
  const declinedState = declineRematch(req1.state);
  console.assert(declinedState.rematch?.status === "declined", "Veli reddedince durum 'declined' olmalı");
  console.log("✅ 2. Veli rövanşı reddetti, durum 'declined' olarak güncellendi.");

  // 3. Ali Tekrar İstiyor ve Veli Kabul Ediyor
  const req2 = requestRematch(declinedState, "user_ali");
  console.assert(req2.state.rematch?.status === "pending", "Yeni istek 'pending' olmalı");

  const reqAccepted = requestRematch(req2.state, "user_veli");
  console.assert(reqAccepted.autoAccepted, "Veli de rövanş isteyince autoAccept true olmalı");
  console.assert(reqAccepted.state.status === "in_round", "Yeni maç başlamalı: in_round");
  console.assert(reqAccepted.state.currentRound === 1, "1. Tur başlamalı");
  console.assert(reqAccepted.state.roundStatus === "picking_teams", "Seçim aşaması olmalı");
  console.assert(reqAccepted.state.player1?.score === 0, "Ali'nin skoru 0 olmalı");
  console.assert(reqAccepted.state.player2?.score === 0, "Veli'nin skoru 0 olmalı");
  console.assert(reqAccepted.state.rematch === null, "Rövanş durumu temizlenmeli");
  console.log("✅ 3. Veli rövanşı kabul etti, yeni maç (1. tur, 0-0) sıfırlandı.");

  // 4. İnsan vs Bot: Otomatik Kabul
  let botRoom = createInitialRoomState("test_room_bot");
  botRoom.status = "match_finished";
  botRoom.player1 = {
    userId: "user_ali",
    username: "Ali",
    score: 2,
    fouls: 0,
    isReady: true,
  };
  botRoom.player2 = {
    userId: "bot_super_ai",
    username: "Yapay Zeka",
    score: 3,
    fouls: 0,
    isReady: true,
  };

  const botReq = requestRematch(botRoom, "user_ali");
  console.assert(botReq.autoAccepted, "Bota karşı rövanş istendiğinde bot anında kabul etmeli");
  console.assert(botReq.state.status === "in_round", "Bot maçı derhal 1. tura geçmeli");
  console.assert(botReq.state.player1?.score === 0 && botReq.state.player2?.score === 0, "Skorlar 0-0 olmalı");
  console.log("✅ 4. Yapay zekaya karşı rövanş istendiğinde anında kabul ve sıfırlama doğrulandı.");

  // 5. Millet vs Kulüp Modunda Rol Dönüşümü
  let nationRoom = createInitialRoomState("oda_millet_123");
  nationRoom.status = "match_finished";
  nationRoom.gameMode = "country_vs_team";
  nationRoom.initialNationPickerUserId = "user_ali";
  nationRoom.player1 = { userId: "user_ali", username: "Ali", score: 3, fouls: 0, isReady: true };
  nationRoom.player2 = { userId: "user_veli", username: "Veli", score: 2, fouls: 0, isReady: true };

  const rematchNation = resetRoomForRematch(nationRoom);
  console.assert(rematchNation.initialNationPickerUserId === "user_veli", "İlk maç Ali başladıysa rövanşta Veli millet seçmeli");
  console.assert(rematchNation.currentNationPickerUserId === "user_veli", "Millet seçici Veli olmalı");
  console.assert(rematchNation.currentTeamPickerUserId === "user_ali", "Kulüp seçici Ali olmalı");
  console.log("✅ 5. Millet vs Kulüp modunda rollerin maçlar arası dönüşümlü değişmesi doğrulandı.");

  console.log("\n🎉 TÜM RÖVANŞ TESTLERİ BAŞARIYLA GEÇTİ!");
}

runRematchTests();
