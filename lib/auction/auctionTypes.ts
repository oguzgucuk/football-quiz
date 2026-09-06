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

export type FormationName = "4-3-3" | "4-2-3-1" | "5-4-1" | "3-5-2" | "4-4-2";

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
}

export interface AuctionLobbySettings {
  playerCount: number; // 2 - 6
  startingBudget: number; // örn. 20 - 100 ($)
  ratingMin: number; // örn. 67 - 90
  ratingMax: number; // örn. 85 - 99
}

export interface AuctionBid {
  bidderUserId: string;
  bidderUsername: string;
  amount: number;
  timestamp: number;
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

export interface TeamLineup {
  userId: string;
  formation: FormationName;
  slots: SquadSlot[];
  teamOvr: number;
  rawDefPower: number;
  rawMidPower: number;
  rawFwdPower: number;
  effectiveAtkPower: number;
  effectiveDefPower: number;
  isConfirmed: boolean;
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "save" | "chance" | "attack_start";
  teamUserId: string;
  playerName?: string;
  description: string;
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
  simulationMatches: MatchSimulationResult[];
  currentSimMatchIndex: number;
  currentSimMinute: number;
  standings: StandingRow[];
  championUserId: string | null;
  lastSoldEvent?: AuctionSoldEvent | null;
}
