"use client";

/**
 * Müzayede Maç Simülasyonu ve Lig Puan Durumu Sahnesi.
 * - 30 saniyelik 90dk maç sunumu (15 pozisyonluk dinamik akış)
 * - Canlı skorboard, spiker olay akışı, renkli gol ve kurtarış bildirimleri
 * - Canlı Lig Puan Durumu ve Şampiyonluk Podyumu
 */

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuctionRoomState } from "@/lib/auction/auctionTypes";
import { calculateStandings } from "@/lib/auction/auctionTournament";
import { Trophy, Timer, Shield, Flame, ChevronRight, Award, RotateCcw, Home, CheckCircle2 } from "lucide-react";

interface AuctionSimulationStageProps {
  state: AuctionRoomState;
  currentUserId: string;
  onNextMatch: () => void;
  onReadyForNextMatch: () => void;
  onReturnToLobby: () => void;
}

export function AuctionSimulationStage({
  state,
  currentUserId,
  onNextMatch,
  onReadyForNextMatch,
  onReturnToLobby,
}: AuctionSimulationStageProps) {
  const router = useRouter();
  const matchIndex = state.currentSimMatchIndex;
  const currentMatch = state.simulationMatches[matchIndex];
  const isAllMatchesFinished = state.status === "finished";

  const visibleEvents = (currentMatch?.events || []).filter(
    (e) => e.minute <= state.currentSimMinute
  );
  const latestEvent = visibleEvents[visibleEvents.length - 1];

  // Canlı skor hesaplama
  const homeGoals = visibleEvents.filter(
    (e) => e.type === "goal" && e.teamUserId === currentMatch?.homeUserId
  ).length;
  const awayGoals = visibleEvents.filter(
    (e) => e.type === "goal" && e.teamUserId === currentMatch?.awayUserId
  ).length;

  const isMatchOver = state.currentSimMinute >= 90;
  const isHost = state.hostUserId === currentUserId;

  const simReadyUserIds = state.simReadyUserIds || [];
  const isMyReady = simReadyUserIds.includes(currentUserId);
  const activeUserIds = useMemo(
    () => Object.keys(state.participants).filter((id) => Boolean(id && id.trim())),
    [state.participants]
  );
  const totalPlayers = Math.max(1, activeUserIds.length);
  const readyCount = simReadyUserIds.length;

  // Sıfır spoiler puan durumu: Sadece tamamlanmış maçlar dahil edilir
  const currentStandings = useMemo(() => {
    if (isAllMatchesFinished) return state.standings;
    const completedCount = isMatchOver ? matchIndex + 1 : matchIndex;
    const completedMatches = state.simulationMatches.slice(0, completedCount);
    return calculateStandings(activeUserIds, state.participants, completedMatches);
  }, [
    isAllMatchesFinished,
    state.standings,
    isMatchOver,
    matchIndex,
    state.simulationMatches,
    activeUserIds,
    state.participants,
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6 select-none animate-fadeIn">
      {/* Şampiyonluk Ekranı */}
      {isAllMatchesFinished ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-black/60 border border-emerald-500/40 backdrop-blur-2xl text-center shadow-[0_0_60px_rgba(34,197,94,0.2)]">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
            <Trophy className="w-10 h-10" />
          </div>

          <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 mb-2">
            Müzayede Ligi Tamamlandı
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ŞAMPİYON: {state.standings[0]?.username || "Kazanan"} 🏆
          </h2>

          <div className="w-full max-w-xl mt-6">
            <StandingsTable standings={state.standings} currentUserId={currentUserId} />
          </div>

          {/* Oyun Sonu Navigasyon Butonları */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xl mt-8">
            <button
              onClick={onReturnToLobby}
              className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Lobiye Dön</span>
            </button>

            <button
              onClick={() => router.push("/?tab=play")}
              className="w-full sm:w-1/2 py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Home className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CANLI SKORBOARD */}
          <div className="flex flex-col p-6 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Lig Maçı {matchIndex + 1} / {state.simulationMatches.length}
              </span>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="font-mono font-black text-amber-400 text-sm">
                  {state.currentSimMinute}&apos; / 90&apos;
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 items-center text-center">
              <div className="col-span-3 flex flex-col items-center">
                <span className="text-lg sm:text-xl font-black text-white truncate max-w-[180px]">
                  {currentMatch?.homeUsername}
                </span>
                <span className="text-[10px] font-mono uppercase text-zinc-400 mt-0.5">
                  Ev Sahibi
                </span>
              </div>

              <div className="col-span-1 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/70 border border-white/15 font-mono font-black text-2xl sm:text-3xl text-emerald-300">
                  <span>{homeGoals}</span>
                  <span className="text-zinc-600">-</span>
                  <span>{awayGoals}</span>
                </div>
              </div>

              <div className="col-span-3 flex flex-col items-center">
                <span className="text-lg sm:text-xl font-black text-white truncate max-w-[180px]">
                  {currentMatch?.awayUsername}
                </span>
                <span className="text-[10px] font-mono uppercase text-zinc-400 mt-0.5">
                  Deplasman
                </span>
              </div>
            </div>

            {/* Son Olay Bildirimi (Flash Banner) */}
            <div className="mt-5 p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-center min-h-[50px]">
              {latestEvent ? (
                <div
                  className={`text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                    latestEvent.type === "goal"
                      ? "text-amber-300 bg-amber-950/60 border border-amber-500/40 text-sm font-black animate-bounce"
                      : latestEvent.type === "save"
                      ? "text-blue-300 bg-blue-950/60 border border-blue-500/40"
                      : "text-zinc-300"
                  }`}
                >
                  [{latestEvent.minute}&apos;] {latestEvent.description}
                </div>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">Maç başladı, pozisyon bekleniyor...</span>
              )}
            </div>

            {/* Maç Bitti Kontrolleri: Hazır Sistemi ve Lobi Sahibi Geçiş Butonu */}
            {isMatchOver && (
              <div className="flex flex-col items-center gap-3 mt-5 pt-4 border-t border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Maç Tamamlandı
                </span>

                <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                  {/* Hazır Butonu: Tıklandığında grileşir */}
                  <button
                    onClick={onReadyForNextMatch}
                    disabled={isMyReady}
                    className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isMyReady
                        ? "bg-zinc-800 text-zinc-400 border border-white/10 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 text-white cursor-pointer shadow-lg active:scale-98"
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isMyReady ? "text-emerald-400" : ""}`} />
                    <span>{isMyReady ? "Hazırsınız ✓" : "Sonraki Maça Hazırım 👍"}</span>
                  </button>

                  {/* Lobi Sahibi Geçiş Butonu */}
                  {isHost && (
                    <button
                      onClick={onNextMatch}
                      className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 active:scale-98"
                    >
                      <span>Sonraki Maça Geç (Lobi Sahibi)</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  )}
                </div>

                {/* X / Y Kişi Hazır Sayacı */}
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400">
                  <span className="text-emerald-400 font-extrabold text-sm">{readyCount}</span>
                  <span>/</span>
                  <span className="text-white font-extrabold text-sm">{totalPlayers}</span>
                  <span className="text-zinc-300 font-sans font-medium">Kişi Hazır</span>
                  {readyCount >= totalPlayers && (
                    <span className="text-emerald-400 font-sans text-[11px] font-bold animate-pulse">
                      (Herkes hazır, başlanıyor...)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* LİG PUAN DURUMU (STANDINGS TABLE) */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-xl">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-3">
              Lig Puan Durumu
            </span>
            <StandingsTable standings={currentStandings} currentUserId={currentUserId} />
          </div>
        </>
      )}
    </div>
  );
}

function StandingsTable({
  standings,
  currentUserId,
}: {
  standings: import("@/lib/auction/auctionTypes").StandingRow[];
  currentUserId: string;
}) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 text-zinc-400 font-mono text-[11px]">
            <th className="py-2 px-3">#</th>
            <th className="py-2 px-3">OYUNCU</th>
            <th className="py-2 px-2 text-center">O</th>
            <th className="py-2 px-2 text-center">G</th>
            <th className="py-2 px-2 text-center">B</th>
            <th className="py-2 px-2 text-center">M</th>
            <th className="py-2 px-2 text-center">AV</th>
            <th className="py-2 px-3 text-right font-black text-emerald-400">P</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => (
            <tr
              key={row.userId}
              className={`border-b border-white/5 font-mono ${
                row.userId === currentUserId ? "bg-emerald-950/30 text-emerald-300 font-bold" : "text-zinc-300"
              }`}
            >
              <td className="py-2.5 px-3 font-bold">{idx + 1}</td>
              <td className="py-2.5 px-3 font-sans font-bold flex items-center gap-1.5">
                {row.username}
                {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-400" />}
              </td>
              <td className="py-2.5 px-2 text-center">{row.played}</td>
              <td className="py-2.5 px-2 text-center">{row.won}</td>
              <td className="py-2.5 px-2 text-center">{row.drawn}</td>
              <td className="py-2.5 px-2 text-center">{row.lost}</td>
              <td className="py-2.5 px-2 text-center">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
              <td className="py-2.5 px-3 text-right font-black text-emerald-400 text-sm">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
