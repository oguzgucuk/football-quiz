/**
 * İki oyuncu arasındaki maç sonucuna göre standart ELO puan değişimini hesaplar.
 *
 * Matematiksel ELO Formülü:
 * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 * Değişim = K * (Skor - E_A)
 *
 * Neden K-Factor = 20 seçildi?
 * - Eşit ELO'ya sahip iki oyuncuda (örn. 1000 vs 1000) E_A = 0.5 olur.
 * - Kazanan için değişim: 20 * (1 - 0.5) = +10 puan.
 * - Kaybeden için değişim: 20 * (0 - 0.5) = -10 puan.
 * - Eşit olmayan senaryolarda:
 *   * Yüksek puanlı kazanırsa: az kazanır (+4 veya +5), düşük olan az kaybeder (-4 veya -5).
 *   * Düşük puanlı kazanırsa (sürpriz): çok kazanır (+15 veya +16), yüksek olan çok kaybeder (-15 veya -16).
 *
 * @example
 * // Eşit ELO (1000 vs 1000) - Kazanan:
 * calculateEloChange({ playerElo: 1000, opponentElo: 1000, isWinner: true })
 * // => +10
 *
 * @example
 * // Eşit ELO (1000 vs 1000) - Kaybeden:
 * calculateEloChange({ playerElo: 1000, opponentElo: 1000, isWinner: false })
 * // => -10
 *
 * @example
 * // Düşük puanlı (1000) yüksek puanlıyı (1200) yendiğinde:
 * calculateEloChange({ playerElo: 1000, opponentElo: 1200, isWinner: true })
 * // => +15
 */

export interface EloCalculationParams {
  playerElo: number;
  opponentElo: number;
  isWinner: boolean;
  isDraw?: boolean;
  kFactor?: number;
}

// Eşit ELO'larda tam +10 / -10 vermesi için K=20 kuralı
const DEFAULT_K_FACTOR = 20;

export function calculateEloChange({
  playerElo,
  opponentElo,
  isWinner,
  isDraw = false,
  kFactor = DEFAULT_K_FACTOR,
}: EloCalculationParams): number {
  // Beklenen skor: 0 ile 1 arasında olasılık değeri
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));

  // Gerçek skor: Galibiyet=1, Beraberlik=0.5, Mağlubiyet=0
  const actualScore = isDraw ? 0.5 : isWinner ? 1 : 0;

  const rawChange = kFactor * (actualScore - expectedScore);
  const roundedChange = Math.round(rawChange);

  // Galip gelen oyuncu aşırı fark olsa dahi en az +1 alsın, mağlup olan en az -1 düşsün
  if (isWinner && !isDraw && roundedChange <= 0) {
    return 1;
  }
  if (!isWinner && !isDraw && roundedChange >= 0) {
    return -1;
  }

  return roundedChange;
}

