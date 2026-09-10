import { MatchSimulationResult, PlayerMatchStat, TeamLineup } from "./auctionTypes";
import { ATK_WEIGHTS, DEF_WEIGHTS, sumScore } from "./matchWeights";
import { resolvePossession } from "./possessionResolver";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function attackingPosture(lineup: TeamLineup): number {
  const attack = sumScore(lineup.slots, ATK_WEIGHTS);
  const defense = sumScore(lineup.slots, DEF_WEIGHTS);
  return (attack - defense) / Math.max(0.001, attack + defense);
}

function calculatePossessionCount(home: TeamLineup, away: TeamLineup): number {
  const matchPosture = (attackingPosture(home) + attackingPosture(away)) / 2;
  return Math.round(clamp(16 + matchPosture * 14, 10, 24));
}

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

  for (const minute of spreadMinutes(calculatePossessionCount(homeLineup, awayLineup))) {
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
