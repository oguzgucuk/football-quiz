/**
 * Transfermarkt'ın canlı lig transfer sayfalarından (Süper Lig, 1. Lig ve 5 Büyük Lig)
 * 2026 güncel transferleri, gelenleri, gidenleri ve bonservis/piyasa değerlerini çeker.
 * 
 * Kurallar (GEMINI.md Kural 9):
 * 1. Oyuncu isimleri temizlenir ve normalize edilir.
 * 2. Mevcut oyuncular bulunursa takımları güncellenir ve piyasa değeri atanır.
 * 3. Gidenler (jübile, kiralık sonu, satış) eski takımlarından düşürülür (seasonEnd: 2026).
 * 4. Gelenler yeni takımlarına bağlanır (seasonStart: 2026).
 */

import * as cheerio from "cheerio";
import { prisma } from "../../lib/db/client";
import { normalizeText } from "../../lib/validation/normalizeText";

export interface LeagueTarget {
  code: string;
  name: string;
  country: string;
}

export const TARGET_LEAGUES: LeagueTarget[] = [
  { code: "TR1", name: "Süper Lig", country: "Türkiye" },
  { code: "TR2", name: "1. Lig", country: "Türkiye" },
  { code: "GB1", name: "Premier League", country: "İngiltere" },
  { code: "ES1", name: "La Liga", country: "İspanya" },
  { code: "IT1", name: "Serie A", country: "İtalya" },
  { code: "L1", name: "Bundesliga", country: "Almanya" },
  { code: "FR1", name: "Ligue 1", country: "Fransa" },
];

const TM_POSITION_MAP: Record<string, { primary: string; positions: string[] }> = {
  Santrafor: { primary: "ST", positions: ["ST", "CF"] },
  "İkinci Forvet": { primary: "CF", positions: ["CF", "ST"] },
  "Sol Kanat": { primary: "LW", positions: ["LW", "LM"] },
  "Sağ Kanat": { primary: "RW", positions: ["RW", "RM"] },
  "On Numara": { primary: "CAM", positions: ["CAM", "CM"] },
  "Forvet Arkası": { primary: "CAM", positions: ["CAM", "CF"] },
  "Merkez Orta Saha": { primary: "CM", positions: ["CM", "CAM", "CDM"] },
  "Ön Libero": { primary: "CDM", positions: ["CDM", "CM"] },
  Stoper: { primary: "CB", positions: ["CB"] },
  "Sol Bek": { primary: "LB", positions: ["LB", "LWB"] },
  "Sağ Bek": { primary: "RB", positions: ["RB", "RWB"] },
  Kaleci: { primary: "GK", positions: ["GK"] },
};

/**
 * Transfermarkt para formatını integer Euro değerine çevirir.
 * Örn: "50.00 mil. €" -> 50000000, "800 bin €" -> 800000
 */
export function parseMoneyEur(raw: string): number | null {
  if (!raw) return null;
  const clean = raw.toLowerCase().replace(/\s+/g, " ").trim();

  const milMatch = clean.match(/([\d.,]+)\s*mil/);
  if (milMatch) {
    const val = parseFloat(milMatch[1].replace(",", "."));
    return Math.round(val * 1_000_000);
  }

  const binMatch = clean.match(/([\d.,]+)\s*(bin|k)/);
  if (binMatch) {
    const val = parseFloat(binMatch[1].replace(",", "."));
    return Math.round(val * 1_000);
  }

  if (clean.includes("bedelsiz") || clean === "-" || clean === "?") {
    return 0;
  }

  return null;
}

interface ParsedTransfer {
  playerName: string;
  tmId?: string;
  currentClubName: string;
  otherClubName: string;
  type: "in" | "out";
  age?: number;
  positionRaw?: string;
  marketValueEur?: number | null;
  feeEur?: number | null;
  isEndCareer?: boolean;
}

