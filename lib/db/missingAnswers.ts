/**
 * Eksik veya Yanlış Oyuncu Cevapları Loglama ve Tekilleştirme (Dedup) Servisi.
 * P1-4: Her yanlış cevapta veritabanına yeni satır açılmasını önler,
 * @@unique([normalizedAnswer, team1Id, team2Id]) bileşik anahtarı üzerinde
 * attemptCount sayısını atomik olarak artırır (upsert).
 */

import { prisma } from "./client";
import { normalizeText } from "../validation/normalizeText";

export interface LogMissingAnswerParams {
  rawAnswer: string;
  team1Id: string;
  team2Id: string;
}

/**
 * Yanlış/bilinmeyen oyuncu cevabını tekilleştirilmiş olarak kaydeder veya deneme sayısını artırır.
 * Hata durumunda oyun döngüsünü aksatmaz (non-blocking).
 */
export async function logMissingAnswer({
  rawAnswer,
  team1Id,
  team2Id,
}: LogMissingAnswerParams): Promise<void> {
  const normalizedAnswer = normalizeText(rawAnswer);
  if (!normalizedAnswer || normalizedAnswer.length < 2) {
    return;
  }

  // Takım ID'lerini deterministik olarak sırala (A-B ile B-A aynı log satırında toplansın)
  const [t1, t2] = [team1Id, team2Id].sort();

  try {
    await prisma.missingAnswerLog.upsert({
      where: {
        normalizedAnswer_team1Id_team2Id: {
          normalizedAnswer,
          team1Id: t1,
          team2Id: t2,
        },
      },
      update: {
        attemptCount: { increment: 1 },
      },
      create: {
        normalizedAnswer,
        team1Id: t1,
        team2Id: t2,
        attemptCount: 1,
      },
    });
  } catch (error) {
    // Veritabanı loglama hatası oyunun gerçek zamanlı akışını kesintiye uğratmamalıdır
    console.error("[MissingAnswers] logMissingAnswer upsert hatası:", error);
  }
}
