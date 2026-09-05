import assert from "assert";
import { isTeamPlayableInGame, isNationalTeamName } from "../lib/db/allowedTeams";
import {
  enqueueAndMatch,
  generateMatchId,
  MatchmakingQueuePlayer,
} from "../lib/realtime/matchmakingEngine";
import { createInitialRoomState } from "../lib/realtime/roomState";

console.log("============================================================");
console.log("🛠️ DÜZELTMELER DOĞRULAMA TESTİ");
console.log("============================================================\n");

// 1. Milli Takımların Kulüp Havuzundan Elenmesi Testi
console.log("--- 1. Kulüp Havuzu Filtreleme Testi ---");
assert(isNationalTeamName("Fransa millî futbol takımı") === true, "Fransa millî futbol takımı milli takım olarak algılandı");
assert(isNationalTeamName("Almanya Millî Futbol Takımı") === true, "Almanya millî futbol takımı milli takım olarak algılandı");
assert(isNationalTeamName("Türkiye 17 yaş altı millî futbol takımı") === true, "U-17 milli takım algılandı");
assert(isNationalTeamName("Brazil national under-17 football team") === true, "Under-17 national team algılandı");
assert(isNationalTeamName("Real Madrid") === false, "Real Madrid kulüp olarak korundu");
assert(isNationalTeamName("FC Barcelona") === false, "FC Barcelona kulüp olarak korundu");
assert(isNationalTeamName("Galatasaray") === false, "Galatasaray kulüp olarak korundu");
assert(isNationalTeamName("Atlético Nacional") === false, "Atlético Nacional kulüp olarak korundu");

assert(isTeamPlayableInGame({ name: "Fransa millî futbol takımı", country: "France", league: "Club" }) === false, "Milli takım kulüp seçiminden elendi");
assert(isTeamPlayableInGame({ name: "Real Madrid", country: "Spain", league: "LaLiga" }) === true, "Real Madrid kulüp seçiminde onaylandı");
console.log("✅ Kulüp havuzundan milli takımlar başarıyla elendi!");

// 2. Matchmaking Mod İzolasyonu Testi
console.log("\n--- 2. Matchmaking Mod İzolasyonu Testi ---");
const pCommon: MatchmakingQueuePlayer = {
  id: "conn_p1",
  userId: "user_common",
  username: "CommonPlayer",
  roundDuration: 15,
  mode: "casual",
  gameMode: "team_vs_team",
  joinedAt: Date.now(),
};

const pNation: MatchmakingQueuePlayer = {
  id: "conn_p2",
  userId: "user_nation",
  username: "NationPlayer",
  roundDuration: 15,
  mode: "casual",
  gameMode: "country_vs_team",
  joinedAt: Date.now(),
};

// Ortak oyuncu kuyruğuna girdi
const res1 = enqueueAndMatch([], pCommon);
assert(res1.match === null, "Tek oyuncu için eşleşme yok");
assert(res1.updatedQueue.length === 1, "Kuyrukta 1 oyuncu var");

// Millet-Takım oyuncusu aynı süre ve aynı casual modunda girdi
const res2 = enqueueAndMatch(res1.updatedQueue, pNation);
assert(res2.match === null, "Farklı oyun modundaki iki oyuncu ASLA eşleşmemeli!");
assert(res2.updatedQueue.length === 2, "İki oyuncu da kendi modunda beklemede kalmalı");
console.log("✅ Ortak Oyuncu ve Millet-Takım oyuncularının birbirine sızmadığı doğrulandı!");

// 3. Aynı Moddaki İki Oyuncunun Eşleşmesi Testi
console.log("\n--- 3. Aynı Moddaki Eşleşme ve Oda ID Testi ---");
const pNation2: MatchmakingQueuePlayer = {
  id: "conn_p3",
  userId: "user_nation2",
  username: "NationPlayer2",
  roundDuration: 15,
  mode: "casual",
  gameMode: "country_vs_team",
  joinedAt: Date.now(),
};

const res3 = enqueueAndMatch(res2.updatedQueue, pNation2);
assert(res3.match !== null, "Aynı moddaki iki Millet-Takım oyuncusu eşleşti");
assert(res3.match.gameMode === "country_vs_team", "Eşleşme gameMode 'country_vs_team'");
assert(res3.match.matchId.includes("_country_vs_team_"), "Oda ID '_country_vs_team_' içeriyor");

// Oda durumu oluşturma testi
const roomState = createInitialRoomState(res3.match.matchId);
assert(roomState.gameMode === "country_vs_team", "createInitialRoomState oda ID'sinden 'country_vs_team' modunu doğru algıladı");
console.log("✅ Eşleşme ve Oda ID doğrulaması başarılı!");

// 4. Özel Oda (Custom Room) ID Testi
console.log("\n--- 4. Özel Oda ID Algılama Testi ---");
const customMilletRoom = createInitialRoomState("oda_millet_7823");
assert(customMilletRoom.gameMode === "country_vs_team", "oda_millet_... 'country_vs_team' olarak algılandı");

const customCommonRoom = createInitialRoomState("oda_4512");
assert(customCommonRoom.gameMode === "team_vs_team", "oda_... 'team_vs_team' olarak algılandı");
console.log("✅ Özel oda ID algılama başarılı!");

console.log("\n============================================================");
console.log("🎉 TÜM DÜZELTMELER BAŞARIYLA DOĞRULANDI!");
console.log("============================================================\n");
