/**
 * Admin paneli oyuncu ve kulüp geçmişi Zod validasyon şemaları.
 */

import { z } from "zod";

export const updatePlayerSchema = z.object({
  fullName: z.string().trim().min(2, "Oyuncu adı en az 2 karakter olmalıdır"),
  birthDate: z.string().nullable().optional(),
  nationality: z.string().trim().nullable().optional(),
  position: z.string().trim().nullable().optional(),
  positions: z.array(z.string().trim()).default([]),
  overallPrime: z.coerce.number().int().min(40).max(99).nullable().optional(),
  popularityScore: z.coerce.number().int().min(0).max(100).default(50),
});

export const createPlayerSchema = z.object({
  fullName: z.string().trim().min(2, "Oyuncu adı en az 2 karakter olmalıdır"),
  birthDate: z.string().nullable().optional(),
  nationality: z.string().trim().nullable().optional(),
  position: z.string().trim().nullable().optional(),
  positions: z.array(z.string().trim()).default([]),
  overallPrime: z.coerce.number().int().min(40).max(99).nullable().optional(),
  popularityScore: z.coerce.number().int().min(0).max(100).default(50),
  initialTeamId: z.string().optional(),
  seasonStart: z.coerce.number().int().min(1900).max(2035).optional(),
});

export const addPlayerClubSchema = z.object({
  teamId: z.string().min(1, "Kulüp seçimi zorunludur"),
  seasonStart: z.coerce.number().int().min(1900).max(2035).nullable().optional(),
  seasonEnd: z.coerce.number().int().min(1900).max(2035).nullable().optional(),
  isNationalTeam: z.boolean().default(false),
});

export const updatePlayerClubSchema = z.object({
  seasonStart: z.coerce.number().int().min(1900).max(2035).nullable().optional(),
  seasonEnd: z.coerce.number().int().min(1900).max(2035).nullable().optional(),
  isNationalTeam: z.boolean().default(false),
});

export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type AddPlayerClubInput = z.infer<typeof addPlayerClubSchema>;
export type UpdatePlayerClubInput = z.infer<typeof updatePlayerClubSchema>;
