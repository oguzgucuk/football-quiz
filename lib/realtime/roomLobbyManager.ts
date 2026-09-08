/**
 * 1v1 Özel Lobi Mantık Yöneticisi (Room Lobby Manager).
 * Ortak Oyuncu ve Millet-Takım modlarında özel oda (lobi) süre ayarları,
 * yetki kontrolleri ve lobi durumundan maç aşamasına geçiş kurallarını yönetir.
 */

import { RoomState } from "./roomState";

export interface DuelLobbySettings {
  pickDuration: number; // 5, 10, 15, 20 saniye (Takım / Millet seçme süresi)
  answerDuration: number; // 5, 10, 15, 20 saniye (Oyuncu bulma süresi)
}

export const VALID_LOBBY_DURATIONS = [5, 10, 15, 20] as const;
export type ValidLobbyDuration = (typeof VALID_LOBBY_DURATIONS)[number];

export const DEFAULT_DUEL_LOBBY_SETTINGS: DuelLobbySettings = {
  pickDuration: 15,
  answerDuration: 15,
};

/**
 * Oda ID'sinin özel lobi olup olmadığını tespit eder (örn: oda_4010, oda_millet_1234).
 */
export function isCustomLobbyRoom(roomId: string): boolean {
  if (!roomId) return false;
  return roomId.startsWith("oda") || roomId.includes("_custom_");
}

/**
 * Verilen sürenin geçerli lobi seçenekleri (5, 10, 15, 20s) arasında olup olmadığını doğrular.
 */
export function isValidLobbyDuration(duration: number): duration is ValidLobbyDuration {
  return VALID_LOBBY_DURATIONS.includes(duration as ValidLobbyDuration);
}

/**
 * Oda sahibi tarafından gönderilen yeni lobi ayarlarını doğrular ve state'e uygular.
 */
export function updateLobbySettings(
  state: RoomState,
  requesterUserId: string,
  newSettings: Partial<DuelLobbySettings>
): { success: boolean; state: RoomState; error?: string } {
  const next: RoomState = { ...state };

  // 1. Yetki kontrolü: Eğer oda sahibi tanımlıysa ve istek atan kişi açıkça 2. oyuncuysa (misafirse) engelle
  if (
    next.hostUserId &&
    requesterUserId &&
    next.hostUserId !== requesterUserId &&
    next.player2?.userId === requesterUserId
  ) {
    return {
      success: false,
      state,
      error: "Ayarları yalnızca oda sahibi değiştirebilir.",
    };
  }

  // 2. Durum kontrolü: Yalnızca lobi aşamasında ayar güncellenebilir
  if (next.status !== "waiting_for_players") {
    return {
      success: false,
      state,
      error: "Maç başladıktan sonra lobi ayarları değiştirilemez.",
    };
  }

  const currentSettings = next.lobbySettings || { ...DEFAULT_DUEL_LOBBY_SETTINGS };
  const updatedSettings: DuelLobbySettings = { ...currentSettings };

  if (newSettings.pickDuration !== undefined) {
    const parsedPick = Number(newSettings.pickDuration);
    if (isValidLobbyDuration(parsedPick)) {
      updatedSettings.pickDuration = parsedPick;
      next.pickDuration = parsedPick;
    }
  }

  if (newSettings.answerDuration !== undefined) {
    const parsedAns = Number(newSettings.answerDuration);
    if (isValidLobbyDuration(parsedAns)) {
      updatedSettings.answerDuration = parsedAns;
      next.roundDuration = parsedAns;
    }
  }

  next.lobbySettings = updatedSettings;
  return { success: true, state: next };
}

/**
 * Lobideki oyunun başlatılabilir olup olmadığını kontrol eder.
 */
