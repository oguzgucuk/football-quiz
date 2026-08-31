/**
 * İki takımın ortak oyuncularını (en genç olanlardan başlayarak 3-5 adet) getiren API endpoint'i.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCommonPlayersByTeams } from "@/lib/db/players";

const querySchema = z.object({
  team1Id: z.string().min(1, "team1Id zorunludur"),
  team2Id: z.string().min(1, "team2Id zorunludur"),
  limit: z.coerce.number().min(1).max(10).default(5),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      team1Id: searchParams.get("team1Id"),
      team2Id: searchParams.get("team2Id"),
      limit: searchParams.get("limit") || 5,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz parametreler", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { team1Id, team2Id, limit } = parsed.data;

    const commonPlayers = await getCommonPlayersByTeams(team1Id, team2Id, limit);

    return NextResponse.json({
      success: true,
      commonPlayers: commonPlayers.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        nationality: p.nationality,
        birthDate: p.birthDate ? p.birthDate.toISOString().split("T")[0] : null,
      })),
      count: commonPlayers.length,
    });
  } catch (error) {
    console.error("[GET /api/teams/common-players] Hata:", error);
    return NextResponse.json(
      { error: "Ortak oyuncular yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
