/**
 * Oyuncu arama, filtreleme ve sayfalama istekleri için Zod validasyon şeması.
 */

import { z } from "zod";

export const playerExplorerSchema = z.object({
  search: z.string().trim().max(100).optional(),
  sortBy: z
    .enum([
      "rating_desc",
      "rating_asc",
      "age_asc",
      "age_desc",
      "name_asc",
      "name_desc",
    ])
    .default("rating_desc"),
  positionGroup: z.enum(["ALL", "ATT", "MID", "DEF", "GK"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
  onlyPrime: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val !== "false"),
});

export type PlayerExplorerQuery = z.infer<typeof playerExplorerSchema>;
