/**
 * Mevcut doğrulanmış ve temizlenmiş logoları Supabase Storage'a aktarır.
 * (LOGO_STORAGE_MIGRATION Adım 1 & Adım 2)
 */

import { readdir, readFile } from "fs/promises";
import path from "path";
import { prisma } from "../lib/db/client";
import { createClient } from "@supabase/supabase-js";
import { processLogo } from "../lib/storage/processLogo";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://mwfxdrejioteevtdehns.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error("❌ HATA: SUPABASE_SERVICE_KEY veya SUPABASE_KEY .env dosyasında bulunamadı!");
  console.error("Lütfen .env dosyasına SUPABASE_SERVICE_KEY ekleyin.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const LOCAL_DIR = path.join(process.cwd(), "public/team-logos");

async function migrate() {
  console.log("🚀 [Supabase Storage Migrasyonu] Başlatılıyor...");
  console.log(`📡 Hedef Endpoint: ${SUPABASE_URL}/storage/v1/object/public/team-logos/\n`);

  const files = await readdir(LOCAL_DIR);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const teamId = path.parse(file).name;
    const rawExt = path.parse(file).ext.slice(1);
    const rawBuffer = await readFile(path.join(LOCAL_DIR, file));

    try {
      // Adım 2: Görsel Optimizasyonu & Format Dönüşümü
      const processed = await processLogo(rawBuffer, rawExt);
      const targetFilename = `${teamId}.${processed.extension}`;

      // Supabase Storage'a Yükle
      const { error: uploadError } = await supabase.storage
        .from("team-logos")
        .upload(targetFilename, processed.buffer, {
          contentType: processed.contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`❌ [${i + 1}/${files.length}] ${file} -> Hata: ${uploadError.message}`);
        failed++;
        continue;
      }

      // Public CDN URL al
      const { data } = supabase.storage
        .from("team-logos")
        .getPublicUrl(targetFilename);

      const cdnUrl = data.publicUrl;

      // Veritabanını güncelle
      await prisma.team.updateMany({
        where: { id: teamId },
        data: { logoUrl: cdnUrl },
      });

      success++;
      console.log(`✅ [${i + 1}/${files.length}] ${teamId} -> ${cdnUrl} (${(processed.buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      console.error(`❌ [${i + 1}/${files.length}] ${file} -> İstisna: ${err.message}`);
      failed++;
    }
  }

  console.log("\n==========================================");
  console.log(`🎉 [MİGRASYON TAMAMLANDI]`);
  console.log(`   - Başarılı CDN Yüklemesi: ${success}`);
  console.log(`   - Başarısız: ${failed}`);
  console.log("==========================================\n");
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
