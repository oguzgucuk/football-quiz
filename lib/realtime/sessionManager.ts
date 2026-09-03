/**
 * Gerçek zamanlı oyun oturumları ve bağlantı kopma (grace period) yöneticisi.
 * - UUID tabanlı kriptografik sessionToken üretimi ve doğrulaması
 * - Bağlantı koptuğunda 10 saniyelik geri sayım (Grace Period)
 * - Yeniden bağlanma (REJOIN) durumunda state kurtarma
 */

import { randomUUID } from "crypto";

export interface SessionInfo {
  token: string;
  roomId: string;
  userId: string;
  playerSlot: "player1" | "player2";
  createdAt: number;
}

export interface GracePeriodTracker {
  roomId: string;
  userId: string;
  username: string;
  timer: NodeJS.Timeout;
  interval: NodeJS.Timeout;
  expiresAt: number;
  secondsLeft: number;
}

const sessionsByToken = new Map<string, SessionInfo>();
const sessionsByRoomUser = new Map<string, string>(); // "roomId:userId" -> token
const graceTrackersByRoom = new Map<string, GracePeriodTracker>();

const GRACE_PERIOD_SECONDS = 10;

/**
 * Oyuncu için yeni bir sessionToken üretir ve kaydeder.
 */
export function createSession(
  roomId: string,
  userId: string,
  playerSlot: "player1" | "player2"
): string {
  const roomUserKey = `${roomId}:${userId}`;
  const existingToken = sessionsByRoomUser.get(roomUserKey);
  if (existingToken) {
    sessionsByToken.delete(existingToken);
  }

  const token = randomUUID();
  const session: SessionInfo = {
    token,
    roomId,
    userId,
    playerSlot,
    createdAt: Date.now(),
  };

  sessionsByToken.set(token, session);
  sessionsByRoomUser.set(roomUserKey, token);
  return token;
}

/**
 * Gönderilen sessionToken'ın odaya ve kullanıcıya ait olup olmadığını doğrular.
 */
export function validateSession(
  roomId: string,
  userId: string,
  sessionToken: string
): SessionInfo | null {
  const session = sessionsByToken.get(sessionToken);
  if (!session) return null;
  if (session.roomId !== roomId || session.userId !== userId) return null;
  return session;
}

/**
 * Oyuncu koptuğunda 10 saniyelik grace period başlatır.
 */
export function startGracePeriod(
  roomId: string,
  userId: string,
  username: string,
  onTick: (secondsLeft: number) => void,
  onExpired: () => void
): GracePeriodTracker {
  clearGracePeriod(roomId);

  const expiresAt = Date.now() + GRACE_PERIOD_SECONDS * 1000;
  let secondsLeft = GRACE_PERIOD_SECONDS;

  const interval = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft > 0) {
      onTick(secondsLeft);
    }
  }, 1000);

  const timer = setTimeout(() => {
    clearInterval(interval);
    graceTrackersByRoom.delete(roomId);
    onExpired();
  }, GRACE_PERIOD_SECONDS * 1000);

  const tracker: GracePeriodTracker = {
    roomId,
    userId,
    username,
    timer,
    interval,
    expiresAt,
    secondsLeft,
  };

  graceTrackersByRoom.set(roomId, tracker);
  return tracker;
}

/**
 * Oyuncu odaya geri döndüğünde (REJOIN) grace period zamanlayıcısını iptal eder.
 */
export function clearGracePeriod(roomId: string): boolean {
  const tracker = graceTrackersByRoom.get(roomId);
  if (!tracker) return false;

  clearTimeout(tracker.timer);
  clearInterval(tracker.interval);
  graceTrackersByRoom.delete(roomId);
  return true;
}

/**
 * Odada aktif bir grace period olup olmadığını sorgular.
 */
export function getActiveGracePeriod(roomId: string): GracePeriodTracker | null {
  return graceTrackersByRoom.get(roomId) || null;
}

/**
 * Oda tamamen bittiğinde veya silindiğinde oturum verilerini temizler.
 */
export function clearRoomSessions(roomId: string): void {
  clearGracePeriod(roomId);

  for (const [token, session] of sessionsByToken.entries()) {
    if (session.roomId === roomId) {
      sessionsByToken.delete(token);
      sessionsByRoomUser.delete(`${session.roomId}:${session.userId}`);
    }
  }
}
