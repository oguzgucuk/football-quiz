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

import { StandingRow, MatchSimulationResult, TeamLineup, AuctionParticipant, SimulationRound } from "./auctionTypes";
import { simulateMatch } from "./simulateMatch";

export interface FixturePair {
  matchId: string;
  homeUserId: string;
  awayUserId: string;
}

// ---------------------------------------------------------------------------
// Yeni: Circle/Berger Round-Robin Algoritması
// ---------------------------------------------------------------------------

/**
 * Berger circle yöntemiyle round-robin fikstür üretir.
 * Çift sayı N oyuncu → N-1 tur, her turda N/2 eş zamanlı maç.
 * Tek sayı N oyuncu → N tur, her turda (N-1)/2 eş zamanlı maç + 1 bye.
 *
 * Örnek (4 oyuncu → 3 tur):
 *   Tur 1: [0-3, 1-2]   Tur 2: [0-2, 3-1]   Tur 3: [0-1, 2-3]
 *
 * @param userIds - Oyuncu ID listesi
 * @param lineups - Taktik çıktısı (maç simülasyonu için)
 * @param participants - Kullanıcı adları
 */
export function generateRoundRobinSchedule(
  userIds: string[],
  lineups: Record<string, TeamLineup>,
  participants: Record<string, AuctionParticipant>
): SimulationRound[] {
  // Tek sayıda oyuncu → "ghost" (bye) oyuncu ekle
  const hasBye = userIds.length % 2 !== 0;
  const BYE_ID = "__BYE__";
  const ids = hasBye ? [...userIds, BYE_ID] : [...userIds];
  const n = ids.length; // Her zaman çift

  const totalRounds = n - 1;
  const rounds: SimulationRound[] = [];

  // Circle algoritması: ilk oyuncu sabit, geri kalanlar her tur döner
  const circle = ids.slice(1); // ilk eleman (ids[0]) sabit

  let matchCounter = 1;

  for (let r = 0; r < totalRounds; r++) {
    const fixed = ids[0];
    const rotated = [circle[(r + circle.length - 1) % circle.length], ...circle.slice(0, circle.length - 1).map((_, i) => circle[(r + i) % (circle.length)])];
    // Rotasyonu doğru hesapla
    const rotatedCorrect: string[] = [];
    for (let i = 0; i < circle.length; i++) {
      rotatedCorrect.push(circle[(r + i) % circle.length]);
    }

    const half = n / 2;
    const pairings: Array<[string, string]> = [];

    // fixed vs rotatedCorrect[n/2 - 1]
    pairings.push([fixed, rotatedCorrect[half - 1]]);

    // Kalan çiftler: rotatedCorrect[0] vs rotatedCorrect[n-2], rotatedCorrect[1] vs rotatedCorrect[n-3], ...
    for (let i = 0; i < half - 1; i++) {
      pairings.push([rotatedCorrect[i], rotatedCorrect[n - 2 - i]]);
    }

    const roundMatches: MatchSimulationResult[] = [];
    let byeUserId: string | null = null;

    for (const [home, away] of pairings) {
      // bye içeren çifti atla
      if (home === BYE_ID || away === BYE_ID) {
        byeUserId = home === BYE_ID ? away : home;
        continue;
      }

      const homeLineup = lineups[home];
      const awayLineup = lineups[away];
      const homeName = participants[home]?.username || "Ev Sahibi";
      const awayName = participants[away]?.username || "Deplasman";

      if (homeLineup && awayLineup) {
        const result = simulateMatch(
          `match_r${r + 1}_${matchCounter++}`,
          homeLineup,
          homeName,
          awayLineup,
          awayName
        );
        roundMatches.push(result);
      }
    }

    rounds.push({
      roundNumber: r + 1,
      matches: roundMatches,
      byeUserId,
    });
  }

  return rounds;
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

  return Object.values(rows)
    .map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
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
