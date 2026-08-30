/**
 * İki metin arasındaki Levenshtein düzenleme mesafesini hesaplar (Typo toleransı).
 * 
 * @example
 * getLevenshteinDistance("recber", "recoberi") // => 2
 * getLevenshteinDistance("zidane", "zidan")    // => 1
 */

export function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // değiştirme
          matrix[i][j - 1] + 1,     // ekleme
          matrix[i - 1][j] + 1      // silme
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * İki kelimenin yazım hatası toleransı dahilinde eşleşip eşleşmediğini kontrol eder.
 */
export function isTypoMatch(input: string, target: string, maxDistance = 2): boolean {
  if (input === target) return true;
  
  // 4 harften kısa kelimelerde maksimum 1 harf hatası
  const allowedDistance = target.length <= 4 ? 1 : maxDistance;
  return getLevenshteinDistance(input, target) <= allowedDistance;
}
