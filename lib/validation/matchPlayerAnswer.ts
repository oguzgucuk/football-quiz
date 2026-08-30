/**
 * Kullanıcı girdisini ortak oyuncu adayları havuzunda akıllıca eşleştiren ve puanlayan fonksiyon.
 * 
 * Özellikler:
 * - Çok kelimeli girdilerde TÜM kelimelerin eşleşmesini zorunlu kılar (örn: "emre belöz" -> Emre Belözoğlu eşleşir, Emre Mor elenir).
 * - Tek kelimeli soyadı/isim girişlerinde öncelik puanlaması yapar (örn: "Bale" -> Gareth Bale).
 * - Türkçe karakter ve aksan normalizasyonu (`normalizeText`).
 * - 1-2 harf Levenshtein typo toleransı ve önek (prefix) desteği (örn: "reçöberi" -> Rüştü Reçber).
 */

import { normalizeText } from "./normalizeText";
import { isTypoMatch } from "./levenshtein";

export interface CandidatePlayer {
  id: string;
  fullName: string;
  nationality?: string | null;
}

export function matchPlayerAnswer(
  rawInput: string,
  candidates: CandidatePlayer[]
): CandidatePlayer | null {
  const normalizedInput = normalizeText(rawInput);
  if (!normalizedInput || normalizedInput.length < 2) return null;

  const inputWords = normalizedInput.split(/\s+/).filter((w) => w.length >= 2);
  if (inputWords.length === 0) return null;

  let bestMatch: CandidatePlayer | null = null;
  let highestScore = 0;

  for (const player of candidates) {
    const normalizedName = normalizeText(player.fullName);
    if (!normalizedName) continue;

    const nameWords = normalizedName.split(/\s+/).filter((w) => w.length >= 2);
    let score = 0;

    // 1. Birebir tam isim eşleşmesi
    if (normalizedInput === normalizedName) {
      score = 100;
    }
    // 2. Tam isim Levenshtein typo eşleşmesi
    else if (isTypoMatch(normalizedInput, normalizedName, 2)) {
      score = 95;
    }
    // 3. Çok kelimeli girdi durumu (örn: "emre belöz" veya "cristiano ronaldo")
    else if (inputWords.length > 1) {
      let allWordsMatched = true;
      const usedNameIndices = new Set<number>();

      for (const inWord of inputWords) {
        let wordMatched = false;

        for (let i = 0; i < nameWords.length; i++) {
          if (usedNameIndices.has(i)) continue;

          const nWord = nameWords[i];

          // Tam kelime eşleşmesi veya Typo toleransı
          if (inWord === nWord || isTypoMatch(inWord, nWord, inWord.length <= 4 ? 1 : 2)) {
            wordMatched = true;
            usedNameIndices.add(i);
            break;
          }

          // Önek eşleşmesi (örn: "beloz" -> "belozoglu" veya "recber" -> "recberi")
          if (inWord.length >= 4 && (nWord.startsWith(inWord) || inWord.startsWith(nWord))) {
            wordMatched = true;
            usedNameIndices.add(i);
            break;
          }
        }

        if (!wordMatched) {
          allWordsMatched = false;
          break;
        }
      }

      if (allWordsMatched) {
        // Tüm girdi kelimeleri başarıyla eşleşti
        score = 85 + (usedNameIndices.size / nameWords.length) * 10;
      } else {
        // Çok kelimeli girdide bazı kelimeler uyuşmadıysa (örn: "emre beloz" -> "Emre Mor"), puan 0 (ELENDİ)
        score = 0;
      }
    }
    // 4. Tek kelimeli girdi durumu (örn: "Bale", "Belözoğlu", "Reçber", "Emre")
    else {
      const singleWord = inputWords[0];

      for (let i = 0; i < nameWords.length; i++) {
        const nWord = nameWords[i];
        const isLastName = i === nameWords.length - 1;

        if (singleWord === nWord) {
          score = Math.max(score, isLastName ? 85 : 70);
        } else if (isTypoMatch(singleWord, nWord, singleWord.length <= 4 ? 1 : 2)) {
          score = Math.max(score, isLastName ? 80 : 65);
        } else if (singleWord.length >= 4 && (nWord.startsWith(singleWord) || singleWord.startsWith(nWord))) {
          score = Math.max(score, isLastName ? 78 : 60);
        }
      }

      // Alt dize kontrolü (örn: "beloz" -> "emre belozoglu")
      if (score === 0 && singleWord.length >= 4 && normalizedName.includes(singleWord)) {
        score = 75;
      }
    }

    if (score > highestScore && score >= 60) {
      highestScore = score;
      bestMatch = player;
    }
  }

  return bestMatch;
}
