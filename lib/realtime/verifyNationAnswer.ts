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
import { getNationById, findNationByIdOrAlias } from "../data/nations";
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
  const fullNation =
    getNationById(nation.id) ||
    findNationByIdOrAlias(nation.id || nation.name || "") ||
    nation;

  const nationKey = (fullNation.id || nation.id || "unknown").toLowerCase();
  const cacheKey = getNationCacheKey(nationKey, teamId);
  const now = Date.now();
  const cached = nationPlayersCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.players;
  }

  // Veritabanındaki nationality değerleri (ör. "Brazil", "Brezilya", "Brasil")
  const rawQueries = [
    fullNation.englishName,
    fullNation.name,
    nation.englishName,
    nation.name,
    ...(fullNation.aliases || []),
    ...(nation.aliases || []),
  ];

  const nationalityQueries = Array.from(
    new Set(rawQueries.filter((q): q is string => typeof q === "string" && q.trim().length > 0))
  );

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
