/**
 * Müzayede Odası Saf Durum ve Mantık Motoru.
 * Teklif akışı, zorunlu 1$ açılış, iflas koruması ve tur geçişleri.
 */

import {
  AuctionRoomState,
  AuctionLobbySettings,
  AuctionParticipant,
  AuctionPlayerCard,
  AuctionBid,
} from "./auctionTypes";

export const DEFAULT_LOBBY_SETTINGS: AuctionLobbySettings = {
  playerCount: 3,
  startingBudget: 30, // 20 - 100 ($)
  ratingMin: 70,
  ratingMax: 99,
};

export function createInitialAuctionState(
  roomId: string,
  hostUserId: string = "",
  hostUsername: string = ""
): AuctionRoomState {
  const hasValidHost = Boolean(hostUserId && hostUserId.trim().length > 0);
  const participants: Record<string, AuctionParticipant> = {};

  if (hasValidHost) {
    participants[hostUserId] = {
      userId: hostUserId,
      username: hostUsername || "Oyuncu",
      budget: DEFAULT_LOBBY_SETTINGS.startingBudget,
      squad: [],
      isReady: true,
      isHost: true,
    };
  }

  return {
    roomId,
    status: "lobby",
    settings: { ...DEFAULT_LOBBY_SETTINGS },
    participants,
    turnOrder: hasValidHost ? [hostUserId] : [],
    hostUserId: hasValidHost ? hostUserId : "",
    pool: [],
    currentCardIndex: 0,
    currentCard: null,
    currentTurnUserId: hasValidHost ? hostUserId : "",
    currentHighestBid: null,
    passedUserIds: [],
    secondsLeft: 0,
    lineups: {},
    confirmedLineupUserIds: [],
    simulationMatches: [],
    currentSimMatchIndex: 0,
    currentSimMinute: 0,
    simulationRounds: [],
    currentRoundIndex: 0,
    currentRoundMinute: 0,
    byeUserIds: [],
    simReadyUserIds: [],
    standings: [],
    championUserId: null,
    lastSoldEvent: null,
  };
}

export function startAuctionStage(
  state: AuctionRoomState,
  pool: AuctionPlayerCard[]
): AuctionRoomState {
  const userIds = Object.keys(state.participants).filter((id) => Boolean(id && id.trim().length > 0));
  const startingBudget = state.settings.startingBudget;

  const updatedParticipants: Record<string, AuctionParticipant> = {};
  for (const uid of userIds) {
    updatedParticipants[uid] = {
      ...state.participants[uid],
      budget: startingBudget,
      squad: [],
      isReady: false,
    };
  }

  const firstTurnUserId = userIds[0] || "";
  const firstCard = pool[0] || null;

  // Zorunlu 1$ Açılış Teklifi
  const initialBid: AuctionBid | null = (firstCard && firstTurnUserId)
    ? {
        bidderUserId: firstTurnUserId,
        bidderUsername: updatedParticipants[firstTurnUserId]?.username || "Oyuncu 1",
        amount: 1,
        timestamp: Date.now(),
      }
    : null;

  return {
    ...state,
    status: "auction",
    pool,
    currentCardIndex: 0,
    currentCard: firstCard,
    currentTurnUserId: firstTurnUserId,
    currentHighestBid: initialBid,
    passedUserIds: [],
    secondsLeft: 8,
    turnOrder: userIds,
    participants: updatedParticipants,
  };
}

