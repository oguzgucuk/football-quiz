/**
 * Oyuncu cevap girdisi için runtime Zod doğrulama şeması.
 */

import { z } from "zod";

export const answerSubmissionSchema = z.object({
  roomId: z.string().min(1, "Oda ID gereklidir"),
  roundNumber: z.number().int().positive("Tur numarası pozitif tam sayı olmalıdır"),
  playerName: z
    .string()
    .trim()
    .min(2, "Oyuncu adı en az 2 karakter olmalıdır")
    .max(80, "Oyuncu adı 80 karakterden uzun olamaz"),
  clientTimestamp: z.number().int().positive(),
});

export type AnswerSubmissionInput = z.infer<typeof answerSubmissionSchema>;
