/**
 * Realtime Oyun Odası Varsayılan Ayarları ve Sabitleri (Room Defaults).
 * Süreler, popüler elit takım listesi ve oda konfigürasyon yardımcıları.
 */

import { Team } from "@/types/game";

export const DEFAULT_ROUND_DURATION = 15;
export const DEFAULT_PICK_DURATION = 5;
export const DEFAULT_MAX_ROUNDS = 5;

/**
 * 18 Elit Takım ve Supabase Storage CDN Logo URL'leri (Tek Doğru Kaynak).
 */
export const DEFAULT_POPULAR_TEAMS: Team[] = [
  { id: "cmtfrb40e00dtu6k4wklez572", name: "Real Madrid", country: "Spain", league: "La Liga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40e00dtu6k4wklez572.svg" },
  { id: "cmtfrb40c003au6k4nfn56sus", name: "FC Barcelona", country: "Spain", league: "La Liga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c003au6k4nfn56sus.png" },
  { id: "cmtfrb40c003lu6k4drdv5sfi", name: "Galatasaray", country: "Türkiye", league: "Süper Lig", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c003lu6k4drdv5sfi.svg" },
  { id: "cmtfrb40e00bpu6k4hmbu9cbf", name: "Fenerbahçe", country: "Türkiye", league: "Süper Lig", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40e00bpu6k4hmbu9cbf.png" },
  { id: "cmtfrb40b001xu6k47fc7n16j", name: "Beşiktaş", country: "Türkiye", league: "Süper Lig", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40b001xu6k47fc7n16j.svg" },
  { id: "cmtfrb40f00f8u6k4sot14ojx", name: "AC Milan", country: "Italy", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00f8u6k4sot14ojx.svg" },
  { id: "cmtfrb40f00elu6k4tgttd211", name: "Inter Milan", country: "Italy", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00elu6k4tgttd211.svg" },
  { id: "cmtfrb40f00fdu6k4upvw15gj", name: "Juventus", country: "Italy", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00fdu6k4upvw15gj.svg" },
  { id: "cmtfrb40g00lxu6k4zyc9ngsw", name: "Manchester United", country: "England", league: "Premier League", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40g00lxu6k4zyc9ngsw.png" },
  { id: "cmtfrb40f00hbu6k4ixa7ye8a", name: "Chelsea FC", country: "England", league: "Premier League", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00hbu6k4ixa7ye8a.png" },
  { id: "cmtfrb40d008pu6k4jemghzq0", name: "Bayern München", country: "Germany", league: "Bundesliga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40d008pu6k4jemghzq0.svg" },
  { id: "cmtfrb40c004nu6k4gn075jtk", name: "Borussia Dortmund", country: "Germany", league: "Bundesliga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c004nu6k4gn075jtk.svg" },
  { id: "cmtfrb40c0036u6k463i99nss", name: "Atlético de Madrid", country: "Spain", league: "La Liga", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c0036u6k463i99nss.png" },
  { id: "cmtfrj6ve000pu6t8gspq4v3h", name: "Boca Juniors", country: "Argentina", league: "Primera División", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrj6ve000pu6t8gspq4v3h.svg" },
  { id: "cmtfrb40c0064u6k4rd98tz21", name: "River Plate", country: "Argentina", league: "Primera División", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c0064u6k4rd98tz21.svg" },
  { id: "cmtfrj0ul000cu6t8j88ybi62", name: "Flamengo", country: "Brazil", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrj0ul000cu6t8j88ybi62.svg" },
  { id: "cmtfrb40c006eu6k4xv2lg93k", name: "Santos FC", country: "Brazil", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40c006eu6k4xv2lg93k.png" },
  { id: "cmtfrb40f00ggu6k4ck93hvci", name: "São Paulo FC", country: "Brazil", league: "Serie A", logoUrl: "https://mwfxdrejioteevtdehns.supabase.co/storage/v1/object/public/team-logos/cmtfrb40f00ggu6k4ck93hvci.svg" },
];

/**
 * Oda kimliğinden seçilen tur süresini çözer (örn: match_10s_xxx -> 10).
 */
export function resolveRoundDuration(roomId: string, defaultDuration = DEFAULT_ROUND_DURATION): number {
  const match = roomId.match(/_(\d+)s_/);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return defaultDuration;
}
