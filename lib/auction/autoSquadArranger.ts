/**
 * Otomatik Akıllı Kadro Dizilim Motoru.
 * Taktik süresi bittiğinde veya oyuncu onaylamadığında:
 * 1. Sahaya elle yerleştirilmiş oyuncular varsa bunları kesinlikle korur.
 * 2. Boş yuvalara kulübedeki oyuncuları mevkii uygunluğuna göre en yüksek reytingi verecek şekilde yerleştirir.
 * 3. Kaleci yuvasına (GK) KESİNLİKLE kadrodaki en iyi doğal kaleciyi yerleştirir; asla orta saha/forvet kaleye geçmez.
 */

import { AuctionPlayerCard, FormationName, PitchPosition, SquadSlot } from "./auctionTypes";
import { FORMATION_CONFIGS, createInitialSlotsForFormation } from "./formationTemplates";
import { calculateSlotRating } from "./positionSuitability";

const DEF_POSITIONS: PitchPosition[] = ["CB", "LB", "RB", "LWB", "RWB"];
const MID_POSITIONS: PitchPosition[] = ["CDM", "CM", "CAM", "LM", "RM"];
const FWD_POSITIONS: PitchPosition[] = ["ST", "CF", "LW", "RW"];

function isGK(player: AuctionPlayerCard): boolean {
  return (
    player.positions?.includes("GK") ||
    player.primaryPosition === "GK"
  );
}

/**
 * Bir oyuncunun bir mevkideki uygunluk önceliğini hesaplar.
 * Doğal mevkii ise en yüksek puanı alır.
 */
function getPositionAffinityScore(player: AuctionPlayerCard, targetPos: PitchPosition): number {
  const positions = player.positions?.length ? player.positions : [player.primaryPosition || "CM"];

  // 1. Kaleci kontrolleri
  if (targetPos === "GK") {
    return isGK(player) ? 1000 + player.overallPrime : -1000;
  }
  if (isGK(player)) {
    // Kaleci saha içine geçerse en son tercih olsun
    return -500;
  }

  // 2. Tam mevkii eşleşmesi
  if (positions.includes(targetPos)) {
    return 500 + player.overallPrime;
  }

  // 3. Aynı hat (Defans, Orta Saha, Forvet)
  const isTargetDef = DEF_POSITIONS.includes(targetPos);
  const isTargetMid = MID_POSITIONS.includes(targetPos);
  const isTargetFwd = FWD_POSITIONS.includes(targetPos);

  const hasDef = positions.some((p) => DEF_POSITIONS.includes(p as PitchPosition));
  const hasMid = positions.some((p) => MID_POSITIONS.includes(p as PitchPosition));
  const hasFwd = positions.some((p) => FWD_POSITIONS.includes(p as PitchPosition));

  if ((isTargetDef && hasDef) || (isTargetMid && hasMid) || (isTargetFwd && hasFwd)) {
    return 200 + player.overallPrime;
  }

  // 4. Farklı hat
  return player.overallPrime;
}

/**
 * Kadroyu formasyon yuvalarına akıllı şekilde yerleştirir.
 */
export function autoAssignSquadToFormation(
  squad: AuctionPlayerCard[],
  formationName: FormationName = "4-2-3-1",
  existingSlots?: SquadSlot[]
): SquadSlot[] {
  const formKey = formationName in FORMATION_CONFIGS ? formationName : "4-2-3-1";
  const baseSlots = createInitialSlotsForFormation(formKey);

  // 1. Eğer kullanıcı sahaya bazı oyuncuları zaten koymuşsa, onları koru
  const currentSlots: SquadSlot[] = baseSlots.map((base, idx) => {
    const existing = existingSlots?.[idx];
    if (existing?.placedPlayer) {
      const { effectiveRating, penalty } = calculateSlotRating(existing.placedPlayer, base.targetPosition);
      return {
        ...base,
        placedPlayer: existing.placedPlayer,
        effectiveRating,
        penalty,
      };
    }
    return base;
  });

  // Sahada olan oyuncuların ID'leri
  const alreadyPlacedIds = new Set(
    currentSlots.map((s) => s.placedPlayer?.id).filter((id): id is string => Boolean(id))
  );

  // Kulübede boşta bekleyen oyuncular
  let availablePlayers = squad.filter((p) => !alreadyPlacedIds.has(p.id));

  // 2. Kaleci Yuvası Kontrolü (s1 / GK):
  // Eğer kaleci boşsa, kulübedeki en iyi kaleciyi hemen ata!
  const gkSlotIndex = currentSlots.findIndex((s) => s.targetPosition === "GK");
  if (gkSlotIndex !== -1 && !currentSlots[gkSlotIndex].placedPlayer) {
    const naturalGks = availablePlayers.filter(isGK).sort((a, b) => b.overallPrime - a.overallPrime);
    const chosenGk = naturalGks[0] || availablePlayers.sort((a, b) => b.overallPrime - a.overallPrime)[0];

    if (chosenGk) {
      const { effectiveRating, penalty } = calculateSlotRating(chosenGk, "GK");
      currentSlots[gkSlotIndex].placedPlayer = chosenGk;
      currentSlots[gkSlotIndex].effectiveRating = effectiveRating;
      currentSlots[gkSlotIndex].penalty = penalty;
      availablePlayers = availablePlayers.filter((p) => p.id !== chosenGk.id);
    }
  }

  // 3. Kalan boş yuvaları, oyuncu mevkii uygunluğu en yüksek olacak şekilde eşleştir (Greedy Best-Fit)
  const emptySlotIndices = currentSlots
    .map((s, idx) => ({ slot: s, idx }))
    .filter(({ slot }) => !slot.placedPlayer);

  // Mevki öncelik sırası: önce forvetler ve stoperler, sonra orta sahalar
  emptySlotIndices.sort((a, b) => {
    const posA = a.slot.targetPosition;
    const posB = b.slot.targetPosition;
    const priority = (pos: PitchPosition) => {
      if (pos === "ST" || pos === "CF") return 3;
      if (DEF_POSITIONS.includes(pos)) return 2;
      return 1;
    };
    return priority(posB) - priority(posA);
  });

  for (const { idx } of emptySlotIndices) {
    if (availablePlayers.length === 0) break;

    const targetPos = currentSlots[idx].targetPosition;

    // Kalan oyuncular arasında bu mevkiiye en uygun olanı bul
    let bestPlayerIdx = 0;
    let bestScore = -Infinity;

    for (let pIdx = 0; pIdx < availablePlayers.length; pIdx++) {
      const score = getPositionAffinityScore(availablePlayers[pIdx], targetPos);
      if (score > bestScore) {
        bestScore = score;
        bestPlayerIdx = pIdx;
      }
    }

    const chosenPlayer = availablePlayers[bestPlayerIdx];
    const { effectiveRating, penalty } = calculateSlotRating(chosenPlayer, targetPos);

    currentSlots[idx].placedPlayer = chosenPlayer;
    currentSlots[idx].effectiveRating = effectiveRating;
    currentSlots[idx].penalty = penalty;

    availablePlayers.splice(bestPlayerIdx, 1);
  }

  return currentSlots;
}
