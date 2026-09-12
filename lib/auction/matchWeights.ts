import { PitchPosition, SquadSlot } from "./auctionTypes";

/**
 * ============================================================================
 * TEK DOĞRULUK KAYNAĞI (SINGLE SOURCE OF TRUTH) - MEVKİ TABAN AĞIRLIKLARI
 * ============================================================================
 * Tüm simülasyon motoru (corridorPowers, corridorActors, possessionResolver)
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
 * Oyuncu reytingini simülasyon güç eğrisine dönüştürür.
 * 2.1 üssü; açık arttırmadaki 3-4 reytinglik kadro avantajını ödüllendirirken
 * aşırı ezici uçurumları törpüleyip maçlara rekabetçi direnç alanı tanır.
 */
export function ratingCurve(rating: number): number {
  return Math.pow(Math.max(0, (rating - 40) / 59), 2.1);
}

/**
 * Verilen mevkisel ağırlık tablosuna göre kadronun toplam skorunu hesaplar.
 */
export function sumScore(slots: SquadSlot[], weights: Record<PitchPosition, number>): number {
  return slots.reduce((total, slot) => (
    slot.placedPlayer ? total + ratingCurve(slot.effectiveRating) * (weights[slot.targetPosition] ?? 0) : total
  ), 0);
}

