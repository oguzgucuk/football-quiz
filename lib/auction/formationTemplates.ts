import { FormationName, PitchPosition, SquadSlot } from "./auctionTypes";

export interface FormationSlotDefinition { slotId: string; targetPosition: PitchPosition; label: string; xPercent: number; yPercent: number; }
type Line = PitchPosition[];
const formation = (...lines: Line[]): FormationSlotDefinition[] => {
  const slots: FormationSlotDefinition[] = [{ slotId: "s1", targetPosition: "GK", label: "KL", xPercent: 50, yPercent: 90 }];
  const ys = lines.length === 2 ? [70, 30] : lines.length === 3 ? [72, 50, 24] : [74, 59, 41, 20];
  let id = 2;
  lines.forEach((line, row) => line.forEach((position, column) => slots.push({ slotId: `s${id++}`, targetPosition: position, label: position, xPercent: ((column + 1) * 100) / (line.length + 1), yPercent: ys[row] })));
  return slots;
};
const back3: Line = ["CB", "CB", "CB"], back4: Line = ["LB", "CB", "CB", "RB"], back5: Line = ["LWB", "CB", "CB", "CB", "RWB"];
const mid = (count: number): Line => Array.from({ length: count }, () => "CM");
const fwd = (count: number): Line => Array.from({ length: count }, () => "ST");

export const FORMATION_CONFIGS: Record<FormationName, FormationSlotDefinition[]> = {
  "3-1-4-2": formation(back3, ["CDM"], mid(4), fwd(2)), "3-4-1-2": formation(back3, mid(4), ["CAM"], fwd(2)), "3-4-2-1": formation(back3, mid(4), ["CAM", "CAM"], ["ST"]), "3-4-3": formation(back3, mid(4), ["LW", "ST", "RW"]), "3-5-2": formation(back3, ["LM", "CDM", "CAM", "CM", "RM"], fwd(2)),
  "4-1-2-1-2": formation(back4, ["CDM"], ["CM", "CM"], ["CAM"], fwd(2)), "4-1-2-1-2(2)": formation(back4, ["CDM"], ["LM", "RM"], ["CAM"], fwd(2)), "4-1-3-2": formation(back4, ["CDM"], ["LM", "CAM", "RM"], fwd(2)), "4-1-4-1": formation(back4, ["CDM"], mid(4), ["ST"]), "4-2-1-3": formation(back4, ["CDM", "CDM"], ["CAM"], ["LW", "ST", "RW"]), "4-2-2-2": formation(back4, ["CDM", "CDM"], ["CAM", "CAM"], fwd(2)), "4-2-3-1": formation(back4, ["CDM", "CDM"], ["LM", "CAM", "RM"], ["ST"]), "4-2-3-1(2)": formation(back4, ["CM", "CM"], ["LW", "CAM", "RW"], ["ST"]), "4-2-4": formation(back4, ["CM", "CM"], ["LW", "ST", "ST", "RW"]), "4-3-1-2": formation(back4, mid(3), ["CAM"], fwd(2)), "4-3-2-1": formation(back4, mid(3), ["CAM", "CAM"], ["ST"]), "4-3-3": formation(back4, ["CDM", "CM", "CM"], ["LW", "ST", "RW"]), "4-3-3(2)": formation(back4, ["CM", "CDM", "CM"], ["LW", "ST", "RW"]), "4-3-3(3)": formation(back4, ["CM", "CM", "CAM"], ["LW", "ST", "RW"]), "4-3-3(4)": formation(back4, ["CDM", "CDM", "CAM"], ["LW", "ST", "RW"]), "4-4-1-1(2)": formation(back4, mid(4), ["CF"], ["ST"]), "4-4-2": formation(back4, ["LM", "CM", "CM", "RM"], fwd(2)), "4-4-2(2)": formation(back4, ["LM", "CDM", "CAM", "RM"], fwd(2)), "4-5-1": formation(back4, ["LM", "CM", "CDM", "CM", "RM"], ["ST"]), "4-5-1(2)": formation(back4, ["LM", "CM", "CAM", "CM", "RM"], ["ST"]),
  "5-2-1-2": formation(back5, ["CM", "CM"], ["CAM"], fwd(2)), "5-2-3": formation(back5, ["CM", "CM"], ["LW", "ST", "RW"]), "5-3-2": formation(back5, mid(3), fwd(2)), "5-4-1": formation(back5, ["LM", "CM", "CM", "RM"], ["ST"]),
};

export function createInitialSlotsForFormation(formationName: FormationName): SquadSlot[] { return FORMATION_CONFIGS[formationName].map((definition) => ({ slotId: definition.slotId, targetPosition: definition.targetPosition, placedPlayer: null, effectiveRating: 0, penalty: 0 })); }
