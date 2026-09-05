/**
 * Millet-Takım modu için sunucu-taraflı yetkili (authoritative) cevap doğrulama fonksiyonu.
 * Oyuncunun belirtilen kulüpte forma giydiğini VE belirtilen milletten olduğunu doğrular.
 * 
 * Özellikler:
 * - 30 saniye TTL'li In-Memory önbellek (tur boyunca DB'ye gereksiz gitmez).
 * - matchPlayerAnswer saf fonksiyonu ile aksan, küçük/büyük harf ve typo toleransı.
 * - Server-Side Authoritative doğrulama.
 */

import { prisma } from "../db/client";
import { matchPlayerAnswer, CandidatePlayer } from "../validation/matchPlayerAnswer";
import { Nation } from "@/types/game";

interface CachedNationPlayers {
  timestamp: number;
  players: CandidatePlayer[];
}

const nationPlayersCache = new Map<string, CachedNationPlayers>();
const CACHE_TTL_MS = 30 * 1000;

function getNationCacheKey(nationId: string, teamId: string): string {
  return `${nationId.toLowerCase()}::${teamId}`;
}

export async function getNationTeamPlayersForRound(
  nation: Nation,
  teamId: string
): Promise<CandidatePlayer[]> {
  const cacheKey = getNationCacheKey(nation.id, teamId);
  const now = Date.now();
  const cached = nationPlayersCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.players;
  }

  // Veritabanındaki nationality değerleri (ör. "Brazil", "Brezilya", "Brasil")
  const nationalityQueries = [
    nation.englishName,
    nation.name,
    ...nation.aliases,
  ];

  const dbPlayers = await prisma.player.findMany({
    where: {
      teamsHistory: { some: { teamId } },
      nationality: { in: nationalityQueries, mode: "insensitive" },
    },
    select: {
      id: true,
      fullName: true,
      nationality: true,
    },
  });

  const candidatePlayers: CandidatePlayer[] = dbPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    nationality: p.nationality,
  }));

  nationPlayersCache.set(cacheKey, {
    timestamp: now,
    players: candidatePlayers,
  });

  // Eski kayıtları temizle
  if (nationPlayersCache.size > 100) {
    for (const [key, val] of nationPlayersCache) {
      if (now - val.timestamp >= CACHE_TTL_MS) {
        nationPlayersCache.delete(key);
      }
    }
  }

  return candidatePlayers;
}

export async function verifyNationAnswerInServer(
  submittedName: string,
  nation: Nation,
  teamId: string
): Promise<{ isCorrect: boolean; playerName?: string }> {
  if (!submittedName || submittedName.trim().length < 2) {
    return { isCorrect: false };
  }

  const candidatePlayers = await getNationTeamPlayersForRound(nation, teamId);
  const matched = matchPlayerAnswer(submittedName, candidatePlayers);

  if (matched) {
    return {
      isCorrect: true,
      playerName: matched.fullName,
    };
  }

  return { isCorrect: false };
}
