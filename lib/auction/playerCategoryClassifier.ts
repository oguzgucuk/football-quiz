/**
 * Oyuncu Mevki Kategorisi Sınıflandırıcı (Tek Doğruluk Kaynağı).
 *
 * Kullanıcı Kuralı:
 * Oyuncular mevkilerine göre ayrılırken en çok hangi mevkide oynuyorsa o mevkinin oyuncusu olur.
 * Örneğin: ["LB", "CB", "RB", "CM", "LW"] -> 3 Defans, 1 Orta Saha, 1 Forvet -> DEFANS.
 *
 * Gruplar:
 * - KL (Kaleci): GK, KL, GOALKEEPER
 * - DEF (Defans): CB, LB, RB, LWB, RWB, DEF, SW
 * - ORT (Orta Saha): CDM, CM, CAM, LM, RM, MID
 * - FOR (Forvet): ST, CF, LW, RW, FWD, SS
 */

export type PositionCategoryKey = "gk" | "def" | "mid" | "fwd";

export const POSITION_CATEGORY_CONFIG: Record<
  PositionCategoryKey,
  {
    key: PositionCategoryKey;
    label: string;
    fullLabel: string;
    accentBadge: string;
    tagBadge: string;
    emptyBadge: string;
    positions: string[];
  }
> = {
  gk: {
    key: "gk",
    label: "KL",
    fullLabel: "Kaleci",
    accentBadge: "text-amber-300 bg-amber-950/70 border-amber-500/50",
    tagBadge: "text-amber-300 bg-amber-950/80 border-amber-500/60 font-black",
    emptyBadge: "text-amber-400/70 bg-amber-950/30 border-amber-500/30 border-dashed",
    positions: ["GK", "KL", "GOALKEEPER"],
  },
  def: {
    key: "def",
    label: "DEF",
    fullLabel: "Defans",
    accentBadge: "text-sky-300 bg-sky-950/70 border-sky-500/50",
    tagBadge: "text-sky-300 bg-sky-950/80 border-sky-500/60 font-black",
    emptyBadge: "text-zinc-500 bg-zinc-900/50 border-zinc-700/50 border-dashed",
    positions: ["CB", "LB", "RB", "LWB", "RWB", "DEF", "SW"],
  },
  mid: {
    key: "mid",
    label: "ORT",
    fullLabel: "Orta Saha",
    accentBadge: "text-emerald-300 bg-emerald-950/70 border-emerald-500/50",
    tagBadge: "text-emerald-300 bg-emerald-950/80 border-emerald-500/60 font-black",
    emptyBadge: "text-zinc-500 bg-zinc-900/50 border-zinc-700/50 border-dashed",
    positions: ["CDM", "CM", "CAM", "LM", "RM", "MID"],
  },
  fwd: {
    key: "fwd",
    label: "FOR",
    fullLabel: "Forvet",
    accentBadge: "text-rose-300 bg-rose-950/70 border-rose-500/50",
    tagBadge: "text-rose-300 bg-rose-950/80 border-rose-500/60 font-black",
    emptyBadge: "text-zinc-500 bg-zinc-900/50 border-zinc-700/50 border-dashed",
    positions: ["ST", "CF", "LW", "RW", "FWD", "SS"],
  },
};

/**
 * Oyuncunun mevkilerine göre en çok hangi grupta yer aldığını tespit eder.
 */
export function classifyPlayerCategory(
  positions: string[] = [],
  primaryPosition?: string
): PositionCategoryKey {
  const normPositions = positions.map((p) => p.toUpperCase());

  // Kaleci kontrolü: Eğer GK varsa veya primary Goalkeeper ise kesinlikle kalecidir
  if (
    normPositions.some((p) => POSITION_CATEGORY_CONFIG.gk.positions.includes(p)) ||
    (primaryPosition && POSITION_CATEGORY_CONFIG.gk.positions.includes(primaryPosition.toUpperCase()))
  ) {
    return "gk";
  }

  let defCount = 0;
  let midCount = 0;
  let fwdCount = 0;

  for (const pos of normPositions) {
    if (POSITION_CATEGORY_CONFIG.def.positions.includes(pos)) defCount++;
    else if (POSITION_CATEGORY_CONFIG.mid.positions.includes(pos)) midCount++;
    else if (POSITION_CATEGORY_CONFIG.fwd.positions.includes(pos)) fwdCount++;
  }

  // Eğer hiçbir mevkisi eşleşmediyse primaryPosition'a bak
  if (defCount === 0 && midCount === 0 && fwdCount === 0) {
    const pNorm = (primaryPosition || "CM").toUpperCase();
    if (POSITION_CATEGORY_CONFIG.def.positions.includes(pNorm) || pNorm === "DEFENDER") return "def";
    if (POSITION_CATEGORY_CONFIG.mid.positions.includes(pNorm) || pNorm === "MIDFIELD") return "mid";
    if (POSITION_CATEGORY_CONFIG.fwd.positions.includes(pNorm) || pNorm === "ATTACK") return "fwd";
    return "mid";
  }

  // En yüksek sayıyı bul
  if (defCount > midCount && defCount > fwdCount) return "def";
  if (midCount > defCount && midCount > fwdCount) return "mid";
  if (fwdCount > defCount && fwdCount > midCount) return "fwd";

  // Eşitlik durumunda primaryPosition belirleyicidir
  if (primaryPosition) {
    const pNorm = primaryPosition.toUpperCase();
    if (POSITION_CATEGORY_CONFIG.def.positions.includes(pNorm) && defCount > 0) return "def";
    if (POSITION_CATEGORY_CONFIG.mid.positions.includes(pNorm) && midCount > 0) return "mid";
    if (POSITION_CATEGORY_CONFIG.fwd.positions.includes(pNorm) && fwdCount > 0) return "fwd";
  }

  // Fallback hiyerarşisi
  if (defCount >= midCount && defCount >= fwdCount) return "def";
  if (midCount >= fwdCount) return "mid";
  return "fwd";
}

/**
 * Oyuncu listesini KL, DEF, ORT, FOR gruplarına böler.
 * Generic T tipi sayesinde id, fullName, overallPrime gibi tüm özellikleri korur.
 */
export function groupSquadByPositions<
  T extends { positions?: string[] | null; primaryPosition?: string | null }
>(squad: T[]): Record<PositionCategoryKey, T[]> {
  const groups: Record<PositionCategoryKey, T[]> = {
    gk: [],
    def: [],
    mid: [],
    fwd: [],
  };

  for (const player of squad) {
    const validPositions = Array.isArray(player.positions) ? player.positions : [];
    const validPrimary = player.primaryPosition ?? undefined;
    const cat = classifyPlayerCategory(validPositions, validPrimary);
    groups[cat].push(player);
  }

  return groups;
}
