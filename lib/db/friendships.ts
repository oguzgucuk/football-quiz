/**
 * Arkadaşlık sistemi veritabanı repository fonksiyonları.
 * Çift yönlü (istek + kabul) arkadaşlık modelini ve anlık durum hesaplamasını yönetir.
 */

import { prisma } from "./client";

export type PresenceStatus = "çevrimiçi" | "oyunda" | "çevrimdışı";

export interface FriendRecord {
  id: string;
  friendshipId: string;
  username: string;
  eloRating: number;
  rankTier: string;
  avatarUrl: string | null;
  status: PresenceStatus;
}

export interface PendingRequest {
  friendshipId: string;
  senderId: string;
  senderUsername: string;
  senderEloRating: number;
  senderAvatarUrl: string | null;
  sentAt: Date;
}

/**
 * Son aktivite zamanı ve currentStatus alanına göre kullanıcının anlık durumunu belirler.
 * Son 2 dakika içinde aktif değilse otomatik "çevrimdışı" sayılır.
 */
export function computeUserPresence(
  lastSeenAt: Date | null,
  currentStatus: string | null
): PresenceStatus {
  if (!lastSeenAt) return "çevrimdışı";

  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const TWO_MINUTES_MS = 2 * 60 * 1000;

  if (diffMs > TWO_MINUTES_MS) {
    return "çevrimdışı";
  }

  if (currentStatus === "in_game") {
    return "oyunda";
  }

  return "çevrimiçi";
}

/**
 * Kullanıcının onaylanmış arkadaşlarını döndürür.
 * Her iki yönden (gönderilen / alınan) ACCEPTED olan kayıtları birleştirir.
 */
export async function getFriendsOfUser(userId: string): Promise<FriendRecord[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          eloRating: true,
          rankTier: true,
          avatarUrl: true,
          lastSeenAt: true,
          currentStatus: true,
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          eloRating: true,
          rankTier: true,
          avatarUrl: true,
          lastSeenAt: true,
          currentStatus: true,
        },
      },
    },
  });

  return friendships.map((f) => {
    const friend = f.senderId === userId ? f.receiver : f.sender;
    return {
      id: friend.id,
      friendshipId: f.id,
      username: friend.username,
      eloRating: friend.eloRating,
      rankTier: friend.rankTier,
      avatarUrl: friend.avatarUrl,
      status: computeUserPresence(friend.lastSeenAt, friend.currentStatus),
    };
  });
}

/**
 * Kullanıcıya gelen bekleyen arkadaşlık isteklerini döndürür.
 */
export async function getPendingRequestsForUser(userId: string): Promise<PendingRequest[]> {
  const requests = await prisma.friendship.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    include: {
      sender: {
        select: { id: true, username: true, eloRating: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    friendshipId: r.id,
    senderId: r.sender.id,
    senderUsername: r.sender.username,
    senderEloRating: r.sender.eloRating,
    senderAvatarUrl: r.sender.avatarUrl,
    sentAt: r.createdAt,
  }));
}

/**
 * A kullanıcısından B'ye arkadaşlık isteği gönderir (ID ile).
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string
): Promise<void> {
  if (senderId === receiverId) {
    throw new Error("Kendinize arkadaşlık isteği gönderemezsiniz.");
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw new Error("Bu kullanıcı zaten arkadaşınız.");
    }
    if (existing.status === "PENDING") {
      throw new Error("Bu kullanıcıya zaten bir arkadaşlık isteği gönderildi.");
    }
    if (existing.status === "BLOCKED") {
      throw new Error("Bu kullanıcıyla arkadaşlık kurulamaz.");
    }
  }

  await prisma.friendship.create({
    data: { senderId, receiverId, status: "PENDING" },
  });
}

/**
 * Kullanıcı adına göre arkadaşlık isteği gönderir.
 * Kullanıcı sistemde yoksa özel 'NOT_FOUND' hatası verir.
 */
export async function sendFriendRequestByUsername(
  senderId: string,
  targetUsername: string
): Promise<{ targetUsername: string; targetId: string }> {
  const cleanUsername = targetUsername.trim();
  if (!cleanUsername) {
    throw new Error("Lütfen bir kullanıcı adı girin.");
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      username: { equals: cleanUsername, mode: "insensitive" },
    },
    select: { id: true, username: true },
  });

  if (!targetUser) {
    const error = new Error("Böyle bir kullanıcı yok.");
    (error as unknown as { code: string }).code = "USER_NOT_FOUND";
    throw error;
  }

  if (targetUser.id === senderId) {
    throw new Error("Kendinize arkadaşlık isteği gönderemezsiniz.");
  }

  await sendFriendRequest(senderId, targetUser.id);

  return { targetUsername: targetUser.username, targetId: targetUser.id };
}

/**
 * Gelen bir arkadaşlık isteğini kabul eder.
 * Sadece isteğin alıcısı (receiverId) çağırabilir.
 */
export async function acceptFriendRequest(
  friendshipId: string,
  currentUserId: string
): Promise<void> {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship || friendship.receiverId !== currentUserId) {
    throw new Error("Böyle bir arkadaşlık isteği bulunamadı.");
  }
  if (friendship.status !== "PENDING") {
    throw new Error("Bu istek zaten işlenmiş.");
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
  });
}

/**
 * Gelen bir arkadaşlık isteğini reddeder veya var olan arkadaşlığı siler.
 */
export async function removeFriendship(
  userId: string,
  targetUserId: string
): Promise<void> {
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId },
      ],
    },
  });
}
