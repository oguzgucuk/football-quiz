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
  AuctionSoldEvent,
} from "./auctionTypes";

export const DEFAULT_LOBBY_SETTINGS: AuctionLobbySettings = {
  playerCount: 4,
  startingBudget: 30, // 20 - 100 ($)
  ratingMin: 70,
  ratingMax: 99,
};

export function isGoalkeeper(
  player: {
    positions?: string[];
    primaryPosition?: string | null;
    position?: string | null;
  } | null | undefined
): boolean {
  if (!player) return false;
  const positions = (player.positions || []).map((p) => String(p).trim().toUpperCase());
  const primary = String(player.primaryPosition || player.position || "").trim().toUpperCase();

  const isGkToken = (s: string) =>
    s === "GK" ||
    s === "KL" ||
    s.includes("GOALKEEPER") ||
    s.includes("KALECI") ||
    s.includes("TORWART") ||
    s.includes("PORTERO");

  return positions.some(isGkToken) || isGkToken(primary);
}

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
    salesHistory: [],
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
        cardIndex: 0,
        cardId: firstCard.id,
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
    bidCooldownUntil: Date.now() + 1000,
  };
}

export function applyBid(
  state: AuctionRoomState,
  bidderUserId: string,
  amount: number,
  cardIndex?: number,
  cardId?: string
): { success: boolean; error?: string; state: AuctionRoomState } {
  const p = state.participants[bidderUserId];
  if (!p) return { success: false, error: "Oyuncu bulunamadı", state };
  if (p.squad.length >= 14) return { success: false, error: "Kadronuz tamamlandı!", state };

  // Satış kutlama fazı (2 saniye): Oyuncu satıldığında vitrin kutlama durumundadır, teklif kabul edilmez
  if (state.isSoldCelebration || (state.soldCelebrationUntil && Date.now() < state.soldCelebrationUntil)) {
    return { success: false, error: "Oyuncu satıldı, yeni tur bekleniyor...", state };
  }

  // Son saniye yarış koşulu koruması: Belirtilen kart ile anlık kart uyuşmalı
  if (cardIndex !== undefined && cardIndex !== state.currentCardIndex) {
    return { success: false, error: "Teklif önceki oyuncuya aitti, yeni tura yetişmedi.", state };
  }
  if (cardId && state.currentCard && cardId !== state.currentCard.id) {
    return { success: false, error: "Teklif önceki oyuncuya aitti, yeni tura yetişmedi.", state };
  }

  // Yeni oyuncu geçiş tamponu: Son saniye tekliflerinin sonraki oyuncuya aktarılmasını önle
  if (state.bidCooldownUntil && Date.now() < state.bidCooldownUntil) {
    return { success: false, error: "Yeni oyuncu açılıyor, lütfen bekleyin.", state };
  }

  // Kaleci Limiti: Her takım en fazla 2 kaleci transfer edebilir
  const isCurrentCardGk = isGoalkeeper(state.currentCard);
  if (isCurrentCardGk && p.squad.filter(isGoalkeeper).length >= 2) {
    return {
      success: false,
      error: "Zaten 2 kaleciniz var! Bir takımda en fazla 2 kaleci bulunabilir.",
      state,
    };
  }

  const currentAmt = state.currentHighestBid?.amount || 0;
  if (amount <= currentAmt) {
    return { success: false, error: "Teklif mevcut tekliften yüksek olmalıdır", state };
  }

  // İflas Güvenliği: Kalan her boş oyuncu için en az 1$ saklanmalı (14 oyuncu hedefi)
  const neededPlayers = 14 - p.squad.length;
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
    cardIndex: state.currentCardIndex,
    cardId: state.currentCard?.id,
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

  const soldEvent: AuctionSoldEvent = {
    playerName: state.currentCard.fullName,
    buyerUserId: winnerId,
    buyerUsername: winner?.username || state.currentHighestBid.bidderUsername || "Oyuncu",
    amount: cost,
    overall: state.currentCard.overallPrime,
    timestamp: Date.now(),
  };

  // 2 Saniyelik Satış Bildirim & Kutlama Durumu:
  // Kart henüz değiştirilmez; butonlar gizlenir ve ortada satış kartı gösterilir.
  return {
    ...state,
    participants: updatedParticipants,
    lastSoldEvent: soldEvent,
    salesHistory: [...(state.salesHistory || []), soldEvent],
    isSoldCelebration: true,
    soldCelebrationUntil: Date.now() + 2000,
    secondsLeft: 2,
  };
}

