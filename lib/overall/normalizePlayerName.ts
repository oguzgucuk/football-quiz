/**
 * Futbolcu isimlerini aksanlardan, Türkçe karakterlerden ve özel sembollerden
 * arındırarak standartlaştırılmış küçük harf formatına dönüştürür.
 * 
 * Örnek girdi: "Luka Modrić" -> "luka modric"
 * Örnek girdi: "Pelé" -> "pele"
 * Örnek girdi: "N'Golo Kanté" -> "ngolo kante"
 */
export function normalizePlayerName(name: string): string {
  if (!name) return "";

  return name
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Diakritik (aksan) işaretlerini temizler
    .replace(/['’`\-.]/g, " ")       // Kesme, tire ve noktaları boşluğa çevirir
    .replace(/\s+/g, " ")            // Çoklu boşlukları teke indirir
    .trim();
}
