/**
 * Realtime Oyun Odası Mantık Motoru (Room Engine - Façade).
 * 
 * Modüler mimari bileşenleri:
 * - roomDefaults: Süreler, 18 elit takım listesi ve konfigürasyon
 * - roomPickManager: Oyuncu atama, takım ve millet seçimleri
 * - roomFoulManager: Zaman aşımı faulleri, ceza puanları ve seçim sıfırlama
 * - roomRoundManager: Cevaplama fazı, tur yaşam döngüsü, pas oylaması ve tur tekrarı
 * - roomAnswerEvaluator: Cevap doğrulama, süre hesabı ve CompletedRoundData kaydı
 */

export * from "./roomDefaults";
export * from "./roomPickManager";
export * from "./roomFoulManager";
export * from "./roomRoundManager";
export * from "./roomAnswerEvaluator";