export function finishSoldCelebration(state: AuctionRoomState): AuctionRoomState {
  return finishOrNextTurn({
    ...state,
    isSoldCelebration: false,
    soldCelebrationUntil: undefined,
  });
}

function finishOrNextTurn(state: AuctionRoomState): AuctionRoomState {
  const activeBidders = Object.values(state.participants).filter(
    (p) => Boolean(p.userId && p.userId.trim()) && p.squad.length < 14
  );

  // Odadaki aktif oyuncuların kaleciye ihtiyacı var mı? (Her oyuncu en fazla 2 kaleci alabilir)
  const anyActiveNeedsGk = activeBidders.some((p) => p.squad.filter(isGoalkeeper).length < 2);

  // Sıradaki uygun kartı bul: Eğer kart kaleciyse ve kimsenin kaleciye ihtiyacı kalmadıysa o kartı doğrudan atla!
  let nextCardIndex = state.currentCardIndex + 1;
  let nextCard: AuctionPlayerCard | null = null;
  let isNextCardGk = false;

  while (nextCardIndex < state.pool.length) {
    const candidateCard = state.pool[nextCardIndex];
    const isCandGk = isGoalkeeper(candidateCard);

    if (isCandGk && !anyActiveNeedsGk) {
      // Kimsenin kaleciye ihtiyacı yok, bu kaleci kartını ihaleye çıkarmadan atla!
      nextCardIndex++;
      continue;
    }

    nextCard = candidateCard;
    isNextCardGk = isCandGk;
    break;
  }

  if (activeBidders.length === 0 || !nextCard || nextCardIndex >= state.pool.length) {
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
  // Eğer sıradaki kart kaleci ise, YALNIZCA kalecisi olmayan bir oyuncuya sıra gelebilir!
  const validTurnOrder = state.turnOrder.filter((id) => Boolean(id && id.trim()));
  const total = validTurnOrder.length;
  const currentIdx = validTurnOrder.indexOf(state.currentTurnUserId);
  const startSearch = currentIdx >= 0 ? (currentIdx + 1) % total : 0;

  let nextTurnUserId = "";
  for (let i = 0; i < total; i++) {
    const candId = validTurnOrder[(startSearch + i) % total];
    const cand = candId ? state.participants[candId] : null;
    if (cand && cand.squad.length < 14) {
      if (isNextCardGk && cand.squad.filter(isGoalkeeper).length >= 2) {
        continue; // 2 kalecisi dolmuş oyuncu yeni kalecinin açılış teklifçisi olamaz!
      }
      nextTurnUserId = candId;
      break;
    }
  }

  if (!nextTurnUserId && activeBidders.length > 0) {
    if (isNextCardGk) {
      const bidderWithoutGk = activeBidders.find((b) => b.squad.filter(isGoalkeeper).length < 2);
      if (bidderWithoutGk) {
        nextTurnUserId = bidderWithoutGk.userId;
      }
    } else {
      nextTurnUserId = activeBidders[0].userId;
    }
  }

  const mandatoryBid: AuctionBid | null = (nextCard && nextTurnUserId)
    ? {
        bidderUserId: nextTurnUserId,
        bidderUsername: state.participants[nextTurnUserId]?.username || "Oyuncu",
        amount: 1,
        timestamp: Date.now(),
        cardIndex: nextCardIndex,
        cardId: nextCard.id,
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
    bidCooldownUntil: Date.now() + 1000, // 1 saniyelik geçiş tamponu
    isSoldCelebration: false,
    soldCelebrationUntil: undefined,
  };
}
