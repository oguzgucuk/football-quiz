/**
 * Güvenli internal HTTP endpoint — PartyKit game sunucusunun maç bitiminde
 * ELO hesaplaması ve maç kaydı için çağırdığı bridge rotası.
 *
 * Güvenlik: INTERNAL_API_SECRET header kontrolü ile public erişim engellenir.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { finalizeMatchAndPersistElo } from "@/lib/db/matches";

const finalizeMatchSchema = z.object({
  matchId: z.string().min(1),
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
  player1Score: z.number().int().min(0),
  player2Score: z.number().int().min(0),
  mode: z.string().optional().default("team_vs_team"),
  ranked: z.boolean().optional().default(true),
  rounds: z
    .array(
      z.object({
        roundNumber: z.number().int(),
        entity1Id: z.string(),
        entity2Id: z.string(),
        winnerUserId: z.string().nullable().optional(),
        answerGiven: z.string().nullable().optional(),
        timeTakenMs: z.number().nullable().optional(),
      })
    )
    .default([]),
});

export async function POST(req: Request) {
  // Internal secret kontrolü — sadece oyun sunucusu çağırabilir
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret) {
    const authHeader = req.headers.get("x-internal-secret");
    if (authHeader !== internalSecret) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const parsed = finalizeMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz parametreler", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await finalizeMatchAndPersistElo(parsed.data);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[API /api/game/finalize-match] Hata:", error);
    return NextResponse.json(
      { error: "Maç kaydedilemedi" },
      { status: 500 }
    );
  }
}
