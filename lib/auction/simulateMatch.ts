import { MatchSimulationResult, TeamLineup } from "./auctionTypes";
import { simulateStatefulMatch } from "./statefulMatchEngine";

export function simulateMatch(
  matchId: string,
  homeLineup: TeamLineup,
  homeUsername: string,
  awayLineup: TeamLineup,
  awayUsername: string,
  seed?: string
): MatchSimulationResult {
  const simulated = simulateStatefulMatch(matchId, homeLineup, homeUsername, awayLineup, awayUsername, seed);

  return {
    matchId, homeUserId: homeLineup.userId, homeUsername, awayUserId: awayLineup.userId, awayUsername,
    homeScore: simulated.homeScore,
    awayScore: simulated.awayScore,
    events: simulated.events,
    winnerUserId: simulated.homeScore === simulated.awayScore
      ? null
      : simulated.homeScore > simulated.awayScore ? homeLineup.userId : awayLineup.userId,
    isFinished: true,
    playerStats: simulated.playerStats,
    simulationSeed: simulated.simulationSeed,
  };
}
