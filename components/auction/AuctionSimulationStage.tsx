"use client";

/**
 * Müzayede Eş Zamanlı Tur Simülasyonu Sahnesi.
 *
 * Her turda aktif maçlar yan yana gösterilir; tüm oyuncular aynı dakikayı izler.
 * - Sol/sağda anlık golcü listesi ve gol sayısı
 * - Bye (izleyici) oyuncu badge ile işaretlenir
 * - Puan tablosu sadece bitmiş turları yansıtır (spoiler yok)
 * - Tur bitmeden/bittikten sonra "Hazırım" + lobi sahibi geçiş butonu
 */

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuctionRoomState, MatchSimulationResult, MatchEvent } from "@/lib/auction/auctionTypes";
import { calculateStandings, collectCompletedRoundMatches } from "@/lib/auction/auctionTournament";
import {
  Trophy,
  Timer,
  Award,
  RotateCcw,
  Home,
  CheckCircle2,
  ChevronRight,
  Eye,
  Swords,
} from "lucide-react";

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

  const isAllMatchesFinished = state.status === "finished";
  const rounds = state.simulationRounds || [];
  const currentRoundIndex = state.currentRoundIndex ?? 0;
  const currentRoundMinute = state.currentRoundMinute ?? state.currentSimMinute ?? 0;
  const currentRound = rounds[currentRoundIndex];

  const isRoundOver = currentRoundMinute >= 90;
  const isHost = state.hostUserId === currentUserId;

  const simReadyUserIds = state.simReadyUserIds || [];
  const isMyReady = simReadyUserIds.includes(currentUserId);
  const activeUserIds = useMemo(
    () => Object.keys(state.participants).filter((id) => Boolean(id && id.trim())),
    [state.participants]
  );
  const totalPlayers = Math.max(1, activeUserIds.length);
  const readyCount = simReadyUserIds.length;

  // Bye oyuncusu — bu turda oynamayan kişi
  const byeUserId = currentRound?.byeUserId ?? null;
  const byeUsername = byeUserId ? state.participants[byeUserId]?.username : null;

  // Puan tablosu: sadece tamamlanmış turlar dahil (spoiler yok)
  const currentStandings = useMemo(() => {
    if (isAllMatchesFinished) return state.standings;
    const completedRoundCount = isRoundOver ? currentRoundIndex + 1 : currentRoundIndex;
    const completedMatches = collectCompletedRoundMatches(
      rounds,
      completedRoundCount
    );
    return calculateStandings(activeUserIds, state.participants, completedMatches);
  }, [
    isAllMatchesFinished,
    state.standings,
    isRoundOver,
    currentRoundIndex,
    rounds,
    activeUserIds,
    state.participants,
  ]);

  // ---------------------------------------------------------------------------
  // Şampiyonluk Ekranı
  // ---------------------------------------------------------------------------
  if (isAllMatchesFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6 select-none animate-fadeIn">
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
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Simülasyon Sahnesi
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 p-3 sm:p-5 select-none animate-fadeIn">

      {/* ── Tur Başlığı ve Dakika Göstergesi ── */}
      <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Swords className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-black text-white">
            TUR {currentRoundIndex + 1}
            <span className="text-zinc-500 font-normal"> / {rounds.length}</span>
          </span>
          {byeUsername && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-[11px] font-bold">
              <Eye className="w-3 h-3 text-zinc-400" />
              {byeUsername} izliyor
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 text-amber-400 ${!isRoundOver ? "animate-spin" : ""}`} />
          <span className="font-mono font-black text-amber-400 text-sm tabular-nums">
            {currentRoundMinute}&apos; / 90&apos;
          </span>
        </div>
      </div>

      {/* ── Eş Zamanlı Maç Kartları ── */}
      {currentRound ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentRound.matches.map((match) => (
            <LiveMatchCard
              key={match.matchId}
              match={match}
              currentMinute={currentRoundMinute}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-zinc-500 text-sm py-8">Maç verisi yükleniyor...</div>
      )}

      {/* ── Tur Bitti Kontrolleri ── */}
      {isRoundOver && (
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {currentRoundIndex < rounds.length - 1
              ? `Tur ${currentRoundIndex + 1} Tamamlandı`
              : "Son Tur Tamamlandı — Lig Bitti!"}
          </span>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
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
              <span>
                {isMyReady
                  ? "Hazırsınız ✓"
                  : currentRoundIndex < rounds.length - 1
                  ? "Sonraki Tura Hazırım 👍"
                  : "Sonuçları Gör 👍"}
              </span>
            </button>

            {isHost && (
              <button
                onClick={onNextMatch}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 active:scale-98"
              >
                <span>
                  {currentRoundIndex < rounds.length - 1
                    ? "Sonraki Tura Geç (Lobi Sahibi)"
                    : "Sonuçları Göster (Lobi Sahibi)"}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>

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

      {/* ── Lig Puan Durumu ── */}
      <div className="p-5 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-xl">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-3">
          Lig Puan Durumu
        </span>
        <StandingsTable standings={currentStandings} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canlı Maç Kartı — Tek Bir Eş Zamanlı Maç
// ---------------------------------------------------------------------------

interface LiveMatchCardProps {
  match: MatchSimulationResult;
  currentMinute: number;
  currentUserId: string;
}

function LiveMatchCard({ match, currentMinute, currentUserId }: LiveMatchCardProps) {
  // Görünen eventler: sadece bu dakikaya kadar olanlar
  const visibleEvents = match.events.filter((e) => e.minute <= currentMinute);

  // Canlı skor
  const homeGoals = visibleEvents.filter(
    (e) => e.type === "goal" && e.teamUserId === match.homeUserId
  );
  const awayGoals = visibleEvents.filter(
    (e) => e.type === "goal" && e.teamUserId === match.awayUserId
  );

  const isMyMatch = match.homeUserId === currentUserId || match.awayUserId === currentUserId;

  // Son event (flash bildirim)
  const latestEvent = visibleEvents[visibleEvents.length - 1];

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-2xl border backdrop-blur-xl transition-all ${
        isMyMatch
          ? "bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_20px_rgba(34,197,94,0.12)]"
          : "bg-black/50 border-white/8"
      }`}
    >
      {/* Skor Satırı */}
      <div className="grid grid-cols-7 items-center text-center gap-1">
        {/* Ev Sahibi */}
        <div className="col-span-3 flex flex-col items-center">
          <span className={`text-sm font-black truncate max-w-[120px] ${isMyMatch && match.homeUserId === currentUserId ? "text-emerald-300" : "text-white"}`}>
            {match.homeUsername}
          </span>
          {/* Golcüler */}
          <GoalScorerList goals={homeGoals} />
        </div>

        {/* Skor */}
        <div className="col-span-1 flex items-center justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/70 border border-white/15 font-mono font-black text-xl text-emerald-300">
            <span>{homeGoals.length}</span>
            <span className="text-zinc-600">-</span>
            <span>{awayGoals.length}</span>
          </div>
        </div>

        {/* Deplasman */}
        <div className="col-span-3 flex flex-col items-center">
          <span className={`text-sm font-black truncate max-w-[120px] ${isMyMatch && match.awayUserId === currentUserId ? "text-emerald-300" : "text-white"}`}>
            {match.awayUsername}
          </span>
          {/* Golcüler */}
          <GoalScorerList goals={awayGoals} />
        </div>
      </div>

      {/* Son Event Flash Bandı */}
      {latestEvent && (
        <div
          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl text-center transition-all ${
            latestEvent.type === "goal"
              ? "text-amber-300 bg-amber-950/60 border border-amber-500/40 animate-bounce"
              : latestEvent.type === "save"
              ? "text-blue-300 bg-blue-950/50 border border-blue-500/30"
              : "text-zinc-400 bg-black/30 border border-white/5"
          }`}
        >
          [{latestEvent.minute}&apos;] {latestEvent.description}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Golcü Listesi — Bir Takımın Golcüleri
// ---------------------------------------------------------------------------

interface GoalScorerListProps {
  goals: MatchEvent[];
}

function GoalScorerList({ goals }: GoalScorerListProps) {
  if (goals.length === 0) {
    return <span className="text-[10px] text-zinc-600 font-mono h-4"> </span>;
  }

  // Golcüleri grupla: "Messi (2), Ronaldo" formatı
  const scorerCounts = goals.reduce<Record<string, number>>((acc, g) => {
    const name = g.playerName || "—";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const formatted = Object.entries(scorerCounts)
    .map(([name, count]) => (count > 1 ? `${name} (${count})` : name))
    .join(", ");

  return (
    <span className="text-[10px] text-amber-300 font-mono mt-0.5 max-w-[130px] truncate text-center" title={formatted}>
      ⚽ {formatted}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Puan Tablosu
// ---------------------------------------------------------------------------

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
                row.userId === currentUserId
                  ? "bg-emerald-950/30 text-emerald-300 font-bold"
                  : "text-zinc-300"
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
