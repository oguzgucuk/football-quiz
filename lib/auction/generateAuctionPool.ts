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
 * Lobide seçilen reyting aralığını dengeli taktiksel piramide böler:
 * - 💎 Elmas (90+ OVR): Toplam havuzun %10-12'si ile sınırlandırılır (~1.5 adet/oyuncu).
 * - 🥇 Üst Altın (85-89 OVR): %28
 * - 🥈 Normal Altın (80-84 OVR): %40
 * - 🥉 Taban / Fırsat (75-79 OVR): %21
 */
export function calculateRatingTiers(
  ratingMin: number,
  ratingMax: number,
  targetTotal: number
): RatingTier[] {
  // Eğer tavan 90 veya üstüyse Elmas kademesi (90+) kişi başı 3 elmas düşecek şekilde hesaplanır
  if (ratingMax >= 90) {
    const diamondMin = 90;
    const diamondMax = ratingMax;
    const playerCount = Math.max(1, Math.round(targetTotal / 14));
    // Kişi başı tam 3 elmas (2 oyuncuda 6, 4 oyuncuda 12)
    const diamondCount = Math.max(1, playerCount * 3);
    const diamondRatio = Number((diamondCount / targetTotal).toFixed(2));

    const remainingCount = targetTotal - diamondCount;
    const subMax = 89;
    const subMin = Math.min(ratingMin, subMax);
    const subSpan = subMax - subMin + 1;

    if (subSpan >= 3 && subMin <= 84) {
      const t3Min = 85;
      const t3Max = 89;
      // Kalan kartlar orijinal 28 : 40 : 21 oranına sadık kalınarak diğer aralıklar bozulmadan paylaştırılır
      const t3Count = Math.max(1, Math.round(remainingCount * (0.28 / 0.89)));

      const t2Min = 80;
      const t2Max = 84;
      const t2Count = Math.max(1, Math.round(remainingCount * (0.40 / 0.89)));

      const t1Min = subMin;
      const t1Max = Math.max(subMin, 79);
      const t1Count = Math.max(1, remainingCount - (t3Count + t2Count));

      return [
        { id: "tier1", name: "Taban / Fırsat", min: t1Min, max: t1Max, targetRatio: Number((t1Count / targetTotal).toFixed(2)), targetCount: t1Count },
        { id: "tier2", name: "Normal Altın", min: t2Min, max: t2Max, targetRatio: Number((t2Count / targetTotal).toFixed(2)), targetCount: t2Count },
        { id: "tier3", name: "Üst Altın Omurga", min: t3Min, max: t3Max, targetRatio: Number((t3Count / targetTotal).toFixed(2)), targetCount: t3Count },
        { id: "tier4", name: "Zirve Elmas", min: diamondMin, max: diamondMax, targetRatio: diamondRatio, targetCount: diamondCount },
      ];
    } else {
      const midPoint = Math.floor((subMin + subMax) / 2);
      const t1Count = Math.round(remainingCount * 0.50);
      const t2Count = Math.max(1, remainingCount - t1Count);
      return [
        { id: "tier1", name: "Taban", min: subMin, max: midPoint, targetRatio: Number((t1Count / targetTotal).toFixed(2)), targetCount: t1Count },
        { id: "tier2", name: "Omurga", min: midPoint + 1, max: subMax, targetRatio: Number((t2Count / targetTotal).toFixed(2)), targetCount: t2Count },
        { id: "tier4", name: "Zirve Elmas", min: diamondMin, max: diamondMax, targetRatio: diamondRatio, targetCount: diamondCount },
      ];
    }
  }

  // ratingMax < 90 ise standart bölme
  const span = ratingMax - ratingMin + 1;
  const parts = partitionSpan(span, 3, [0.3, 0.4, 0.3]);
  const t1Count = Math.round(targetTotal * 0.3);
  const t2Count = Math.round(targetTotal * 0.4);
  const t3Count = Math.max(1, targetTotal - (t1Count + t2Count));
  return [
    { id: "tier1", name: "Taban", min: ratingMin, max: ratingMin + parts[0] - 1, targetRatio: 0.3, targetCount: t1Count },
    { id: "tier2", name: "Orta", min: ratingMin + parts[0], max: ratingMin + parts[0] + parts[1] - 1, targetRatio: 0.4, targetCount: t2Count },
    { id: "tier3", name: "Zirve", min: ratingMin + parts[0] + parts[1], max: ratingMax, targetRatio: 0.3, targetCount: t3Count },
  ];
}

