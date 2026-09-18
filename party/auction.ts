import { matchMinuteAt, matchStartAtMinute } from "../lib/auction/matchClock";
/**
 * PartyKit Cloud Canlı Müzayede Odası Sunucusu (AuctionPartyServer).
 * - Canlı Çok Oyunculu Açık Artırma (Lobi, Bütçe, Teklifler, Sayaç)
 * - Taktik ve Kadro Kurma
 * - Tur Tabanlı Eş Zamanlı Lig Simülasyonu:
 *   Her turda tüm maçlar aynı anda oynanır; herkes herkesi görebilir.
 *   Tek sayıda oyuncuda bir kişi "bye" (izleyici) olarak tur geçirir.
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
  finishSoldCelebration,
} from "../lib/auction/auctionRoomEngine";
import { calculateLineupPowers } from "../lib/auction/positionSuitability";
import { autoAssignSquadToFormation } from "../lib/auction/autoSquadArranger";
import { buildCanonicalLineup, sanitizeTactics } from "../lib/auction/validateLineup";
import { stateForAuctionViewer } from "../lib/auction/visibleAuctionState";
import {
  generateLeagueSchedule,
  simulateSingleRoundMatches,
  calculateStandings,
  collectCompletedRoundMatches,
} from "../lib/auction/auctionTournament";

export default class AuctionPartyServer implements Party.Server {
  state: AuctionRoomState;
  siteUrl?: string;
  timerInterval?: ReturnType<typeof setInterval>;
  connectionMeta = new Map<string, { userId: string; username: string }>();
  disconnectGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(readonly room: Party.Room) {
    this.state = createInitialAuctionState(this.room.id, "", "");
  }

  async onStart() {
    try {
      const saved = await this.room.storage.get<AuctionRoomState>("auction_room_state");
      if (saved && saved.roomId === this.room.id) {
        this.state = saved;
        // Eğer simülasyon veya zamanlayıcı gerektiren bir aşamadaysa zamanlayıcıyı devam ettir
        if (
          this.state.status === "auction" ||
          this.state.status === "tactics" ||
          this.state.status === "simulation"
        ) {
          this.syncSimulationProgress();
          this.startAuctionTimer();
        }
      }
    } catch (err) {
      console.error("[AuctionPartyServer] onStart storage restore hatası:", err);
    }
  }

  private async persistState() {
    try {
      await this.room.storage.put("auction_room_state", this.state);
    } catch (err) {
      console.error("[AuctionPartyServer] persistState hatası:", err);
    }
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    this.extractSiteUrl(ctx);
    this.syncSimulationProgress();
  }

  onClose(conn: Party.Connection) {
    const meta = this.connectionMeta.get(conn.id);
    this.connectionMeta.delete(conn.id);
    if (!meta?.userId) return;

    const remainingConns = Array.from(this.connectionMeta.values()).filter(
      (m) => m.userId === meta.userId
    );
    if (remainingConns.length === 0) {
      // Katılımcıyı geçici olarak bağlantı koptu işaretle (anlık F5 yenileme koruması)
      if (this.state.participants[meta.userId]) {
        this.state.participants[meta.userId].isDisconnected = true;
        this.state.participants[meta.userId].disconnectedAt = Date.now();
        this.persistState();
        this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
      }

      // Varsa eski grace timer'ı temizle
      const existing = this.disconnectGraceTimers.get(meta.userId);
      if (existing) clearTimeout(existing);

      // 25 saniye grace period (F5 ve anlık kopma koruması)
      const timer = setTimeout(() => {
        this.disconnectGraceTimers.delete(meta.userId);
        this.handleUserDisconnect(meta.userId, meta.username || "Bir oyuncu");
      }, 25000);

      this.disconnectGraceTimers.set(meta.userId, timer);
    }
  }

  async onMessage(rawMessage: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(rawMessage);
      if (msg.siteUrl && typeof msg.siteUrl === "string" && msg.siteUrl.startsWith("http")) {
        this.siteUrl = msg.siteUrl.replace(/\/$/, "");
      }
      const joinedUserId = this.connectionMeta.get(sender.id)?.userId;
      if (msg.type !== "AUCTION_JOIN" && (!joinedUserId || joinedUserId !== msg.userId)) {
        sender.send(JSON.stringify({ type: "AUCTION_ERROR", message: "Geçersiz kullanıcı oturumu." }));
        return;
      }

      switch (msg.type) {
        case "AUCTION_JOIN":
          await this.handleJoin(sender, msg.userId, msg.username || "Oyuncu");
          break;
        case "AUCTION_UPDATE_SETTINGS":
          await this.handleUpdateSettings(msg.userId, msg.settings);
          break;
        case "AUCTION_START":
          if (this.state.hostUserId === msg.userId && this.state.status === "lobby") {
            await this.handleStartGame();
          }
          break;
        case "AUCTION_BID":
          await this.handleBid(
            sender,
            msg.userId,
            Number(msg.amount),
            msg.cardIndex !== undefined ? Number(msg.cardIndex) : undefined,
            msg.cardId
          );
          break;
        case "AUCTION_PASS":
          await this.handlePass(msg.userId);
          break;
        case "AUCTION_CONFIRM_LINEUP":
          if (msg.lineup) await this.handleConfirmLineup(sender, joinedUserId!, msg.lineup);
          break;
        case "AUCTION_UNCONFIRM_LINEUP":
          await this.handleUnconfirmLineup(msg.userId);
          break;
        case "AUCTION_SIM_READY":
          await this.handleSimReady(msg.userId);
          break;
        case "AUCTION_ROUND_COMPLETE":
          await this.handleRoundComplete(msg.userId);
          break;
        case "AUCTION_NEXT_SIM_MATCH":
          await this.handleNextRound(msg.userId);
          break;
        case "AUCTION_RETURN_TO_LOBBY":
          await this.handleReturnToLobby();
          break;
        case "AUCTION_LEAVE":
          const graceTimer = this.disconnectGraceTimers.get(msg.userId);
          if (graceTimer) {
            clearTimeout(graceTimer);
            this.disconnectGraceTimers.delete(msg.userId);
          }
          await this.handleUserDisconnect(msg.userId, msg.username || "Bir oyuncu");
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
    // Include timer-driven sales and round progress in the reconnect snapshot.
    void this.persistState();
    const statePayload = payload as { type?: string; state?: AuctionRoomState; [key: string]: unknown };
    if (statePayload.type !== "AUCTION_STATE_SYNC" || !statePayload.state) {
      this.room.broadcast(JSON.stringify(payload));
      return;
    }
    for (const connection of this.room.getConnections()) {
      const viewerUserId = this.connectionMeta.get(connection.id)?.userId || "";
      connection.send(JSON.stringify({
        ...statePayload,
        state: stateForAuctionViewer(statePayload.state, viewerUserId),
      }));
    }
  }

  private async handleJoin(sender: Party.Connection, userId: string, username: string) {
    if (!userId || !userId.trim()) return;

    // Yeniden bağlanma (reconnect): Varsa bekleyen grace period timer'ını iptal et
    const existingTimer = this.disconnectGraceTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.disconnectGraceTimers.delete(userId);
    }

    this.connectionMeta.set(sender.id, { userId, username });
    delete this.state.participants[""];

    if (!this.state.hostUserId) {
      this.state.hostUserId = userId;
    }

    if (!this.state.participants[userId] && this.state.status !== "lobby") {
      // Oyun başladıktan sonra bağlananlar yalnızca mevcut durumu izler.
      // Katılımcı listesine eklenmedikleri için bütçe, teklif ve kadro akışını etkileyemezler.
      sender.send(JSON.stringify({
        type: "AUCTION_STATE_SYNC",
        state: stateForAuctionViewer(this.state, userId),
        viewerMode: true,
      }));
      return;
    }

    if (!this.state.participants[userId]) {
      this.state.participants[userId] = {
        userId,
        username,
        budget: this.state.settings.startingBudget,
        squad: [],
        isReady: true,
        isHost: this.state.hostUserId === userId,
        isDisconnected: false,
        disconnectedAt: null,
      };
    } else {
      // Oyuncu zaten vardı (F5 veya yeniden bağlanma)
      this.state.participants[userId].isDisconnected = false;
      this.state.participants[userId].disconnectedAt = null;
      if (username) {
        this.state.participants[userId].username = username;
      }
    }

    this.state.turnOrder = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    this.syncSimulationProgress();
    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private async handleUpdateSettings(userId: string, settings?: Partial<AuctionLobbySettings>) {
    if (this.state.hostUserId === userId && this.state.status === "lobby" && settings) {
      this.state.settings = { ...this.state.settings, ...settings };
      await this.persistState();
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
    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    this.startAuctionTimer();
  }

  private async handleBid(
    sender: Party.Connection,
    userId: string,
    amount: number,
    cardIndex?: number,
    cardId?: string
  ) {
    if (this.state.status !== "auction" || !this.state.participants[userId]) return;
    const res = applyBid(this.state, userId, amount, cardIndex, cardId);
    if (!res.success) {
      sender.send(JSON.stringify({ type: "AUCTION_ERROR", message: res.error }));
      return;
    }
    this.state = res.state;
    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private async handlePass(userId: string) {
    if (this.state.status !== "auction" || this.state.isSoldCelebration || !this.state.participants[userId]) return;
    this.state = applyPass(this.state, userId);

    const activeBidders = Object.values(this.state.participants).filter((p) => p.squad.length < 14);
    const passedCount = this.state.passedUserIds.length;

    if (passedCount >= activeBidders.length - 1 && this.state.currentHighestBid) {
      this.state = advanceAuctionCard(this.state);
    }
    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private async handleConfirmLineup(sender: Party.Connection, userId: string, requestedLineup: TeamLineup) {
    if (!this.state.participants[userId]) return;
    if (this.state.status !== "tactics") return;
    const canonical = buildCanonicalLineup(userId, this.state.participants[userId], requestedLineup);
    if (!canonical.lineup) {
      sender.send(JSON.stringify({ type: "AUCTION_ERROR", message: canonical.error || "Kadro doğrulanamadı." }));
      return;
    }
    if (!this.state.confirmedLineupUserIds) {
      this.state.confirmedLineupUserIds = [];
    }
    if (!this.state.confirmedLineupUserIds.includes(userId)) {
      this.state.confirmedLineupUserIds.push(userId);
    }
    this.state.lineups[userId] = canonical.lineup;

    const activeUids = Object.keys(this.state.participants).filter((uid) => Boolean(uid && uid.trim()));
    const allConfirmed =
      activeUids.length > 0 && activeUids.every((uid) => this.state.confirmedLineupUserIds.includes(uid));

    if (allConfirmed) {
      if (!this.state.leagueSchedule || this.state.leagueSchedule.length === 0) {
        await this.startTournamentSimulation();
      } else {
        await this.proceedToSimulationRound();
      }
    } else {
      await this.persistState();
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }

  private async handleUnconfirmLineup(userId: string) {
    if (!this.state.participants[userId]) return;
    if (this.state.status !== "tactics") return;
    this.state.confirmedLineupUserIds = (this.state.confirmedLineupUserIds || []).filter((id) => id !== userId);
    if (this.state.lineups[userId]) {
      this.state.lineups[userId].isConfirmed = false;
    }
    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  // ---------------------------------------------------------------------------
  // Tur Tabanlı Simülasyon — Ana Başlatıcı
  // ---------------------------------------------------------------------------

  private async proceedToSimulationRound() {
    const uids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    if (!this.state.leagueSchedule || this.state.leagueSchedule.length === 0) {
      this.state.leagueSchedule = generateLeagueSchedule(uids);
      this.state.byeUserIds = this.state.leagueSchedule.map((round) => round.byeUserId);
    }

    const roundIdx = this.state.currentRoundIndex ?? 0;
    const currentScheduleItem = this.state.leagueSchedule[roundIdx];

    if (currentScheduleItem) {
      const simulatedRound = simulateSingleRoundMatches(
        currentScheduleItem,
        this.state.lineups,
        this.state.participants,
        `${this.room.id}:round:${currentScheduleItem.roundNumber}:${Date.now()}`
      );
      if (!this.state.simulationRounds) {
        this.state.simulationRounds = [];
      }
      this.state.simulationRounds[roundIdx] = simulatedRound;
      this.state.simulationMatches = this.state.simulationRounds.flatMap((r) => r.matches);
    }

    this.state.status = "simulation";
    this.state.simulationStartedAt = Date.now();
    this.state.currentRoundMinute = 0;
    this.state.currentSimMinute = 0;
    this.state.confirmedLineupUserIds = [];
    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private async startTournamentSimulation() {
    const uids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    const schedule = generateLeagueSchedule(uids);

    this.state.leagueSchedule = schedule;
    this.state.byeUserIds = schedule.map((r) => r.byeUserId);
    this.state.currentRoundIndex = 0;
    this.state.currentRoundMinute = 0;
    this.state.currentSimMinute = 0;

    // Sıfır spoiler: başlangıçta oynanmamış maçlar puan tablosuna eklenmez
    this.state.standings = calculateStandings(uids, this.state.participants, []);
    this.state.championUserId = null;
    this.state.simReadyUserIds = [];
    this.state.secondsLeft = 30;

    await this.proceedToSimulationRound();
  }

  private async handleRoundComplete(userId: string) {
    if (!this.state.participants[userId] || this.state.status !== "simulation") return;
    this.syncSimulationProgress();
    if (this.state.currentRoundMinute < 90) return;

    this.state.currentRoundMinute = 90;
    this.state.currentSimMinute = 90;
    this.updateStandingsAfterRound();
    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  // ---------------------------------------------------------------------------
  // Tur Bitti — Puan Tablosu Güncelleme
  // ---------------------------------------------------------------------------

  private updateStandingsAfterRound() {
    const uids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    const completedMatches = collectCompletedRoundMatches(
      this.state.simulationRounds,
      this.state.currentRoundIndex + 1
    );
    this.state.standings = calculateStandings(uids, this.state.participants, completedMatches);

    const totalRounds = this.state.leagueSchedule?.length || this.state.simulationRounds.length;
    if (this.state.currentRoundIndex >= totalRounds - 1) {
      this.state.championUserId = this.state.standings[0]?.userId || null;
    }
  }

  // ---------------------------------------------------------------------------
  // Tur Geçiş Mantığı
  // ---------------------------------------------------------------------------

  private async handleSimReady(userId: string) {
    if (!this.state.participants[userId] || this.state.status !== "simulation" || this.state.currentRoundMinute < 90) return;
    if (!this.state.simReadyUserIds) {
      this.state.simReadyUserIds = [];
    }
    if (!this.state.simReadyUserIds.includes(userId)) {
      this.state.simReadyUserIds.push(userId);
    }

    const activeUids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    if (activeUids.length > 0 && this.state.simReadyUserIds.length >= activeUids.length) {
      await this.advanceToNextRound();
    } else {
      await this.persistState();
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }

  private async handleNextRound(userId?: string) {
    if (userId && !this.state.participants[userId]) return;
    if (this.state.status !== "simulation" || this.state.currentRoundMinute < 90) return;

    const activeUids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    const isHost = !userId || userId === this.state.hostUserId;
    const isAllReady = (this.state.simReadyUserIds?.length || 0) >= activeUids.length;

    // Sadece oyun kurucusu VEYA herkes hazır olduğunda sonraki tura geçilebilir
    if (!isHost && !isAllReady) return;

    await this.advanceToNextRound();
  }

  private async advanceToNextRound() {
    this.state.simReadyUserIds = [];
    const totalRounds = this.state.leagueSchedule?.length || this.state.simulationRounds.length;
    const nextRoundIdx = this.state.currentRoundIndex + 1;

    if (nextRoundIdx < totalRounds) {
      this.state.currentRoundIndex = nextRoundIdx;
      this.state.simulationStartedAt = undefined;
      this.state.currentRoundMinute = 0;
      this.state.currentSimMinute = 0; // geriye dönük uyum
      this.state.status = "tactics";
      this.state.secondsLeft = 120; // 2 dakikalık analiz ve taktik süresi
      this.state.confirmedLineupUserIds = [];

      // Önceki kadroları koru ancak yeni tur için onaysız yap
      for (const uid of Object.keys(this.state.lineups)) {
        if (this.state.lineups[uid]) {
          this.state.lineups[uid].isConfirmed = false;
        }
      }

      await this.persistState();
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    } else {
      // Tüm turlar tamamlandı
      this.state.status = "finished";
      await this.persistState();
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }

  // ---------------------------------------------------------------------------
  // Teklif (Auction) Timer
  // ---------------------------------------------------------------------------

  private startAuctionTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.state.status === "auction") {
        if (this.state.isSoldCelebration) {
          if (
            this.state.secondsLeft <= 1 ||
            (this.state.soldCelebrationUntil && Date.now() >= this.state.soldCelebrationUntil)
          ) {
            this.state = finishSoldCelebration(this.state);
            this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
          } else {
            this.state.secondsLeft--;
            this.broadcast({ type: "AUCTION_TIMER_TICK", secondsLeft: this.state.secondsLeft });
          }
        } else {
          if (this.state.secondsLeft <= 1) {
            this.state = advanceAuctionCard(this.state);
            this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
          } else {
            this.state.secondsLeft--;
            this.broadcast({ type: "AUCTION_TIMER_TICK", secondsLeft: this.state.secondsLeft });
          }
        }
      } else if (this.state.status === "tactics") {
        if (this.state.secondsLeft <= 1) {
          this.autoConfirmLineups();
          if (!this.state.leagueSchedule || this.state.leagueSchedule.length === 0) {
            this.startTournamentSimulation();
          } else {
            this.proceedToSimulationRound();
          }
        } else {
          this.state.secondsLeft--;
          this.broadcast({ type: "AUCTION_TIMER_TICK", secondsLeft: this.state.secondsLeft });
        }
      } else if (this.state.status === "simulation") {
        if (!this.state.simulationStartedAt) {
          this.state.simulationStartedAt = matchStartAtMinute(this.state.currentRoundMinute || 0, Date.now());
        }
        const startedAt = this.state.simulationStartedAt;
        const calculatedMinute = matchMinuteAt(startedAt, Date.now());

        const prevMinute = this.state.currentRoundMinute || 0;
        this.state.currentRoundMinute = Math.max(prevMinute, calculatedMinute);
        this.state.currentSimMinute = this.state.currentRoundMinute;

        if (this.state.currentRoundMinute >= 90) {
          if (prevMinute < 90) {
            this.updateStandingsAfterRound();
            this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
          }
        } else {
          this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
        }
      }
    }, 1000);
  }

  private syncSimulationProgress() {
    if (this.state.status === "simulation") {
      if (!this.state.simulationStartedAt) {
        this.state.simulationStartedAt = matchStartAtMinute(this.state.currentRoundMinute || 0, Date.now());
      }
      const minute = matchMinuteAt(this.state.simulationStartedAt, Date.now());
      this.state.currentRoundMinute = Math.max(this.state.currentRoundMinute || 0, minute);
      this.state.currentSimMinute = this.state.currentRoundMinute;
      if (this.state.currentRoundMinute >= 90 && (!this.state.standings || this.state.standings.length === 0)) {
        this.updateStandingsAfterRound();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Yardımcılar
  // ---------------------------------------------------------------------------

  private autoConfirmLineups() {
    for (const [uid, p] of Object.entries(this.state.participants)) {
      if (!this.state.lineups[uid]?.isConfirmed) {
        const defaultFormation: FormationName = "4-3-3";
        const existingSlots = this.state.lineups[uid]?.slots;
        const formation = this.state.lineups[uid]?.formation || defaultFormation;
        // Akıllı dizilim: GK'yi mutlaka kaleye, defansı defansa koyar, sahada elle konmuş oyuncuları korur
        const slots = autoAssignSquadToFormation(p.squad, formation, existingSlots);
        const lineup = calculateLineupPowers(uid, formation, slots);
        lineup.tactics = sanitizeTactics(this.state.lineups[uid]?.tactics);
        lineup.isConfirmed = true;
        this.state.lineups[uid] = lineup;
      }
    }
    const activeUids = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
    this.state.confirmedLineupUserIds = activeUids;
  }

  private async handleReturnToLobby() {
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
      simulationStartedAt: undefined,
      lineups: {},
      simulationMatches: [],
      currentSimMatchIndex: 0,
      currentSimMinute: 0,
      simulationRounds: [],
      currentRoundIndex: 0,
      currentRoundMinute: 0,
      byeUserIds: [],
      standings: [],
      championUserId: null,
    };

    await this.persistState();
    this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
  }

  private async handleUserDisconnect(userId: string, username: string) {
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
        try {
          await this.room.storage.delete("auction_room_state");
        } catch {
          // ignore
        }
        return;
      }

      delete this.state.participants[userId];
      this.state.turnOrder = Object.keys(this.state.participants).filter((id) => Boolean(id && id.trim()));
      await this.persistState();
      this.broadcast({ type: "AUCTION_PLAYER_LEFT", username });
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    } else {
      if (this.state.participants[userId]) {
        this.state.participants[userId].isDisconnected = true;
        this.state.participants[userId].disconnectedAt = Date.now();
        await this.persistState();
      }
      this.broadcast({ type: "AUCTION_PLAYER_LEFT", username });
      this.broadcast({ type: "AUCTION_STATE_SYNC", state: this.state });
    }
  }
}
