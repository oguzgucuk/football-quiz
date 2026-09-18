/**
 * 9 Bölgeli Maç Simülasyonu Giriş Noktası (Facade).
 * Durum makinesini (matchStateMachine) kullanarak 90 dakikalık maçı
 * veya devre arası molalı iki yarıyı simüle eder.
 */

import { MatchEvent, MatchSimulationResult, PlayerMatchStat, TeamLineup } from "./auctionTypes";
import { generateHalftimeCommentary } from "./matchCommentary";
import { createInitialBallState, resolveNextState } from "./matchStateMachine";
import { calculateMatchTempo } from "./zoneGrid";
import { BallState } from "./zoneTypes";

function spreadMinutes(startMin: number, endMin: number, count: number): number[] {
  if (count <= 1) return [Math.round((startMin + endMin) / 2)];
  return Array.from({ length: count }, (_, i) =>
    Math.round(startMin + (i / (count - 1)) * (endMin - startMin))
  );
}

function updateStat(
  stats: Record<string, PlayerMatchStat>,
  playerName: string,
  teamUserId: string,
  field: "goals" | "assists" | "saves"
) {
  const key = `${teamUserId}:${playerName}`;
  const stat = (stats[key] ||= { playerName, teamUserId, goals: 0, assists: 0, saves: 0 });
  stat[field]++;
}

export interface HalfSimulationResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  playerStats: Record<string, PlayerMatchStat>;
  finalBallState: BallState;
}

/**
 * Maçın belirli bir yarısını (1. Yarı: 1-45 veya 2. Yarı: 46-90) simüle eder.
 * Devre arası oyuncu ve taktik değişikliklerini destekler.
 */
export function simulateMatchHalf(
  startMin: number,
  endMin: number,
  homeLineup: TeamLineup,
  homeUsername: string,
  awayLineup: TeamLineup,
  awayUsername: string,
  initialBallState?: BallState,
  initialStats?: Record<string, PlayerMatchStat>,
  initialHomeScore: number = 0,
  initialAwayScore: number = 0
): HalfSimulationResult {
  let homeScore = initialHomeScore;
  let awayScore = initialAwayScore;
  const events: MatchEvent[] = [];
  const playerStats: Record<string, PlayerMatchStat> = initialStats ? { ...initialStats } : {};

  let ballState: BallState = initialBallState || createInitialBallState(homeLineup.userId, awayLineup.userId);

  const totalTempo = calculateMatchTempo(homeLineup, awayLineup);
  const halfSteps = Math.max(8, Math.round(totalTempo / 2));
  const minutes = spreadMinutes(startMin, endMin, halfSteps);

  for (const minute of minutes) {
    const res = resolveNextState(ballState, minute, homeLineup, homeUsername, awayLineup, awayUsername);
    ballState = res.nextState;

    if (res.event) {
      events.push(res.event);
    }

    if (res.isGoal) {
      if (res.event?.teamUserId === homeLineup.userId) homeScore++;
      else awayScore++;
      if (res.goalScorerName && res.event) updateStat(playerStats, res.goalScorerName, res.event.teamUserId, "goals");
      if (res.assistPlayerName && res.event) updateStat(playerStats, res.assistPlayerName, res.event.teamUserId, "assists");
    } else if (res.isSave && res.gkName) {
      const gkTeamId = res.event?.teamUserId === homeLineup.userId ? awayLineup.userId : homeLineup.userId;
      updateStat(playerStats, res.gkName, gkTeamId, "saves");
    }
  }

  return { homeScore, awayScore, events, playerStats, finalBallState: ballState };
}

/**
 * 90 dakikalık tam maç simülasyonu.
 */
export function simulateMatch(
  matchId: string,
  homeLineup: TeamLineup,
  homeUsername: string,
  awayLineup: TeamLineup,
  awayUsername: string
): MatchSimulationResult {
  // 1. Yarı (1 - 45 dk)
  const firstHalf = simulateMatchHalf(1, 44, homeLineup, homeUsername, awayLineup, awayUsername);

  // Devre Arası Olayı
  const halftimeEvent: MatchEvent = {
    minute: 45,
    type: "halftime",
    teamUserId: homeLineup.userId,
    description: generateHalftimeCommentary(),
  };

  // 2. Yarı (46 - 90 dk)
  const secondHalf = simulateMatchHalf(
    46, 90,
    homeLineup, homeUsername, awayLineup, awayUsername,
    firstHalf.finalBallState,
    firstHalf.playerStats,
    firstHalf.homeScore,
    firstHalf.awayScore
  );

  const allEvents = [...firstHalf.events, halftimeEvent, ...secondHalf.events];
  const homeScore = secondHalf.homeScore;
  const awayScore = secondHalf.awayScore;

  return {
    matchId,
    homeUserId: homeLineup.userId,
    homeUsername,
    awayUserId: awayLineup.userId,
    awayUsername,
    homeScore,
    awayScore,
    events: allEvents,
    winnerUserId: homeScore === awayScore ? null : homeScore > awayScore ? homeLineup.userId : awayLineup.userId,
    isFinished: true,
    playerStats: secondHalf.playerStats,
  };
}
