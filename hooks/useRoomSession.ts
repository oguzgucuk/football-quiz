/**
 * Oyun odası session token'larının sessionStorage üzerinde güvenle
 * saklanması, okunması ve temizlenmesini yöneten yardımcı fonksiyonlar.
 */

const SESSION_STORAGE_PREFIX = "match_session_";
const ROOM_STATE_STORAGE_PREFIX = "match_state_";

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
    sessionStorage.removeItem(`${ROOM_STATE_STORAGE_PREFIX}${roomId}`);
  } catch {
    // sessionStorage kısıtlamalarına karşı sessiz düşme
  }
}

export function getStoredRoomState<T = unknown>(roomId: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${ROOM_STATE_STORAGE_PREFIX}${roomId}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveStoredRoomState<T = unknown>(roomId: string, state: T): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${ROOM_STATE_STORAGE_PREFIX}${roomId}`, JSON.stringify(state));
  } catch {
    // sessionStorage kısıtlamalarına karşı sessiz düşme
  }
}

export function clearStoredRoomState(roomId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${ROOM_STATE_STORAGE_PREFIX}${roomId}`);
  } catch {
    // sessionStorage kısıtlamalarına karşı sessiz düşme
  }
}
