/**
 * Kullanıcı kimlik doğrulama, kayıt ve misafir girişi için Zod validasyon şemaları.
 */

import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(20, "Kullanıcı adı en fazla 20 karakter olabilir")
    .regex(/^[a-zA-Z0-9_-]+$/, "Kullanıcı adı sadece harf, rakam, alt çizgi ve tire içerebilir"),
  email: z.string().trim().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Parola en az 6 karakter olmalıdır"),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Kullanıcı adı veya e-posta giriniz"),
  password: z.string().min(6, "Parola en az 6 karakter olmalıdır"),
});

export const guestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(20, "Kullanıcı adı en fazla 20 karakter olabilir")
    .regex(/^[a-zA-Z0-9_-]+$/, "Kullanıcı adı sadece harf, rakam, alt çizgi ve tire içerebilir"),
});
