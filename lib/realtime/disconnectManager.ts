/**
 * Bağlantı kopması (disconnect), tolerans süresi (grace period) ve hükmen mağlubiyet (forfeit) yönetimi.
 * Oyuncunun 10 saniye içinde odaya tekrar bağlanabilmesi için sunucu tarafı oturum toleransını işletir.
 */

import { RoomState, ForfeitInfo } from "./roomState";
import { startGracePeriod } from "./sessionManager";
import { isBotPlayer } from "./botSimulator";

export const DISCONNECT_GRACE_SECONDS = 10;

export interface DisconnectHandlingCallbacks {
  onTick: (secondsLeft: number) => void;
  onForfeit: (forfeitInfo: ForfeitInfo) => void;
  onNotifyDisconnect: (userId: string, graceSeconds: number) => void;
}

export function handleMatchPlayerDisconnect(
  roomId: string,
  disconnectedUserId: string,
  state: RoomState,
  callbacks: DisconnectHandlingCallbacks
): boolean {
  const isMatchActive = state.status === "in_round";
  const isPlayer1 = state.player1?.userId === disconnectedUserId;
  const isPlayer2 = state.player2?.userId === disconnectedUserId;

  if (
    !isMatchActive ||
    (!isPlayer1 && !isPlayer2) ||
    !disconnectedUserId ||
    isBotPlayer(disconnectedUserId)
  ) {
    return false;
  }

  const disconnectedPlayer = isPlayer1 ? state.player1! : state.player2!;
  const remainingPlayer = isPlayer1 ? state.player2 : state.player1;

  disconnectedPlayer.isDisconnected = true;
  disconnectedPlayer.disconnectedAt = Date.now();

  state.disconnectGrace = {
    userId: disconnectedUserId,
    username: disconnectedPlayer.username,
    expiresAt: Date.now() + DISCONNECT_GRACE_SECONDS * 1000,
    secondsLeft: DISCONNECT_GRACE_SECONDS,
  };

  callbacks.onNotifyDisconnect(disconnectedUserId, DISCONNECT_GRACE_SECONDS);

  startGracePeriod(
    roomId,
    disconnectedUserId,
    disconnectedPlayer.username,
    (secondsLeft) => {
      state.disconnectGrace = {
        userId: disconnectedUserId,
        username: disconnectedPlayer.username,
        expiresAt: Date.now() + secondsLeft * 1000,
        secondsLeft,
      };
      callbacks.onTick(secondsLeft);
    },
    () => {
      const winnerUserId = remainingPlayer?.userId || "unknown";
      const forfeitInfo: ForfeitInfo = {
        forfeitUserId: disconnectedUserId,
        winnerUserId,
        reason: `${disconnectedPlayer.username} bağlantıyı kesti ve ${DISCONNECT_GRACE_SECONDS} saniye içinde dönmedi.`,
      };

      state.status = "match_finished";
      state.disconnectGrace = null;
      state.forfeitInfo = forfeitInfo;

      callbacks.onForfeit(forfeitInfo);
    }
  );

  return true;
}
