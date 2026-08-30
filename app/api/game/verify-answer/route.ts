/**
 * Kullanıcının gönderdiği futbolcu ismini iki takımın ortak oyuncu havuzunda doğrular.
 * Aksan temizleme, tam isim, tek kelimelik soyadı/isim ve Levenshtein typo toleransı içerir.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { normalizeText } from "@/lib/validation/normalizeText";
import { isTypoMatch } from "@/lib/validation/levenshtein";
import { z } from "zod";

const verifyAnswerInputSchema = z.object({
  team1Id: z.string().min(1, "Takım 1 ID gereklidir"),
  team2Id: z.string().min(1, "Takım 2 ID gereklidir"),
  submittedName: z.string().trim().min(2, "Oyuncu adı en az 2 karakter olmalıdır"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyAnswerInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz istek parametreleri", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { team1Id, team2Id, submittedName } = parsed.data;
    const normalizedInput = normalizeText(submittedName);

    if (!normalizedInput || normalizedInput.length < 2) {
      return NextResponse.json({ isCorrect: false, player: null });
    }

    // Her iki takımda da oynamış tüm ortak oyuncuları getir
    const commonPlayers = await prisma.player.findMany({
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

    // İsim tam eşleşme, parçalı kelime eşleşmesi, Levenshtein typo toleransı
    const matchedPlayer = commonPlayers.find((p) => {
      const normalizedPlayerName = normalizeText(p.fullName);

      // 1. Birebir tam eşleşme veya tüm isimde 1-2 harf typo toleransı
      if (normalizedPlayerName === normalizedInput) return true;
      if (isTypoMatch(normalizedInput, normalizedPlayerName)) return true;

      // 2. İsim parçaları kontrolü (örn: "Rüştü Reçber" -> ["rustu", "recber"])
      const nameParts = normalizedPlayerName.split(" ").filter((part) => part.length >= 2);
      const inputParts = normalizedInput.split(" ").filter((part) => part.length >= 2);

      // Gönderilen herhangi bir kelime parçası (örn: "rustu" veya "recber" veya "recoberi")
      for (const inputPart of inputParts) {
        for (const namePart of nameParts) {
          if (isTypoMatch(inputPart, namePart)) {
            return true;
          }
        }
      }

      // 3. Alt dize kontrolü
      if (normalizedInput.length >= 4 && normalizedPlayerName.includes(normalizedInput)) {
        return true;
      }

      return false;
    });

    if (matchedPlayer) {
      return NextResponse.json({
        isCorrect: true,
        player: {
          id: matchedPlayer.id,
          fullName: matchedPlayer.fullName,
          nationality: matchedPlayer.nationality,
        },
      });
    }

    // Doğru bulunamadıysa eksik log tablosuna kaydet
    await prisma.missingAnswerLog.create({
      data: {
        submittedName,
        team1Id,
        team2Id,
      },
    });

    return NextResponse.json({
      isCorrect: false,
      player: null,
    });
  } catch (error) {
    console.error("[API /api/game/verify-answer] Hata:", error);
    return NextResponse.json(
      { error: "Cevap doğrulanamadı" },
      { status: 500 }
    );
  }
}
