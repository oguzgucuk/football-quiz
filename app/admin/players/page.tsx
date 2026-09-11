"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Image, ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { PlayerSearchFilter } from "@/components/admin/PlayerSearchFilter";
import {
  PlayerListTable,
  AdminPlayerListItem,
} from "@/components/admin/PlayerListTable";
import { PlayerEditModal } from "@/components/admin/PlayerEditModal";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<AdminPlayerListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit / Create Modal
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      perPage: "25",
    });

    if (search.trim()) params.set("q", search.trim());
    if (position) params.set("position", position);
    if (minRating) params.set("minRating", minRating);
    if (maxRating) params.set("maxRating", maxRating);

    try {
      const res = await fetch(`/api/admin/players?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setPlayers(data.players || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Fetch players failed:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, position, minRating, maxRating]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleEditPlayer = (player: AdminPlayerListItem) => {
    setSelectedPlayerId(player.id);
    setIsModalOpen(true);
  };

  const handleAddNewPlayer = () => {
    setSelectedPlayerId(null);
    setIsModalOpen(true);
  };

  return (
    <AdminAuthGate>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
        {/* Top Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/logos"
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                title="Logo paneline geç"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="size-5 text-emerald-400" />
                    <span>Oyuncu Yönetim Paneli</span>
                  </h1>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="size-3" />
                    <span>Admin</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Futbolcu isimlerini, reytinglerini, mevkilerini ve oynadıkları kulüpleri canlı düzenleyin.
                </p>
              </div>
            </div>

            {/* Quick Link to Logo admin */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin/logos"
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Image className="size-3.5" />
                <span>Logo Paneli</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <PlayerSearchFilter
            search={search}
            onSearchChange={setSearch}
            position={position}
            onPositionChange={(pos) => {
              setPosition(pos);
              setPage(1);
            }}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            maxRating={maxRating}
            onMaxRatingChange={setMaxRating}
            onAddNewPlayer={handleAddNewPlayer}
            onApplyFilters={() => {
              setPage(1);
              fetchPlayers();
            }}
          />

          <PlayerListTable
            players={players}
            loading={loading}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
            onEditPlayer={handleEditPlayer}
          />
        </main>

        {/* Edit / Create Modal */}
        <PlayerEditModal
          playerId={selectedPlayerId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchPlayers}
        />
      </div>
    </AdminAuthGate>
  );
}
