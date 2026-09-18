import {
  AuctionParticipant,
  FormationName,
  PitchPosition,
  TeamLineup,
  TeamTactics,
} from "./auctionTypes";
import { FORMATION_CONFIGS, createInitialSlotsForFormation } from "./formationTemplates";
import { calculateLineupPowers, calculateSlotRating } from "./positionSuitability";
import { DEFAULT_TACTICS } from "./corridorSetup";

const FORMATIONS = new Set<FormationName>(Object.keys(FORMATION_CONFIGS) as FormationName[]);
const CHANGEABLE_GROUPS: PitchPosition[][] = [
  ["ST", "CF"],
  ["CM", "CDM", "CAM"],
  ["RB", "RWB"],
  ["LB", "LWB"],
];

function validTarget(base: PitchPosition, requested: PitchPosition): boolean {
  if (base === requested) return true;
  return CHANGEABLE_GROUPS.some((group) => group.includes(base) && group.includes(requested));
}

export function sanitizeTactics(input?: Partial<TeamTactics>): TeamTactics {
  const tempo = ["slow", "balanced", "fast"].includes(String(input?.tempo)) ? input!.tempo! : DEFAULT_TACTICS.tempo;
  const buildUp = ["short_pass", "balanced", "long_ball"].includes(String(input?.buildUp)) ? input!.buildUp! : DEFAULT_TACTICS.buildUp;
  const pressing = ["park_bus", "balanced", "high_press"].includes(String(input?.pressing)) ? input!.pressing! : DEFAULT_TACTICS.pressing;
  const attackDirection = ["left", "center", "right", "balanced", "wings"].includes(String(input?.attackDirection))
    ? input!.attackDirection!
    : DEFAULT_TACTICS.attackDirection;
  const transition = ["retain", "balanced", "counter"].includes(String(input?.transition)) ? input!.transition! : "balanced";
  const chanceCreation = ["patient", "balanced", "early_cross", "shoot_on_sight"].includes(String(input?.chanceCreation))
    ? input!.chanceCreation!
    : "balanced";
  return { tempo, buildUp, pressing, attackDirection, transition, chanceCreation };
}

export function buildCanonicalLineup(
  userId: string,
  participant: AuctionParticipant,
  requested: TeamLineup
): { lineup?: TeamLineup; error?: string } {
  if (!FORMATIONS.has(requested.formation)) return { error: "Geçersiz diziliş." };
  const definitions = FORMATION_CONFIGS[requested.formation];
  if (!Array.isArray(requested.slots) || requested.slots.length !== definitions.length) {
    return { error: "Kadro tam olarak 11 geçerli slottan oluşmalıdır." };
  }

  const squadById = new Map(participant.squad.map((player) => [player.id, player]));
  const requestedBySlot = new Map(requested.slots.map((slot) => [slot.slotId, slot]));
  const usedPlayerIds = new Set<string>();
  const slots = createInitialSlotsForFormation(requested.formation);

  for (let index = 0; index < definitions.length; index++) {
    const definition = definitions[index];
    const incoming = requestedBySlot.get(definition.slotId);
    const playerId = incoming?.placedPlayer?.id;
    if (!incoming || !playerId) return { error: "İlk 11'de boş pozisyon bırakılamaz." };
    if (usedPlayerIds.has(playerId)) return { error: "Aynı oyuncu birden fazla pozisyonda kullanılamaz." };
    const canonicalPlayer = squadById.get(playerId);
    if (!canonicalPlayer) return { error: "Kadronuzda bulunmayan bir oyuncu kullanılamaz." };

    const targetPosition = incoming.targetPosition;
    if (!validTarget(definition.targetPosition, targetPosition)) {
      return { error: `${definition.targetPosition} slotu ${targetPosition} olarak değiştirilemez.` };
    }
    const rating = calculateSlotRating(canonicalPlayer, targetPosition);
    slots[index] = {
      ...slots[index],
      targetPosition,
      placedPlayer: canonicalPlayer,
      effectiveRating: rating.effectiveRating,
      penalty: rating.penalty,
    };
    usedPlayerIds.add(playerId);
  }

  const lineup = calculateLineupPowers(userId, requested.formation, slots);
  lineup.tactics = sanitizeTactics(requested.tactics);
  lineup.isConfirmed = true;
  return { lineup };
}
