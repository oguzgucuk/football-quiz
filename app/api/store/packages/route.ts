import { NextResponse } from "next/server";
import { AC_PACKAGES } from "@/lib/db/storeCatalog";

export async function GET() {
  return NextResponse.json({
    success: true,
    packages: AC_PACKAGES,
  });
}
