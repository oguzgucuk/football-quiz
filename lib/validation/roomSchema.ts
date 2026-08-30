/**
 * Oda oluşturma ve odaya katılma istekleri için Zod doğrulama şemaları.
 */

import { z } from "zod";

export const joinRoomSchema = z.object({
  roomId: z.string().trim().min(3, "Oda kodu en az 3 karakter olmalıdır"),
  userId: z.string().trim().min(1, "Kullanıcı ID gereklidir"),
  username: z.string().trim().min(2, "Kullanıcı adı en az 2 karakter olmalıdır").max(30),
});

export const teamPickSchema = z.object({
  roomId: z.string().min(1),
  roundNumber: z.number().int().positive(),
  teamId: z.string().min(1, "Seçilen takım ID'si boş olamaz"),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type TeamPickInput = z.infer<typeof teamPickSchema>;
