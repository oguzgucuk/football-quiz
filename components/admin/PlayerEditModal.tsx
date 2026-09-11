"use client";

import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, CheckCircle } from "lucide-react";
import { PlayerClubHistoryEditor, ClubHistoryItem } from "./PlayerClubHistoryEditor";

interface PlayerEditModalProps {
  playerId: string | null; // null means create new player
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PlayerEditModal({
  playerId,
  isOpen,
  onClose,
  onSaved,
}: PlayerEditModalProps) {
  const [fullName, setFullName] = useState("");
  const [overallPrime, setOverallPrime] = useState<string>("75");
  const [popularityScore, setPopularityScore] = useState<string>("50");
  const [position, setPosition] = useState("");
  const [positionsInput, setPositionsInput] = useState("");
  const [nationality, setNationality] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [history, setHistory] = useState<ClubHistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchPlayerDetails = async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/players/${playerId}`);
      const data = await res.json();
      if (res.ok && data.player) {
        const p = data.player;
        setFullName(p.fullName || "");
        setOverallPrime(p.overallPrime ? String(p.overallPrime) : "");
        setPopularityScore(String(p.popularityScore || 50));
        setPosition(p.position || "");
        setPositionsInput(p.positions ? p.positions.join(", ") : "");
        setNationality(p.nationality || "");
        setBirthDate(p.birthDate ? p.birthDate.split("T")[0] : "");
        setHistory(p.teamsHistory || []);
      }
    } catch {
      setFeedback({ text: "Detaylar yüklenemedi", isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      if (playerId) {
        fetchPlayerDetails();
      } else {
        // Reset for create
        setFullName("");
        setOverallPrime("75");
        setPopularityScore("50");
        setPosition("ST");
        setPositionsInput("ST");
        setNationality("Türkiye");
        setBirthDate("");
        setHistory([]);
      }
    }
  }, [isOpen, playerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const positions = positionsInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const payload = {
      fullName,
      overallPrime: overallPrime ? parseInt(overallPrime, 10) : null,
      popularityScore: parseInt(popularityScore, 10) || 50,
      position: position || null,
      positions,
      nationality: nationality || null,
      birthDate: birthDate ? new Date(birthDate).toISOString() : null,
    };

    try {
      const url = playerId ? `/api/admin/players/${playerId}` : "/api/admin/players";
      const method = playerId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.player)) {
        setFeedback({ text: "Değişiklikler başarıyla kaydedildi!" });
        onSaved();
        if (!playerId) {
          setTimeout(() => onClose(), 800);
        }
      } else {
        setFeedback({ text: data.error || "Kayıt başarısız", isError: true });
      }
    } catch {
      setFeedback({ text: "Bağlantı hatası", isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div>
            <h3 className="text-lg font-bold text-white">
              {playerId ? "Oyuncuyu Düzenle" : "Yeni Oyuncu Oluştur"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Oyuncu bilgilerini ve oynadığı kulüp geçmişini güncelleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.isError
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {feedback.isError ? <AlertCircle className="size-4" /> : <CheckCircle className="size-4" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-sm">Yükleniyor...</div>
          ) : (
            <>
              {/* Basic Info Form */}
              <form id="player-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      İsim Soyisim *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Reyting (Prime Overall 40-99)
                    </label>
                    <input
                      type="number"
                      min="40"
                      max="99"
                      value={overallPrime}
                      onChange={(e) => setOverallPrime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Ana Mevki (Örn: ST, CAM, CB)
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Tüm Mevkiler (Virgülle ayırın: ST, RW, CF)
                    </label>
                    <input
                      type="text"
                      value={positionsInput}
                      onChange={(e) => setPositionsInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Uyruk / Milliyet
                    </label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Doğum Tarihi
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </form>

              {/* Club History Editor (Only if player exists) */}
              {playerId && (
                <div className="pt-4 border-t border-zinc-800">
                  <PlayerClubHistoryEditor
                    playerId={playerId}
                    history={history}
                    onRefresh={fetchPlayerDetails}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Vazgeç
          </button>

          <button
            type="submit"
            form="player-form"
            disabled={saving || !fullName.trim()}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="size-4" />
            <span>{saving ? "Kaydediliyor..." : "Kaydet"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
