/**
 * Müzayede Realtime WebSocket Sunucu Yöneticisi.
 * Canlı açık artırma sayaçları, teklif senkronizasyonu ve maç simülasyon akışı.
 */

import { WebSocket } from "ws";
import {
  AuctionRoomState,
  AuctionParticipant,
  TeamLineup,
  FormationName,
} from "./auctionTypes";
import {
  createInitialAuctionState,
  startAuctionStage,
  applyBid,
  applyPass,
  advanceAuctionCard,
} from "./auctionRoomEngine";
import { generateAuctionPool } from "./generateAuctionPool";
import { createInitialSlotsForFormation } from "./formationTemplates";
import { calculateLineupPowers, calculateSlotRating } from "./positionSuitability";
import { generateRoundRobinSchedule, calculateStandings, collectCompletedRoundMatches } from "./auctionTournament";

interface AuctionPartyRoom {
  roomId: string;
  state: AuctionRoomState;
  clients: Map<WebSocket, { userId: string; username: string }>;
  timer?: NodeJS.Timeout;
}

const auctionRooms = new Map<string, AuctionPartyRoom>();

export function isAuctionRoomId(roomId: string): boolean {
  return roomId.startsWith("oda_muzayede_") || roomId.startsWith("auction_");
}

export function handleAuctionSocketConnection(ws: WebSocket, roomId: string) {
  let room = auctionRooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      state: createInitialAuctionState(roomId, "", ""),
      clients: new Map(),
    };
    auctionRooms.set(roomId, room);
  }

  room.clients.set(ws, { userId: "", username: "" });

  ws.on("message", async (raw: string) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!room) return;
      await processAuctionMessage(room, ws, msg);
    } catch (err) {
      console.error("[AuctionServer] Mesaj ayrıştırma hatası:", err);
    }
  });

  ws.on("close", () => {
    if (!room) return;
    const clientMeta = room.clients.get(ws);
    room.clients.delete(ws);

    if (!clientMeta?.userId) return;

    const remainingSockets = Array.from(room.clients.values()).filter(
      (c) => c.userId === clientMeta.userId
    );

    if (remainingSockets.length === 0) {
      handleUserDisconnect(room, clientMeta.userId, clientMeta.username || "Bir oyuncu");
    }
  });
}

type IncomingAuctionMessage = {
  type: string;
  userId: string;
  username?: string;
  settings?: Partial<import("./auctionTypes").AuctionLobbySettings>;
  amount?: number | string;
  lineup?: TeamLineup;
};

async function processAuctionMessage(
  room: AuctionPartyRoom,
  ws: WebSocket,
  msg: IncomingAuctionMessage
) {
  switch (msg.type) {
    case "AUCTION_JOIN": {
      handleJoin(room, ws, msg.userId, msg.username || "Oyuncu");
      break;
    }
    case "AUCTION_UPDATE_SETTINGS": {
      if (room.state.hostUserId === msg.userId && room.state.status === "lobby") {
        room.state.settings = { ...room.state.settings, ...msg.settings };
        broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
      }
      break;
    }
    case "AUCTION_START": {
      if (room.state.hostUserId === msg.userId && room.state.status === "lobby") {
        await handleStartGame(room);
      }
      break;
    }
    case "AUCTION_BID": {
      handleBid(room, ws, msg.userId, Number(msg.amount));
      break;
    }
    case "AUCTION_PASS": {
      handlePass(room, msg.userId);
      break;
    }
    case "AUCTION_CONFIRM_LINEUP": {
      if (msg.lineup) {
        handleConfirmLineup(room, msg.userId, msg.lineup);
      }
      break;
    }
    case "AUCTION_UNCONFIRM_LINEUP": {
      handleUnconfirmLineup(room, msg.userId);
      break;
    }
    case "AUCTION_SIM_READY": {
      handleSimReady(room, msg.userId);
      break;
    }
    case "AUCTION_ROUND_COMPLETE": {
      handleRoundComplete(room, msg.userId);
      break;
    }
    case "AUCTION_NEXT_SIM_MATCH": {
      handleNextSimMatch(room, msg.userId);
      break;
    }
    case "AUCTION_RETURN_TO_LOBBY": {
      handleReturnToLobby(room);
      break;
    }
    case "AUCTION_LEAVE": {
      const clientMeta = room.clients.get(ws);
      const uname = clientMeta?.username || msg.username || "Bir oyuncu";
      room.clients.delete(ws);
      handleUserDisconnect(room, msg.userId, uname);
      break;
    }
  }
}

