"use client";

import React, { useState } from "react";
import { Trash2, Plus, Save, Calendar, Check, AlertCircle } from "lucide-react";
import { TeamBadge } from "../ui/TeamBadge";
import { TeamSearchSelect, SelectedTeam } from "./TeamSearchSelect";

export interface ClubHistoryItem {
  id?: string;
  teamId: string;
  seasonStart: number | null;
  seasonEnd: number | null;
  isNationalTeam: boolean;
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
    country?: string | null;
    league?: string | null;
  };
}

interface PlayerClubHistoryEditorProps {
  playerId: string;
  history: ClubHistoryItem[];
  onRefresh: () => void;
}

export function PlayerClubHistoryEditor({
  playerId,
  history,
  onRefresh,
}: PlayerClubHistoryEditorProps) {
  const [selectedNewTeam, setSelectedNewTeam] = useState<SelectedTeam | null>(null);
  const [newStart, setNewStart] = useState<string>("2026");
  const [newEnd, setNewEnd] = useState<string>("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add new club
  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewTeam) return;
    setLoadingAction("add");
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/players/${playerId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedNewTeam.id,
          seasonStart: newStart ? parseInt(newStart, 10) : null,
          seasonEnd: newEnd ? parseInt(newEnd, 10) : null,
        }),
      });

      if (!res.ok) throw new Error("Kulüp eklenemedi");
      setSelectedNewTeam(null);
      setNewStart("2026");
      setNewEnd("");
      onRefresh();
    } catch (err) {
      setErrorMsg("Kulüp eklenirken bir sorun oluştu.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Delete club
  const handleDeleteClub = async (teamId: string) => {
    if (!confirm("Bu kulübü oyuncunun geçmişinden silmek istediğinize emin misiniz?")) return;
    setLoadingAction(`delete-${teamId}`);
    try {
      await fetch(`/api/admin/players/${playerId}/teams/${teamId}`, { method: "DELETE" });
      onRefresh();
    } catch {
      setErrorMsg("Kulüp silinirken hata oluştu.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Oynadığı Kulüpler Geçmişi ({history.length})
        </h4>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Existing Clubs List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl">
            Henüz eklenmiş bir kulüp geçmişi yok.
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.team.id}
              className="flex items-center justify-between gap-3 p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <TeamBadge logoUrl={item.team.logoUrl} name={item.team.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{item.team.name}</div>
                  <div className="text-[11px] text-zinc-400">
                    {item.seasonStart ? `${item.seasonStart}` : "Belirsiz"} -{" "}
                    {item.seasonEnd ? `${item.seasonEnd}` : "Güncel / Devam"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteClub(item.team.id)}
                  disabled={loadingAction === `delete-${item.team.id}`}
                  title="Kulübü kaldır"
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Club Form */}
      <form onSubmit={handleAddClub} className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl space-y-3">
        <span className="text-xs font-semibold text-emerald-400 block">Yeni Kulüp Ekle</span>
        <TeamSearchSelect
          onSelect={setSelectedNewTeam}
          selectedTeam={selectedNewTeam}
          onClear={() => setSelectedNewTeam(null)}
        />

        {selectedNewTeam && (
          <div className="flex items-center gap-2.5 pt-1">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Başlangıç Yılı</label>
              <input
                type="number"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                placeholder="2026"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 block mb-1">Bitiş Yılı (Boş = Aktif)</label>
              <input
                type="number"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                placeholder="Boş bırakın"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={loadingAction === "add"}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="size-3.5" />
                <span>Ekle</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
