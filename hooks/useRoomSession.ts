/**
 * Oyun odası session token'larının sessionStorage üzerinde güvenle
 * saklanması, okunması ve temizlenmesini yöneten yardımcı fonksiyonlar.
 */

const SESSION_STORAGE_PREFIX = "match_session_";

export function getStoredSessionToken(roomId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${roomId}`);
  } catch {
    return null;
  }
}

export function saveStoredSessionToken(roomId: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${roomId}`, token);
  } catch {
    // sessionStorage kısıtlamalarına karşı sessiz düşme
  }
}

export function clearStoredSessionToken(roomId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${roomId}`);
  } catch {
    // sessionStorage kısıtlamalarına karşı sessiz düşme
  }
}
