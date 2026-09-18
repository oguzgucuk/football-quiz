export type RandomSource = () => number;

/** Stable, dependency-free string hash used to seed match simulations. */
export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32: small deterministic PRNG suitable for gameplay simulation. */
export function createSeededRandom(seed: string | number): RandomSource {
  let state = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T>(
  candidates: Array<{ item: T; weight: number }>,
  random: RandomSource = Math.random
): T | undefined {
  const valid = candidates.filter((candidate) => Number.isFinite(candidate.weight) && candidate.weight > 0);
  const total = valid.reduce((sum, candidate) => sum + candidate.weight, 0);
  if (total <= 0) return undefined;

  let roll = random() * total;
  for (const candidate of valid) {
    if (roll < candidate.weight) return candidate.item;
    roll -= candidate.weight;
  }
  return valid.at(-1)?.item;
}
