/**
 * İki oyuncu arasındaki maç sonucuna göre ELO puan değişimini hesaplar.
 *
 * @example
 * // 1000 puanlı oyuncu, 1000 puanlı rakibi yendiğinde:
 * calculateEloChange({ playerElo: 1000, opponentElo: 1000, isWinner: true })
 * // => 16
 *
 * @example
 * // 1000 puanlı oyuncu, 1000 puanlı rakibe yenildiğinde:
 * calculateEloChange({ playerElo: 1000, opponentElo: 1000, isWinner: false })
 * // => -16
 */

interface EloCalculationParams {
  playerElo: number;
  opponentElo: number;
  isWinner: boolean;
  kFactor?: number;
}

const DEFAULT_K_FACTOR = 32;

export function calculateEloChange({
  playerElo,
  opponentElo,
  isWinner,
  kFactor = DEFAULT_K_FACTOR,
}: EloCalculationParams): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = isWinner ? 1 : 0;
  const rawChange = kFactor * (actualScore - expectedScore);

  return Math.round(rawChange);
}
