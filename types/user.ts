/**
 * Kullanıcı ve ELO/Rank sistemine ait tipler.
 */

export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface User {
  id: string;
  username: string;
  email: string;
  eloRating: number;
  rankTier: RankTier;
  createdAt: string;
}

export interface UserProfileSummary {
  id: string;
  username: string;
  eloRating: number;
  rankTier: RankTier;
  totalMatches: number;
  totalWins: number;
}
