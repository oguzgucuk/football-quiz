/**
 * Müzayede Oyuncu Havuzu Oluşturucu.
 * Belirlenen reyting aralığını dinamik kademelere (tier) bölerek
 * hem tepe yıldızların hem de dengeli mevkilerin havuza girmesini sağlar.
 */

import { prisma } from "../db/client";
import { AuctionPlayerCard } from "./auctionTypes";

export interface PoolFilterOptions {
  playerCount: number;
  ratingMin: number;
  ratingMax: number;
}

export interface RatingTier {
  id: string;
  name: string;
  min: number;
  max: number;
  targetRatio: number;
  targetCount: number;
}

export type PositionCategory = "GK" | "DEF" | "MID" | "FWD";

export interface CandidatePlayer {
  id: string;
  fullName: string;
  overallPrime: number;
  positions: string[];
  position: string | null;
  nationality: string | null;
}

const DEF_POSITIONS = new Set(["CB", "LB", "RB", "LWB", "RWB"]);
const MID_POSITIONS = new Set(["CDM", "CM", "CAM", "LM", "RM"]);
const FWD_POSITIONS = new Set(["ST", "CF", "LW", "RW"]);

/**
 * Verilen aralık genişliğini belirtilen oranlara göre tamsayı dilimlere ayırır.
 */
export function partitionSpan(span: number, parts: number, weights: number[]): number[] {
  const result = new Array(parts).fill(1);
  let remaining = span - parts;
  if (remaining <= 0) return result;

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const allocations = weights.map((w) => Math.floor(remaining * (w / totalWeight)));
  let allocatedSum = 0;
  for (let i = 0; i < parts; i++) {
    result[i] += allocations[i];
    allocatedSum += allocations[i];
  }
  remaining -= allocatedSum;

  let idx = 1;
  while (remaining > 0) {
    result[idx % parts] += 1;
    idx++;
    remaining--;
  }
  return result;
}

/**
 * Lobide seçilen reyting aralığını dengeli kotalara sahip 4 (veya dar aralıklarda 2-3) kademeye böler.
 */
export function calculateRatingTiers(
  ratingMin: number,
  ratingMax: number,
  targetTotal: number
): RatingTier[] {
  const span = ratingMax - ratingMin + 1;

  if (span >= 4) {
    // 4 Kademeli Dağılım: T1 (%20 taban), T2 (%35 omurga), T3 (%30 yıldız), T4 (%15 zirve)
    const parts = partitionSpan(span, 4, [0.25, 0.35, 0.25, 0.15]);

    const t1Min = ratingMin;
    const t1Max = t1Min + parts[0] - 1;

    const t2Min = t1Max + 1;
    const t2Max = t2Min + parts[1] - 1;

    const t3Min = t2Max + 1;
    const t3Max = t3Min + parts[2] - 1;

    const t4Min = t3Max + 1;
    const t4Max = ratingMax;

    const t1Count = Math.max(1, Math.round(targetTotal * 0.20));
    const t2Count = Math.max(1, Math.round(targetTotal * 0.35));
    const t3Count = Math.max(1, Math.round(targetTotal * 0.30));
    const t4Count = Math.max(1, targetTotal - (t1Count + t2Count + t3Count));

    return [
      { id: "tier1", name: "Taban / Fırsat", min: t1Min, max: t1Max, targetRatio: 0.20, targetCount: t1Count },
      { id: "tier2", name: "Omurga Kadro", min: t2Min, max: t2Max, targetRatio: 0.35, targetCount: t2Count },
      { id: "tier3", name: "Yıldızlar", min: t3Min, max: t3Max, targetRatio: 0.30, targetCount: t3Count },
      { id: "tier4", name: "Zirve Elit", min: t4Min, max: t4Max, targetRatio: 0.15, targetCount: t4Count },
    ];
  } else if (span === 3) {
    const t1Count = Math.max(1, Math.round(targetTotal * 0.30));
    const t2Count = Math.max(1, Math.round(targetTotal * 0.40));
    const t3Count = Math.max(1, targetTotal - (t1Count + t2Count));
    return [
      { id: "tier1", name: "Taban", min: ratingMin, max: ratingMin, targetRatio: 0.30, targetCount: t1Count },
      { id: "tier2", name: "Orta", min: ratingMin + 1, max: ratingMin + 1, targetRatio: 0.40, targetCount: t2Count },
      { id: "tier3", name: "Zirve", min: ratingMax, max: ratingMax, targetRatio: 0.30, targetCount: t3Count },
    ];
  } else if (span === 2) {
    const t1Count = Math.max(1, Math.round(targetTotal * 0.50));
    const t2Count = Math.max(1, targetTotal - t1Count);
    return [
      { id: "tier1", name: "Alt", min: ratingMin, max: ratingMin, targetRatio: 0.50, targetCount: t1Count },
      { id: "tier2", name: "Üst", min: ratingMax, max: ratingMax, targetRatio: 0.50, targetCount: t2Count },
    ];
  } else {
    return [
      { id: "tier1", name: "Sabit", min: ratingMin, max: ratingMax, targetRatio: 1.0, targetCount: targetTotal },
    ];
  }
}

