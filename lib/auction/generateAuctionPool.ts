/**
 * Müzayede Oyuncu Havuzu Oluşturucu.
 * Belirlenen reyting aralığında ve dengeli mevkisel dağılımda
 * (oyuncu sayısı * 11) adet futbolcu çeker.
 */

import { prisma } from "../db/client";
import { AuctionPlayerCard } from "./auctionTypes";

export interface PoolFilterOptions {
  playerCount: number;
  ratingMin: number;
  ratingMax: number;
}

const CANDIDATE_SELECT = {
  id: true,
  fullName: true,
  overallPrime: true,
  positions: true,
  position: true,
  nationality: true,
  teamsHistory: {
    take: 1,
    orderBy: { seasonEnd: "desc" as const },
    select: {
      team: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
    },
  },
};

export async function generateAuctionPool(options: PoolFilterOptions): Promise<AuctionPlayerCard[]> {
  const { playerCount, ratingMin, ratingMax } = options;
  const targetTotal = Math.max(22, playerCount * 11);

  // Mevki Kotaları
  const targetGK = playerCount * 1;
  const targetDEF = playerCount * 4;
  const targetMID = playerCount * 4;
  const targetFWD = playerCount * 2;

  // DB'den reyting aralığındaki tüm adayları tek sorguda çek
  let candidates = await prisma.player.findMany({
    where: {
      overallPrime: {
        gte: ratingMin,
        lte: ratingMax,
      },
      positions: {
        isEmpty: false,
      },
    },
    select: CANDIDATE_SELECT,
  });

  // Emniyet Koruması: Eğer seçilen dar/yüksek aralıkta (örn. 98-99) yeterli oyuncu yoksa
  // havuzun eksiksiz kurulabilmesi için en yüksek reytingli mevcut yıldızlarla tamamla
  if (candidates.length < targetTotal * 2) {
    const existingIds = new Set(candidates.map((c) => c.id));
    const extraNeeded = targetTotal * 3;
    const fallbackCandidates = await prisma.player.findMany({
      where: {
        id: { notIn: Array.from(existingIds) },
        overallPrime: { not: null },
        positions: { isEmpty: false },
      },
      orderBy: { overallPrime: "desc" },
      take: extraNeeded,
      select: CANDIDATE_SELECT,
    });
    candidates = [...candidates, ...fallbackCandidates];
  }

  const shuffledCandidates = shuffleArray(candidates);

  const selectedList: typeof candidates = [];
  const selectedIds = new Set<string>();

  // 1. Kaleciler (Havuzda yoksa DB'deki en iyi kalecilerden çek)
  pickByPosition(shuffledCandidates, selectedList, selectedIds, targetGK, ["GK"]);
  const foundGKs = selectedList.filter((p) => p.positions.includes("GK")).length;
  if (foundGKs < targetGK) {
    const extraGKs = await prisma.player.findMany({
      where: {
        positions: { has: "GK" },
        id: { notIn: Array.from(selectedIds) },
      },
      orderBy: { overallPrime: "desc" },
      take: targetGK - foundGKs,
      select: CANDIDATE_SELECT,
    });
    for (const gk of extraGKs) {
      selectedList.push(gk);
      selectedIds.add(gk.id);
    }
  }

  // 2. Defanslar
  pickByPosition(shuffledCandidates, selectedList, selectedIds, targetDEF, ["CB", "LB", "RB", "LWB", "RWB"]);
  // 3. Orta Sahalar
  pickByPosition(shuffledCandidates, selectedList, selectedIds, targetMID, ["CDM", "CM", "CAM", "LM", "RM"]);
  // 4. Forvetler
  pickByPosition(shuffledCandidates, selectedList, selectedIds, targetFWD, ["ST", "CF", "LW", "RW"]);

  // 5. Kalan eksikleri adaylardan tamamla
  for (const c of shuffledCandidates) {
    if (selectedList.length >= targetTotal) break;
    if (!selectedIds.has(c.id)) {
      selectedList.push(c);
      selectedIds.add(c.id);
    }
  }

  // Havuzu karıştır ve kart formatına çevir
  const finalPool = shuffleArray(selectedList).map((p) => ({
    id: p.id,
    fullName: p.fullName,
    overallPrime: p.overallPrime || 75,
    positions: p.positions,
    primaryPosition: p.position,
    nationality: p.nationality,
    currentClub: p.teamsHistory[0]?.team.name || null,
    logoUrl: p.teamsHistory[0]?.team.logoUrl || null,
  }));

  return finalPool;
}

type CandidatePlayer = {
  id: string;
  fullName: string;
  overallPrime: number | null;
  positions: string[];
  position: string | null;
  nationality: string | null;
  teamsHistory: { team: { name: string; logoUrl: string | null } }[];
};

function pickByPosition(
  all: CandidatePlayer[],
  dest: CandidatePlayer[],
  used: Set<string>,
  count: number,
  matchingPositions: string[]
) {
  let found = 0;
  for (const p of all) {
    if (found >= count) break;
    if (used.has(p.id)) continue;
    const hasMatch = p.positions.some((pos) => matchingPositions.includes(pos));
    if (hasMatch) {
      dest.push(p);
      used.add(p.id);
      found++;
    }
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