export function applyBid(
  state: AuctionRoomState,
  bidderUserId: string,
  amount: number
): { success: boolean; error?: string; state: AuctionRoomState } {
  const p = state.participants[bidderUserId];
  if (!p) return { success: false, error: "Oyuncu bulunamadı", state };
  if (p.squad.length >= 11) return { success: false, error: "Kadronuz tamamlandı!", state };

  const currentAmt = state.currentHighestBid?.amount || 0;
  if (amount <= currentAmt) {
    return { success: false, error: "Teklif mevcut tekliften yüksek olmalıdır", state };
  }

  // İflas Güvenliği: Kalan her boş oyuncu için en az 1$ saklanmalı
  const neededPlayers = 11 - p.squad.length;
  const reserveNeeded = Math.max(0, neededPlayers - 1);
  const maxAllowedBid = p.budget - reserveNeeded;

  if (amount > maxAllowedBid) {
    return {
      success: false,
      error: `Yetersiz bütçe! Kalan ${neededPlayers - 1} transfer için en az $${reserveNeeded} saklamalısınız. (Max: $${maxAllowedBid})`,
      state,
    };
  }

  const newBid: AuctionBid = {
    bidderUserId,
    bidderUsername: p.username,
    amount,
    timestamp: Date.now(),
  };

  const nextPassed = state.passedUserIds.filter((id) => id !== bidderUserId);

  return {
    success: true,
    state: {
      ...state,
      currentHighestBid: newBid,
      passedUserIds: nextPassed,
      secondsLeft: Math.max(5, state.secondsLeft), // Sayaç en az 5 saniyeye yenilenir
    },
  };
}

export function applyPass(state: AuctionRoomState, userId: string): AuctionRoomState {
  if (state.passedUserIds.includes(userId)) return state;
  return {
    ...state,
    passedUserIds: [...state.passedUserIds, userId],
  };
}

export function advanceAuctionCard(state: AuctionRoomState): AuctionRoomState {
  if (!state.currentHighestBid || !state.currentCard) {
    return finishOrNextTurn(state);
  }

  const winnerId = state.currentHighestBid.bidderUserId;
  const cost = state.currentHighestBid.amount;
  const winner = state.participants[winnerId];

  const updatedParticipants = { ...state.participants };
  if (winner) {
    updatedParticipants[winnerId] = {
      ...winner,
      budget: Math.max(0, winner.budget - cost),
      squad: [...winner.squad, state.currentCard],
    };
  }

  const soldEvent = {
    playerName: state.currentCard.fullName,
    buyerUserId: winnerId,
    buyerUsername: winner?.username || state.currentHighestBid.bidderUsername || "Oyuncu",
    amount: cost,
    overall: state.currentCard.overallPrime,
    timestamp: Date.now(),
  };

  return finishOrNextTurn({
    ...state,
    participants: updatedParticipants,
    lastSoldEvent: soldEvent,
  });
}

function finishOrNextTurn(state: AuctionRoomState): AuctionRoomState {
  // Herkes 11 oyuncuya ulaştı mı kontrolü
  const activeBidders = Object.values(state.participants).filter(
    (p) => Boolean(p.userId && p.userId.trim()) && p.squad.length < 11
  );
  const nextCardIndex = state.currentCardIndex + 1;

  if (activeBidders.length === 0 || nextCardIndex >= state.pool.length) {
    return {
      ...state,
      status: "tactics",
      currentCard: null,
      currentHighestBid: null,
      confirmedLineupUserIds: [],
      secondsLeft: 180, // Diziliş ve taktik için 3 dakika
    };
  }

  // Sıradaki zorunlu 1$ açılış yapacak oyuncu:
  const validTurnOrder = state.turnOrder.filter((id) => Boolean(id && id.trim()));
  const total = validTurnOrder.length;
  const currentIdx = validTurnOrder.indexOf(state.currentTurnUserId);
  const startSearch = currentIdx >= 0 ? (currentIdx + 1) % total : 0;

  let nextTurnUserId = "";
  for (let i = 0; i < total; i++) {
    const candId = validTurnOrder[(startSearch + i) % total];
    if (candId && state.participants[candId] && state.participants[candId].squad.length < 11) {
      nextTurnUserId = candId;
      break;
    }
  }

  if (!nextTurnUserId && activeBidders.length > 0) {
    nextTurnUserId = activeBidders[0].userId;
  }

  const nextCard = state.pool[nextCardIndex] || null;
  const mandatoryBid: AuctionBid | null = (nextCard && nextTurnUserId)
    ? {
        bidderUserId: nextTurnUserId,
        bidderUsername: state.participants[nextTurnUserId]?.username || "Oyuncu",
        amount: 1,
        timestamp: Date.now(),
      }
    : null;

  return {
    ...state,
    currentCardIndex: nextCardIndex,
    currentCard: nextCard,
    currentTurnUserId: nextTurnUserId,
    currentHighestBid: mandatoryBid,
    passedUserIds: [],
    secondsLeft: 8,
  };
}