export function matchesCategory(player: CandidatePlayer, cat: PositionCategory): boolean {
  const positions = (player.positions || []).map((p) => String(p).trim().toUpperCase());
  const primary = String(player.position || "").trim().toUpperCase();

  const isGk =
    positions.includes("GK") ||
    positions.includes("KL") ||
    positions.some((p) => p.includes("GOALKEEPER") || p.includes("KALECI")) ||
    primary === "GK" ||
    primary === "KL" ||
    primary.includes("GOALKEEPER") ||
    primary.includes("KALECI");

  if (cat === "GK") return isGk;
  if (isGk) return false; // Kaleciler defans/orta saha/forvet kategorileriyle eşleşemez

  if (cat === "DEF") return positions.some((p) => DEF_POSITIONS.has(p)) || DEF_POSITIONS.has(primary);
  if (cat === "MID") return positions.some((p) => MID_POSITIONS.has(p)) || MID_POSITIONS.has(primary);
  if (cat === "FWD") return positions.some((p) => FWD_POSITIONS.has(p)) || FWD_POSITIONS.has(primary);
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
 * DB'den aday oyuncuları hafif olarak çeker ve karıştırır.
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

  const valid = raw.filter((c): c is CandidatePlayer => typeof c.overallPrime === "number");
  return shuffleArray(valid);
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
  const gkCount = playerCount * 2;
  const defCount = playerCount * 5;
  const midCount = Math.round(playerCount * 4.5);
  const fwdCount = Math.max(playerCount * 2, targetTotal - (gkCount + defCount + midCount));

  const neededPositions: Record<PositionCategory, number> = {
    GK: gkCount,
    DEF: defCount,
    MID: midCount,
    FWD: fwdCount,
  };

  const maxDiamondGk = Math.max(1, Math.floor(playerCount / 2));
  let diamondGkCount = 0;
  const selectedList: CandidatePlayer[] = [];
  const selectedIds = new Set<string>();

  const shuffledAllCandidates = shuffleArray(allCandidates);
  const candidatesByTier = new Map<string, CandidatePlayer[]>();
  for (const t of tiers) {
    const inTier = shuffledAllCandidates.filter((c) => c.overallPrime >= t.min && c.overallPrime <= t.max);
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

      const player = list.find((p) => {
        if (selectedIds.has(p.id)) return false;
        if (!matchesCategory(p, cat)) return false;
        if (cat === "GK" && p.overallPrime >= 90 && diamondGkCount >= maxDiamondGk) return false;
        return true;
      });
      if (player) {
        selectedList.push(player);
        selectedIds.add(player.id);
        neededPositions[cat]--;
        pickedInTier++;
        if (cat === "GK" && player.overallPrime >= 90) diamondGkCount++;
      }
    }

    // Tier kotası tam dolmadıysa kalan uygun adaylardan tamamla
    for (const player of list) {
      if (pickedInTier >= targetInTier) break;
      if (selectedIds.has(player.id)) continue;

      const neededCat = posCycle.find((cat) => {
        if (neededPositions[cat] <= 0) return false;
        if (!matchesCategory(player, cat)) return false;
        if (cat === "GK" && player.overallPrime >= 90 && diamondGkCount >= maxDiamondGk) return false;
        return true;
      });
      if (neededCat) {
        selectedList.push(player);
        selectedIds.add(player.id);
        neededPositions[neededCat]--;
        pickedInTier++;
        if (neededCat === "GK" && player.overallPrime >= 90) diamondGkCount++;
      }
    }
  }

  // Eksik mevkileri tüm adaylardan tamamla (karıştırılmış havuzdan)
  const randomFallbackPool = shuffleArray(shuffledAllCandidates);
  for (const cat of posCycle) {
    while (neededPositions[cat] > 0) {
      const p = randomFallbackPool.find((c) => {
        if (selectedIds.has(c.id)) return false;
        if (!matchesCategory(c, cat)) return false;
        if (cat === "GK" && c.overallPrime >= 90 && diamondGkCount >= maxDiamondGk) return false;
        return true;
      });
      if (!p) break;
      selectedList.push(p);
      selectedIds.add(p.id);
      neededPositions[cat]--;
      if (cat === "GK" && p.overallPrime >= 90) diamondGkCount++;
    }
  }

  // Hedef toplam karta ulaşana kadar kalan adaylardan tamamla (FAZLADAN KALECİ ASLA ALINMAZ)
  for (const p of shuffleArray(shuffledAllCandidates)) {
    if (selectedList.length >= targetTotal) break;
    if (!selectedIds.has(p.id)) {
      if (matchesCategory(p, "GK")) continue; // Havuzda ihtiyaçtan fazla kaleci birikmesini önle
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
    const isGk = matchesCategory(p, "GK");
    const normalizedPositions =
      p.positions && p.positions.length > 0
        ? p.positions
        : isGk
        ? ["GK"]
        : [p.position || "CM"];

    return {
      id: p.id,
      fullName: p.fullName,
      overallPrime: p.overallPrime,
      positions: normalizedPositions,
      primaryPosition: isGk ? "GK" : p.position,
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
  const targetTotal = Math.max(28, playerCount * 14);

  const tiers = calculateRatingTiers(ratingMin, ratingMax, targetTotal);
  const candidates = await fetchCandidates(ratingMin, ratingMax, targetTotal);
  const selectedPlayers = pickPlayersFromTiers(tiers, candidates, targetTotal, playerCount);

  return populateTeamDetails(selectedPlayers);
}
