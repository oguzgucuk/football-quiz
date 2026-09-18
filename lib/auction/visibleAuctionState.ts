import { AuctionRoomState } from "./auctionTypes";

/** Removes hidden tactics and future simulation events before state leaves the server. */
export function stateForAuctionViewer(state: AuctionRoomState, viewerUserId: string): AuctionRoomState {
  const visible = structuredClone(state);

  if (visible.status === "tactics") {
    for (const [userId, lineup] of Object.entries(visible.lineups)) {
      if (userId !== viewerUserId && lineup) lineup.tactics = undefined;
    }
  }

  if (visible.status === "simulation") {
    const minute = visible.currentRoundMinute || 0;
    visible.simulationRounds = visible.simulationRounds.map((round, roundIndex) => {
      if (roundIndex !== visible.currentRoundIndex) return round;
      return {
        ...round,
        matches: round.matches.map((match) => {
          const events = match.events.filter((event) => event.minute <= minute);
          const homeScore = events.filter((event) => event.type === "goal" && event.teamUserId === match.homeUserId).length;
          const awayScore = events.filter((event) => event.type === "goal" && event.teamUserId === match.awayUserId).length;
          return {
            ...match,
            events,
            homeScore,
            awayScore,
            winnerUserId: minute >= 90
              ? homeScore === awayScore ? null : homeScore > awayScore ? match.homeUserId : match.awayUserId
              : null,
            isFinished: minute >= 90,
            playerStats: minute >= 90 ? match.playerStats : {},
            simulationSeed: minute >= 90 ? match.simulationSeed : undefined,
          };
        }),
      };
    });
    visible.simulationMatches = visible.simulationRounds.flatMap((round) => round.matches);
  }

  return visible;
}
