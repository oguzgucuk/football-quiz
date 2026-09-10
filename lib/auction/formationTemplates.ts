import { FormationName, PitchPosition, SquadSlot } from "./auctionTypes";

export interface FormationSlotDefinition { slotId: string; targetPosition: PitchPosition; label: string; xPercent: number; yPercent: number; }
type Line = PitchPosition[];
const formation = (...lines: Line[]): FormationSlotDefinition[] => {
  const slots: FormationSlotDefinition[] = [{ slotId: "s1", targetPosition: "GK", label: "KL", xPercent: 50, yPercent: 90 }];
  const ys = lines.length === 2
    ? [70, 30]
    : lines.length === 3
      ? [72, 50, 24]
      : lines.length === 4
        ? [74, 59, 41, 20]
        : [76, 62, 47, 32, 17];
  let id = 2;
  lines.forEach((line, row) => line.forEach((position, column) => slots.push({ slotId: `s${id++}`, targetPosition: position, label: position, xPercent: ((column + 1) * 100) / (line.length + 1), yPercent: ys[row] })));
  return slots;
};
const back3: Line = ["CB", "CB", "CB"];
const back4: Line = ["LB", "CB", "CB", "RB"];
const back5: Line = ["LWB", "CB", "CB", "CB", "RWB"];
const fwd = (count: number): Line => Array.from({ length: count }, () => "ST");

export const FORMATION_CONFIGS: Record<FormationName, FormationSlotDefinition[]> = {
  "3-5-2": formation(back3, ["LM", "CM", "CDM", "CM", "RM"], fwd(2)),
  "3-4-2-1": formation(back3, ["LM", "CM", "CM", "RM"], ["CAM", "CAM"], ["ST"]),
  "3-4-3": formation(back3, ["LM", "CM", "CM", "RM"], ["LW", "ST", "RW"]),
  "4-4-2(1)": formation(back4, ["CDM"], ["CM", "CM"], ["CAM"], fwd(2)),
  "4-4-2(2)": formation(back4, ["LM", "CM", "CM", "RM"], fwd(2)),
  "4-2-3-1": formation(back4, ["CM", "CM"], ["LW", "CAM", "RW"], ["ST"]),
  "5-3-2": formation(back5, ["CM", "CDM", "CM"], fwd(2)),
  "5-2-3": formation(back5, ["CM", "CM"], ["LW", "ST", "RW"]),
  "5-4-1(1)": formation(back5, ["CM", "CDM", "CAM", "CM"], ["ST"]),
  "5-4-1(2)": formation(back5, ["LM", "CM", "CM", "RM"], ["ST"]),
};

export function createInitialSlotsForFormation(formationName: FormationName): SquadSlot[] { return FORMATION_CONFIGS[formationName].map((definition) => ({ slotId: definition.slotId, targetPosition: definition.targetPosition, placedPlayer: null, effectiveRating: 0, penalty: 0 })); }