export function matchesCategory(player: CandidatePlayer, cat: PositionCategory): boolean {
  if (cat === "GK") return player.positions.includes("GK");
  if (cat === "DEF") return player.positions.some((p) => DEF_POSITIONS.has(p));
  if (cat === "MID") return player.positions.some((p) => MID_POSITIONS.has(p));
  if (cat === "FWD") return player.positions.some((p) => FWD_POSITIONS.has(p));
  return false;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * DB'den aday oyuncuları hafif olarak çeker.
 * Seçilen aralık üstüne ASLA çıkılmaz; sadece yetersiz aday varsa aşağı doğru genişler.
 */
async function fetchCandidates(
  ratingMin: number,
  ratingMax: number,
  targetTotal: number
): Promise<CandidatePlayer[]> {
  let raw = await prisma.player.findMany({
    where: {
      overallPrime: { gte: ratingMin, lte: ratingMax },
      positions: { isEmpty: false },
    },
    select: {
      id: true,
      fullName: true,
      overallPrime: true,
      positions: true,
      position: true,
      nationality: true,
    },
  });

  if (raw.length < targetTotal * 2) {
    const existingIds = new Set(raw.map((c) => c.id));
    const extraNeeded = targetTotal * 2 - raw.length;
    const fallbacks = await prisma.player.findMany({
      where: {
        id: { notIn: Array.from(existingIds) },
        overallPrime: { lt: ratingMin },
        positions: { isEmpty: false },
      },
      orderBy: { overallPrime: "desc" },
      take: extraNeeded,
      select: {
        id: true,
        fullName: true,
        overallPrime: true,
        positions: true,
        position: true,
        nationality: true,
      },
    });
    raw = [...raw, ...fallbacks];
  }

  return raw.filter((c): c is CandidatePlayer => typeof c.overallPrime === "number");
}

/**
 * Kademelerden (Tier) ve mevkisel kotalardan dengeli oyuncu seçimi yapar.
 */
function pickPlayersFromTiers(
  tiers: RatingTier[],
  allCandidates: CandidatePlayer[],
  targetTotal: number,
  playerCount: number
): CandidatePlayer[] {
  const neededPositions: Record<PositionCategory, number> = {
    GK: playerCount * 1,
    DEF: playerCount * 4,
    MID: playerCount * 4,
    FWD: playerCount * 2,
  };

  const selectedList: CandidatePlayer[] = [];
  const selectedIds = new Set<string>();

  const candidatesByTier = new Map<string, CandidatePlayer[]>();
  for (const t of tiers) {
    const inTier = allCandidates.filter((c) => c.overallPrime >= t.min && c.overallPrime <= t.max);
    candidatesByTier.set(t.id, shuffleArray(inTier));
  }

  // Zirve kademeden tabana doğru seç
  const sortedTiers = [...tiers].reverse();
  const posCycle: PositionCategory[] = ["FWD", "MID", "DEF", "GK"];

  for (const tier of sortedTiers) {
    const list = candidatesByTier.get(tier.id) || [];
    let pickedInTier = 0;
    const targetInTier = tier.targetCount;

    let cycleIdx = 0;
    let attempts = 0;
    while (pickedInTier < targetInTier && attempts < posCycle.length * 6) {
      attempts++;
      const cat = posCycle[cycleIdx % posCycle.length];
      cycleIdx++;

      if (neededPositions[cat] <= 0) continue;

      const player = list.find((p) => !selectedIds.has(p.id) && matchesCategory(p, cat));
      if (player) {
        selectedList.push(player);
        selectedIds.add(player.id);
        neededPositions[cat]--;
        pickedInTier++;
      }
    }

    // Tier kotası tam dolmadıysa kalan uygun adaylardan tamamla
    for (const player of list) {
      if (pickedInTier >= targetInTier) break;
      if (selectedIds.has(player.id)) continue;

      const neededCat = posCycle.find((cat) => neededPositions[cat] > 0 && matchesCategory(player, cat));
      if (neededCat) {
        selectedList.push(player);
        selectedIds.add(player.id);
        neededPositions[neededCat]--;
        pickedInTier++;
      }
    }
  }

  // Eksik mevkileri tüm adaylardan tamamla
  for (const cat of posCycle) {
    while (neededPositions[cat] > 0) {
      const p = allCandidates.find((c) => !selectedIds.has(c.id) && matchesCategory(c, cat));
      if (!p) break;
      selectedList.push(p);
      selectedIds.add(p.id);
      neededPositions[cat]--;
    }
  }

  // Hedef toplam karta ulaşana kadar kalanlardan tamamla
  for (const p of shuffleArray(allCandidates)) {
    if (selectedList.length >= targetTotal) break;
    if (!selectedIds.has(p.id)) {
      selectedList.push(p);
      selectedIds.add(p.id);
    }
  }

  return selectedList;
}

/**
 * Seçilen nihai oyuncuların kulüp ve logo bilgilerini toplu sorguyla getirir.
 */
async function populateTeamDetails(selected: CandidatePlayer[]): Promise<AuctionPlayerCard[]> {
  const ids = selected.map((p) => p.id);
  const details = await prisma.player.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      teamsHistory: {
        take: 1,
        orderBy: { seasonEnd: "desc" },
        select: {
          team: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  });

  const detailsMap = new Map(details.map((d) => [d.id, d.teamsHistory[0]?.team]));

  return shuffleArray(selected).map((p) => {
    const team = detailsMap.get(p.id);
    return {
      id: p.id,
      fullName: p.fullName,
      overallPrime: p.overallPrime,
      positions: p.positions,
      primaryPosition: p.position,
      nationality: p.nationality,
      currentClub: team?.name || null,
      logoUrl: team?.logoUrl || null,
    };
  });
}

/**
 * Müzayede oyuncu havuzunu oluşturur ve döndürür.
 */
export async function generateAuctionPool(options: PoolFilterOptions): Promise<AuctionPlayerCard[]> {
  const { playerCount, ratingMin, ratingMax } = options;
  const targetTotal = Math.max(22, playerCount * 11);

  const tiers = calculateRatingTiers(ratingMin, ratingMax, targetTotal);
  const candidates = await fetchCandidates(ratingMin, ratingMax, targetTotal);
  const selectedPlayers = pickPlayersFromTiers(tiers, candidates, targetTotal, playerCount);

  return populateTeamDetails(selectedPlayers);
}
