/**
 * WebSocket ve Realtime oyun sunucuları için sunucu-taraflı güvenli (authoritative)
 * cevap doğrulama fonksiyonu.
 * 
 * Özellikler:
 * - 30 saniye TTL'li In-Memory Önbellek (Aynı turun 15 saniyelik süresinde DB'ye tekrar gitmez).
 * - matchPlayerAnswer saf fonksiyonuyla aksan, typo ve önek toleransı.
 * - İstemci manipülasyonunu ve sahte skor gönderimlerini engeller.
 */

import { prisma } from "../db/client";
import { matchPlayerAnswer, CandidatePlayer } from "../validation/matchPlayerAnswer";
import { logMissingAnswer } from "../db/missingAnswers";

interface CachedCommonPlayers {
  timestamp: number;
  players: CandidatePlayer[];
}

// 30 saniye TTL bellek içi tur önbelleği
const commonPlayersCache = new Map<string, CachedCommonPlayers>();
const CACHE_TTL_MS = 30 * 1000;

function getCacheKey(team1Id: string, team2Id: string): string {
  return [team1Id, team2Id].sort().join("::");
}

export async function getCommonPlayersForRound(
  team1Id: string,
  team2Id: string
): Promise<CandidatePlayer[]> {
  const cacheKey = getCacheKey(team1Id, team2Id);
  const now = Date.now();
  const cached = commonPlayersCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.players;
  }

  const dbPlayers = await prisma.player.findMany({
    where: {
      teamsHistory: { some: { teamId: team1Id } },
      AND: [{ teamsHistory: { some: { teamId: team2Id } } }],
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

  commonPlayersCache.set(cacheKey, {
    timestamp: now,
    players: candidatePlayers,
  });

  // Eski önbellek kayıtlarını periyodik temizle
  if (commonPlayersCache.size > 100) {
    for (const [key, val] of commonPlayersCache) {
      if (now - val.timestamp >= CACHE_TTL_MS) {
        commonPlayersCache.delete(key);
      }
    }
  }

  return candidatePlayers;
}

export async function verifyPlayerAnswerInServer(
  submittedName: string,
  team1Id: string,
  team2Id: string
): Promise<{ isCorrect: boolean; playerName?: string }> {
  if (!submittedName || submittedName.trim().length < 2) {
    return { isCorrect: false };
  }

  const commonPlayers = await getCommonPlayersForRound(team1Id, team2Id);
  const matched = matchPlayerAnswer(submittedName, commonPlayers);

  if (matched) {
    return {
      isCorrect: true,
      playerName: matched.fullName,
    };
  }

  // P1-4: Yanlış veya eksik cevabı tekilleştirilmiş olarak arka planda logla
  logMissingAnswer({
    rawAnswer: submittedName,
    team1Id,
    team2Id,
  }).catch((err) => {
    console.error("[verifyPlayerAnswerInServer] logMissingAnswer error:", err);
  });

  return { isCorrect: false };
}
