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
import { MatchLineupDrawer } from "./MatchLineupDrawer";

interface AuctionSimulationStageProps {
  state: AuctionRoomState;
  currentUserId: string;
  isSpectator?: boolean;
  onNextMatch: () => void;
  onReadyForNextMatch: () => void;
  onReturnToLobby: () => void;
}

export function AuctionSimulationStage({
  state,
  currentUserId,
  isSpectator = false,
  onNextMatch,
  onReadyForNextMatch,
  onReturnToLobby,
}: AuctionSimulationStageProps) {
  const router = useRouter();

  const isAllMatchesFinished = state.status === "finished";
  const rounds = state.simulationRounds;
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
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-3.5 select-none animate-fadeIn">
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-black/60 border border-emerald-500/40 backdrop-blur-2xl text-center shadow-[0_0_60px_rgba(34,197,94,0.2)]">
          <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 mb-2 shadow-[0_0_24px_rgba(245,158,11,0.35)]">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mb-1.5">
            Müzayede Ligi Tamamlandı
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ŞAMPİYON: {state.standings[0]?.username || "Kazanan"} 🏆
          </h2>

          <div className="mt-4 grid w-full gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)]">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="mb-1.5 text-left text-[11px] font-black uppercase tracking-widest text-zinc-400">Puan durumu</p>
              <StandingsTable standings={state.standings} currentUserId={currentUserId} />
            </div>
            <TournamentPlayerLeaders
              matches={rounds.flatMap((round) => round.matches)}
              participants={state.participants}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mt-4">
            <button
              onClick={onReturnToLobby}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Lobiye Dön</span>
            </button>

            <button
              onClick={() => router.push("/?tab=play")}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
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
    <div className="w-full flex flex-col gap-4 select-none animate-fadeIn">

      {/* ── Üst Bilgi Barı: Tur Sayacı ve Dakika ── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentRound.matches.map((match) => (
            <LiveMatchCard
              key={match.matchId}
              match={match}
              currentMinute={currentRoundMinute}
              currentUserId={currentUserId}
              lineups={state.lineups}
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

          {!isSpectator && <div className="flex flex-wrap items-center justify-center gap-3 w-full">
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
          </div>}

          {!isSpectator && <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400">
            <span className="text-emerald-400 font-extrabold text-sm">{readyCount}</span>
            <span>/</span>
            <span className="text-white font-extrabold text-sm">{totalPlayers}</span>
            <span className="text-zinc-300 font-sans font-medium">Kişi Hazır</span>
            {readyCount >= totalPlayers && (
              <span className="text-emerald-400 font-sans text-[11px] font-bold animate-pulse">
                (Herkes hazır, başlanıyor...)
              </span>
            )}
          </div>}

          <RoundHighlights matches={currentRound?.matches || []} lineups={state.lineups} />
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
  lineups: AuctionRoomState["lineups"];
}

function LiveMatchCard({ match, currentMinute, currentUserId, lineups }: LiveMatchCardProps) {
  // Görünen eventler: sadece bu dakikaya kadar olanlar (kronolojik ters sıra — en yeni üstte)
  const visibleEvents = match.events
    .filter((e) => e.minute <= currentMinute)
    .slice()
    .reverse();

  // Canlı skor
  const homeGoals = match.events.filter(
    (e) => e.type === "goal" && e.teamUserId === match.homeUserId && e.minute <= currentMinute
  );
  const awayGoals = match.events.filter(
    (e) => e.type === "goal" && e.teamUserId === match.awayUserId && e.minute <= currentMinute
  );

  const isMyMatch = match.homeUserId === currentUserId || match.awayUserId === currentUserId;
  const latestGoal = visibleEvents.find((e) => e.type === "goal");

  return (
    <div
      className={`flex flex-col gap-2.5 p-3 sm:p-3.5 rounded-2xl border backdrop-blur-xl transition-all ${
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
          <GoalScorerList goals={homeGoals} />
        </div>

        {/* Skor */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-black text-xl transition-all ${
            latestGoal
              ? "bg-amber-950/60 border-amber-500/40 text-amber-300 scale-110"
              : "bg-black/70 border-white/15 text-emerald-300"
          }`}>
            <span>{homeGoals.length}</span>
            <span className="text-zinc-600">-</span>
            <span>{awayGoals.length}</span>
          </div>
          <MatchLineupDrawer
            homeName={match.homeUsername}
            homeLineup={lineups[match.homeUserId]}
            awayName={match.awayUsername}
            awayLineup={lineups[match.awayUserId]}
            currentUserId={currentUserId}
            homeUserId={match.homeUserId}
            awayUserId={match.awayUserId}
          />
        </div>

        {/* Deplasman */}
        <div className="col-span-3 flex flex-col items-center">
          <span className={`text-sm font-black truncate max-w-[120px] ${isMyMatch && match.awayUserId === currentUserId ? "text-emerald-300" : "text-white"}`}>
            {match.awayUsername}
          </span>
          <GoalScorerList goals={awayGoals} />
        </div>
      </div>

      {/* Event Feed — tüm görünür eventler, en yeni üstte */}
      <div className="flex flex-col gap-1 max-h-24 sm:max-h-28 overflow-y-auto">
        {visibleEvents.length === 0 ? (
          <div className="text-[10px] text-zinc-600 text-center py-2 font-mono animate-pulse">
            {currentMinute < 6 ? "Maç başlıyor..." : "Maç devam ediyor..."}
          </div>
        ) : (
          visibleEvents.map((event, index) => (
            <div
              key={`${event.minute}-${event.type}-${index}`}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                event.type === "goal" && index === 0
                  ? "text-amber-200 bg-amber-950/70 border border-amber-500/50 animate-bounce"
                  : event.type === "goal"
                  ? "text-amber-300/80 bg-amber-950/40 border border-amber-500/20"
                  : event.type === "save"
                  ? "text-sky-300 bg-sky-950/40 border border-sky-500/20"
                  : "text-zinc-400 bg-black/20 border border-white/5"
              }`}
            >
              <span className="font-mono text-zinc-500 mr-1.5">{event.minute}&apos;</span>
              {event.description}
            </div>
          ))
        )}
      </div>

      {currentMinute >= 90 && <MatchSummary match={match} />}
    </div>
  );
}

