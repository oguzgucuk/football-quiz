/**
 * Realtime Oyun Odası Mantık Motoru (Room Engine).
 * P2-10: party/server.ts ve party/game.ts sunucuları arasındaki oda ve tur mantığını
 * saf ve test edilebilir fonksiyonlar olarak tek noktada toplar.
 * 
 * Örnek kullanım:
 * const { state, duration } = prepareAnsweringPhase(currentRoomState);
 */

import { Team } from "@/types/game";
import { RoomState } from "./roomState";
import { CompletedRoundData } from "../db/matches";

export const DEFAULT_ROUND_DURATION = 15;
export const DEFAULT_PICK_DURATION = 5;
export const DEFAULT_MAX_ROUNDS = 5;

/**
 * 18 Elit Takım ve Supabase Storage CDN Logo URL'leri (Tek Doğru Kaynak).
 */
export const DEFAULT_POPULAR_TEAMS: Team[] = [
  { id: "cmtfrb40e00dtu6k4wklez572", name: "Real Madrid", country: "Spain", league: "La Liga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40e00dtu6k4wklez572.svg" },
  { id: "cmtfrb40c003au6k4nfn56sus", name: "FC Barcelona", country: "Spain", league: "La Liga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c003au6k4nfn56sus.png" },
  { id: "cmtfrb40c003lu6k4drdv5sfi", name: "Galatasaray", country: "Türkiye", league: "Süper Lig", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c003lu6k4drdv5sfi.svg" },
  { id: "cmtfrb40e00bpu6k4hmbu9cbf", name: "Fenerbahçe", country: "Türkiye", league: "Süper Lig", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40e00bpu6k4hmbu9cbf.png" },
  { id: "cmtfrb40b001xu6k47fc7n16j", name: "Beşiktaş", country: "Türkiye", league: "Süper Lig", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40b001xu6k47fc7n16j.svg" },
  { id: "cmtfrb40f00f8u6k4sot14ojx", name: "AC Milan", country: "Italy", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00f8u6k4sot14ojx.svg" },
  { id: "cmtfrb40f00elu6k4tgttd211", name: "Inter Milan", country: "Italy", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00elu6k4tgttd211.svg" },
  { id: "cmtfrb40f00fdu6k4upvw15gj", name: "Juventus", country: "Italy", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00fdu6k4upvw15gj.svg" },
  { id: "cmtfrb40g00lxu6k4zyc9ngsw", name: "Manchester United", country: "England", league: "Premier League", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40g00lxu6k4zyc9ngsw.png" },
  { id: "cmtfrb40f00hbu6k4ixa7ye8a", name: "Chelsea FC", country: "England", league: "Premier League", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00hbu6k4ixa7ye8a.png" },
  { id: "cmtfrb40d008pu6k4jemghzq0", name: "Bayern München", country: "Germany", league: "Bundesliga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40d008pu6k4jemghzq0.svg" },
  { id: "cmtfrb40c004nu6k4gn075jtk", name: "Borussia Dortmund", country: "Germany", league: "Bundesliga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c004nu6k4gn075jtk.svg" },
  { id: "cmtfrb40c0036u6k463i99nss", name: "Atlético de Madrid", country: "Spain", league: "La Liga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c0036u6k463i99nss.png" },
  { id: "cmtfrj6ve000pu6t8gspq4v3h", name: "Boca Juniors", country: "Argentina", league: "Primera División", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrj6ve000pu6t8gspq4v3h.svg" },
  { id: "cmtfrb40c0064u6k4rd98tz21", name: "River Plate", country: "Argentina", league: "Primera División", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c0064u6k4rd98tz21.svg" },
  { id: "cmtfrj0ul000cu6t8j88ybi62", name: "Flamengo", country: "Brazil", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrj0ul000cu6t8j88ybi62.svg" },
  { id: "cmtfrb40c006eu6k4xv2lg93k", name: "Santos FC", country: "Brazil", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c006eu6k4xv2lg93k.png" },
  { id: "cmtfrb40f00ggu6k4ck93hvci", name: "São Paulo FC", country: "Brazil", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00ggu6k4ck93hvci.svg" },
];

/**
 * Oda kimliğinden seçilen tur süresini çözer (örn: match_10s_xxx -> 10).
 */
export function resolveRoundDuration(roomId: string, defaultDuration = DEFAULT_ROUND_DURATION): number {
  const match = roomId.match(/_(\d+)s_/);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return defaultDuration;
}

/**
 * Kullanıcıyı oda oyuncusu olarak atar veya mevcut oyuncu slotunu günceller.
 */
export function assignPlayerToRoom(
  state: RoomState,
  player: { userId: string; username: string }
): { slot: "player1" | "player2" | null; state: RoomState; isRoomFull: boolean } {
  const next = { ...state };

  if (next.player1?.userId === player.userId) {
    next.player1.username = player.username;
    next.player1.isDisconnected = false;
    return { slot: "player1", state: next, isRoomFull: !!next.player2 };
  }

  if (next.player2?.userId === player.userId) {
    next.player2.username = player.username;
    next.player2.isDisconnected = false;
    return { slot: "player2", state: next, isRoomFull: !!next.player1 };
  }

  if (!next.player1) {
    next.player1 = {
      userId: player.userId,
      username: player.username,
      score: 0,
      isReady: true,
    };
    return { slot: "player1", state: next, isRoomFull: false };
  }

  if (!next.player2) {
    next.player2 = {
      userId: player.userId,
      username: player.username,
      score: 0,
      isReady: true,
    };
    next.status = "in_round";
    return { slot: "player2", state: next, isRoomFull: true };
  }

  return { slot: null, state: next, isRoomFull: true };
}

/**
 * Oyuncu için takım seçimi kaydeder.
 */
export function registerTeamPick(
  state: RoomState,
  userId: string,
  team: Team
): { state: RoomState; bothPicked: boolean } {
  const next = { ...state };

  if (next.player1?.userId === userId) {
    next.team1 = team;
    next.player1.selectedTeamId = team.id;
  } else if (next.player2?.userId === userId) {
    next.team2 = team;
    next.player2.selectedTeamId = team.id;
  }

  const bothPicked = Boolean(next.team1 && next.team2);
  return { state: next, bothPicked };
}

/**
 * Takım seçimi süresi bittiğinde veya her iki oyuncu da seçtiğinde
 * eksik takımları varsayılanlardan tamamlar ve cevaplama aşamasını başlatır.
 */
export function prepareAnsweringPhase(
  state: RoomState,
  availableTeams: Team[] = DEFAULT_POPULAR_TEAMS
): { state: RoomState; duration: number } {
  const next = { ...state };

  if (!next.team1) {
    next.team1 = availableTeams[0];
    if (next.player1) next.player1.selectedTeamId = next.team1.id;
  }

  if (!next.team2) {
    const available = availableTeams.filter((t) => t.id !== next.team1?.id);
    next.team2 = available[0] || availableTeams[1];
    if (next.player2) next.player2.selectedTeamId = next.team2.id;
  }

  next.roundStatus = "answering";
  next.roundStartTime = Date.now();
  next.passVotes = [];

  const duration = next.roundDuration || DEFAULT_ROUND_DURATION;
  return { state: next, duration };
}

/**
 * Süre dolduğunda turu berabere olarak kapatır ve tur kaydı oluşturur.
 */
export function recordRoundTimeout(
  state: RoomState
): { state: RoomState; completedRound: CompletedRoundData } {
  const next = { ...state };
  next.roundStatus = "round_finished";

  const completedRound: CompletedRoundData = {
    roundNumber: next.currentRound,
    entity1Id: next.team1?.id || "",
    entity2Id: next.team2?.id || "",
    winnerUserId: null,
    answerGiven: "Süre Doldu",
    timeTakenMs: (next.roundDuration || DEFAULT_ROUND_DURATION) * 1000,
  };

  return { state: next, completedRound };
}

/**
 * Gönderilen cevabı işler; doğruysa turu sonlandırır ve skor artırır (Race-condition kilitli).
 */
export function evaluateAnswerSubmission(
  state: RoomState,
  senderUserId: string,
  result: { isCorrect: boolean; playerName?: string },
  timeTakenMs?: number
): {
  accepted: boolean;
  isCorrect: boolean;
  winnerUserId?: string;
  playerName?: string;
  state: RoomState;
  completedRound?: CompletedRoundData;
} {
  if (state.roundStatus !== "answering") {
    return { accepted: false, isCorrect: false, state };
  }

  if (!result.isCorrect) {
    return { accepted: true, isCorrect: false, state };
  }

  const next = { ...state };
  next.roundStatus = "round_finished";

  if (next.player1?.userId === senderUserId) {
    next.player1.score += 1;
  } else if (next.player2?.userId === senderUserId) {
    next.player2.score += 1;
  }

  const duration = next.roundDuration || DEFAULT_ROUND_DURATION;
  const takenMs = timeTakenMs ?? (next.roundStartTime ? Date.now() - next.roundStartTime : duration * 1000);

  const completedRound: CompletedRoundData = {
    roundNumber: next.currentRound,
    entity1Id: next.team1?.id || "",
    entity2Id: next.team2?.id || "",
    winnerUserId: senderUserId,
    answerGiven: result.playerName || "Doğru Cevap",
    timeTakenMs: Math.min(takenMs, duration * 1000),
  };

  return {
    accepted: true,
    isCorrect: true,
    winnerUserId: senderUserId,
    playerName: result.playerName,
    state: next,
    completedRound,
  };
}

/**
 * Pas oylamasını işler. Her iki oyuncu da pas verirse tur berabere biter.
 */
export function evaluatePassVote(
  state: RoomState,
  userId: string
): {
  bothPassed: boolean;
  state: RoomState;
  completedRound?: CompletedRoundData;
} {
  const next = { ...state };
  if (!next.passVotes.includes(userId)) {
    next.passVotes = [...next.passVotes, userId];
  }

  const p1Id = next.player1?.userId;
  const p2Id = next.player2?.userId;
  const bothPassed = Boolean(p1Id && p2Id && next.passVotes.includes(p1Id) && next.passVotes.includes(p2Id));

  if (bothPassed) {
    next.roundStatus = "round_finished";
    const completedRound: CompletedRoundData = {
      roundNumber: next.currentRound,
      entity1Id: next.team1?.id || "",
      entity2Id: next.team2?.id || "",
      winnerUserId: null,
      answerGiven: "Pas Geçildi (Berabere)",
      timeTakenMs: next.roundStartTime ? Date.now() - next.roundStartTime : 0,
    };
    return { bothPassed: true, state: next, completedRound };
  }

  return { bothPassed: false, state: next };
}

/**
 * Tur bitiminde bir sonraki tura geçer veya maçı sonlandırır.
 */
export function prepareNextRound(
  state: RoomState,
  maxRounds = DEFAULT_MAX_ROUNDS
): { isMatchFinished: boolean; state: RoomState } {
  const next = { ...state };

  if (next.currentRound >= (next.maxRounds || maxRounds)) {
    next.status = "match_finished";
    return { isMatchFinished: true, state: next };
  }

  next.currentRound += 1;
  next.roundStatus = "picking_teams";
  next.team1 = null;
  next.team2 = null;
  next.passVotes = [];
  next.roundStartTime = null;

  if (next.player1) next.player1.selectedTeamId = null;
  if (next.player2) next.player2.selectedTeamId = null;

  return { isMatchFinished: false, state: next };
}
