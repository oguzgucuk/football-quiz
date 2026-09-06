/**
 * Saha Diziliş Şablonları ve Koordinatları.
 * Pitch üzerindeki yüzde bazlı (x, y) slot pozisyonları.
 */

import { FormationName, PitchPosition, SquadSlot } from "./auctionTypes";

export interface FormationSlotDefinition {
  slotId: string;
  targetPosition: PitchPosition;
  label: string;
  xPercent: number; // 0 (sol) - 100 (sağ)
  yPercent: number; // 0 (üst / kale) - 100 (alt / rakip kale)
}

export const FORMATION_CONFIGS: Record<FormationName, FormationSlotDefinition[]> = {
  "4-3-3": [
    { slotId: "s1", targetPosition: "GK", label: "KL", xPercent: 50, yPercent: 90 },
    { slotId: "s2", targetPosition: "LB", label: "SOL BEK", xPercent: 15, yPercent: 74 },
    { slotId: "s3", targetPosition: "CB", label: "STOPER", xPercent: 38, yPercent: 76 },
    { slotId: "s4", targetPosition: "CB", label: "STOPER", xPercent: 62, yPercent: 76 },
    { slotId: "s5", targetPosition: "RB", label: "SAĞ BEK", xPercent: 85, yPercent: 74 },
    { slotId: "s6", targetPosition: "CDM", label: "ÖN LİBERO", xPercent: 50, yPercent: 57 },
    { slotId: "s7", targetPosition: "CM", label: "ORTA SAHA", xPercent: 28, yPercent: 48 },
    { slotId: "s8", targetPosition: "CM", label: "ORTA SAHA", xPercent: 72, yPercent: 48 },
    { slotId: "s9", targetPosition: "LW", label: "SOL KANAT", xPercent: 18, yPercent: 22 },
    { slotId: "s10", targetPosition: "ST", label: "SANTRFOR", xPercent: 50, yPercent: 18 },
    { slotId: "s11", targetPosition: "RW", label: "SAĞ KANAT", xPercent: 82, yPercent: 22 },
  ],
  "4-2-3-1": [
    { slotId: "s1", targetPosition: "GK", label: "KL", xPercent: 50, yPercent: 90 },
    { slotId: "s2", targetPosition: "LB", label: "SOL BEK", xPercent: 15, yPercent: 74 },
    { slotId: "s3", targetPosition: "CB", label: "STOPER", xPercent: 38, yPercent: 76 },
    { slotId: "s4", targetPosition: "CB", label: "STOPER", xPercent: 62, yPercent: 76 },
    { slotId: "s5", targetPosition: "RB", label: "SAĞ BEK", xPercent: 85, yPercent: 74 },
    { slotId: "s6", targetPosition: "CDM", label: "ÖN LİBERO", xPercent: 35, yPercent: 57 },
    { slotId: "s7", targetPosition: "CDM", label: "ÖN LİBERO", xPercent: 65, yPercent: 57 },
    { slotId: "s8", targetPosition: "CAM", label: "10 NUMARA", xPercent: 50, yPercent: 38 },
    { slotId: "s9", targetPosition: "LM", label: "SOL KANAT", xPercent: 18, yPercent: 36 },
    { slotId: "s10", targetPosition: "RM", label: "SAĞ KANAT", xPercent: 82, yPercent: 36 },
    { slotId: "s11", targetPosition: "ST", label: "SANTRFOR", xPercent: 50, yPercent: 18 },
  ],
  "5-4-1": [
    { slotId: "s1", targetPosition: "GK", label: "KL", xPercent: 50, yPercent: 90 },
    { slotId: "s2", targetPosition: "LWB", label: "SOL KANAT BEK", xPercent: 12, yPercent: 70 },
    { slotId: "s3", targetPosition: "CB", label: "SOL STOPER", xPercent: 30, yPercent: 76 },
    { slotId: "s4", targetPosition: "CB", label: "MERKEZ STOPER", xPercent: 50, yPercent: 77 },
    { slotId: "s5", targetPosition: "CB", label: "SAĞ STOPER", xPercent: 70, yPercent: 76 },
    { slotId: "s6", targetPosition: "RWB", label: "SAĞ KANAT BEK", xPercent: 88, yPercent: 70 },
    { slotId: "s7", targetPosition: "LM", label: "SOL ORTA", xPercent: 20, yPercent: 48 },
    { slotId: "s8", targetPosition: "CM", label: "MERKEZ ORTA", xPercent: 40, yPercent: 50 },
    { slotId: "s9", targetPosition: "CM", label: "MERKEZ ORTA", xPercent: 60, yPercent: 50 },
    { slotId: "s10", targetPosition: "RM", label: "SAĞ ORTA", xPercent: 80, yPercent: 48 },
    { slotId: "s11", targetPosition: "ST", label: "TEK FORVET", xPercent: 50, yPercent: 20 },
  ],
  "3-5-2": [
    { slotId: "s1", targetPosition: "GK", label: "KL", xPercent: 50, yPercent: 90 },
    { slotId: "s2", targetPosition: "CB", label: "SOL STOPER", xPercent: 28, yPercent: 76 },
    { slotId: "s3", targetPosition: "CB", label: "MERKEZ STOPER", xPercent: 50, yPercent: 77 },
    { slotId: "s4", targetPosition: "CB", label: "SAĞ STOPER", xPercent: 72, yPercent: 76 },
    { slotId: "s5", targetPosition: "LM", label: "SOL KANAT", xPercent: 14, yPercent: 50 },
    { slotId: "s6", targetPosition: "CDM", label: "ÖN LİBERO", xPercent: 38, yPercent: 58 },
    { slotId: "s7", targetPosition: "CAM", label: "O. SAHA", xPercent: 50, yPercent: 42 },
    { slotId: "s8", targetPosition: "CDM", label: "ÖN LİBERO", xPercent: 62, yPercent: 58 },
    { slotId: "s9", targetPosition: "RM", label: "SAĞ KANAT", xPercent: 86, yPercent: 50 },
    { slotId: "s10", targetPosition: "ST", label: "FORVET", xPercent: 36, yPercent: 20 },
    { slotId: "s11", targetPosition: "ST", label: "FORVET", xPercent: 64, yPercent: 20 },
  ],
  "4-4-2": [
    { slotId: "s1", targetPosition: "GK", label: "KL", xPercent: 50, yPercent: 90 },
    { slotId: "s2", targetPosition: "LB", label: "SOL BEK", xPercent: 15, yPercent: 74 },
    { slotId: "s3", targetPosition: "CB", label: "STOPER", xPercent: 38, yPercent: 76 },
    { slotId: "s4", targetPosition: "CB", label: "STOPER", xPercent: 62, yPercent: 76 },
    { slotId: "s5", targetPosition: "RB", label: "SAĞ BEK", xPercent: 85, yPercent: 74 },
    { slotId: "s6", targetPosition: "LM", label: "SOL KANAT", xPercent: 16, yPercent: 48 },
    { slotId: "s7", targetPosition: "CM", label: "ORTA SAHA", xPercent: 38, yPercent: 50 },
    { slotId: "s8", targetPosition: "CM", label: "ORTA SAHA", xPercent: 62, yPercent: 50 },
    { slotId: "s9", targetPosition: "RM", label: "SAĞ KANAT", xPercent: 84, yPercent: 48 },
    { slotId: "s10", targetPosition: "ST", label: "FORVET", xPercent: 36, yPercent: 20 },
    { slotId: "s11", targetPosition: "ST", label: "FORVET", xPercent: 64, yPercent: 20 },
  ],
};

export function createInitialSlotsForFormation(formation: FormationName): SquadSlot[] {
  const defs = FORMATION_CONFIGS[formation] || FORMATION_CONFIGS["4-3-3"];
  return defs.map((d) => ({
    slotId: d.slotId,
    targetPosition: d.targetPosition,
    placedPlayer: null,
    effectiveRating: 0,
    penalty: 0,
  }));
}
