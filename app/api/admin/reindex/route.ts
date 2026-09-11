/**
 * Panelden tek tıkla arama indeksini (players-index.json) yenileme API rotası.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth/adminAuth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync("npm run generate:index", {
      cwd: process.cwd(),
      timeout: 60000,
    });

    return NextResponse.json({
      success: true,
      message: "Arama indeksi başarıyla yenilendi",
      output: stdout,
      error: stderr || null,
    });
  } catch (error) {
    console.error("Admin reindex error:", error);
    return NextResponse.json(
      {
        error: "İndeks yenilenirken hata oluştu",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
