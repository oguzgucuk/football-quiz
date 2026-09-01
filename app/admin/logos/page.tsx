"use client";

import { useState, useEffect, useCallback } from "react";
import { TeamBadge } from "@/components/ui/TeamBadge";

interface TeamLogoEntry {
  id: string;
  name: string;
  country: string | null;
  league: string | null;
  logoUrl: string | null;
  popularityScore: number | null;
}

interface AdminLogosResponse {
  teams: TeamLogoEntry[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalWithLogo: number;
    totalNoLogo: number;
    totalAll: number;
  };
  countries: Array<{ country: string | null; count: number }>;
}

type FilterType = "all" | "with_logo" | "no_logo";

export default function AdminLogosPage() {
  const [data, setData] = useState<AdminLogosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [country, setCountry] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      filter,
      page: String(page),
      per_page: "60",
    });
    if (country) params.set("country", country);
    if (search) params.set("q", search);

    try {
      const res = await fetch(`/api/admin/logos?${params}`);
      const json: AdminLogosResponse = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [filter, country, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setPage(1);
  };

  const stats = data?.stats;
  const logoPercent = stats
    ? Math.round((stats.totalWithLogo / stats.totalAll) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-white">🏆 Logo Admin</h1>
              {stats && (
                <p className="text-sm text-zinc-400 mt-0.5">
                  <span className="text-emerald-400 font-semibold">{stats.totalWithLogo}</span> logolu ·{" "}
                  <span className="text-red-400 font-semibold">{stats.totalNoLogo}</span> logosuz ·{" "}
                  <span className="text-zinc-300">{stats.totalAll} toplam</span>{" "}
                  <span className="text-zinc-500">({logoPercent}% tamamlandı)</span>
                </p>
              )}
            </div>

            {/* Progress Bar */}
            {stats && (
              <div className="flex-1 max-w-xs">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${logoPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                id="admin-logo-search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Kulüp ara..."
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-48"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                Ara
              </button>
              {(search || searchInput) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="text-zinc-400 hover:text-zinc-200 text-sm px-2 transition-colors"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Logo Status Filter */}
            <div className="flex rounded-lg overflow-hidden border border-zinc-700">
              {(["all", "with_logo", "no_logo"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    filter === f
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {f === "all" ? "Tümü" : f === "with_logo" ? "✅ Logolu" : "⚪ Logosuz"}
                </button>
              ))}
            </div>

            {/* Country Filter */}
            <select
              id="admin-country-filter"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Tüm Ülkeler</option>
              {data?.countries?.map((c) => (
                <option key={c.country} value={c.country ?? ""}>
                  {c.country} ({c.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-3 bg-zinc-900 rounded-xl animate-pulse"
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl" />
                <div className="h-2 w-16 bg-zinc-800 rounded" />
                <div className="h-2 w-10 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="text-zinc-500 text-sm mb-4">
              {data?.pagination?.total} kulüp bulundu · Sayfa {data?.pagination?.page}/{data?.pagination?.totalPages}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {data?.teams?.map((team) => (
                <div
                  key={team.id}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:scale-105 cursor-default ${
                    team.logoUrl
                      ? "bg-zinc-900/60 border-zinc-700/50 hover:border-emerald-600/50"
                      : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-600/50"
                  }`}
                  title={`${team.name}\n${team.country ?? ""} · ${team.league ?? ""}\nPopülarite: ${team.popularityScore ?? 0}`}
                >
                  {/* Rozet */}
                  <TeamBadge
                    name={team.name}
                    logoUrl={team.logoUrl}
                    size="lg"
                  />

                  {/* İsim */}
                  <span className="text-[10px] text-zinc-300 text-center leading-tight line-clamp-2 w-full">
                    {team.name}
                  </span>

                  {/* Ülke */}
                  <span className="text-[9px] text-zinc-500 text-center truncate w-full">
                    {team.country ?? "—"}
                  </span>

                  {/* Logo durumu indikatörü */}
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      team.logoUrl ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination?.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                >
                  ← Önceki
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(7, data.pagination?.totalPages ?? 1) }, (_, i) => {
                    const half = 3;
                    let start = Math.max(1, page - half);
                    const end = Math.min(data.pagination?.totalPages ?? 1, start + 6);
                    start = Math.max(1, end - 6);
                    const p = start + i;
                    if (p > (data.pagination?.totalPages ?? 1)) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                          p === page
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.pagination?.totalPages ?? 1, p + 1))
                  }
                  disabled={page === (data.pagination?.totalPages ?? 1)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                >
                  Sonraki →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
