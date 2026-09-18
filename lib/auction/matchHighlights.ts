import { MatchEvent } from "./auctionTypes";

/** Presentation only: routine possession events remain in the simulation record. */
export function selectMatchHighlights(events: MatchEvent[], minute: number): MatchEvent[] {
  return events.filter((event) => event.minute <= minute && (
    event.type === "goal" || event.type === "save" || event.type === "miss" ||
    event.type === "attack_start" || event.type === "corner" ||
    (event.type === "chance" && (event.phase === "shot" ||
      (event.phase === "loose_ball" && event.zone === "penalty_area")))
  ));
}
