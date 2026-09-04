/**
 * Kullanıcı anlık durumunu ve son görülme zamanını güncelleyen heartbeat API rotası.
 * Kullanıcı sitede aktifken veya oyundayken düzenli aralıklarla çağrılır.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş yapılmamış." }, { status: 401 });
    }

    let inGame = false;
    try {
      const body = await req.json();
      if (typeof body?.inGame === "boolean") {
        inGame = body.inGame;
      }
    } catch {
      // Body boş veya json değilse varsayılan false
    }

    const newStatus = inGame ? "in_game" : "online";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeenAt: new Date(),
        currentStatus: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
    });
  } catch (error) {
    console.error("[Heartbeat Error]:", error);
    return NextResponse.json({ error: "Heartbeat güncellenemedi." }, { status: 500 });
  }
}
