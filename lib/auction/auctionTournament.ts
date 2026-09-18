/**
 * Müzayede Ligi Fikstür ve Puan Tablosu Motoru.
 *
 * İki mod desteklenir:
 * 1. Tur tabanlı eş zamanlı (generateRoundRobinSchedule): Her turda tüm maçlar
 *    aynı anda oynanır. Circle/berger algoritması kullanılır. Tek sayıda oyuncuda
 *    her tur bir kişi bye (izleyici) olur.
 *
 * 2. Eski sıralı mod (generateLeagueFixtures): Geriye dönük uyum için tutuldu.
 */

import { StandingRow, MatchSimulationResult, TeamLineup, AuctionParticipant, SimulationRound, RoundScheduleItem } from "./auctionTypes";
import { simulateMatch } from "./simulateMatch";

export interface FixturePair {
  matchId: string;
  homeUserId: string;
  awayUserId: string;
}

// ---------------------------------------------------------------------------
// Yeni: Circle/Berger Round-Robin Algoritması
// ---------------------------------------------------------------------------

export type { RoundScheduleItem };

/**
 * Berger circle algoritmasıyla tüm ligin eşleşmelerini üretir (taktiklerden bağımsız, saf eşleşme).
 */
export function generateLeagueSchedule(userIds: string[]): RoundScheduleItem[] {
  const validIds = userIds.filter((id) => Boolean(id && id.trim()));
  const hasBye = validIds.length % 2 !== 0;
  const BYE_ID = "__BYE__";
  const ids = hasBye ? [...validIds, BYE_ID] : [...validIds];
  const n = ids.length;
  if (n < 2) return [];

  const totalRounds = n - 1;
  const circle = ids.slice(1);
  const schedule: RoundScheduleItem[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const fixed = ids[0];
    const rotatedCorrect: string[] = [];
    for (let i = 0; i < circle.length; i++) {
      rotatedCorrect.push(circle[(r + i) % circle.length]);
    }

    const half = n / 2;
    const pairings: Array<{ homeUserId: string; awayUserId: string }> = [];
    let byeUserId: string | null = null;

    const pairs: Array<[string, string]> = [[fixed, rotatedCorrect[half - 1]]];
    for (let i = 0; i < half - 1; i++) {
      pairs.push([rotatedCorrect[i], rotatedCorrect[n - 2 - i]]);
    }

    for (const [home, away] of pairs) {
      if (home === BYE_ID || away === BYE_ID) {
        byeUserId = home === BYE_ID ? away : home;
        continue;
      }
      pairings.push({ homeUserId: home, awayUserId: away });
    }

    schedule.push({ roundNumber: r + 1, pairings, byeUserId });
  }

  return schedule;
}

/**
 * Belirtilen turun maçlarını o anki güncel kadrolar ve taktiklerle canlı olarak simüle eder.
 */
export function simulateSingleRoundMatches(
  scheduleItem: RoundScheduleItem,
  lineups: Record<string, TeamLineup>,
  participants: Record<string, AuctionParticipant>,
  seedPrefix = `round-${scheduleItem.roundNumber}`
): SimulationRound {
  const roundMatches: MatchSimulationResult[] = [];
  let matchCounter = 1;

  for (const { homeUserId: home, awayUserId: away } of scheduleItem.pairings) {
    const homeLineup = lineups[home];
    const awayLineup = lineups[away];
    const homeName = participants[home]?.username || "Ev Sahibi";
    const awayName = participants[away]?.username || "Deplasman";

    if (homeLineup && awayLineup) {
      const result = simulateMatch(
        `match_r${scheduleItem.roundNumber}_${matchCounter++}`,
        homeLineup,
        homeName,
        awayLineup,
        awayName,
        `${seedPrefix}:${home}:${away}`
      );
      result.homeLineup = structuredClone(homeLineup);
      result.awayLineup = structuredClone(awayLineup);
      roundMatches.push(result);
    }
  }

  return {
    roundNumber: scheduleItem.roundNumber,
    matches: roundMatches,
    byeUserId: scheduleItem.byeUserId,
  };
}

/**
 * Belirtilen turda bir oyuncunun rakibini bulur. Bye ise null döner.
 */
export function getOpponentForUserInRound(
  schedule: RoundScheduleItem[],
  roundIndex: number,
  userId: string
): string | null {
  const round = schedule[roundIndex];
  if (!round) return null;
  const match = round.pairings.find((p) => p.homeUserId === userId || p.awayUserId === userId);
  if (!match) return null;
  return match.homeUserId === userId ? match.awayUserId : match.homeUserId;
}

/**
 * Berger circle yöntemiyle round-robin fikstür üretir ve simüle eder (geriye dönük uyum).
 */
export function generateRoundRobinSchedule(
  userIds: string[],
  lineups: Record<string, TeamLineup>,
  participants: Record<string, AuctionParticipant>
): SimulationRound[] {
  const schedule = generateLeagueSchedule(userIds);
  return schedule.map((item) => simulateSingleRoundMatches(item, lineups, participants));
}

// ---------------------------------------------------------------------------
// Eski Sıralı Mod — Geriye Dönük Uyum
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Puan Tablosu
// ---------------------------------------------------------------------------

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

  const result = Object.values(rows).map((row) => ({ ...row, goalDiff: row.goalsFor - row.goalsAgainst }));
  const tiedMiniLeaguePoints = new Map<string, number>();
  for (const row of result) {
    const tiedIds = new Set(result.filter((other) => other.points === row.points).map((other) => other.userId));
    let miniPoints = 0;
    for (const match of matches) {
      if (!match.isFinished || !tiedIds.has(match.homeUserId) || !tiedIds.has(match.awayUserId)) continue;
      if (match.homeScore === match.awayScore && (match.homeUserId === row.userId || match.awayUserId === row.userId)) miniPoints++;
      else if (match.homeScore > match.awayScore && match.homeUserId === row.userId) miniPoints += 3;
      else if (match.awayScore > match.homeScore && match.awayUserId === row.userId) miniPoints += 3;
    }
    tiedMiniLeaguePoints.set(row.userId, miniPoints);
  }

  return result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const headToHead = (tiedMiniLeaguePoints.get(b.userId) || 0) - (tiedMiniLeaguePoints.get(a.userId) || 0);
    if (headToHead !== 0) return headToHead;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    const usernameOrder = a.username.localeCompare(b.username, "tr");
    return usernameOrder !== 0 ? usernameOrder : a.userId.localeCompare(b.userId);
  });
}

/**
 * Tamamlanmış tüm turların maçlarını düz bir listeye çıkarır (puan tablosu için).
 */
export function collectCompletedRoundMatches(
  rounds: SimulationRound[],
  completedRoundCount: number
): MatchSimulationResult[] {
  const result: MatchSimulationResult[] = [];
  for (let i = 0; i < completedRoundCount && i < rounds.length; i++) {
    result.push(...rounds[i].matches);
  }
  return result;
}
