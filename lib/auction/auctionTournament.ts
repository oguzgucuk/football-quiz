/**
 * Müzayede Ligi Fikstür ve Puan Tablosu Motoru.
 * Herkesin birbiriyle 1 maç yaptığı lig fikstürünü üretir ve puan tablosunu hesaplar.
 */

import { StandingRow, MatchSimulationResult, TeamLineup, AuctionParticipant } from "./auctionTypes";
import { simulateMatch } from "./simulateMatch";

export interface FixturePair {
  matchId: string;
  homeUserId: string;
  awayUserId: string;
}

export function generateLeagueFixtures(userIds: string[]): FixturePair[] {
  const fixtures: FixturePair[] = [];
  let matchIndex = 1;

  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      fixtures.push({
        matchId: `match_${matchIndex++}`,
        homeUserId: userIds[i],
        awayUserId: userIds[j],
      });
    }
  }

  return fixtures;
}

export function simulateEntireTournament(
  fixtures: FixturePair[],
  lineups: Record<string, TeamLineup>,
  participants: Record<string, AuctionParticipant>
): { matches: MatchSimulationResult[]; standings: StandingRow[]; championUserId: string | null } {
  const matches: MatchSimulationResult[] = [];

  for (const f of fixtures) {
    const homeLineup = lineups[f.homeUserId];
    const awayLineup = lineups[f.awayUserId];
    const homeName = participants[f.homeUserId]?.username || "Ev Sahibi";
    const awayName = participants[f.awayUserId]?.username || "Deplasman";

    if (homeLineup && awayLineup) {
      const result = simulateMatch(f.matchId, homeLineup, homeName, awayLineup, awayName);
      matches.push(result);
    }
  }

  const standings = calculateStandings(Object.keys(participants), participants, matches);
  const championUserId = standings.length > 0 ? standings[0].userId : null;

  return { matches, standings, championUserId };
}

export function calculateStandings(
  userIds: string[],
  participants: Record<string, AuctionParticipant>,
  matches: MatchSimulationResult[]
): StandingRow[] {
  const rows: Record<string, StandingRow> = {};

  for (const id of userIds) {
    rows[id] = {
      userId: id,
      username: participants[id]?.username || "Oyuncu",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };
  }

  for (const m of matches) {
    if (!m.isFinished) continue;
    const h = rows[m.homeUserId];
    const a = rows[m.awayUserId];
    if (!h || !a) continue;

    h.played++;
    a.played++;
    h.goalsFor += m.homeScore;
    h.goalsAgainst += m.awayScore;
    a.goalsFor += m.awayScore;
    a.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      h.won++;
      h.points += 3;
      a.lost++;
    } else if (m.awayScore > m.homeScore) {
      a.won++;
      a.points += 3;
      h.lost++;
    } else {
      h.drawn++;
      h.points += 1;
      a.drawn++;
      a.points += 1;
    }
  }

  return Object.values(rows)
    .map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });
}
