# Auction match simulation

Production entry point: `simulateMatch.ts` → `statefulMatchEngine.ts`.
Gameplay and narration use separate seeded random streams. Presentation changes
must not change scores or consume gameplay randomness.

The September integration retains the tested stateful engine, canonical lineup
validation and per-viewer event filtering. Main's storage/reconnect fixes and
three-diamond-cards-per-participant target are preserved.

The alternative zone engine and halftime UI from main are retained as inactive
code. Halftime substitution/tactic messages are not handled by the production
server: that implementation re-simulated already revealed first-half results.
A future integration must simulate only the unplayed half, validate substitutes,
preserve historical events and pass the same deterministic balance tests.

Match playback lasts 90 real seconds (one second per match minute), using the
shared `matchClock.ts` on local and cloud servers. The client uses server minutes,
never its wall clock. Network stalls may cause catch-up; future events are never
sent merely to smooth the clock. The progress bar interpolates visually only.

The match feed shows shots, goals, saves, dangerous attacking entries, corners
and attacking rebounds inside the penalty area. Routine interceptions stay in
the engine record but are hidden in the UI.

Validation:

```sh
pnpm test:sim:v2
pnpm exec tsx scripts/test-auction-presentation.ts
pnpm exec tsx scripts/test-auction-cloud-regressions.ts
pnpm exec tsx scripts/test-auction-engine.ts
pnpm exec tsx scripts/test-auction-simulation-flow.ts
pnpm exec next build
```