export function canStartLobbyGame(
  state: RoomState,
  requesterUserId: string
): { canStart: boolean; reason?: string } {
  if (state.status !== "waiting_for_players") {
    return { canStart: false, reason: "Oyun zaten başlatılmış." };
  }

  if (state.hostUserId && state.hostUserId !== requesterUserId) {
    return { canStart: false, reason: "Yalnızca oda sahibi oyunu başlatabilir." };
  }

  if (!state.player1 || !state.player2) {
    return { canStart: false, reason: "Oyunu başlatmak için en az 2 oyuncu gereklidir." };
  }

  return { canStart: true };
}

/**
 * Lobiyi sonlandırıp 1. turun takım seçme fazına geçirir.
 */
export function startLobbyGame(state: RoomState): RoomState {
  const next: RoomState = { ...state };

  next.status = "in_round";
  next.roundStatus = "picking_teams";
  next.currentRound = 1;
  next.passVotes = [];
  next.lastRoundWasDraw = false;
  next.isReplayRound = false;

  const pickDuration = next.lobbySettings?.pickDuration || 15;
  const answerDuration = next.lobbySettings?.answerDuration || 15;

  next.pickDuration = pickDuration;
  next.roundDuration = answerDuration;

  // Millet-Takım modunda ilk tur için rastgele rol belirleme
  if (next.gameMode === "country_vs_team" && !next.initialNationPickerUserId && next.player1 && next.player2) {
    const startWithP1 = Math.random() < 0.5;
    next.initialNationPickerUserId = startWithP1 ? next.player1.userId : next.player2.userId;
    next.currentNationPickerUserId = next.initialNationPickerUserId;
    next.currentTeamPickerUserId = startWithP1 ? next.player2.userId : next.player1.userId;
  }

  return next;
}

/**
 * Oda ID'sinden oyun modunu (Ortak Oyuncu vs Millet-Takım) tespit eder.
 */
export function getLobbyGameMode(roomId: string): "country_vs_team" | "team_vs_team" {
  if (!roomId) return "team_vs_team";
  const lower = roomId.toLowerCase();
  if (lower.includes("millet") || lower.includes("country_vs_team") || lower.includes("nation")) {
    return "country_vs_team";
  }
  return "team_vs_team";
}

/**
 * Kullanıcının girdiği kodun beklenen oyun moduyla eşleşip eşleşmediğini doğrular.
 * Yanlış moda ait kod girilirse açıklayıcı Türkçe hata mesajı üretir.
 */
export function validateRoomCodeForMode(
  rawInput: string,
  expectedMode: "team_vs_team" | "country_vs_team"
): { valid: boolean; normalizedCode: string; error?: string } {
  let cleaned = rawInput.trim();
  if (!cleaned) {
    return { valid: false, normalizedCode: "", error: "Lütfen bir lobi kodu veya bağlantı girin." };
  }

  // URL yapıştırıldıysa oda ID'sini ayıkla
  if (cleaned.includes("/play/")) {
    const parts = cleaned.split("/play/");
    cleaned = parts[parts.length - 1];
  }
  cleaned = cleaned.split("?")[0].split("#")[0].trim().toLowerCase();

  // Sadece rakamlardan oluşuyorsa (örn: 1234) moda göre önek tak
  if (/^\d{3,8}$/.test(cleaned)) {
    const prefix = expectedMode === "country_vs_team" ? "oda_millet_" : "oda_";
    cleaned = `${prefix}${cleaned}`;
  }

  const detectedMode = getLobbyGameMode(cleaned);

  if (expectedMode === "team_vs_team" && detectedMode === "country_vs_team") {
    return {
      valid: false,
      normalizedCode: cleaned,
      error: "Bu kod Millet & Takım moduna aittir! Ortak Oyuncu lobisine katılmak için lütfen bir Ortak Oyuncu kodu (örn: oda_1234) girin.",
    };
  }

  if (expectedMode === "country_vs_team" && detectedMode === "team_vs_team") {
    return {
      valid: false,
      normalizedCode: cleaned,
      error: "Bu kod Ortak Oyuncu moduna aittir! Millet & Takım lobisine katılmak için lütfen bir Millet-Takım kodu (örn: oda_millet_1234) girin.",
    };
  }

  return { valid: true, normalizedCode: cleaned };
}

