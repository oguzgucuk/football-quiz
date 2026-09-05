/**
 * Bir millet ve bir takımın ortak oyuncularını (en popüler olanlardan başlayarak 3-5 adet)
 * getiren API endpoint'i (Millet-Takım modu için).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCommonPlayersByNationAndTeam } from "@/lib/db/players";
import { findNationByIdOrAlias, POPULAR_NATIONS } from "@/lib/data/nations";

const querySchema = z.object({
  nationId: z.string().min(1, "nationId zorunludur"),
  teamId: z.string().min(1, "teamId zorunludur"),
  limit: z.coerce.number().min(1).max(10).default(5),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      nationId: searchParams.get("nationId"),
      teamId: searchParams.get("teamId"),
      limit: searchParams.get("limit") || 5,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz parametreler", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { nationId, teamId, limit } = parsed.data;

    const matchedNation = findNationByIdOrAlias(nationId) || POPULAR_NATIONS.find((n) => n.id === nationId);
    const nationQueries = matchedNation
      ? [matchedNation.englishName, matchedNation.name, ...matchedNation.aliases]
      : [nationId];

    const commonPlayers = await getCommonPlayersByNationAndTeam(nationQueries, teamId, limit);

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
    console.error("[GET /api/nations/common-players] Hata:", error);
    return NextResponse.json(
      { error: "Ortak oyuncular yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
