/**
 * Kullanıcının gönderdiği futbolcu ismini iki takımın ortak oyuncu havuzunda doğrular.
 * Aksan, tam isim, tek kelimelik soyadı/isim (örn: "Pique", "Bale", "Zidane") ve çoklu isim toleransı içerir.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { normalizeText } from "@/lib/validation/normalizeText";
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

    // İsim tam eşleşme, parçalı kelime eşleşmesi veya alt dize kontrolü
    const matchedPlayer = commonPlayers.find((p) => {
      const normalizedPlayerName = normalizeText(p.fullName);

      // 1. Birebir tam eşleşme (örn: "gareth bale" === "gareth bale")
      if (normalizedPlayerName === normalizedInput) return true;

      // 2. İsim parçaları kontrolü (örn: "Gerard Pique Bernabeu" -> ["gerard", "pique", "bernabeu"])
      const nameParts = normalizedPlayerName.split(" ").filter((part) => part.length >= 2);
      if (nameParts.includes(normalizedInput)) return true;

      // 3. Kullanıcı adı tam ismin başlangıcı veya alt dizesi mi? (örn: "gerard pique" in "gerard pique bernabeu")
      if (normalizedInput.length >= 4) {
        if (normalizedPlayerName.includes(normalizedInput)) return true;
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
