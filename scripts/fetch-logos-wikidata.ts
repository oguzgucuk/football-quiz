/**
 * Dinamik Wikidata & Wikipedia Infobox Logo Çekici
 * Wikidata P154 eksik olduğunda (telif hakları nedeniyle), İngilizce Wikipedia'daki 
 * Infobox (bilgi kutusu) içindeki `image = ...` parametresini okur ve logoyu çeker.
 */

import { prisma } from "../lib/db/client";
import { createClient } from "@supabase/supabase-js";
import { processLogo } from "../lib/storage/processLogo";
import { getTargetTeams } from "./get-logo-target-teams";
import sharp from "sharp";

const USER_AGENT = "FootballQuizBot/1.0 (https://github.com/oguzgucuk/football-quiz)";
const REFERER = "https://en.wikipedia.org/";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://mwfxdrejioteevtdehns.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ HATA: SUPABASE_KEY eksik!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Wikidata'da takımı ara ve QID'sini bul
async function searchWikidataForTeam(teamName: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(teamName)}&language=en&format=json&type=item`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.search && data.search.length > 0) {
      const match = data.search.find((item: any) => 
        item.description && (item.description.toLowerCase().includes("football") || item.description.toLowerCase().includes("soccer"))
      ) || data.search[0];
      return match.id;
    }
  } catch (e) {
    console.error(`   ⚠️ Wikidata search error:`, e);
  }
  return null;
}

// 2. QID'den İngilizce Wikipedia sayfa başlığını bul
async function getEnWikiTitle(entityId: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=sitelinks&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const entity = data.entities[entityId];
    if (entity && entity.sitelinks && entity.sitelinks.enwiki) {
      return entity.sitelinks.enwiki.title;
    }
  } catch (e) {
    console.error(`   ⚠️ Wikidata sitelinks error:`, e);
  }
  return null;
}

// 3. Wikipedia sayfasının wikitext'inden "image = " parametresini çıkar
async function getInfoboxImageFilename(pageTitle: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(pageTitle)}&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId !== "-1" && pages[pageId].revisions) {
      const content = pages[pageId].revisions[0].slots.main["*"];
      // Infobox image regex (e.g. `| image = Genoa_C.F.C._logo.svg`)
      const match = content.match(/\|\s*image\s*=\s*([^|\n]+)/i);
      if (match && match[1]) {
        let filename = match[1].trim();
        // Bazen dosya isminin başında File: veya Image: olur, temizle
        filename = filename.replace(/^(File|Image):/i, "");
        // Eğer HTML/Wiki tag varsa temizle (örn. [[File:Logo.svg|150px]])
        if (filename.startsWith("[[File:") || filename.startsWith("[[Image:")) {
           const innerMatch = filename.match(/\[\[(?:File|Image):([^|\]]+)/i);
           if (innerMatch && innerMatch[1]) filename = innerMatch[1].trim();
        }
        return filename;
      }
    }
  } catch (e) {
    console.error(`   ⚠️ Wikipedia infobox parse error:`, e);
  }
  return null;
}

// 4. Dosya adından Wikipedia URL'sini al
async function getWikimediaImageUrl(filename: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId !== "-1" && pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
      return pages[pageId].imageinfo[0].url;
    }
  } catch (e) {
    console.error(`   ⚠️ MediaWiki image URL error:`, e);
  }
  return null;
}

// Görseli indir
async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Referer: REFERER } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;
    return buf;
  } catch {
    return null;
  }
}

async function run() {
  console.log("🚀 [Wikipedia Infobox Fallback Motoru] Başlatılıyor...");
  
  const targetTeams = await getTargetTeams();
  let downloadedCount = 0;
  let notFoundCount = 0;

  for (const team of targetTeams) {
    if (team.logoUrl) continue;

    console.log(`\n🔍 Aranıyor: ${team.name} (${team.country})`);

    const entityId = await searchWikidataForTeam(team.name);
    if (!entityId) {
      console.log(`   ⏭️ Wikidata'da takım bulunamadı.`);
      notFoundCount++;
      await sleep(1000);
      continue;
    }

    const enWikiTitle = await getEnWikiTitle(entityId);
    if (!enWikiTitle) {
      console.log(`   ⏭️ Wikidata'da enwiki bağlantısı yok (${entityId}).`);
      notFoundCount++;
      await sleep(1000);
      continue;
    }

    const filename = await getInfoboxImageFilename(enWikiTitle);
    if (!filename) {
      console.log(`   ⏭️ Wikipedia sayfasında (Infobox) logo resmi bulunamadı (${enWikiTitle}).`);
      notFoundCount++;
      await sleep(1000);
      continue;
    }

    const imageUrl = await getWikimediaImageUrl(filename);
    if (!imageUrl) {
      console.log(`   ⏭️ Dosya URL'si çözülemedi (File:${filename}).`);
      notFoundCount++;
      await sleep(1000);
      continue;
    }

    console.log(`   📥 İndiriliyor: ${imageUrl}`);
    const rawBuf = await fetchBuffer(imageUrl);
    if (!rawBuf) {
      console.log(`   ❌ Dosya indirilemedi.`);
      notFoundCount++;
      await sleep(1000);
      continue;
    }

    try {
      const rawExt = imageUrl.toLowerCase().includes(".svg") ? "svg" : "png";
      const processed = await processLogo(rawBuf, rawExt);
      
      const meta = await sharp(processed.buffer).metadata();
      if (meta.format === "jpeg" || (meta.format === "png" && !meta.hasAlpha)) {
        console.warn(`   ⚠️ Şeffaf değil veya JPEG. Atlanıyor.`);
        notFoundCount++;
        continue;
      }

      const targetFilename = `${team.id}.${processed.extension}`;
      const { error: uploadErr } = await supabase.storage
        .from("team-logos")
        .upload(targetFilename, processed.buffer, {
          contentType: processed.contentType,
          upsert: true,
        });

      if (!uploadErr) {
        const { data } = supabase.storage.from("team-logos").getPublicUrl(targetFilename);
        await prisma.team.update({
          where: { id: team.id },
          data: { logoUrl: data.publicUrl },
        });
        downloadedCount++;
        console.log(`   ✅ Supabase'e Kaydedildi: ${data.publicUrl}`);
      } else {
        console.error(`   ❌ Supabase Hatası:`, uploadErr);
      }
    } catch (e: any) {
      console.error(`   ❌ İşleme hatası:`, e.message);
    }
    
    await sleep(1000);
  }

  console.log(`\n🎉 İşlem tamamlandı! Wikipedia Infobox üzerinden başarıyla eklenen logo sayısı: ${downloadedCount}`);
  await prisma.$disconnect();
}

run();
