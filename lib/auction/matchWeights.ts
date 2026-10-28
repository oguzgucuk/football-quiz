import { PitchPosition, SquadSlot } from "./auctionTypes";

/**
 * ============================================================================
 * TEK DOĞRULUK KAYNAĞI (SINGLE SOURCE OF TRUTH) - MEVKİ TABAN AĞIRLIKLARI
 * ============================================================================
 * Tüm simülasyon motoru (zonePowers, zoneActors, matchStateMachine)
 * mevkilerin taban güçlerini bu tablolardan alır.
 * Değerleri değiştirmek doğrudan tüm simülasyon dengesini günceller.
 */

/**
 * Top kapma ve orta saha mücadelesi taban ağırlıkları.
 * Ön libero ve merkez orta sahalar asıl gücü oluşturur;
 * bekler kanatta, forvetler ise önde preste destek verir.
 */
export const MID_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0,
  CB: 0.10,
  LB: 0.30, RB: 0.30, LWB: 0.40, RWB: 0.40,
  CDM: 1.15, CM: 0.95, LM: 0.75, RM: 0.75, CAM: 0.45,
  LW: 0.25, RW: 0.25,
  ST: 0.10, CF: 0.10,
};

/**
 * Ceza sahası savunması ve tehlikeyi savuşturma direnci.
 * Stoperler ve bekler asıl dirençtir. CDM önlerini kapatır,
 * CM iki yönlü yardım eder. CAM (10 numara) geriye yardımı minimumdur (0.20).
 */
export const DEF_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0,
  CB: 1.85,
  LB: 1.75, RB: 1.75, LWB: 1.35, RWB: 1.35,
  CDM: 0.90, CM: 0.65, LM: 0.70, RM: 0.70, CAM: 0.20,
  LW: 0.20, RW: 0.20,
  ST: 0.05, CF: 0.05,
};

/**
 * Ceza sahası hücumu ve gol tehdidi taban ağırlıkları.
 * Santrforlar ve kanat forvetler en yüksek bitiriciliğe sahiptir.
 * CAM forvet arkasında yüksek tehdit yaratır (1.35).
 */
export const ATK_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0,
  CB: 0.05,
  LB: 0.25, RB: 0.25, LWB: 0.45, RWB: 0.45,
  CDM: 0.25, CM: 0.65, LM: 0.90, RM: 0.90, CAM: 1.35,
  LW: 1.60, RW: 1.60,
  ST: 1.85, CF: 1.85,
};

/**
 * Gol pozisyonunu hazırlayan asistçi olma ağırlıkları.
 * CAM (10 numara) ve kanat oyuncuları en yüksek pasör gücüne sahiptir.
 */
export const ASSIST_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0,
  CB: 0.15,
  LB: 0.60, RB: 0.60, LWB: 0.90, RWB: 0.90,
  CDM: 1.00, CM: 1.40, LM: 1.50, RM: 1.50, CAM: 1.85,
  LW: 1.70, RW: 1.70,
  ST: 1.40, CF: 1.40,
};

/**
 * Ceza sahası dışından uzaktan şut çekme ve tehdit yaratma taban ağırlıkları.
 * CAM (10 numara) ve CM (merkez orta saha) uzaktan şut uzmanlarıdır.
 * LW/RW kanattan içeri kat edip vurur. CDM yay üzerinde dönen toplara mermi gibi vurur.
 */
export const LONG_SHOT_WEIGHTS: Record<PitchPosition, number> = {
  GK: 0,
  CB: 0.15,
  LB: 0.50, RB: 0.50, LWB: 0.70, RWB: 0.70,
  CDM: 1.20, CM: 1.60, LM: 1.00, RM: 1.00, CAM: 1.85,
  LW: 1.40, RW: 1.40,
  ST: 1.10, CF: 1.10,
};

const DEF_ROLES: PitchPosition[] = ["CB", "LB", "RB", "LWB", "RWB"];
const MID_ROLES: PitchPosition[] = ["CDM", "CM", "CAM", "LM", "RM"];
const FWD_ROLES: PitchPosition[] = ["ST", "CF", "LW", "RW"];

/**
 * Oyuncunun doğal mevkisel hattı ile sahadaki rolün gereksinimleri arasındaki uyum katsayısı.
 * Stoper forvet slotunda oynuyorsa hücum aksiyonunda %60 ceza alır (0.40x).
 * Forvet stoper slotunda oynuyorsa savunma aksiyonunda %60 ceza alır (0.40x).
 */
export function getRoleSuitabilityMultiplier(
  playerPositions: string[] | undefined,
  targetPosition: PitchPosition,
  actionType: "def" | "mid" | "atk"
): number {
  if (!playerPositions || playerPositions.length === 0) return 1.0;

  // Kaleci sahada oynuyorsa hiçbir aksiyonda etkili olamaz
  if (playerPositions.some((p) => ["GK", "KL"].includes(p.toUpperCase()))) {
    return targetPosition === "GK" ? 1.0 : 0.20;
  }

  // Oyuncunun doğal mevkilerinden biri hedef mevkiyse tam verim
  if (playerPositions.includes(targetPosition)) return 1.0;

  const isPlayerDef = playerPositions.some((p) => DEF_ROLES.includes(p as PitchPosition));
  const isPlayerMid = playerPositions.some((p) => MID_ROLES.includes(p as PitchPosition));
  const isPlayerFwd = playerPositions.some((p) => FWD_ROLES.includes(p as PitchPosition));

  if (actionType === "atk") {
    if (isPlayerFwd) return 1.0;
    if (isPlayerMid) return 0.80;
    if (isPlayerDef) return 0.40;
  } else if (actionType === "def") {
    if (isPlayerDef) return 1.0;
    if (isPlayerMid) return 0.75;
    if (isPlayerFwd) return 0.40;
  } else if (actionType === "mid") {
    if (isPlayerMid) return 1.0;
    if (isPlayerDef || isPlayerFwd) return 0.75;
  }

  return 0.85;
}

/**
 * Oyuncu reytingini simülasyon güç eğrisine dönüştürür.
 * 35 taban reytingi destekler, kadro ve mevki kalitesi farkını net yansıtır.
 */
export function ratingCurve(rating: number): number {
  return Math.pow(Math.max(0.01, (rating - 30) / 69), 2.2);
}

/**
 * Verilen mevkisel ağırlık tablosuna göre kadronun toplam skorunu hesaplar.
 */
export function sumScore(slots: SquadSlot[], weights: Record<PitchPosition, number>): number {
  return slots.reduce((total, slot) => (
    slot.placedPlayer ? total + ratingCurve(slot.effectiveRating) * (weights[slot.targetPosition] ?? 0) : total
  ), 0);
}

