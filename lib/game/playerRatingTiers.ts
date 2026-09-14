/**
 * Oyuncu Reyting Kademeleri Görsel Tasarım Sistemi.
 * 90+ Elmas, 80-89 Altın, 72-79 Gümüş ve <72 Bronz kademelerini
 * tüm oyun modları için ortak görsel belirteçlerle (token) tanımlar.
 */

export type RatingTierKey = "diamond" | "gold" | "silver" | "bronze" | "standard";

export interface RatingTierStyle {
  tier: RatingTierKey;
  tierName: string;
  badgeClass: string;
  badgeSubtle: string;
  cardBorder: string;
  glowGradient: string;
  ambientBlur: string;
  pillClass: string;
  accentText: string;
  iconColor: string;
}

const DIAMOND_STYLE: RatingTierStyle = {
  tier: "diamond",
  tierName: "ELMAS",
  badgeClass:
    "bg-cyan-950/90 border-2 border-cyan-400/70 text-cyan-200 font-black shadow-[0_2px_14px_rgba(56,189,248,0.25)]",
  badgeSubtle:
    "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40",
  cardBorder:
    "border-cyan-400/40 hover:border-cyan-300 shadow-[0_4px_20px_rgba(0,0,0,0.7)]",
  glowGradient: "from-cyan-950/30 via-[#0c1612]/90 to-[#0c1612]",
  ambientBlur: "bg-cyan-400/10 shadow-[0_0_30px_rgba(56,189,248,0.15)]",
  pillClass:
    "bg-cyan-950/60 text-cyan-200 border border-cyan-400/40",
  accentText: "text-cyan-300",
  iconColor: "text-cyan-300",
};

const GOLD_STYLE: RatingTierStyle = {
  tier: "gold",
  tierName: "ALTIN",
  badgeClass:
    "bg-amber-950/90 border-2 border-amber-400/70 text-amber-200 font-black shadow-[0_2px_14px_rgba(251,191,36,0.25)]",
  badgeSubtle:
    "bg-amber-500/20 text-amber-300 border border-amber-400/40",
  cardBorder:
    "border-amber-400/40 hover:border-amber-300 shadow-[0_4px_20px_rgba(0,0,0,0.7)]",
  glowGradient: "from-amber-950/30 via-[#0c1612]/90 to-[#0c1612]",
  ambientBlur: "bg-amber-400/10 shadow-[0_0_30px_rgba(251,191,36,0.15)]",
  pillClass:
    "bg-amber-950/60 text-amber-200 border border-amber-400/40",
  accentText: "text-amber-300",
  iconColor: "text-amber-400",
};

const SILVER_STYLE: RatingTierStyle = {
  tier: "silver",
  tierName: "GÜMÜŞ",
  badgeClass:
    "bg-slate-900 border-2 border-slate-300/70 text-slate-100 font-black shadow-[0_2px_12px_rgba(226,232,240,0.2)]",
  badgeSubtle:
    "bg-slate-400/20 text-slate-200 border border-slate-300/40",
  cardBorder:
    "border-slate-400/35 hover:border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.7)]",
  glowGradient: "from-slate-900/30 via-[#0c1612]/90 to-[#0c1612]",
  ambientBlur: "bg-slate-300/10 shadow-[0_0_24px_rgba(226,232,240,0.1)]",
  pillClass:
    "bg-slate-900 text-slate-200 border border-slate-400/35",
  accentText: "text-slate-200",
  iconColor: "text-slate-300",
};

const BRONZE_STYLE: RatingTierStyle = {
  tier: "bronze",
  tierName: "BRONZ",
  badgeClass:
    "bg-[#241407] border-2 border-amber-700/70 text-amber-200 font-black shadow-[0_2px_12px_rgba(180,83,9,0.2)]",
  badgeSubtle:
    "bg-amber-900/30 text-amber-300 border border-amber-700/40",
  cardBorder:
    "border-amber-800/40 hover:border-amber-700 shadow-[0_4px_20px_rgba(0,0,0,0.7)]",
  glowGradient: "from-[#241407]/30 via-[#0c1612]/90 to-[#0c1612]",
  ambientBlur: "bg-amber-800/10 shadow-[0_0_20px_rgba(180,83,9,0.1)]",
  pillClass:
    "bg-[#241407] text-amber-200 border border-amber-800/40",
  accentText: "text-amber-400",
  iconColor: "text-amber-500",
};

const STANDARD_STYLE: RatingTierStyle = {
  tier: "standard",
  tierName: "STANDART",
  badgeClass: "bg-zinc-800 text-zinc-300 font-bold border border-white/10",
  badgeSubtle: "bg-white/5 text-zinc-400 border border-white/10",
  cardBorder: "border-white/10 hover:border-white/20",
  glowGradient: "from-white/5 to-black/80",
  ambientBlur: "bg-white/5 shadow-none",
  pillClass: "bg-white/5 text-zinc-400 border border-white/10",
  accentText: "text-zinc-400",
  iconColor: "text-zinc-500",
};

/**
 * Verilen reyting değerine göre kademe stil nesnesini döndürür.
 * - 90+: Elmas (Diamond)
 * - 80-89: Altın (Gold)
 * - 72-79: Gümüş (Silver)
 * - <72: Bronz (Bronze)
 */
export function getRatingTier(rating: number | null | undefined): RatingTierStyle {
  if (rating === null || rating === undefined || Number.isNaN(rating)) {
    return STANDARD_STYLE;
  }
  if (rating >= 90) return DIAMOND_STYLE;
  if (rating >= 80) return GOLD_STYLE;
  if (rating >= 72) return SILVER_STYLE;
  return BRONZE_STYLE;
}
