/**
 * En popüler ve ortak kulüp geçmişine sahip oyuncuların arama indeksini statik JSON dosyası olarak üretir.
 * - En az 2 farklı kulüpte oynamış tüm oyuncuları (quiz'de ortak oyuncu olabilecek havuz) eksiksiz kapsar.
 * - Tek kulüp ikonlarını (Totti, Puyol vb.) popülerlik barajıyla dahil eder.
 * - Efsane oyuncuların (Zidane, Figo, Hagi, Nihat vb.) arama önceliğini kulüp prestijleriyle destekler.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../lib/db/client";

async function generateStaticPlayerIndex() {
  console.log("⚽ Statik oyuncu indeksi üretimi başlatılıyor...");
  const startTime = Date.now();

  const dataDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. En az 2 farklı kulüpte oynamış TÜM oyuncuları al (Quiz'in gerçek havuzu)
  const multiClubPlayersRaw: { player_id: string }[] = await prisma.$queryRaw`
    SELECT player_id 
    FROM player_team_history 
    GROUP BY player_id 
    HAVING count(DISTINCT team_id) >= 2
  `;
  const candidateIds = new Set<string>(multiClubPlayersRaw.map((r) => r.player_id));
  console.log(`   - 2+ kulüpte oynamış ortak oyuncu adayı: ${candidateIds.size.toLocaleString()}`);

  // 2. Popüler tek-kulüp ikonlarını veya yüksek piyasa değerli oyuncuları ekle
  const topPopular = await prisma.player.findMany({
    where: { popularityScore: { gte: 65 } },
    select: { id: true },
  });
  topPopular.forEach((p) => candidateIds.add(p.id));
  console.log(`   - Popüler oyuncularla birleştirilmiş toplam aday: ${candidateIds.size.toLocaleString()}`);

  // 3. Bu oyuncuların detaylarını ve oynadıkları kulüplerin prestij puanlarını çek
  const idArray = Array.from(candidateIds);
  const CHUNK_SIZE = 5000;
  const players: {
    id: string;
    fullName: string;
    popularityScore: number;
    teamsHistory: { team: { popularityScore: number } }[];
  }[] = [];

  for (let i = 0; i < idArray.length; i += CHUNK_SIZE) {
    const chunkIds = idArray.slice(i, i + CHUNK_SIZE);
    const chunk = await prisma.player.findMany({
      where: { id: { in: chunkIds } },
      select: {
        id: true,
        fullName: true,
        popularityScore: true,
        teamsHistory: {
          select: {
            team: {
              select: { popularityScore: true },
            },
          },
        },
      },
    });
    players.push(...chunk);
  }

  // 4. Efsane oyuncuların aramalarda üst sıralarda çıkması için kulüp prestiji takviyesi
  const normalizeAccents = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .toLowerCase();
  };

  const litePlayers = players.map((p) => {
    const maxClubPrestige = p.teamsHistory.reduce(
      (max, th) => Math.max(max, th.team?.popularityScore || 0),
      0
    );

    // Emekli efsaneler piyasa değeri olmadığı için düşük kalmasın: kulüp prestijini baz al
    const effectivePopularity = Math.max(p.popularityScore || 0, maxClubPrestige);

    return {
      id: p.id,
      name: p.fullName,
      asciiName: normalizeAccents(p.fullName),
      popularityScore: effectivePopularity,
    };
  });

  // Popülerliğe göre azalan sırala
  litePlayers.sort((a, b) => b.popularityScore - a.popularityScore);

  const version = Date.now();
  const indexFilePath = path.join(dataDir, "players-index.json");
  const manifestFilePath = path.join(dataDir, "manifest.json");

  fs.writeFileSync(indexFilePath, JSON.stringify(litePlayers));
  fs.writeFileSync(
    manifestFilePath,
    JSON.stringify(
      {
        version,
        count: litePlayers.length,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  const stats = fs.statSync(indexFilePath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log(`✅ Statik oyuncu indeksi başarıyla üretildi!`);
  console.log(`   - Toplam Oyuncu Sayısı: ${litePlayers.length.toLocaleString()}`);
  console.log(`   - Dosya Boyutu: ${sizeMB} MB (${sizeKB} KB uncompressed)`);
  console.log(`   - Tahmini Gzip Boyutu: ~${(stats.size / 1024 / 5).toFixed(0)} KB`);
  console.log(`   - Konum: ${indexFilePath}`);
  console.log(`   - Süre: ${Date.now() - startTime}ms`);
}

generateStaticPlayerIndex()
  .catch((err) => {
    console.error("❌ İndeks üretim hatası:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
