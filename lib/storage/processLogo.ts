/**
 * Kulüp logoları için boyut ve format optimizasyonu (Adım 2 Standardı).
 * - SVG: 200 KB üst sınır denetimi.
 * - Raster (PNG/JPG): 256x256 içine sığdırma + WebP dönüşümü (<200 KB).
 */

import sharp from "sharp";

export const MAX_FILE_SIZE = 200 * 1024; // 200 KB
export const TARGET_DIMENSION = 256; // 256px

export interface ProcessedLogo {
  buffer: Buffer;
  extension: "svg" | "webp";
  contentType: "image/svg+xml" | "image/webp";
}

/**
 * Logoyu boyuta ve formata göre işler, optimize edilmiş Buffer döndürür.
 * @param buffer Ham görsel Buffer'ı
 * @param ext Orijinal dosya uzantısı ("svg" | "png" | "webp" | "jpg")
 */
export async function processLogo(buffer: Buffer, ext: string): Promise<ProcessedLogo> {
  const normalizedExt = ext.toLowerCase().replace(/^\./, "");

  if (normalizedExt === "svg") {
    if (buffer.length > MAX_FILE_SIZE) {
      // SVG çok büyükse küçültme uyarısı
      console.warn(`⚠️ SVG 200 KB sınırını aşıyor (${(buffer.length / 1024).toFixed(1)} KB)`);
    }
    return {
      buffer,
      extension: "svg",
      contentType: "image/svg+xml",
    };
  }

  // Raster formatlar (PNG/JPG/WEBP): 256x256 px içine sığdırıp WebP formatına çevir
  const processed = await sharp(buffer)
    .resize(TARGET_DIMENSION, TARGET_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85, effort: 6 })
    .toBuffer();

  if (processed.length > MAX_FILE_SIZE) {
    console.warn(`⚠️ WebP optimizasyonu sonrası dosya büyük: ${(processed.length / 1024).toFixed(1)} KB`);
  }

  return {
    buffer: processed,
    extension: "webp",
    contentType: "image/webp",
  };
}
