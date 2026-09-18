/**
 * Müzayede (Auction Draft) Modu TypeScript Tipleri.
 * Lobi, teklif havuzu, saha dizilişi ve maç simülasyonu veri modelleri.
 */

export type AuctionStatus = "lobby" | "auction" | "tactics" | "simulation" | "finished";

export type PitchPosition =
  | "GK"
  | "LB"
  | "CB"
  | "RB"
  | "LWB"
  | "RWB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "ST"
  | "CF";

export type FormationName =
  | "3-5-2" | "3-4-2-1" | "3-4-3"
  | "4-4-2(1)" | "4-4-2(2)" | "4-5-1" | "4-3-3" | "4-2-4"
  | "5-3-2" | "5-2-3" | "5-4-1(1)" | "5-4-1(2)";

export interface AuctionPlayerCard {
  id: string;
  fullName: string;
  overallPrime: number;
  positions: string[];
  primaryPosition?: string | null;
  nationality?: string | null;
  currentClub?: string | null;
  logoUrl?: string | null;
}

export interface AuctionParticipant {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  budget: number;
  squad: AuctionPlayerCard[];
  isReady: boolean;
  isHost: boolean;
  hasPassed?: boolean;
  isDisconnected?: boolean;
  disconnectedAt?: number | null;
}

export interface AuctionLobbySettings {
  playerCount: number; // 2 - 8
  startingBudget: number; // örn. 20 - 100 ($)
  ratingMin: number; // örn. 67 - 90
  ratingMax: number; // örn. 85 - 99
}

export interface AuctionBid {
  bidderUserId: string;
  bidderUsername: string;
  amount: number;
  timestamp: number;
  cardIndex?: number;
  cardId?: string;
}

export interface AuctionSoldEvent {
  playerName: string;
  buyerUserId: string;
  buyerUsername: string;
  amount: number;
  overall: number;
  timestamp: number;
}

export interface SquadSlot {
  slotId: string;
  targetPosition: PitchPosition;
  placedPlayer: AuctionPlayerCard | null;
  effectiveRating: number;
  penalty: number;
}

export type PitchCorridor = "left" | "center" | "right";

export interface TeamTactics {
  tempo: "slow" | "balanced" | "fast";
  buildUp: "short_pass" | "balanced" | "long_ball" | "shoot_on_sight";
  pressing: "park_bus" | "balanced" | "high_press";
  attackDirection: "left" | "center" | "right" | "balanced" | "wings";
}

export interface TeamLineup {
  userId: string;
  formation: FormationName;
  slots: SquadSlot[];
  teamOvr: number;
  tactics?: TeamTactics;
  isConfirmed: boolean;
}

import { ZoneId } from "./zoneTypes";
export type { ZoneId, PitchThird, BallPhase, BallState, SubstitutionAction, HalftimeTacticsAction } from "./zoneTypes";

export interface MatchEvent {
  minute: number;
  type: "goal" | "save" | "chance" | "attack_start" | "corner" | "turnover" | "sub" | "halftime";
  teamUserId: string;
  playerName?: string;
  assistPlayerName?: string;
  description: string;
  zone?: ZoneId;
}

export interface PossessionResult {
  attackingTeamUserId: string;
  isGoal: boolean;
  gkSaved: boolean;
  defenseBlocked: boolean;
  isLongRangeShot?: boolean;
  goalScorerName?: string;
  assistPlayerName?: string;
  gkName?: string;
  defenderName?: string;
  event: MatchEvent;
}

export interface PlayerMatchStat {
  playerName: string;
  teamUserId: string;
  goals: number;
  assists: number;
  saves: number;
}

export interface MatchSimulationResult {
  matchId: string;
  homeUserId: string;
  homeUsername: string;
  awayUserId: string;
  awayUsername: string;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  winnerUserId: string | null;
  isFinished: boolean;
  playerStats: Record<string, PlayerMatchStat>;
  homeLineup?: TeamLineup;
  awayLineup?: TeamLineup;
}

export interface RoundScheduleItem {
  roundNumber: number;
  pairings: Array<{ homeUserId: string; awayUserId: string }>;
  byeUserId: string | null;
}

/**
 * Bir ligde tur: Aynı anda oynanan maçlar + bye oyuncusu (tek sayıda oyuncu olunca).
 * Tüm maçlar aynı dakika tickiyle ilerler.
 */
export interface SimulationRound {
  roundNumber: number;
  matches: MatchSimulationResult[];
  /** Tek sayıda oyuncu varsa bu turda oynamayan oyuncu. Null = herkes oynuyor. */
  byeUserId: string | null;
}

export interface StandingRow {
  userId: string;
  username: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface AuctionRoomState {
  roomId: string;
  status: AuctionStatus;
  settings: AuctionLobbySettings;
  participants: Record<string, AuctionParticipant>;
  turnOrder: string[];
  hostUserId: string;
  pool: AuctionPlayerCard[];
  currentCardIndex: number;
  currentCard: AuctionPlayerCard | null;
  currentTurnUserId: string; // Zorunlu 1$ açılış yapacak kişi
  currentHighestBid: AuctionBid | null;
  passedUserIds: string[];
  secondsLeft: number;
  lineups: Record<string, TeamLineup>;
  confirmedLineupUserIds: string[];

  // --- Eski sıralı simülasyon alanları (geriye dönük uyum) ---
  simulationMatches: MatchSimulationResult[];
  currentSimMatchIndex: number;
  currentSimMinute: number;

  // --- Yeni tur tabanlı eş zamanlı simülasyon alanları ---
  /** Tüm tur verisi: her tur içinde paralel maçlar ve bye oyuncusu. */
  simulationRounds: SimulationRound[];
  /** Lig fikstür eşleşmeleri tablosu (hangi tur kim kiminle oynuyor) */
  leagueSchedule?: RoundScheduleItem[];
  /** Şu an yayınlanan turun indexi (0-tabanlı). */
  currentRoundIndex: number;
  /** Şu an gösterilen dakika — tüm maçlar bu dakikada eş zamanlı ilerler. */
  currentRoundMinute: number;
  /** Tur simülasyonunun başladığı sunucu epoch zamanı (ms) */
  simulationStartedAt?: number;
  /** Her turun bye oyuncusu: byeUserIds[turIndex] → userId | null */
  byeUserIds: (string | null)[];

  simReadyUserIds: string[];
  standings: StandingRow[];
  championUserId: string | null;
  lastSoldEvent?: AuctionSoldEvent | null;
  salesHistory?: AuctionSoldEvent[];
  /** Yeni karta geçildiğinde son saniye tekliflerinin taşmasını önleyen geçiş tamponu (ms) */
  bidCooldownUntil?: number;
  /** Oyuncu satıldığında vitrinde 2 saniyelik kutlama/bilgilendirme gösteriliyor mu */
  isSoldCelebration?: boolean;
  /** Satış kutlamasının biteceği zaman damgası (ms) */
  soldCelebrationUntil?: number;
  /** Maç 45. dakikada devre arası molasında mı (10s) */
  isHalftime?: boolean;
  /** Devre arasının biteceği epoch zamanı (ms) */
  halftimeEndsAt?: number;
  /** Devre arasında kalan saniye (0-10) */
  halftimeSecondsLeft?: number;
}

