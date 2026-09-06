/**
 * Müzayede Oyuncu Havuzu Üretici API Uç Noktası.
 * Edge worker sunucuları (PartyKit Cloud) doğrudan veritabanı bağlantısı yapamadığı durumlarda
 * bu HTTP uç noktası üzerinden Prisma ile veritabanından havuz futbolcularını çeker.
 */

import { NextResponse } from "next/server";
import { generateAuctionPool } from "@/lib/auction/generateAuctionPool";
import { z } from "zod";

const poolInputSchema = z.object({
  playerCount: z.number().int().min(2).max(10).default(2),
  ratingMin: z.number().int().min(60).max(99).default(80),
  ratingMax: z.number().int().min(60).max(99).default(95),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = poolInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz parametreler", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { playerCount, ratingMin, ratingMax } = parsed.data;
    const pool = await generateAuctionPool({ playerCount, ratingMin, ratingMax });

    return NextResponse.json({
      success: true,
      pool,
      count: pool.length,
    });
  } catch (error) {
    console.error("[API /api/auction/generate-pool] Hata:", error);
    return NextResponse.json(
      { error: "Müzayede havuzu oluşturulamadı" },
      { status: 500 }
    );
  }
}
