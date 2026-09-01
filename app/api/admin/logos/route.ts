/**
 * Admin logo yönetim sayfası için takım listesi döndürür.
 * DB-level pagination kullanır; Prisma 6.x'te findMany null filter çalışır,
 * sadece groupBy where null kısıtlaması var — onu rawQuery ile aşıyoruz.
 * Tablo adı: "teams" (@@map ile küçük harf).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";

type LogoFilter = "all" | "with_logo" | "no_logo";

function buildLogoWhere(filter: LogoFilter): Prisma.TeamWhereInput {
  if (filter === "with_logo") return { logoUrl: { not: null } };
  if (filter === "no_logo") return { logoUrl: null };
  return {};
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get("filter") ?? "all") as LogoFilter;
    const country = searchParams.get("country");
    const search = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(parseInt(searchParams.get("per_page") ?? "60", 10), 120);
    const skip = (page - 1) * perPage;

    const where: Prisma.TeamWhereInput = {
      ...buildLogoWhere(filter),
    };

    if (country) where.country = country;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { league: { contains: search, mode: "insensitive" } },
      ];
    }

    // Prisma 6.x: findMany'de logoUrl: null ✅ çalışıyor (sadece groupBy where'de sorun var)
    const [teams, total, totalWithLogo, totalAll] = await Promise.all([
      prisma.team.findMany({
        where,
        select: {
          id: true,
          name: true,
          country: true,
          league: true,
          logoUrl: true,
          popularityScore: true,
        },
        orderBy: [{ popularityScore: "desc" }, { name: "asc" }],
        skip,
        take: perPage,
      }),
      prisma.team.count({ where }),
      // logoUrl IS NOT NULL — findMany null filter çalışıyor
      prisma.team.count({ where: { logoUrl: { not: null } } }),
      prisma.team.count(),
    ]);

    // Ülke listesi — rawQuery kullanıyoruz çünkü groupBy WHERE IS NOT NULL Prisma 6.x'te hata veriyor
    // Tablo adı: "teams" (schema.prisma @@map("teams"))
    const countriesRaw = await prisma.$queryRaw<Array<{ country: string; count: number }>>`
      SELECT country, COUNT(*)::int AS count
      FROM teams
      WHERE country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 100
    `;

    return NextResponse.json({
      teams,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      stats: {
        totalWithLogo,
        totalNoLogo: totalAll - totalWithLogo,
        totalAll,
      },
      countries: countriesRaw,
    });
  } catch (error) {
    console.error("[API /api/admin/logos] Hata:", error);
    return NextResponse.json(
      { error: "Logo listesi alınamadı", detail: String(error) },
      { status: 500 }
    );
  }
}
