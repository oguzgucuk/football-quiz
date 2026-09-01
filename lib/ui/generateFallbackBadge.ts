/**
 * SAF CLIENT-SIDE SVG FALLBACK ROZET ÜRETİCİSİ
 * 
 * Hiçbir harici ağ isteği yapmadan, takım adına göre deterministik renk paleti
 * ve 2 harfli monogram rozet (SVG) üretir.
 */

// Futbol kulüpleri için modern, zengin gradient ve renk paleti
const TEAM_COLOR_PALETTES = [
  { bg: "#1e3a8a", accent: "#3b82f6", text: "#ffffff" }, // Mavi (Chelsea, Everton vb.)
  { bg: "#991b1b", accent: "#ef4444", text: "#ffffff" }, // Kırmızı (Liverpool, Arsenal vb.)
  { bg: "#065f46", accent: "#10b981", text: "#ffffff" }, // Yeşil (Betis, Celtic vb.)
  { bg: "#854d0e", accent: "#eab308", text: "#ffffff" }, // Sarı / Altın (Dortmund, Fenerbahçe vb.)
  { bg: "#3730a3", accent: "#6366f1", text: "#ffffff" }, // İndigo (PSG vb.)
  { bg: "#701a75", accent: "#d946ef", text: "#ffffff" }, // Mor (Fiorentina vb.)
  { bg: "#1f2937", accent: "#4b5563", text: "#ffffff" }, // Koyu Gri / Siyah (Juventus, Beşiktaş vb.)
  { bg: "#0f766e", accent: "#14b8a6", text: "#ffffff" }, // Turkuaz (Trabzonspor vb.)
  { bg: "#9a3412", accent: "#f97316", text: "#ffffff" }, // Turuncu (Galatasaray vb.)
];

/**
 * Takım isminden deterministik bir renk indeksi üretir.
 */
function getTeamColorPalette(teamName: string) {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TEAM_COLOR_PALETTES.length;
  return TEAM_COLOR_PALETTES[index];
}

/**
 * Takım isminden 2 harfli monogram üretir.
 * Örn: "Real Madrid" -> "RM", "Galatasaray" -> "GS", "Chelsea" -> "CH"
 */
export function getTeamInitials(teamName: string): string {
  if (!teamName) return "FC";
  
  // SK, FK, FC gibi jenerik ekleri temizle
  const cleaned = teamName
    .replace(/\b(SK|FK|FC|CF|SC|AC|SS|AS|SD|US)\b/gi, "")
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  const singleWord = words[0] || teamName;
  return singleWord.slice(0, 2).toUpperCase();
}

/**
 * Saf SVG string üretir.
 */
export function generateFallbackBadgeSvg(teamName: string, customColor?: string): string {
  const initials = getTeamInitials(teamName);
  const palette = getTeamColorPalette(teamName);
  const bgColor = customColor || palette.bg;
  const accentColor = palette.accent;

  return `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="${accentColor}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#grad-${initials})" stroke="rgba(255,255,255,0.2)" stroke-width="2" filter="url(#shadow)" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="3,3" />
    <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;
}
