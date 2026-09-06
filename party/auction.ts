/**
 * PartyKit Cloud Canlı Müzayede Odası Sunucusu (AuctionPartyServer).
 * - Canlı Çok Oyunculu Açık Artırma (Lobi, Bütçe, Teklifler, Sayaç)
 * - Taktik ve Kadro Kurma (4-3-3, 4-4-2, 3-5-2)
 * - Lig ve Turnuva Simülasyonu (Fikstür, Canlı Dakikalar, Puan Durumu)
 */

import type * as Party from "partykit/server";
import {
  AuctionRoomState,
  AuctionParticipant,
  TeamLineup,
  FormationName,
  AuctionPlayerCard,
  AuctionLobbySettings,
} from "../lib/auction/auctionTypes";
import {
  createInitialAuctionState,
  startAuctionStage,
  applyBid,
  applyPass,
  advanceAuctionCard,
} from "../lib/auction/auctionRoomEngine";
import { createInitialSlotsForFormation } from "../lib/auction/formationTemplates";
import { calculateLineupPowers, calculateSlotRating } from "../lib/auction/positionSuitability";
import { generateLeagueFixtures, simulateEntireTournament, calculateStandings } from "../lib/auction/auctionTournament";

export default class AuctionPartyServer implements Party.Server {
  state: AuctionRoomState;
  siteUrl?: string;
  timerInterval?: ReturnType<typeof setInterval>;
  connectionMeta = new Map<string, { userId: string; username: string }>();

  constructor(readonly room: Party.Room) {
    this.state = createInitialAuctionState(this.room.id, "", "");
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.extractSiteUrl(ctx);
    conn.send(JSON.stringify({ type: "AUCTION_STATE_SYNC", state: this.state }));
  }

  onClose(conn: Party.Connection) {
    const meta = this.connectionMeta.get(conn.id);
    this.connectionMeta.delete(conn.id);
    if (!meta?.userId) return;

    const remainingConns = Array.from(this.connectionMeta.values()).filter(
      (m) => m.userId === meta.userId
    );
    if (remainingConns.length === 0) {
      this.handleUserDisconnect(meta.userId, meta.username || "Bir oyuncu");
    }
  }

