/**
 * Kullanıcının gönderdiği futbolcu ismini doğrular.
 * Hem iki kulübün ortak oyuncusunu (team_vs_team) hem de
 * millet + kulüp eşleşmesini (country_vs_team) destekler.
 */

import { NextResponse } from "next/server";
import { verifyPlayerAnswerInServer } from "@/lib/realtime/verifyPlayerAnswerInServer";
import { verifyNationAnswerInServer } from "@/lib/realtime/verifyNationAnswer";
import { getNationById, findNationByIdOrAlias } from "@/lib/data/nations";
import { Nation } from "@/types/game";
import { z } from "zod";

const verifyAnswerInputSchema = z.object({
  team1Id: z.string().min(1, "Takım 1 ID gereklidir"),
  team2Id: z.string().optional(),
  nation: z
    .object({
      id: z.string(),
      name: z.string().optional(),
      englishName: z.string().optional(),
      aliases: z.array(z.string()).optional(),
      flagCode: z.string().optional(),
      flagUrl: z.string().optional(),
    })
    .passthrough()
    .optional(),
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

    const { team1Id, team2Id, nation, submittedName } = parsed.data;

    let result: { isCorrect: boolean; playerName?: string };

    if (nation) {
      const canonicalNation =
        getNationById(nation.id) ||
        findNationByIdOrAlias(nation.id || nation.name || "") ||
        (nation as Nation);

      result = await verifyNationAnswerInServer(submittedName, canonicalNation, team1Id);
    } else if (team2Id) {
      result = await verifyPlayerAnswerInServer(submittedName, team1Id, team2Id);
    } else {
      return NextResponse.json(
        { error: "team2Id veya nation parametresi zorunludur" },
        { status: 400 }
      );
    }

    if (result.isCorrect && result.playerName) {
      return NextResponse.json({
        isCorrect: true,
        playerName: result.playerName,
        player: {
          id: result.playerName,
          fullName: result.playerName,
        },
      });
    }

    return NextResponse.json({
      isCorrect: false,
      player: null,
      playerName: null,
    });
  } catch (error) {
    console.error("[API /api/game/verify-answer] Hata:", error);
    return NextResponse.json(
      { error: "Cevap doğrulanamadı" },
      { status: 500 }
    );
  }
}
