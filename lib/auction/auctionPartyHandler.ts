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
import { generateLeagueFixtures, simulateEntireTournament } from "./auctionTournament";

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

    if (clientMeta?.userId && room.state.status === "lobby") {
      const remainingSockets = Array.from(room.clients.values()).filter(
        (c) => c.userId === clientMeta.userId
      );
      if (remainingSockets.length === 0) {
        delete room.state.participants[clientMeta.userId];
        room.state.turnOrder = Object.keys(room.state.participants).filter((id) => Boolean(id && id.trim()));
        if (room.state.hostUserId === clientMeta.userId) {
          room.state.hostUserId = room.state.turnOrder[0] || "";
          if (room.state.hostUserId && room.state.participants[room.state.hostUserId]) {
            room.state.participants[room.state.hostUserId].isHost = true;
          }
        }
        broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
      }
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
    case "AUCTION_NEXT_SIM_MATCH": {
      handleNextSimMatch(room);
      break;
    }
    case "AUCTION_RETURN_TO_LOBBY": {
      handleReturnToLobby(room);
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
  if (room.state.status !== "auction") return;

  const res = applyBid(room.state, userId, amount);
  if (!res.success) {
    ws.send(JSON.stringify({ type: "AUCTION_ERROR", message: res.error }));
    return;
  }

  room.state = res.state;
  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function handlePass(room: AuctionPartyRoom, userId: string) {
  if (room.state.status !== "auction") return;
  room.state = applyPass(room.state, userId);

  const activeBidders = Object.values(room.state.participants).filter((p) => p.squad.length < 11);
  const passedCount = room.state.passedUserIds.length;

  if (passedCount >= activeBidders.length - 1 && room.state.currentHighestBid) {
    room.state = advanceAuctionCard(room.state);
  }

  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
}

function handleConfirmLineup(room: AuctionPartyRoom, userId: string, lineup: TeamLineup) {
  room.state.lineups[userId] = lineup;
  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });

  const allConfirmed = Object.keys(room.state.participants).every(
    (uid) => room.state.lineups[uid]?.isConfirmed
  );

  if (allConfirmed) {
    startTournamentSimulation(room);
  }
}

function startTournamentSimulation(room: AuctionPartyRoom) {
  const uids = Object.keys(room.state.participants);
  const fixtures = generateLeagueFixtures(uids);
  const { matches, standings, championUserId } = simulateEntireTournament(
    fixtures,
    room.state.lineups,
    room.state.participants
  );

  room.state.simulationMatches = matches;
  room.state.standings = standings;
  room.state.championUserId = championUserId;
  room.state.currentSimMatchIndex = 0;
  room.state.currentSimMinute = 0;
  room.state.status = "simulation";
  room.state.secondsLeft = 30;

  broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
  startSimTimer(room);
}

function handleNextSimMatch(room: AuctionPartyRoom) {
  const nextIdx = room.state.currentSimMatchIndex + 1;
  if (nextIdx < room.state.simulationMatches.length) {
    room.state.currentSimMatchIndex = nextIdx;
    room.state.currentSimMinute = 0;
    room.state.secondsLeft = 30;
    broadcast(room, { type: "AUCTION_STATE_SYNC", state: room.state });
    startSimTimer(room);
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
        autoConfirmLineups(room);
        startTournamentSimulation(room);
      } else {
        room.state.secondsLeft--;
        broadcast(room, { type: "AUCTION_TIMER_TICK", secondsLeft: room.state.secondsLeft });
      }
    }
  }, 1000);
}

function startSimTimer(room: AuctionPartyRoom) {
  if (room.timer) clearInterval(room.timer);

  room.timer = setInterval(() => {
    if (room.state.status !== "simulation") {
      if (room.timer) clearInterval(room.timer);
      return;
    }

    if (room.state.currentSimMinute < 90) {
      room.state.currentSimMinute += 6;
      broadcast(room, {
        type: "AUCTION_SIM_TICK",
        currentMinute: room.state.currentSimMinute,
        currentMatchIndex: room.state.currentSimMatchIndex,
      });
    } else {
      if (room.timer) clearInterval(room.timer);
      broadcast(room, {
        type: "AUCTION_SIM_MATCH_END",
        currentMatchIndex: room.state.currentSimMatchIndex,
      });
    }
  }, 1800); // Her ~1.8 saniyede bir pozisyon (~27-30 sn toplam maç süresi)
}

function autoConfirmLineups(room: AuctionPartyRoom) {
  for (const [uid, p] of Object.entries(room.state.participants)) {
    if (!room.state.lineups[uid]?.isConfirmed) {
      const defaultFormation: FormationName = "4-3-3";
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

function broadcast(room: AuctionPartyRoom, payload: object) {
  const str = JSON.stringify(payload);
  for (const [ws] of room.clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(str);
    }
  }
}