function MatchSummary({ match }: { match: MatchSimulationResult }) {
  const stats = Object.values(match.playerStats || {});
  const topPlayer = [...stats].sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || b.saves - a.saves)[0];
  const saves = stats.filter((stat) => stat.saves > 0);
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-[10px]">
      <p className="mb-1 font-black uppercase tracking-wider text-amber-300">Maç Sonu</p>
      {topPlayer && <p className="text-zinc-200">⭐ En iyi oyuncu: <span className="font-bold text-white">{topPlayer.playerName}</span> ({topPlayer.goals + topPlayer.assists} gol katkısı)</p>}
      {saves.length > 0 && <p className="mt-1 text-sky-200">🧤 {saves.map((stat) => `${stat.playerName} — ${stat.saves} kurtarış`).join(", ")}</p>}
    </div>
  );
}

function RoundHighlights({ matches, lineups }: { matches: MatchSimulationResult[]; lineups: AuctionRoomState["lineups"] }) {
  const totals = new Map<string, { name: string; goals: number; assists: number; saves: number }>();
  for (const match of matches) {
    for (const stat of Object.values(match.playerStats || {})) {
      const current = totals.get(`${stat.teamUserId}:${stat.playerName}`) || { name: stat.playerName, goals: 0, assists: 0, saves: 0 };
      current.goals += stat.goals;
      current.assists += stat.assists;
      current.saves += stat.saves;
      totals.set(`${stat.teamUserId}:${stat.playerName}`, current);
    }
  }
  const leaders = [...totals.values()];
  const topGoals = [...leaders].sort((a, b) => b.goals - a.goals)[0];
  const topAssists = [...leaders].sort((a, b) => b.assists - a.assists)[0];
  const surprise = matches
    .filter((match) => match.winnerUserId)
    .map((match) => {
      const winnerIsHome = match.winnerUserId === match.homeUserId;
      const winnerOvr = lineups[winnerIsHome ? match.homeUserId : match.awayUserId]?.teamOvr || 0;
      const loserOvr = lineups[winnerIsHome ? match.awayUserId : match.homeUserId]?.teamOvr || 0;
      return { match, difference: loserOvr - winnerOvr };
    })
    .filter((item) => item.difference > 0)
    .sort((a, b) => b.difference - a.difference)[0];
  if (!topGoals) return null;
  return <div className="w-full rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-center text-[11px] text-zinc-200">
    <p className="mb-1 font-black uppercase tracking-wider text-amber-300">Turun Öne Çıkanları</p>
    <p>
      {topGoals?.goals ? `⚽ ${topGoals.name}: ${topGoals.goals} gol` : ""}
      {topAssists?.assists ? ` · 🎯 ${topAssists.name}: ${topAssists.assists} asist` : ""}
    </p>
    {surprise && <p className="mt-1 text-emerald-200">✨ Sürpriz: {surprise.match.homeUsername} {surprise.match.homeScore}-{surprise.match.awayScore} {surprise.match.awayUsername}</p>}
  </div>;
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

  const formatted = goals
    .map((goal) => `${goal.playerName || "—"}${goal.assistPlayerName ? ` (a: ${goal.assistPlayerName})` : ""}`)
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
            <th className="py-1.5 px-2.5">#</th>
            <th className="py-1.5 px-2.5">OYUNCU</th>
            <th className="py-1.5 px-2 text-center">O</th>
            <th className="py-1.5 px-2 text-center">G</th>
            <th className="py-1.5 px-2 text-center">B</th>
            <th className="py-1.5 px-2 text-center">M</th>
            <th className="py-1.5 px-2 text-center">AV</th>
            <th className="py-1.5 px-2.5 text-right font-black text-emerald-400">P</th>
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
              <td className="py-1.5 px-2.5 font-bold">{idx + 1}</td>
              <td className="py-1.5 px-2.5 font-sans font-bold flex items-center gap-1.5">
                {row.username}
                {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-400" />}
              </td>
              <td className="py-1.5 px-2 text-center">{row.played}</td>
              <td className="py-1.5 px-2 text-center">{row.won}</td>
              <td className="py-1.5 px-2 text-center">{row.drawn}</td>
              <td className="py-1.5 px-2 text-center">{row.lost}</td>
              <td className="py-1.5 px-2 text-center">{row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}</td>
              <td className="py-1.5 px-2.5 text-right font-black text-emerald-400 text-sm">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TournamentPlayerLeaders({
  matches,
  participants,
}: {
  matches: MatchSimulationResult[];
  participants: AuctionRoomState["participants"];
}) {
  const playerTotals = new Map<string, { playerName: string; teamUserId: string; goals: number; assists: number }>();

  for (const match of matches) {
    for (const stat of Object.values(match.playerStats || {})) {
      const key = `${stat.teamUserId}:${stat.playerName}`;
      const current = playerTotals.get(key) || {
        playerName: stat.playerName,
        teamUserId: stat.teamUserId,
        goals: 0,
        assists: 0,
      };
      current.goals += stat.goals;
      current.assists += stat.assists;
      playerTotals.set(key, current);
    }
  }

  const leaders = [...playerTotals.values()];
  const goalLeaders = leaders.filter((player) => player.goals > 0).sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.playerName.localeCompare(b.playerName));
  const assistLeaders = leaders.filter((player) => player.assists > 0).sort((a, b) => b.assists - a.assists || b.goals - a.goals || a.playerName.localeCompare(b.playerName));

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-black/30 p-3 text-left shadow-lg shadow-black/20">
      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-300">Oyuncu istatistikleri</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <LeaderTable title="Gol krallığı" icon="⚽" valueLabel="GOL" players={goalLeaders} valueKey="goals" participants={participants} />
        <LeaderTable title="Asist krallığı" icon="🎯" valueLabel="AST" players={assistLeaders} valueKey="assists" participants={participants} />
      </div>
    </section>
  );
}

