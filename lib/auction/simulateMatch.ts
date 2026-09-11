import { MatchSimulationResult, PlayerMatchStat, TeamLineup } from "./auctionTypes";
import { calculateMatchTempo } from "./corridorEngine";
import { resolvePossession } from "./possessionResolver";

function spreadMinutes(count: number): number[] {
  return Array.from({ length: count }, (_, index) => Math.round(1 + (index / Math.max(1, count - 1)) * 89));
}

function updateStat(stats: Record<string, PlayerMatchStat>, playerName: string, teamUserId: string, field: "goals" | "assists" | "saves") {
  const key = `${teamUserId}:${playerName}`;
  const stat = stats[key] ||= { playerName, teamUserId, goals: 0, assists: 0, saves: 0 };
  stat[field]++;
}

export function simulateMatch(
  matchId: string,
  homeLineup: TeamLineup,
  homeUsername: string,
  awayLineup: TeamLineup,
  awayUsername: string
): MatchSimulationResult {
  let homeScore = 0;
  let awayScore = 0;
  const events = [];
  const playerStats: Record<string, PlayerMatchStat> = {};

  for (const minute of spreadMinutes(calculateMatchTempo(homeLineup, awayLineup))) {
    const possession = resolvePossession(minute, homeLineup, homeUsername, awayLineup, awayUsername);
    events.push(possession.event);
    if (possession.isGoal) {
      if (possession.attackingTeamUserId === homeLineup.userId) homeScore++;
      else awayScore++;
      if (possession.goalScorerName) updateStat(playerStats, possession.goalScorerName, possession.attackingTeamUserId, "goals");
      if (possession.assistPlayerName) updateStat(playerStats, possession.assistPlayerName, possession.attackingTeamUserId, "assists");
    } else if (possession.gkSaved && possession.gkName) {
      const goalkeeperTeam = possession.attackingTeamUserId === homeLineup.userId ? awayLineup.userId : homeLineup.userId;
      updateStat(playerStats, possession.gkName, goalkeeperTeam, "saves");
    }
  }

  return {
    matchId, homeUserId: homeLineup.userId, homeUsername, awayUserId: awayLineup.userId, awayUsername,
    homeScore, awayScore, events,
    winnerUserId: homeScore === awayScore ? null : homeScore > awayScore ? homeLineup.userId : awayLineup.userId,
    isFinished: true, playerStats,
  };
}