async function fetchLeaguePage(code: string): Promise<string> {
  const url = `https://www.transfermarkt.com.tr/wettbewerb/transfers/wettbewerb/${code}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr,en-US;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Transfermarkt HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

function parseTransfermarktHtml(html: string): ParsedTransfer[] {
  const $ = cheerio.load(html);
  const transfers: ParsedTransfer[] = [];

  // Transfermarkt sayfalarında her kulübün transferleri ardışık 2 tablo (Gelenler / Gidenler) halindedir.
  // Tabloların başlıklarındaki h2 öğelerinden kulüp adını alırız.
  $("table").each((_, tbl) => {
    const $tbl = $(tbl);
    const headerText = $tbl.closest(".box").find(".content-box-headline, h2").text().trim();
    if (!headerText || headerText.includes("Transferler 2")) return;

    // Gelenler mi Gidenler mi olduğunu th etiketinden anlarız
    const firstTh = $tbl.find("th").first().text().trim();
    const isIncoming = firstTh.toLowerCase().includes("gelenler");
    const isOutgoing = firstTh.toLowerCase().includes("gidenler");
    if (!isIncoming && !isOutgoing) return;

    // Kulüp adı temizliği (örn: "Galatasaray SK" -> "Galatasaray")
    const currentClubName = headerText
      .replace(/\s+(SK|JK|FK|FC|S\.K\.|A\.Ş\.|Kulübü)$/i, "")
      .trim();

    $tbl.find("tbody tr").each((__, tr) => {
      const $tr = $(tr);
      const playerLink = $tr.find("a[href*='/profil/spieler/']").first();
      const playerName = playerLink.text().trim();
      if (!playerName) return;

      const href = playerLink.attr("href") || "";
      const tmId = href.match(/spieler\/(\d+)/)?.[1];

      const ageText = $tr.find("td.alter-transfer-cell").text().trim();
      const age = ageText ? parseInt(ageText, 10) : undefined;
      const positionRaw = $tr.find("td.pos-transfer-cell").text().trim();
      const mvText = $tr.find("td.mw-transfer-cell").text().trim();
      const otherClubName = $tr.find("td.verein-flagge-transfer-cell").text().trim();
      const feeText = $tr.find("td.rechts").last().text().trim();

      const isEndCareer =
        otherClubName.toLowerCase().includes("kariyer sonu") ||
        otherClubName.toLowerCase().includes("kulüpsüz") ||
        otherClubName.toLowerCase().includes("ara verdi");

      transfers.push({
        playerName,
        tmId,
        currentClubName,
        otherClubName,
        type: isIncoming ? "in" : "out",
        age,
        positionRaw,
        marketValueEur: parseMoneyEur(mvText),
        feeEur: parseMoneyEur(feeText),
        isEndCareer,
      });
    });
  });

  return transfers;
}

export async function syncTransfermarktLive() {
  console.log("🚀 Canlı Transfermarkt 2026 Transfer Senkronizasyonu Başlatılıyor...\n");
  const startTime = Date.now();

  // 1. Veritabanındaki tüm kulüpleri indeksle
  console.log("📚 Veritabanındaki kulüpler taranıyor...");
  const dbTeams = await prisma.team.findMany({
    select: { id: true, name: true, aliases: true },
  });

  const teamLookup = new Map<string, string>();
  for (const t of dbTeams) {
    teamLookup.set(normalizeText(t.name), t.id);
    for (const a of t.aliases) {
      teamLookup.set(normalizeText(a), t.id);
    }
  }

  const findTeamId = (rawName: string): string | undefined => {
    if (!rawName) return undefined;
    const norm = normalizeText(rawName);
    if (teamLookup.has(norm)) return teamLookup.get(norm);
    for (const [key, id] of teamLookup.entries()) {
      if (key.includes(norm) || norm.includes(key)) return id;
    }
    return undefined;
  };

  // 2. Mevcut oyuncuları indeksle
  console.log("👥 Mevcut oyuncu veritabanı indeksleniyor...");
  const dbPlayers = await prisma.player.findMany({
    select: { id: true, fullName: true, kaggleId: true, marketValueEur: true },
  });

  const playerByTmId = new Map<string, string>();
  const playerByName = new Map<string, string>();
  for (const p of dbPlayers) {
    if (p.kaggleId) playerByTmId.set(p.kaggleId, p.id);
    const norm = normalizeText(p.fullName);
    if (norm) playerByName.set(norm, p.id);
  }

  // 3. Lig sayfalarını sırayla çek ve parse et
  const allTransfers: ParsedTransfer[] = [];
  for (let i = 0; i < TARGET_LEAGUES.length; i++) {
    const league = TARGET_LEAGUES[i];
    console.log(`📡 [${i + 1}/${TARGET_LEAGUES.length}] ${league.name} transfer sayfası çekiliyor...`);
    try {
      const html = await fetchLeaguePage(league.code);
      const parsed = parseTransfermarktHtml(html);
      console.log(`   ✓ ${parsed.length} transfer hareketi okundu.`);
      allTransfers.push(...parsed);
    } catch (err) {
      console.warn(`   ❌ Hata (${league.name}):`, err instanceof Error ? err.message : err);
    }

    // Cloudflare eşiğine takılmamak için 2.5 saniye insani bekleme
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log(`\n📥 Toplam ${allTransfers.length} transfer hareketi işleniyor...`);

  let addedInCount = 0;
  let closedOutCount = 0;
  let updatedMvCount = 0;

  // 4. Transferleri Veritabanına Uygula
  for (const t of allTransfers) {
    const normName = normalizeText(t.playerName);
    if (!normName || normName.length < 2) continue;

    // Oyuncu DB'de var mı?
    let playerId: string | undefined = undefined;
    if (t.tmId && playerByTmId.has(t.tmId)) {
      playerId = playerByTmId.get(t.tmId);
    } else if (playerByName.has(normName)) {
      playerId = playerByName.get(normName);
    }

    const currentClubId = findTeamId(t.currentClubName);
    if (!currentClubId) continue;

    // Pozisyon eşleştirmesi
    const posInfo = t.positionRaw ? TM_POSITION_MAP[t.positionRaw] : undefined;

    // Oyuncu yoksa yeni oyuncu aç
    if (!playerId) {
      const newP = await prisma.player.create({
        data: {
          fullName: t.playerName,
          kaggleId: t.tmId,
          position: posInfo?.primary || null,
          positions: posInfo?.positions || [],
          marketValueEur: t.marketValueEur || null,
          popularityScore: t.marketValueEur && t.marketValueEur > 10_000_000 ? 75 : 55,
        },
      });
      playerId = newP.id;
      if (t.tmId) playerByTmId.set(t.tmId, playerId);
      playerByName.set(normName, playerId);
    } else if (t.marketValueEur) {
      // Mevcut oyuncunun piyasa değerini güncelle
      await prisma.player.update({
        where: { id: playerId },
        data: { marketValueEur: t.marketValueEur },
      });
      updatedMvCount++;
    }

    // A. GELENLER (GELİŞ): Kulübe bağlanır
    if (t.type === "in") {
      await prisma.playerTeamHistory.upsert({
        where: {
          playerId_teamId: {
            playerId,
            teamId: currentClubId,
          },
        },
        update: {
          seasonStart: 2026,
          seasonEnd: null, // Güncel aktif kulüp
        },
        create: {
          playerId,
          teamId: currentClubId,
          seasonStart: 2026,
        },
      });
      addedInCount++;

      // Eski kulüp varsa onun sezonunu kapat
      const otherClubId = findTeamId(t.otherClubName);
      if (otherClubId && otherClubId !== currentClubId) {
        await prisma.playerTeamHistory.updateMany({
          where: { playerId, teamId: otherClubId },
          data: { seasonEnd: 2026 },
        });
      }
    }

    // B. GİDENLER (AYRILIŞ / JÜBİLE): Kulüple bağı kapatılır
    if (t.type === "out") {
      // Ayrılan oyuncunun bu kulüpteki aktifliğini sonlandır
      await prisma.playerTeamHistory.updateMany({
        where: { playerId, teamId: currentClubId },
        data: { seasonEnd: 2026 },
      });
      closedOutCount++;

      // Gittiği yeni kulüp varsa ve DB'mizde kayıtlıysa yeni kulübe bağla
      if (!t.isEndCareer) {
        const destinationClubId = findTeamId(t.otherClubName);
        if (destinationClubId) {
          await prisma.playerTeamHistory.upsert({
            where: {
              playerId_teamId: {
                playerId,
                teamId: destinationClubId,
              },
            },
            update: {
              seasonStart: 2026,
              seasonEnd: null,
            },
            create: {
              playerId,
              teamId: destinationClubId,
              seasonStart: 2026,
            },
          });
        }
      }
    }
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log("\n==========================================");
  console.log("✅ Canlı Transfermarkt Senkronizasyonu Tamamlandı!");
  console.log(`⏱️ Süre: ${durationSec} saniye`);
  console.log(`⚽ Yeni Kulübüne Bağlanan Oyuncu: ${addedInCount}`);
  console.log(`👋 Kulübünden Ayrılan/Sonlandırılan (Gidenler): ${closedOutCount}`);
  console.log(`💰 Güncellenen Piyasa Değeri (Piyasa/Bonservis): ${updatedMvCount}`);
  console.log("==========================================\n");
}

if (require.main === module) {
  syncTransfermarktLive()
    .catch((err) => {
      console.error("❌ Hata:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