function handleJoin(room: AuctionPartyRoom, ws: WebSocket, userId: string, username: string) {
  if (!userId || !userId.trim()) return;

  room.clients.set(ws, { userId, username });

  delete room.state.participants[""];

  if (!room.state.hostUserId) {
    room.state.hostUserId = userId;
  }

  if (!room.state.participants[userId] && room.state.status !== "lobby") {
    ws.send(JSON.stringify({ type: "AUCTION_STATE_SYNC", state: room.state, viewerMode: true }));
    return;
  }

  if (!room.state.participants[userId]) {
    room.state.participants[userId] = {
      userId,
      username,
      budget: room.state.settings.startingBudget,
      squad: [],
      isReady: true,
      isHost: room.state.hostUserId === userId,
    };
  }

  room.state.turnOrder = Object.keys(room.state.participants).filter((id) => Boolean(id && id.trim()));
  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

async function handleStartGame(room: AuctionPartyRoom) {
  delete room.state.participants[""];
  const validParticipants = Object.values(room.state.participants).filter(
    (p) => Boolean(p.userId && p.userId.trim())
  );
  const pCount = Math.max(2, validParticipants.length);
  const pool = await generateAuctionPool({
    playerCount: pCount,
    ratingMin: room.state.settings.ratingMin,
    ratingMax: room.state.settings.ratingMax,
  });

  room.state = startAuctionStage(room.state, pool);
  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
  startTimer(room);
}

function handleBid(room: AuctionPartyRoom, ws: WebSocket, userId: string, amount: number) {
  if (room.state.status !== "auction" || !room.state.participants[userId]) return;

  const res = applyBid(room.state, userId, amount);
  if (!res.success) {
    ws.send(JSON.stringify({ type: "AUCTION_ERROR", message: res.error }));
    return;
  }

  room.state = res.state;
  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function handlePass(room: AuctionPartyRoom, userId: string) {
  if (room.state.status !== "auction" || !room.state.participants[userId]) return;
  room.state = applyPass(room.state, userId);

  const activeBidders = Object.values(room.state.participants).filter((p) => p.squad.length < 11);
  const passedCount = room.state.passedUserIds.length;

  if (passedCount >= activeBidders.length - 1 && room.state.currentHighestBid) {
    room.state = advanceAuctionCard(room.state);
  }

  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function handleConfirmLineup(room: AuctionPartyRoom, userId: string, lineup: TeamLineup) {
  if (!room.state.participants[userId]) return;
  if (!room.state.confirmedLineupUserIds) {
    room.state.confirmedLineupUserIds = [];
  }
  if (!room.state.confirmedLineupUserIds.includes(userId)) {
    room.state.confirmedLineupUserIds.push(userId);
  }
  room.state.lineups[userId] = lineup;

  const activeUids = Object.keys(room.state.participants).filter((uid) => Boolean(uid && uid.trim()));
  const allConfirmed =
    activeUids.length > 0 && activeUids.every((uid) => room.state.confirmedLineupUserIds.includes(uid));

  if (allConfirmed) {
    if (!room.state.simulationRounds || room.state.simulationRounds.length === 0) {
      startTournamentSimulation(room);
    } else {
      room.state.status = "simulation";
      room.state.currentRoundMinute = 0;
      room.state.currentSimMinute = 0;
      room.state.confirmedLineupUserIds = [];
      broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
    }
  } else {
    broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
  }
}

function handleUnconfirmLineup(room: AuctionPartyRoom, userId: string) {
  if (!room.state.participants[userId]) return;
  if (room.state.status !== "tactics") return;
  room.state.confirmedLineupUserIds = (room.state.confirmedLineupUserIds || []).filter((id) => id !== userId);
  if (room.state.lineups[userId]) {
    room.state.lineups[userId].isConfirmed = false;
  }
  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function startTournamentSimulation(room: AuctionPartyRoom) {
  const uids = Object.keys(room.state.participants).filter((id) => Boolean(id && id.trim()));
  const rounds = generateRoundRobinSchedule(
    uids,
    room.state.lineups,
    room.state.participants
  );

  room.state.simulationRounds = rounds;
  room.state.byeUserIds = rounds.map((round) => round.byeUserId);
  room.state.simulationMatches = rounds.flatMap((round) => round.matches);
  room.state.currentRoundIndex = 0;
  room.state.currentRoundMinute = 0;
  // Sıfır spoiler: Başlangıçta oynanmamış maçlar puan tablosuna eklenmez
  room.state.standings = calculateStandings(uids, room.state.participants, []);
  room.state.championUserId = null;
  room.state.currentSimMatchIndex = 0;
  room.state.currentSimMinute = 0;
  room.state.simReadyUserIds = [];
  room.state.status = "simulation";
  room.state.secondsLeft = 30;

  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function updateStandingsAfterRound(room: AuctionPartyRoom) {
  const uids = Object.keys(room.state.participants).filter((id) => Boolean(id && id.trim()));
  const completedMatches = collectCompletedRoundMatches(room.state.simulationRounds, room.state.currentRoundIndex + 1);
  room.state.standings = calculateStandings(uids, room.state.participants, completedMatches);

  if (room.state.currentRoundIndex >= room.state.simulationRounds.length - 1) {
    room.state.championUserId = room.state.standings[0]?.userId || null;
  }
}

function handleRoundComplete(room: AuctionPartyRoom, userId: string) {
  // Client'tan gelen "round bitti" bildirimi.
  // Server currentRoundMinute'u hiç artırmıyor (client-side timer mimarisi);
  // dolayısıyla >= 90 kontrolü her zaman false olur. Sadece status kontrolü yeterli.
  if (!room.state.participants[userId] || room.state.status !== "simulation") return;

  // İdempotent: birden fazla çağrıda güvenli
  room.state.currentRoundMinute = 90;
  room.state.currentSimMinute = 90;
  updateStandingsAfterRound(room);
  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function handleSimReady(room: AuctionPartyRoom, userId: string) {
  // currentRoundMinute < 90 kontrolü kaldırıldı: server minute'u artırmıyor,
  // client gönderdiğinde server zaten 90'a setlemiş olacak (handleRoundComplete ile).
  if (!room.state.participants[userId] || room.state.status !== "simulation") return;
  // Round henüz bitmemişse hazır sayma (server 90'a setlemediyse)
  if (room.state.currentRoundMinute < 90) return;

  if (!room.state.simReadyUserIds) {
    room.state.simReadyUserIds = [];
  }
  if (!room.state.simReadyUserIds.includes(userId)) {
    room.state.simReadyUserIds.push(userId);
  }

  const activeUids = Object.keys(room.state.participants).filter((id) => Boolean(id && id.trim()));
  if (activeUids.length > 0 && room.state.simReadyUserIds.length >= activeUids.length) {
    handleNextSimMatch(room);
  } else {
    broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
  }
}

function handleNextSimMatch(room: AuctionPartyRoom, userId?: string) {
  if (userId && !room.state.participants[userId]) return;
  if (room.state.status !== "simulation") return;
  // Round bitmeden geçiş yok (server minute 90 olmalı)
  if (room.state.currentRoundMinute < 90) return;

  const activeUids = Object.keys(room.state.participants).filter((id) => Boolean(id && id.trim()));
  const isHost = !userId || userId === room.state.hostUserId;
  const isAllReady = (room.state.simReadyUserIds?.length || 0) >= activeUids.length;

  if (!isHost && !isAllReady) return;

  room.state.simReadyUserIds = [];
  const nextIdx = room.state.currentRoundIndex + 1;
  if (nextIdx < room.state.simulationRounds.length) {
    room.state.currentRoundIndex = nextIdx;
    room.state.currentRoundMinute = 0;
    room.state.currentSimMinute = 0;
    room.state.status = "tactics";
    room.state.secondsLeft = 120; // 2 dakikalık analiz ve taktik süresi
    room.state.confirmedLineupUserIds = [];
    broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
  } else {
    room.state.status = "finished";
    broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
  }
}

function startTimer(room: AuctionPartyRoom) {
  if (room.timer) clearInterval(room.timer);

  room.timer = setInterval(() => {
    if (room.state.status === "auction") {
      if (room.state.secondsLeft <= 1) {
        room.state = advanceAuctionCard(room.state);
        broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
      } else {
        room.state.secondsLeft--;
        broadcast(room, { type: "AUCTION_TIMER_TICK", secondsLeft: room.state.secondsLeft });
      }
    } else if (room.state.status === "tactics") {
      if (room.state.secondsLeft <= 1) {
        if (!room.state.simulationRounds || room.state.simulationRounds.length === 0) {
          autoConfirmLineups(room);
          startTournamentSimulation(room);
        } else {
          autoConfirmLineups(room);
          room.state.status = "simulation";
          room.state.currentRoundMinute = 0;
          room.state.currentSimMinute = 0;
          room.state.confirmedLineupUserIds = [];
          broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
        }
      } else {
        room.state.secondsLeft--;
        broadcast(room, { type: "AUCTION_TIMER_TICK", secondsLeft: room.state.secondsLeft });
      }
    }
  }, 1000);
}

function autoConfirmLineups(room: AuctionPartyRoom) {
  for (const [uid, p] of Object.entries(room.state.participants)) {
    if (!room.state.lineups[uid]?.isConfirmed) {
      const defaultFormation: FormationName = "4-2-3-1";
      const slots = createInitialSlotsForFormation(defaultFormation);
      p.squad.forEach((player, i) => {
        if (slots[i]) {
          const { effectiveRating, penalty } = calculateSlotRating(player, slots[i].targetPosition);
          slots[i].placedPlayer = player;
          slots[i].effectiveRating = effectiveRating;
          slots[i].penalty = penalty;
        }
      });
      room.state.lineups[uid] = calculateLineupPowers(uid, defaultFormation, slots);
    }
  }
  const activeUids = Object.keys(room.state.participants).filter((id) => Boolean(id && id.trim()));
  room.state.confirmedLineupUserIds = activeUids;
}

function handleReturnToLobby(room: AuctionPartyRoom) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = undefined;
  }

  const updatedParticipants: Record<string, AuctionParticipant> = {};
  for (const [uid, p] of Object.entries(room.state.participants)) {
    if (uid && uid.trim()) {
      updatedParticipants[uid] = {
        ...p,
        budget: room.state.settings.startingBudget,
        squad: [],
        isReady: true,
      };
    }
  }

  room.state = {
    ...room.state,
    status: "lobby",
    participants: updatedParticipants,
    turnOrder: Object.keys(updatedParticipants),
    pool: [],
    currentCardIndex: 0,
    currentCard: null,
    currentTurnUserId: room.state.hostUserId || Object.keys(updatedParticipants)[0] || "",
    currentHighestBid: null,
    passedUserIds: [],
    secondsLeft: 0,
    lineups: {},
    simulationMatches: [],
    currentSimMatchIndex: 0,
    currentSimMinute: 0,
    standings: [],
    championUserId: null,
  };

  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function handleUserDisconnect(room: AuctionPartyRoom, userId: string, username: string) {
  if (room.state.status === "lobby") {
    const isHost = room.state.hostUserId === userId;

    if (isHost) {
      // 1. Lobi sahibi ayrıldı -> Lobi bozulur (kapatılır)
      broadcast(room, {
        type: "AUCTION_ROOM_CLOSED",
        reason: `Lobi sahibi (${username}) ayrıldığı için lobi kapatıldı.`,
      });
      if (room.timer) {
        clearInterval(room.timer);
        room.timer = undefined;
      }
      auctionRooms.delete(room.roomId);
      return;
    }

    // 2. Normal oyuncu ayrıldı -> Listeden silinir ve uyarı bildirimi gönderilir
    delete room.state.participants[userId];
    room.state.turnOrder = Object.keys(room.state.participants).filter(
      (id) => Boolean(id && id.trim())
    );
    broadcast(room, {
      type: "AUCTION_PLAYER_LEFT",
      username,
    });
    broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
  } else {
    // Oyun sırasında biri ayrılırsa bildirim gönder
    broadcast(room, {
      type: "AUCTION_PLAYER_LEFT",
      username,
    });
  }
}

function broadcast(room: AuctionPartyRoom, payload: object) {
  const str = JSON.stringify(payload);
  for (const [ws] of room.clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(str);
    }
  }
}
