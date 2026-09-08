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
    "bg-gradient-to-br from-cyan-200 via-sky-300 to-blue-500 text-slate-950 font-black shadow-[0_0_22px_rgba(56,189,248,0.6)] border-2 border-cyan-200",
  badgeSubtle:
    "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(56,189,248,0.3)]",
  cardBorder:
    "border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.25)]",
  glowGradient: "from-cyan-950/80 via-sky-950/40 to-black/80",
  ambientBlur: "bg-cyan-400/25 shadow-[0_0_90px_rgba(56,189,248,0.5)]",
  pillClass:
    "bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-cyan-200 border border-cyan-400/40 shadow-[0_0_8px_rgba(56,189,248,0.3)]",
  accentText: "text-cyan-300",
  iconColor: "text-cyan-300",
};

const GOLD_STYLE: RatingTierStyle = {
  tier: "gold",
  tierName: "ALTIN",
  badgeClass:
    "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-amber-950 font-black shadow-[0_0_18px_rgba(251,191,36,0.5)] border-2 border-amber-300",
  badgeSubtle:
    "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.25)]",
  cardBorder:
    "border-amber-400/45 hover:border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.2)]",
  glowGradient: "from-amber-950/70 via-yellow-950/35 to-black/80",
  ambientBlur: "bg-amber-400/20 shadow-[0_0_75px_rgba(251,191,36,0.4)]",
  pillClass:
    "bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-200 border border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.25)]",
  accentText: "text-amber-300",
  iconColor: "text-amber-400",
};

const SILVER_STYLE: RatingTierStyle = {
  tier: "silver",
  tierName: "GÜMÜŞ",
  badgeClass:
    "bg-gradient-to-br from-slate-100 via-zinc-200 to-slate-400 text-zinc-900 font-black shadow-[0_0_12px_rgba(226,232,240,0.4)] border-2 border-slate-200",
  badgeSubtle:
    "bg-slate-400/20 text-slate-200 border border-slate-300/40 shadow-[0_0_8px_rgba(226,232,240,0.2)]",
  cardBorder:
    "border-slate-400/35 hover:border-slate-300 shadow-[0_0_12px_rgba(226,232,240,0.15)]",
  glowGradient: "from-slate-900/70 via-zinc-900/40 to-black/80",
  ambientBlur: "bg-slate-300/15 shadow-[0_0_60px_rgba(226,232,240,0.3)]",
  pillClass:
    "bg-gradient-to-r from-slate-500/20 to-zinc-500/20 text-slate-200 border border-slate-400/35",
  accentText: "text-slate-200",
  iconColor: "text-slate-300",
};

const BRONZE_STYLE: RatingTierStyle = {
  tier: "bronze",
  tierName: "BRONZ",
  badgeClass:
    "bg-gradient-to-br from-amber-700 via-orange-800 to-amber-950 text-amber-100 font-black shadow-[0_0_10px_rgba(180,83,9,0.35)] border-2 border-amber-600/70",
  badgeSubtle:
    "bg-amber-900/30 text-amber-300 border border-amber-700/40 shadow-[0_0_6px_rgba(180,83,9,0.2)]",
  cardBorder:
    "border-amber-800/40 hover:border-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.15)]",
  glowGradient: "from-amber-950/80 via-stone-950/50 to-black/80",
  ambientBlur: "bg-amber-800/15 shadow-[0_0_50px_rgba(180,83,9,0.25)]",
  pillClass:
    "bg-gradient-to-r from-amber-900/30 to-orange-950/30 text-amber-200 border border-amber-800/40",
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
