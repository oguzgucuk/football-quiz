/**
 * Yapay zeka (bot) oyuncu simülasyonu ve yardımcı fonksiyonları.
 * 1v1 maçlarda rakip olmadığında veya bot isteğinde oyuncu ve takım seçimi sağlar.
 */

import { Team, Nation } from "@/types/game";
import { RoomPlayer } from "./roomState";
import { POPULAR_NATIONS } from "../data/nations";

const BOT_USER_PREFIX = "bot_";
const BOT_NAMES = [
  "Yapay Zeka",
  "Hızlı Forvet",
  "Taktik Dehası",
  "Gol Makinesi",
  "Futbol Dehası",
];

export function isBotPlayer(userId?: string | null): boolean {
  if (!userId) return false;
  return userId.startsWith(BOT_USER_PREFIX);
}

export function pickBotTeam(availableTeams: Team[]): Team {
  if (!availableTeams.length) {
    throw new Error("Bot takım seçimi için kullanılabilir takım listesi boş olamaz.");
  }
  const randomIndex = Math.floor(Math.random() * availableTeams.length);
  return availableTeams[randomIndex];
}

export function pickBotNation(availableNations: Nation[] = POPULAR_NATIONS): Nation {
  if (!availableNations.length) {
    throw new Error("Bot millet seçimi için liste boş olamaz.");
  }
  const topSlice = availableNations.slice(0, 10);
  const randomIndex = Math.floor(Math.random() * topSlice.length);
  return topSlice[randomIndex];
}

export function createBotPlayer(availableTeams: Team[]): { player: RoomPlayer; team: Team } {
  const botUserId = `${BOT_USER_PREFIX}${Math.random().toString(36).substring(2, 7)}`;
  const randomName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const botTeam = pickBotTeam(availableTeams);

  const player: RoomPlayer = {
    userId: botUserId,
    username: randomName,
    score: 0,
    isReady: true,
    selectedTeamId: botTeam.id,
  };

  return { player, team: botTeam };
}

export function getBotOpponentMetadata(): { userId: string; username: string; eloRating: number } {
  return {
    userId: "bot_ai",
    username: "Yapay Zeka",
    eloRating: 1000,
  };
}
