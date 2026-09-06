/**
 * Oyuncu keşif arayüzü için Türkçe aksan duyarsız ve typo (yazım hatası)
 * toleranslı veritabanı arama servisi (PostgreSQL unaccent & pg_trgm).
 */

import { prisma } from "@/lib/db/client";
import { PlayerExplorerParams } from "./players";

export interface ExplorerPlayerItem {
  id: string;
  fullName: string;
  birthDate: string | null;
  nationality: string | null;
  position: string | null;
  overallPrime: number | null;
  positions: string[];
  teams: { id: string; name: string; logoUrl: string | null }[];
}

interface RawSqlPlayer {
  id: string;
  fullName: string;
  birthDate: Date | string | null;
  nationality: string | null;
  position: string | null;
  overallPrime: number | null;
  positions: string[] | null;
  teams: { id: string; name: string; logoUrl: string | null }[] | null;
}

function buildPositionFilterSql(positionGroup?: string): string {
  const map: Record<string, string[]> = {
    ATT: ["ST", "CF", "LW", "RW"],
    MID: ["CAM", "CM", "CDM", "LM", "RM"],
    DEF: ["CB", "LB", "RB", "LWB", "RWB"],
    GK: ["GK"],
  };
  if (!positionGroup || positionGroup === "ALL" || !map[positionGroup]) return "";
  const posList = map[positionGroup].map((p) => `'${p}'`).join(",");
  return `AND p.positions && ARRAY[${posList}]::text[]`;
}

export async function searchPlayersExplorer(
  params: PlayerExplorerParams,
  limit: number,
  skip: number,
  page: number
) {
  const safeQ = (params.search || "").replace(/'/g, "''").trim();
  const primeSql = params.onlyPrime !== false ? "AND p.overall_prime IS NOT NULL" : "";
  const posSql = buildPositionFilterSql(params.positionGroup);

  const whereSql = `
    WHERE 1=1
      ${primeSql}
      ${posSql}
      AND (
        unaccent(p.full_name) ILIKE unaccent('%${safeQ}%')
        OR unaccent(p.full_name) % unaccent('${safeQ}')
        OR similarity(unaccent(p.full_name), unaccent('${safeQ}')) >= 0.3
      )
  `;

  const countSql = `SELECT COUNT(*)::int AS count FROM players p ${whereSql};`;

  const dataSql = `
    SELECT 
      p.id,
      p.full_name AS "fullName",
      p.birth_date AS "birthDate",
      p.nationality,
      p.position,
      p.overall_prime AS "overallPrime",
      p.positions,
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'logoUrl', t.logo_url))
          FROM (
            SELECT team.id, team.name, team.logo_url
            FROM player_team_history pt
            JOIN teams team ON team.id = pt.team_id
            WHERE pt.player_id = p.id
            LIMIT 5
          ) t
        ),
        '[]'::json
      ) AS teams,
      similarity(unaccent(p.full_name), unaccent('${safeQ}')) AS sim
    FROM players p
    ${whereSql}
    ORDER BY 
      CASE 
        WHEN unaccent(p.full_name) ILIKE unaccent('${safeQ}%') 
          OR unaccent(p.full_name) ILIKE unaccent('% ${safeQ}%') THEN 0
        WHEN unaccent(p.full_name) ILIKE unaccent('%${safeQ}%') THEN 1
        ELSE 2 
      END,
      p.overall_prime DESC NULLS LAST,
      sim DESC
    LIMIT ${limit} OFFSET ${skip};
  `;

  const [countResult, rawPlayers] = await Promise.all([
    prisma.$queryRawUnsafe<{ count: number }[]>(countSql),
    prisma.$queryRawUnsafe<RawSqlPlayer[]>(dataSql),
  ]);

  const total = countResult[0]?.count || 0;

  const players: ExplorerPlayerItem[] = rawPlayers.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    birthDate: p.birthDate ? new Date(p.birthDate).toISOString().slice(0, 10) : null,
    nationality: p.nationality,
    position: p.position,
    overallPrime: p.overallPrime,
    positions: p.positions || [],
    teams: p.teams || [],
  }));

  return {
    players,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
