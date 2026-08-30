/**
 * Futbolcu isimlerini karşılaştırmak için aksanları, Türkçe karakterleri ve noktalama işaretlerini temizler.
 *
 * @example
 * normalizeText("Zinédine Zidane") // => "zinedine zidane"
 * normalizeText("Hakan Şükür")      // => "hakan sukur"
 */

export function normalizeText(text: string): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Aksan işaretlerini kaldır
    .replace(/[^a-z0-9\s]/g, "") // Özel karakterleri kaldır
    .replace(/\s+/g, " "); // Çoklu boşlukları tek boşluğa indir
}
