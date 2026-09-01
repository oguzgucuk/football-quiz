/**
 * TheSportsDB ücretsiz API'si ile Avrupa ligleri ve Türkiye'deki eksik logolu
 * takımları tespit eder ve kaç tanesinin eşleşme ihtimali olduğunu gösterir.
 * API key gerektirmez.
 *
 * Örnek input/output:
 *   fetchSportsDbBadge("Galatasaray") → "https://r2.thesportsdb.com/images/media/team/badge/..."
 *   fetchSportsDbBadge("Adana Demirspor") → null (bulunamazsa)
 */

import { prisma } from "@/lib/db/client";
import { isTeamPlayableInGame } from "@/lib/db/allowedTeams";

const THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

/** TheSportsDB'de takım arar, badge URL döner. Rate limit için 500ms bekler. */
async function fetchSportsDbBadge(teamName: string): Promise<string | null> {
  const url = `${THESPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent(teamName)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const team = data.teams?.[0];
    // strBadge: şeffaf arka planlı rozet (en iyi seçenek)
    return team?.strBadge ?? null;
  } catch {
    return null;
  }
}

async function auditMissingLogos() {
  console.log("🔍 Eksik Logo Tespiti (Oynanabilir Takımlar)...\n");

  // Tüm oynanabilir takımları çek
  const allTeams = await prisma.team.findMany({
    select: { id: true, name: true, country: true, league: true, logoUrl: true },
    where: { logoUrl: null },
    orderBy: { popularityScore: "desc" },
  });

  const playable = allTeams.filter((t) => isTeamPlayableInGame(t));

  console.log(`Toplam logosuz takım: ${allTeams.length}`);
  console.log(`Oynanabilir + logosuz: ${playable.length}`);
  console.log("\nİlk 20 oynanabilir logosuz takım:\n");

  // Sadece ilk 20'yi listele (test için)
  for (const t of playable.slice(0, 20)) {
    console.log(`  - ${t.name} (${t.country ?? "—"} / ${t.league ?? "—"})`);
  }

  // 5 takım için TheSportsDB test çek
  console.log("\n\n🌐 TheSportsDB API Test (İlk 5 takım):\n");
  for (const t of playable.slice(0, 5)) {
    const badge = await fetchSportsDbBadge(t.name);
    console.log(`  ${t.name} → ${badge ? `✅ ${badge}` : "❌ bulunamadı"}`);
    await new Promise((r) => setTimeout(r, 500)); // rate limit
  }

  await prisma.$disconnect();
}

auditMissingLogos();
