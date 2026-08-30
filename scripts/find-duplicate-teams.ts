/**
 * 1. Adım: Aday Kopya Kulüp Çiftlerini Bul (Dry-run, Hiçbir Şeyi Silmez)
 */

import { prisma } from "../lib/db/client";

function normalize(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // aksan temizle
    .replace(/\b(sk|fc|cf|afc|club|deportivo|cd|ac|sc|ssc|rotterdam|eindhoven|lisboa|lisbon)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function findDuplicates() {
  console.log("🔍 [Aday Kopya Kulüp Taraması - Dry Run] Başlatılıyor...\n");

  const teams = await prisma.team.findMany({
    include: {
      playersHistory: true,
    },
  });

  const groups = new Map<string, typeof teams>();

  for (const team of teams) {
    const key = normalize(team.name);
    if (!key || key.length < 3) continue;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(team);
  }

  const duplicates = [...groups.values()].filter((g) => g.length > 1);

  console.log(`📊 Toplam ${duplicates.length} potansiyel çakışma grubu bulundu:\n`);

  for (const group of duplicates) {
    const formatted = group
      .map((t) => `[${t.id}] ${t.name} (${t.playersHistory.length} oyuncu, ${t.country})`)
      .join("  <--->  ");
    console.log(` • ${formatted}`);
  }
}

findDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
