import type { LucideIcon } from "lucide-react";
import { Swords, Trophy, Dumbbell, Zap, Gavel, Globe } from "lucide-react";

export type GameMode = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  players: string;
  image: string;
  icon: LucideIcon;
  ranked: boolean;
  badge?: string;
  queueTime: string;
  online: number;
  available: boolean;
};

export const gameModes: GameMode[] = [
  {
    id: "ranked",
    name: "1v1 Dereceli Düello",
    tagline: "Ortak futbolcuyu ilk yazan ELO'yu kapar",
    description:
      "İki kulüp, tek ortak efsane! 5 saniyede takımını seç, rakibinle eşleş ve her iki kulüpte de forma giymiş ortak futbolcuyu saniyeler içinde yazarak ligde yüksel.",
    players: "1v1",
    image: "/ranked-hero.png",
    icon: Trophy,
    ranked: true,
    badge: "SEZON 1",
    queueTime: "~00:05",
    online: 148,
    available: true,
  },
  {
    id: "custom",
    name: "Arkadaşınla Oyna",
    tagline: "Özel oda kodu ile dostane kapışma",
    description:
      "Özel bir lobi kur, oda kodunu arkadaşına gönder veya arkadaşının kurduğu odaya katılarak derece kaygısı olmadan antrenman yap.",
    players: "1v1",
    image: "/stadium-hero.png",
    icon: Swords,
    ranked: false,
    queueTime: "Anında",
    online: 84,
    available: true,
  },
  {
    id: "sandbox",
    name: "Sonsuz Seri (Sandbox)",
    tagline: "Süresiz tek kişilik futbol hafızası",
    description:
      "Rastgele kulüp eşleşmeleriyle futbol hafızanı test et. Süre baskısı yok, takıldığında ipucu al veya ortak oyuncuların tam listesini incele.",
    players: "Solo",
    image: "/stadium-hero.png",
    icon: Dumbbell,
    ranked: false,
    queueTime: "Anında",
    online: 32,
    available: true,
  },
  {
    id: "auction",
    name: "Açık Arttırma & Simülasyon",
    tagline: "4-8 Kişi Canlı Müzayede ve Kadro Savaşı",
    description:
      "100$ bütçeyle tahtaya gelen dünya yıldızlarına pey sür. 11 kişilik rüya kadronu kur ve turnuva simülasyonunda şampiyonluğa oyna!",
    players: "4-8 Kişi",
    image: "/cup-hero.png",
    icon: Gavel,
    ranked: false,
    badge: "ÇOK YAKINDA",
    queueTime: "Geliştirmede",
    online: 0,
    available: false,
  },
  {
    id: "grid",
    name: "Ülke x Takım Grid",
    tagline: "Brezilya x Real Madrid... Ortak yıldızları bul",
    description:
      "Belirlenen ülke ve kulüp kombinasyonlarında forma giymiş tüm efsaneleri tek tek listele ve hafıza rekorunu kır.",
    players: "Solo / 1v1",
    image: "/stadium-hero.png",
    icon: Globe,
    ranked: false,
    badge: "YAKINDA",
    queueTime: "Geliştirmede",
    online: 0,
    available: false,
  },
];

export type FriendStatus = "in-match" | "online" | "away" | "offline";

export type Friend = {
  id: string;
  name: string;
  tag: string;
  status: FriendStatus;
  activity: string;
  rank?: string;
};

export const friends: Friend[] = [
  { id: "1", name: "Emre_10", tag: "#TR1", status: "in-match", activity: "1v1 Dereceli • 2-1", rank: "Scout II" },
  { id: "2", name: "BurakScout", tag: "#TR2", status: "online", activity: "Lobide Bekliyor", rank: "Efsane" },
  { id: "3", name: "CanTaktik", tag: "#TR3", status: "online", activity: "Çevrimiçi", rank: "Scout I" },
  { id: "4", name: "Mert_FC", tag: "#TR4", status: "away", activity: "Uzakta (5dk)", rank: "Amatör" },
  { id: "5", name: "AhmetFutbol", tag: "#TR5", status: "offline", activity: "1 saat önce aktifti", rank: "Scout III" },
];

export const statusMeta: Record<FriendStatus, { label: string; dot: string }> = {
  "in-match": { label: "Maçta", dot: "bg-amber-400 animate-pulse" },
  online: { label: "Çevrimiçi", dot: "bg-emerald-400" },
  away: { label: "Uzakta", dot: "bg-zinc-500" },
  offline: { label: "Çevrimdışı", dot: "bg-zinc-700" },
};