  async onMessage(rawMessage: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(rawMessage);
      if (msg.siteUrl && typeof msg.siteUrl === "string" && msg.siteUrl.startsWith("http")) {
        this.siteUrl = msg.siteUrl.replace(/\/$/, "");
      }

      switch (msg.type) {
        case "AUCTION_JOIN":
          this.handleJoin(sender, msg.userId, msg.username || "Oyuncu");
          break;
        case "AUCTION_UPDATE_SETTINGS":
          this.handleUpdateSettings(msg.userId, msg.settings);
          break;
        case "AUCTION_START":
          if (this.state.hostUserId === msg.userId && this.state.status === "lobby") {
            await this.handleStartGame();
          }
          break;
        case "AUCTION_BID":
          this.handleBid(sender, msg.userId, Number(msg.amount));
          break;
        case "AUCTION_PASS":
          this.handlePass(msg.userId);
          break;
        case "AUCTION_CONFIRM_LINEUP":
          if (msg.lineup) this.handleConfirmLineup(msg.userId, msg.lineup);
          break;
        case "AUCTION_SIM_READY":
          this.handleSimReady(msg.userId);
          break;
        case "AUCTION_NEXT_SIM_MATCH":
          this.handleNextSimMatch(msg.userId);
          break;
        case "AUCTION_RETURN_TO_LOBBY":
          this.handleReturnToLobby();
          break;
        case "AUCTION_LEAVE":
          this.handleUserDisconnect(msg.userId, msg.username || "Bir oyuncu");
          break;
      }
    } catch (err) {
      console.error("[AuctionPartyServer] Mesaj işleme hatası:", err);
    }
  }

  private extractSiteUrl(ctx: Party.ConnectionContext) {
    const origin = ctx.request.headers.get("origin") || ctx.request.headers.get("referer");
    let queryOrigin = "";
    try {
      const url = new URL(ctx.request.url);
      queryOrigin = url.searchParams.get("origin") || "";
    } catch {
      // ignore
    }
    const detected = origin || queryOrigin;
    if (detected && detected.startsWith("http")) {
      this.siteUrl = detected.replace(/\/$/, "");
    }
  }

  private broadcast(payload: object) {
    this.room.broadcast(JSON.stringify(payload));
  }

  private handleJoin(sender: Party.Connection, userId: string, username: string) {
    if (!userId || !userId.trim()) return;
    this.connectionMeta.set(sender.id, { userId, username });
    delete this.state.participants[""];

    if (!this.state.hostUserId) {
      this.state.hostUserId = userId;
    }

    if (!this.state.participants[userId]) {
      this.state.participants[userId] = {
        userId,
        username,
        budget: this.state.settings.startingBudget,
        squad: [],
        isReady: true,
        isHost: this.state.hostUserId === userId,
      };
    }

    this.state.turnOrder = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private handleUpdateSettings(userId: string, settings?: Partial<AuctionLobbySettings>) {
    if (this.state.hostUserId === userId && this.state.status === "lobby" && settings) {
      this.state.settings = { ...this.state.settings, ...settings };
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }

  private async fetchPoolFromApi(playerCount: number): Promise<AuctionPlayerCard[]> {
    const apiUrl = this.siteUrl || (this.room.env?.NEXT_PUBLIC_SITE_URL as string) || "http://127.0.0.1:5000";
    try {
      const res = await fetch(`${apiUrl}/api/auction/generate-pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerCount,
          ratingMin: this.state.settings.ratingMin,
          ratingMax: this.state.settings.ratingMax,
        }),
      });
      const data = await res.json();
      if (data.pool && Array.isArray(data.pool) && data.pool.length > 0) {
        return data.pool;
      }
    } catch (err) {
      console.error("[AuctionPartyServer] fetchPoolFromApi error:", err);
    }
    return [];
  }

  private async handleStartGame() {
    delete this.state.participants[""];
    const validCount = Object.values(this.state.participants).filter((p) => Boolean(p.userId)).length;
    const pCount = Math.max(2, validCount);

    const pool = await this.fetchPoolFromApi(pCount);
    if (!pool || pool.length === 0) {
      this.broadcast({ type: "AUCTION_ERROR", message: "Oyuncu havuzu oluşturulamadı." });
      return;
    }

    this.state = startAuctionStage(this.state, pool);
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    this.startAuctionTimer();
  }

  private handleBid(sender: Party.Connection, userId: string, amount: number) {
    if (this.state.status !== "auction") return;
    const res = applyBid(this.state, userId, amount);
    if (!res.success) {
      sender.send(JSON.stringify({ type: "AUCTION_ERROR", message: res.error }));
      return;
    }
    this.state = res.state;
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private handlePass(userId: string) {
    if (this.state.status !== "auction") return;
    this.state = applyPass(this.state, userId);

    const activeBidders = Object.values(this.state.participants).filter((p) => p.squad.length < 11);
    const passedCount = this.state.passedUserIds.length;

    if (passedCount >= activeBidders.length - 1 && this.state.currentHighestBid) {
      this.state = advanceAuctionCard(this.state);
    }
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private handleConfirmLineup(userId: string, lineup: TeamLineup) {
    if (!this.state.confirmedLineupUserIds) {
      this.state.confirmedLineupUserIds = [];
    }
    if (!this.state.confirmedLineupUserIds.includes(userId)) {
      this.state.confirmedLineupUserIds.push(userId);
    }
    this.state.lineups[userId] = lineup;

    const activeUids = Object.keys(this.state.participants).filter((uid) => Boolean(uid && uid.trim()));
    const allConfirmed =
      activeUids.length > 0 && activeUids.every((uid) => this.state.confirmedLineupUserIds.includes(uid));

    if (allConfirmed) {
      this.startTournamentSimulation();
    } else {
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }

  private startTournamentSimulation() {
    const uids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    const fixtures = generateLeagueFixtures(uids);
    const { matches } = simulateEntireTournament(
      fixtures,
      this.state.lineups,
      this.state.participants
    );

    this.state.simulationMatches = matches;
    // Sıfır spoiler: Başlangıçta oynanmamış maçlar puan tablosuna eklenmez
    this.state.standings = calculateStandings(uids, this.state.participants, []);
    this.state.championUserId = null;
    this.state.currentSimMatchIndex = 0;
    this.state.currentSimMinute = 0;
    this.state.simReadyUserIds = [];
    this.state.status = "simulation";
    this.state.secondsLeft = 30;

    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    this.startSimTimer();
  }

  private updateStandingsAfterMatch() {
    const uids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    const completedMatches = this.state.simulationMatches.slice(0, this.state.currentSimMatchIndex + 1);
    this.state.standings = calculateStandings(uids, this.state.participants, completedMatches);

    // Eğer son maç bittiyse şampiyonu belirle
    if (this.state.currentSimMatchIndex >= this.state.simulationMatches.length - 1) {
      this.state.championUserId = this.state.standings[0]?.userId || null;
    }
  }

  private handleSimReady(userId: string) {
    if (this.state.status !== "simulation" || this.state.currentSimMinute < 90) return;
    if (!this.state.simReadyUserIds) {
      this.state.simReadyUserIds = [];
    }
    if (!this.state.simReadyUserIds.includes(userId)) {
      this.state.simReadyUserIds.push(userId);
    }

    const activeUids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    if (activeUids.length > 0 && this.state.simReadyUserIds.length >= activeUids.length) {
      this.handleNextSimMatch();
    } else {
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }

  private handleNextSimMatch(userId?: string) {
    if (this.state.status !== "simulation" || this.state.currentSimMinute < 90) return;

    const activeUids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    const isHost = !userId || userId === this.state.hostUserId;
    const isAllReady = (this.state.simReadyUserIds?.length || 0) >= activeUids.length;

    // Sadece oyun kurucusu VEYA herkes hazır olduğunda sonraki maça geçilebilir
    if (!isHost && !isAllReady) return;

    this.state.simReadyUserIds = [];
    const nextIdx = this.state.currentSimMatchIndex + 1;
    if (nextIdx < this.state.simulationMatches.length) {
      this.state.currentSimMatchIndex = nextIdx;
      this.state.currentSimMinute = 0;
      this.state.secondsLeft = 30;
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
      this.startSimTimer();
    } else {
      this.state.status = "finished";
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }

  private startAuctionTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.state.status === "auction") {
        if (this.state.secondsLeft <= 1) {
          this.state = advanceAuctionCard(this.state);
          this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
        } else {
          this.state.secondsLeft--;
          this.broadcast({ type: "AUCTION_TIMER_TICK", secondsLeft: this.state.secondsLeft });
        }
      } else if (this.state.status === "tactics") {
        if (this.state.secondsLeft <= 1) {
          this.autoConfirmLineups();
          this.startTournamentSimulation();
        } else {
          this.state.secondsLeft--;
          this.broadcast({ type: "AUCTION_TIMER_TICK", secondsLeft: this.state.secondsLeft });
        }
      }
    }, 1000);
  }

  private startSimTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.state.status !== "simulation") {
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      if (this.state.currentSimMinute < 90) {
        this.state.currentSimMinute = Math.min(90, this.state.currentSimMinute + 6);
        this.broadcast({
          type: "AUCTION_SIM_TICK",
          currentMinute: this.state.currentSimMinute,
          currentMatchIndex: this.state.currentSimMatchIndex,
        });

        if (this.state.currentSimMinute === 90) {
          if (this.timerInterval) clearInterval(this.timerInterval);
          this.updateStandingsAfterMatch();
          this.broadcast({
            type: "AUCTION_SIM_MATCH_END",
            currentMatchIndex: this.state.currentSimMatchIndex,
          });
          this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
        }
      } else {
        if (this.timerInterval) clearInterval(this.timerInterval);
      }
    }, 1800);
  }

  private autoConfirmLineups() {
    for (const [uid, p] of Object.entries(this.state.participants)) {
      if (!this.state.lineups[uid]?.isConfirmed) {
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
        this.state.lineups[uid] = calculateLineupPowers(uid, defaultFormation, slots);
      }
    }
    const activeUids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    this.state.confirmedLineupUserIds = activeUids;
  }

  private handleReturnToLobby() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }

    const updatedParticipants: Record<string, AuctionParticipant> = {};
    for (const [uid, p] of Object.entries(this.state.participants)) {
      if (uid && uid.trim()) {
        updatedParticipants[uid] = {
          ...p,
          budget: this.state.settings.startingBudget,
          squad: [],
          isReady: true,
        };
      }
    }

    this.state = {
      ...this.state,
      status: "lobby",
      participants: updatedParticipants,
      turnOrder: Object.keys(updatedParticipants),
      pool: [],
      currentCardIndex: 0,
      currentCard: null,
      currentTurnUserId: this.state.hostUserId || Object.keys(updatedParticipants)[0] || "",
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

    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private handleUserDisconnect(userId: string, username: string) {
    if (this.state.status === "lobby") {
      const isHost = this.state.hostUserId === userId;
      if (isHost) {
        this.broadcast({
          type: "AUCTION_ROOM_CLOSED",
          reason: `Lobi sahibi (${username}) ayrıldığı için lobi kapatıldı.`,
        });
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = undefined;
        }
        return;
      }

      delete this.state.participants[userId];
      this.state.turnOrder = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
      this.broadcast({ type: "AUCTION_PLAYER_LEFT", username });
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    } else {
      this.broadcast({ type: "AUCTION_PLAYER_LEFT", username });
    }
  }
}