function LeaderTable({
  title,
  icon,
  valueLabel,
  players,
  valueKey,
  participants,
}: {
  title: string;
  icon: string;
  valueLabel: string;
  players: Array<{ playerName: string; teamUserId: string; goals: number; assists: number }>;
  valueKey: "goals" | "assists";
  participants: AuctionRoomState["participants"];
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wide text-white">{icon} {title}</p>
        <span className="text-[8px] font-black text-zinc-500">{valueLabel}</span>
      </div>
      {players.length ? (
        <ol className="custom-scrollbar max-h-36 sm:max-h-44 space-y-1 overflow-y-auto pr-1">
          {players.map((player, index) => (
            <li key={`${player.teamUserId}:${player.playerName}`} className="grid grid-cols-[16px_minmax(0,1fr)_24px] items-center gap-1 rounded-md px-1 py-1 text-[10px] odd:bg-white/[0.03]">
              <span className={`font-mono font-black ${index === 0 ? "text-amber-300" : "text-zinc-500"}`}>{index + 1}.</span>
              <span className="min-w-0">
                <span className="block truncate font-bold text-zinc-200">{player.playerName}</span>
                <span className="block truncate text-[8px] text-zinc-500">{participants[player.teamUserId]?.username || "Takım"}</span>
              </span>
              <span className="text-right font-mono text-xs font-black text-emerald-300">{player[valueKey]}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-2 text-center text-[10px] text-zinc-600">Henüz veri yok</p>
      )}
    </div>
  );
}
