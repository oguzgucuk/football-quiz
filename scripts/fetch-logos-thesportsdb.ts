/**
 * TheSportsDB API'sinden eksik logoları çeker, processLogo() ile optimize eder
 * ve Supabase'e yükler. Sadece `teams.logoUrl IS NULL` olan kulüpleri hedefler.
 */

import { prisma } from "../lib/db/client";
import { createClient } from "@supabase/supabase-js";
import { processLogo } from "../lib/storage/processLogo";

// TheSportsDB API (Free Tier)
const API_KEY = "3";
const SPORTSDB_BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || "https://mwfxdrejioteevtdehns.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ HATA: SUPABASE_KEY eksik!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Hedef liglerin DB adları -> TheSportsDB adları eşleştirmesi
const LEAGUE_MAP: Record<string, string> = {
  "premier-league": "English Premier League",
  "laliga": "Spanish La Liga",
  "serie-a": "Italian Serie A",
  "bundesliga": "German Bundesliga",
  "ligue-1": "French Ligue 1",
  "super-lig": "Turkish Super Lig",
  "championship": "English League Championship"
};

const BUCKET_NAME = "team-logos";

// Rate limiting (Dakikada max ~30, biz saniyede max 0.5 yapalım = 2000ms bekle)
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTeamFromSportsDB(teamName: string, retries = 3): Promise<any[]> {
  const url = `${SPORTSDB_BASE}/searchteams.php?t=${encodeURIComponent(teamName)}`;
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      if (retries > 0) {
        console.log(`  ⚠️ Rate limit aşıldı (429). 5 saniye bekleniyor... (${retries} deneme kaldı)`);
        await sleep(5000);
        return fetchTeamFromSportsDB(teamName, retries - 1);
      } else {
        throw new Error(`HTTP 429 - Max retries exceeded`);
      }
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.teams || [];
  } catch (err) {
    console.error(`  ⚠️ TheSportsDB'den ${teamName} çekilemedi:`, err);
    return [];
  }
}

async function downloadAndProcessBadge(badgeUrl: string): Promise<{ buffer: Buffer, type: 'png' | 'svg' } | null> {
  try {
    const res = await fetch(badgeUrl);
    if (!res.ok) return null;
    
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    
    if (buffer.byteLength === 0) return null;

    // PNG dosyaları webp'ye çevirip küçült
    const processed = await processLogo(buffer, 'png');
    if (!processed || !processed.buffer) return null;

    return { buffer: processed.buffer, type: 'png' };
  } catch (err) {
    console.error("    ⚠️ Görsel indirme/işleme hatası:", err);
    return null;
  }
}

async function uploadToSupabase(teamId: string, processed: { buffer: Buffer, type: 'png' | 'svg' }) {
  // webp formatında kaydediyoruz processLogo'dan dolayı
  const fileName = `${teamId}.webp`; 
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, processed.buffer, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicData.publicUrl;
}

async function run() {
  console.log("🚀 [TheSportsDB Entegrasyonu] Başlatılıyor...\n");
  
  let totalMatched = 0;
  let totalUploaded = 0;

  for (const [dbLeague, sdbLeague] of Object.entries(LEAGUE_MAP)) {
    console.log(`\n⚽ Lig işleniyor: ${dbLeague} (TheSportsDB: ${sdbLeague})`);
    
    // DB'deki eksik logolu takımlar
    const missingTeams = await prisma.team.findMany({
      where: {
        logoUrl: null,
        league: { contains: dbLeague, mode: "insensitive" }
      },
      select: { id: true, name: true, aliases: true }
    });

    if (missingTeams.length === 0) {
      console.log(`  ✅ Bu ligde eksik logolu hedef takım yok, atlanıyor.`);
      continue;
    }

    console.log(`  🎯 ${missingTeams.length} takımın logosu eksik. Sırayla aranıyor...`);

    // Takımları eşleştir
    for (const missingTeam of missingTeams) {
      console.log(`  🔍 Aranıyor: ${missingTeam.name}`);
      const sdbTeams = await fetchTeamFromSportsDB(missingTeam.name);
      
      const dbNameLower = missingTeam.name.toLowerCase();
      const aliasesStr = Array.isArray(missingTeam.aliases) ? missingTeam.aliases.join(" ").toLowerCase() : (typeof missingTeam.aliases === "string" ? (missingTeam.aliases as string).toLowerCase() : "");

      const match = sdbTeams.find((s: any) => {
        const sdbNameLower = (s.strTeam || "").toLowerCase();
        const sdbAltLower = (s.strAlternate || "").toLowerCase();
        
        return dbNameLower === sdbNameLower || 
               dbNameLower === sdbAltLower ||
               aliasesStr.includes(sdbNameLower) ||
               (sdbAltLower && aliasesStr.includes(sdbAltLower));
      });

      if (!match) {
        console.log(`    ⏭️ Eşleşme bulunamadı: ${missingTeam.name}`);
        continue;
      }

      if (!match.strBadge) {
        console.log(`    ⏭️ Eşleşti ama TheSportsDB'de badge yok: ${missingTeam.name}`);
        continue;
      }

      console.log(`    ✅ Eşleşti: ${missingTeam.name} == ${match.strTeam}`);
      totalMatched++;

      // Görseli indir, işle ve yükle
      const processed = await downloadAndProcessBadge(match.strBadge);
      if (!processed) {
        console.log(`      ❌ Görsel indirilemedi veya geçersiz.`);
        continue;
      }

      try {
        const publicUrl = await uploadToSupabase(missingTeam.id, processed);
        
        await prisma.team.update({
          where: { id: missingTeam.id },
          data: { logoUrl: publicUrl }
        });
        
        console.log(`      🚀 Yüklendi ve güncellendi: ${publicUrl}`);
        totalUploaded++;
      } catch (err: any) {
        console.error(`      ❌ Yükleme/Güncelleme hatası: ${err.message}`);
      }

      // Rate limit koruması (TheSportsDB free tier: ~30 req/min)
      await sleep(2500); 
    }
    
    // Ligler arası ekstra bekleme (opsiyonel)
    await sleep(2000);
  }

  console.log(`\n🎉 İşlem tamamlandı! Eşleşen: ${totalMatched} | Başarıyla Yüklenen: ${totalUploaded}`);
  await prisma.$disconnect();
}

run();
