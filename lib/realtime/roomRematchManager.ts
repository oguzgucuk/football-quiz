/**
 * 1v1 maç sonu rövanş (rematch) durum yönetimi ve yeni maç sıfırlama mantığı.
 * Framework'ten bağımsız, test edilebilir saf fonksiyonlar içerir.
 */

import { RoomState } from "./roomState";
import { isBotPlayer } from "./botSimulator";

/**
 * Bir oyuncunun rövanş teklifini işler.
 * Rakip botsa veya rakip zaten teklifte bulunmuşsa maçı doğrudan otomatik başlatır.
 */
export function requestRematch(
  state: RoomState,
  requesterUserId: string
): { state: RoomState; autoAccepted: boolean } {
  // Eğer rakip bot ise otomatik olarak kabul et ve maçı başlat
  const isVsBot = isBotPlayer(state.player2?.userId);
  if (isVsBot) {
    return {
      state: resetRoomForRematch(state),
      autoAccepted: true,
    };
  }

  // Eğer rakip zaten daha önce rövanş istemişse, bu istek kabul anlamına gelir
  if (state.rematch?.status === "pending" && state.rematch.requestedBy !== requesterUserId) {
    return {
      state: resetRoomForRematch(state),
      autoAccepted: true,
    };
  }

  // Standart rövanş teklifi oluştur
  const nextState: RoomState = {
    ...state,
    rematch: {
      requestedBy: requesterUserId,
      status: "pending",
    },
  };

  return {
    state: nextState,
    autoAccepted: false,
  };
}

/**
 * Beklemedeki rövanş teklifini reddeder.
 */
export function declineRematch(state: RoomState): RoomState {
  if (!state.rematch || state.rematch.status !== "pending") {
    return state;
  }

  return {
    ...state,
    rematch: {
      ...state.rematch,
      status: "declined",
    },
  };
}

/**
 * Rövanş başladığında odayı 1. turun seçim aşamasına tertemiz sıfırlar.
 */
export function resetRoomForRematch(state: RoomState): RoomState {
  const p1 = state.player1
    ? {
        ...state.player1,
        score: 0,
        fouls: 0,
        selectedTeamId: null,
        selectedNationId: null,
      }
    : null;

  const p2 = state.player2
    ? {
        ...state.player2,
        score: 0,
        fouls: 0,
        selectedTeamId: null,
        selectedNationId: null,
      }
    : null;

  let currentNationPicker = state.currentNationPickerUserId;
  let currentTeamPicker = state.currentTeamPickerUserId;
  let initialNationPicker = state.initialNationPickerUserId;

  // Millet vs Kulüp modunda roller maçlar arasında dönüşümlü olsun
  if (state.gameMode === "country_vs_team" && p1 && p2) {
    const prevInitial = state.initialNationPickerUserId || p1.userId;
    initialNationPicker = prevInitial === p1.userId ? p2.userId : p1.userId;
    currentNationPicker = initialNationPicker;
    currentTeamPicker = initialNationPicker === p1.userId ? p2.userId : p1.userId;
  }

  return {
    ...state,
    status: "in_round",
    roundStatus: "picking_teams",
    currentRound: 1,
    player1: p1,
    player2: p2,
    team1: null,
    team2: null,
    nation: null,
    usedTeamIds: [],
    usedNationIds: [],
    currentNationPickerUserId: currentNationPicker,
    currentTeamPickerUserId: currentTeamPicker,
    initialNationPickerUserId: initialNationPicker,
    roundStartTime: null,
    passVotes: [],
    disconnectGrace: null,
    forfeitInfo: null,
    lastFoulEvent: null,
    lastRoundWasDraw: false,
    isReplayRound: false,
    rematch: null,
  };
}
