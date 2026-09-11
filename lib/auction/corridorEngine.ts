/**
 * Koridor Tabanlı Taktik ve Pozisyon Motoru Ana Giriş Noktası (Facade).
 * Alt modüller:
 * - corridorSetup.ts: Geometri, tempo ve koridor zarı (~90 satır)
 * - corridorPowers.ts: Güç hesaplamaları ve taktik katsayıları (~120 satır)
 * - corridorActors.ts: Şutör, asistçi ve savunmacı seçimi (~95 satır)
 */

export {
  DEFAULT_TACTICS,
  getSlotCorridor,
  calculateMatchTempo,
  determineAttackCorridor,
  mirrorCorridor,
} from "./corridorSetup";

export {
  calculateCorridorMidfieldScore,
  calculateCorridorAttackPower,
  calculateCorridorDefensePower,
} from "./corridorPowers";

export {
  pickCorridorShooter,
  pickCorridorAssist,
  pickCorridorDefender,
} from "./corridorActors";
