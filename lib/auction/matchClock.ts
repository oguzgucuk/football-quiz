/** One real second per match minute, shared by local and cloud servers. */
export const MATCH_DURATION_MS = 90_000;

export function matchMinuteAt(startedAt: number, now: number): number {
  return Math.min(90, Math.max(0, Math.floor((now - startedAt) * 90 / MATCH_DURATION_MS)));
}

export function matchStartAtMinute(minute: number, now: number): number {
  return now - Math.min(90, Math.max(0, minute)) * MATCH_DURATION_MS / 90;
}
