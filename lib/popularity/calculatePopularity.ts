/**
 * POPÜLERLİK HESAPLAMA ÇEKİRDEĞİ (POPULARITY_RANKING.md Spesifikasyonu)
 * 
 * Hiçbir oyuncu veya kulüp için elle sayı girilmez.
 * 1. Piyasa Değeri Sinyali (Logaritmik Normalizasyon, %50 ağırlık)
 * 2. Transfer Sayısı Sinyali (%30 ağırlık)
 * 3. En Yüksek Kulüp Prestij Sinyali (%20 ağırlık)
 */

export function logNormalize(value: number, maxValue: number): number {
  if (value <= 0) return 0;
  return Math.log(value + 1) / Math.log(maxValue + 1);
}

export function linearNormalize(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) return 0;
  return Math.min(value / maxValue, 1);
}

export const MAX_MARKET_VALUE_EUR = 200_000_000; // 200M €
export const MAX_TRANSFERS_COUNT = 15;

export interface PlayerPopularityInput {
  marketValueEur: number;
  transferCount: number;
  maxClubPrestige: number; // 0-100 arası
}

export function calculatePlayerPopularity(input: PlayerPopularityInput): number {
  const marketScore = logNormalize(input.marketValueEur, MAX_MARKET_VALUE_EUR);
  const transferScore = linearNormalize(input.transferCount, MAX_TRANSFERS_COUNT);
  const clubPrestigeScore = Math.min(1, Math.max(0, input.maxClubPrestige / 100));

  const rawScore = marketScore * 0.5 + transferScore * 0.3 + clubPrestigeScore * 0.2;
  return Math.min(100, Math.max(1, Math.round(rawScore * 100)));
}

export interface TeamPopularityInput {
  squadValueEur: number;
  maxSquadValueInDb: number;
  playerCount: number;
}

export function calculateTeamPopularity(input: TeamPopularityInput): number {
  const squadScore = logNormalize(input.squadValueEur, input.maxSquadValueInDb);
  const countScore = linearNormalize(input.playerCount, 200);

  const rawScore = squadScore * 0.7 + countScore * 0.3;
  return Math.min(100, Math.max(5, Math.round(rawScore * 100)));
}
