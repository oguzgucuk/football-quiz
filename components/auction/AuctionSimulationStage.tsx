"use client";

/**
 * Müzayede Eş Zamanlı Canlı Maç Simülasyonu Sahnesi.
 * Kullanıcının çizdiği 4 kolonlu taslağa tam sadık:
 * - Kolon 1: Benim Kadrom (Dikey Mini Yeşil Saha) + Taktiklerim
 * - Kolon 2: Rakibin Kadrosu (Dikey Mini Yeşil Saha) + Rakip Taktikleri
 * - Kolon 3: Canlı Skor/Dakika + Maç Anlatımı (Spiker) + Gol Krallığı
 * - Kolon 4: Diğer Maçlar + Canlı Puan Durumu + Asist Krallığı
 * Ekranda scrollbar çıkmayacak şekilde hizada ve dengeli kutu boyutları.
 */

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AuctionRoomState,
  MatchSimulationResult,
  MatchEvent,
  TeamLineup,
  PitchPosition,
  FormationName,
} from "@/lib/auction/auctionTypes";
import { calculateStandings, collectCompletedRoundMatches } from "@/lib/auction/auctionTournament";
import { FORMATION_CONFIGS, FormationSlotDefinition } from "@/lib/auction/formationTemplates";
import { getRatingTier } from "@/lib/game/playerRatingTiers";
import {
  Trophy,
  Timer,
  RotateCcw,
  Home,
  CheckCircle2,
  ChevronRight,
  Eye,
  Swords,
  Flame,
  Award,
} from "lucide-react";

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

  // Bu turdaki benim maçım ve rakibim
  const currentMatches = currentRound?.matches || [];
  const myMatch = currentMatches.find(
    (m) => m.homeUserId === currentUserId || m.awayUserId === currentUserId
  ) || currentMatches[0];

  // İzleyici/bye durumu
  const byeUserId = currentRound?.byeUserId ?? null;
  const byeUsername = byeUserId ? state.participants[byeUserId]?.username : null;

  // Sahada gösterilecek iki takımın bilgisi:
  // Eğer benim maçım varsa: Sol = Ben, Sağ = Rakip
  // Eğer bye isem: Sol = Ev Sahibi, Sağ = Deplasman
  const isUserPlaying = myMatch && (myMatch.homeUserId === currentUserId || myMatch.awayUserId === currentUserId);
  const leftUserId = isUserPlaying
    ? currentUserId
    : myMatch?.homeUserId || activeUserIds[0];
  const rightUserId = isUserPlaying
    ? (myMatch.homeUserId === currentUserId ? myMatch.awayUserId : myMatch.homeUserId)
    : myMatch?.awayUserId || activeUserIds[1];

  const leftLineup = state.lineups[leftUserId];
  const rightLineup = state.lineups[rightUserId];
  const leftUsername = state.participants[leftUserId]?.username || "Ev Sahibi";
  const rightUsername = state.participants[rightUserId]?.username || "Deplasman";

  // Diğer maçlar (benim maçım haricindekiler)
  const otherMatches = currentMatches.filter((m) => m.matchId !== myMatch?.matchId);

  // Puan tablosu
  const currentStandings = useMemo(() => {
    if (isAllMatchesFinished) return state.standings;
    const completedRoundCount = isRoundOver ? currentRoundIndex + 1 : currentRoundIndex;
    const completedMatches = collectCompletedRoundMatches(rounds, completedRoundCount);
    return calculateStandings(activeUserIds, state.participants, completedMatches);
  }, [isAllMatchesFinished, state.standings, isRoundOver, currentRoundIndex, rounds, activeUserIds, state.participants]);

  // Gol ve Asist Krallığı İstatistikleri (Anlık Canlı)
  const { topScorers, topAssisters } = useMemo(() => {
    const goalMap: Record<string, { name: string; team: string; count: number }> = {};
    const assistMap: Record<string, { name: string; team: string; count: number }> = {};

    rounds.forEach((rnd, rIdx) => {
      const isPastRound = rIdx < currentRoundIndex;
      const isCurrent = rIdx === currentRoundIndex;

      rnd.matches.forEach((m) => {
        m.events.forEach((ev) => {
          if (ev.type === "goal") {
            const isVisible = isPastRound || (isCurrent && ev.minute <= currentRoundMinute);
            if (!isVisible) return;

            if (ev.playerName) {
              const teamName = state.participants[ev.teamUserId]?.username || "Takım";
              const key = `${ev.playerName}_${teamName}`;
              if (!goalMap[key]) goalMap[key] = { name: ev.playerName, team: teamName, count: 0 };
              goalMap[key].count++;
            }
            if (ev.assistPlayerName) {
              const teamName = state.participants[ev.teamUserId]?.username || "Takım";
              const key = `${ev.assistPlayerName}_${teamName}`;
              if (!assistMap[key]) assistMap[key] = { name: ev.assistPlayerName, team: teamName, count: 0 };
              assistMap[key].count++;
            }
          }
        });
      });
    });

    const topScorers = Object.values(goalMap).sort((a, b) => b.count - a.count).slice(0, 4);
    const topAssisters = Object.values(assistMap).sort((a, b) => b.count - a.count).slice(0, 4);
    return { topScorers, topAssisters };
  }, [rounds, currentRoundIndex, currentRoundMinute, state.participants]);

  // ---------------------------------------------------------------------------
  // ŞAMPİYONLUK EKRANI
  // ---------------------------------------------------------------------------
  if (isAllMatchesFinished) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-3.5 select-none animate-fadeIn my-auto">
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-black/70 border border-emerald-500/40 backdrop-blur-2xl text-center shadow-[0_0_60px_rgba(34,197,94,0.2)]">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 mb-2 shadow-[0_0_24px_rgba(245,158,11,0.35)]">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 mb-1.5">
            Müzayede Ligi Tamamlandı
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">
            ŞAMPİYON: {state.standings[0]?.username || "Kazanan"} 🏆
          </h2>

          <div className="mt-5 grid w-full gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="mb-2 text-left text-xs font-black uppercase tracking-widest text-zinc-400">Puan Durumu</p>
              <StandingsTable standings={state.standings} currentUserId={currentUserId} />
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col gap-3">
              <p className="text-left text-xs font-black uppercase tracking-widest text-zinc-400">Ödül Kürsüsü & Liderler</p>
              <div className="flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xs font-bold text-amber-300">⚽ Gol Kralı</span>
                  <span className="font-mono text-xs font-black text-white">{topScorers[0]?.name || "-"} ({topScorers[0]?.count || 0} Gol)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <span className="text-xs font-bold text-cyan-300">👟 Asist Kralı</span>
                  <span className="font-mono text-xs font-black text-white">{topAssisters[0]?.name || "-"} ({topAssisters[0]?.count || 0} Asist)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mt-6">
            <button
              type="button"
              onClick={onReturnToLobby}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Lobiye Dön</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/?tab=play")}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Home className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Canlı maç skorunu hesapla
  const homeGoals = myMatch?.events.filter(
    (e) => e.type === "goal" && e.teamUserId === myMatch.homeUserId && e.minute <= currentRoundMinute
  ).length || 0;

  const awayGoals = myMatch?.events.filter(
    (e) => e.type === "goal" && e.teamUserId === myMatch.awayUserId && e.minute <= currentRoundMinute
  ).length || 0;

  const visibleEvents = myMatch
    ? myMatch.events
        .filter((e) => e.minute <= currentRoundMinute)
        .slice()
        .reverse()
    : [];

  return (
    <div className="w-full h-[calc(100vh-100px)] min-h-[640px] max-h-[860px] flex flex-col gap-2.5 select-none animate-fadeIn overflow-hidden">
      {/* ── ÜST ÇUBUK: Tur Başlığı + Canlı Sayaç + Tur Geçiş Butonu ── */}
      <div className="relative flex items-center justify-between p-2.5 px-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Swords className="w-3.5 h-3.5" />
            <span>Tur {currentRoundIndex + 1} / {rounds.length}</span>
          </span>

          {byeUsername && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs font-bold">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>{byeUsername} izliyor</span>
            </span>
          )}
        </div>

        {/* Ortadaki Canlı Dakika */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1 rounded-xl bg-black/80 border border-white/15 shadow-md">
          <Timer className={`w-4 h-4 text-amber-400 ${!isRoundOver ? "animate-spin" : ""}`} />
          <span className="font-mono font-black text-amber-400 text-base tabular-nums">
            {currentRoundMinute}&apos; / 90&apos;
          </span>
        </div>

        {/* Tur Bittiğinde Geçiş Kontrolü */}
        <div className="flex items-center gap-2">
          {isRoundOver ? (
            <div className="flex items-center gap-2">
              {!isSpectator && (
                <button
                  type="button"
                  onClick={onReadyForNextMatch}
                  disabled={isMyReady}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    isMyReady
                      ? "bg-zinc-800 text-zinc-400 border border-white/10 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md active:scale-95"
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isMyReady ? "text-emerald-400" : ""}`} />
                  <span>{isMyReady ? "Hazırsınız ✓" : "Sonraki Tura Hazırım"}</span>
                </button>
              )}

              {isHost && (
                <button
                  type="button"
                  onClick={onNextMatch}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <span>{currentRoundIndex < rounds.length - 1 ? "Taktik Aşamasına Geç" : "Sonuçları Göster"}</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-mono font-bold text-zinc-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canlı Simülasyon Devam Ediyor</span>
            </span>
          )}
        </div>
      </div>

      {/* ── 4 KOLONLU ANA MAÇ DÜZENİ (ÇİZİME BİREBİR SADIK - SCROLLSUZ) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5 flex-1 min-h-0 w-full">
        {/* ============================================================ */}
        {/* KOLON 1: BENİM KADROM (DİKEY MİNİ SAHA + TAKTİKLERİM)        */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-2 rounded-2xl bg-black/40 border border-white/10 p-2.5 backdrop-blur-xl h-full overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 truncate max-w-[150px]">
              {isUserPlaying ? "Benim Kadrom" : leftUsername}
            </span>
            <span className="font-mono text-[11px] font-black text-white bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              {leftLineup?.formation || "4-2-3-1"}
            </span>
          </div>

          {/* Dikey Mini Yeşil Saha */}
          <MiniPitchView lineup={leftLineup} formation={leftLineup?.formation || "4-2-3-1"} />

          {/* Sahanın Altındaki Taktik Rozetleri */}
          <TacticsBadgesBar tactics={leftLineup?.tactics} />
        </div>

        {/* ============================================================ */}
        {/* KOLON 2: RAKİBİN KADROSU (DİKEY MİNİ SAHA + TAKTİKLERİ)      */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-2 rounded-2xl bg-black/40 border border-white/10 p-2.5 backdrop-blur-xl h-full overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 truncate max-w-[150px]">
              {isUserPlaying ? `Rakip: ${rightUsername}` : rightUsername}
            </span>
            <span className="font-mono text-[11px] font-black text-white bg-cyan-950/80 border border-cyan-400/30 px-2 py-0.5 rounded-md">
              {rightLineup?.formation || "4-2-3-1"}
            </span>
          </div>

          {/* Dikey Mini Yeşil Saha */}
          <MiniPitchView lineup={rightLineup} formation={rightLineup?.formation || "4-2-3-1"} isOpponent />

          {/* Sahanın Altındaki Taktik Rozetleri */}
          <TacticsBadgesBar tactics={rightLineup?.tactics} isOpponent />
        </div>

        {/* ============================================================ */}
        {/* KOLON 3: MAÇ MERKEZİ (SKOR/DK + SPİKER + GOL KRALLIĞI)       */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-2 h-full min-h-0 overflow-hidden">
          {/* ÜST: SKOR - DAKİKA */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl shrink-0">
            <div className="flex items-center justify-between w-full px-2 text-xs font-bold text-zinc-300">
              <span className="truncate max-w-[90px] text-emerald-300 font-black">{myMatch?.homeUsername}</span>
              <span className="font-mono text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                {currentRoundMinute}&apos; Canlı
              </span>
              <span className="truncate max-w-[90px] text-cyan-300 font-black">{myMatch?.awayUsername}</span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono font-black text-3xl sm:text-4xl text-white">{homeGoals}</span>
              <span className="text-zinc-500 text-lg font-mono font-bold">-</span>
              <span className="font-mono font-black text-3xl sm:text-4xl text-white">{awayGoals}</span>
            </div>
          </div>

          {/* ORTA: MAÇ ANLATIMI (CANLI SPİKER AKIŞI) */}
          <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-black/40 border border-white/10 p-2.5 backdrop-blur-xl overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 pb-1 border-b border-white/10">
              Maç Anlatımı
            </span>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
              {visibleEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-zinc-500 text-xs font-medium py-8">
                  Hakem düdüğünü çaldı, maç başladı...
                </div>
              ) : (
                visibleEvents.map((ev, i) => (
                  <div
                    key={`${ev.minute}_${ev.type}_${i}`}
                    className={`p-2 rounded-xl text-xs flex items-start gap-2 border transition-all ${
                      ev.type === "goal"
                        ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200 shadow-sm"
                        : ev.type === "save"
                        ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-200"
                        : "bg-white/5 border-white/5 text-zinc-300"
                    }`}
                  >
                    <span className="font-mono font-black text-[11px] text-amber-400 shrink-0 mt-0.5">
                      {ev.minute}&apos;
                    </span>
                    <span className="leading-snug text-[11px] font-medium">{ev.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ALT: GOL KRALLIĞI (H: 140px Sabit Kutu) */}
          <div className="h-[140px] rounded-2xl bg-black/40 border border-white/10 p-2.5 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Gol Krallığı</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-400">Lig Top</span>
            </div>
            <div className="flex-1 flex flex-col justify-around text-xs">
              {topScorers.length === 0 ? (
                <span className="text-zinc-500 text-[11px] text-center my-auto">Henüz gol atılmadı</span>
              ) : (
                topScorers.map((s, idx) => (
                  <div key={`${s.name}_${idx}`} className="flex items-center justify-between text-[11px] py-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-zinc-400 text-[10px] w-3.5">{idx + 1}.</span>
                      <span className="font-bold text-white truncate max-w-[120px]">{s.name}</span>
                      <span className="text-[10px] text-zinc-400">({s.team})</span>
                    </div>
                    <span className="font-mono font-black text-amber-300">{s.count} G</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* KOLON 4: LİG PANELİ (DİĞER MAÇLAR + PUAN DURUMU + ASİST)     */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-2 h-full min-h-0 overflow-hidden">
          {/* ÜST: DİĞER MAÇLAR (Kompakt Skor Kartları) */}
          <div className="rounded-2xl bg-black/50 border border-white/10 p-2.5 backdrop-blur-xl shrink-0 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Diğer Maçlar
            </span>
            {otherMatches.length === 0 ? (
              <div className="text-[11px] text-zinc-500 py-1 text-center font-medium">
                Bu turda başka maç oynanmıyor.
              </div>
            ) : (
              otherMatches.map((om) => {
                const omHomeGoals = om.events.filter((e) => e.type === "goal" && e.teamUserId === om.homeUserId && e.minute <= currentRoundMinute).length;
                const omAwayGoals = om.events.filter((e) => e.type === "goal" && e.teamUserId === om.awayUserId && e.minute <= currentRoundMinute).length;
                return (
                  <div
                    key={om.matchId}
                    className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-white/5 border border-white/5 text-xs font-mono"
                  >
                    <span className="truncate max-w-[75px] text-zinc-200 font-bold">{om.homeUsername}</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-amber-300 font-black text-[11px]">
                      {omHomeGoals} - {omAwayGoals}
                    </span>
                    <span className="truncate max-w-[75px] text-zinc-200 font-bold text-right">{om.awayUsername}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* ORTA: PUAN DURUMU (Lig Tablosu) */}
          <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-black/40 border border-white/10 p-2.5 backdrop-blur-xl overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 pb-1 border-b border-white/10">
              Puan Durumu
            </span>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <StandingsTable standings={currentStandings} currentUserId={currentUserId} compact />
            </div>
          </div>

          {/* ALT: ASİST KRALLIĞI (H: 140px Sabit Kutu - Gol Krallığı ile Eşit Boyut) */}
          <div className="h-[140px] rounded-2xl bg-black/40 border border-white/10 p-2.5 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                <Award className="w-3 h-3 text-cyan-400" />
                <span>Asist Krallığı</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-400">Lig Top</span>
            </div>
            <div className="flex-1 flex flex-col justify-around text-xs">
              {topAssisters.length === 0 ? (
                <span className="text-zinc-500 text-[11px] text-center my-auto">Henüz asist yapılmadı</span>
              ) : (
                topAssisters.map((a, idx) => (
                  <div key={`${a.name}_${idx}`} className="flex items-center justify-between text-[11px] py-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-zinc-400 text-[10px] w-3.5">{idx + 1}.</span>
                      <span className="font-bold text-white truncate max-w-[120px]">{a.name}</span>
                      <span className="text-[10px] text-zinc-400">({a.team})</span>
                    </div>
                    <span className="font-mono font-black text-cyan-300">{a.count} A</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dikey Mini Yeşil Saha Bileşeni (Kolon 1 ve Kolon 2)
// ---------------------------------------------------------------------------
function MiniPitchView({
  lineup,
  formation,
  isOpponent = false,
}: {
  lineup?: TeamLineup;
  formation?: FormationName | string;
  isOpponent?: boolean;
}) {
  const formKey = (formation as FormationName) in FORMATION_CONFIGS ? (formation as FormationName) : "4-2-3-1";
  const formationConfig = FORMATION_CONFIGS[formKey];
  const slots = lineup?.slots || [];

  return (
    <div className="relative flex-1 w-full rounded-2xl overflow-hidden border border-emerald-500/25 bg-[#092215] shadow-inner select-none min-h-[220px]">
      {/* Çim Işığı */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(16,185,129,0.15)_0%,rgba(4,26,16,0.95)_100%)] pointer-events-none" />

      {/* Saha Çizgileri */}
      <div className="absolute inset-2 border border-white/15 rounded-xl pointer-events-none" />
      <div className="absolute top-1/2 inset-x-2 h-[1px] bg-white/15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 rounded-full border border-white/15 pointer-events-none" />

      {/* 11 Oyuncu Rozeti */}
      <div className="relative w-full h-full p-2">
        {formationConfig.map((slotDef: FormationSlotDefinition, index: number) => {
          const slot = slots[index];
          const player = slot?.placedPlayer;
          const tier = player ? getRatingTier(player.overallPrime) : null;
          const x = slotDef.xPercent;
          const y = slotDef.yPercent;

          return (
            <div
              key={slotDef.slotId}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {player ? (
                <div className="flex flex-col items-center">
                  <div
                    className={`size-6 sm:size-7 rounded-full flex items-center justify-center font-mono text-[10px] font-black border shadow-md ${
                      isOpponent ? "bg-cyan-950 border-cyan-400 text-cyan-300" : tier?.badgeClass || "bg-emerald-950 border-emerald-400 text-emerald-300"
                    }`}
                  >
                    {player.overallPrime}
                  </div>
                  <span className="text-[9px] font-bold text-white bg-black/80 px-1 rounded truncate max-w-[55px] text-center mt-0.5 leading-tight shadow-sm">
                    {player.fullName.split(" ").slice(-1)[0]}
                  </span>
                </div>
              ) : (
                <div className="size-5 rounded-full border border-dashed border-white/20 bg-black/30 flex items-center justify-center text-[8px] text-zinc-500 font-mono">
                  {slotDef.targetPosition}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sahanın Altındaki Taktik Rozetleri Barı
// ---------------------------------------------------------------------------
function TacticsBadgesBar({
  tactics,
  isOpponent = false,
}: {
  tactics?: any;
  isOpponent?: boolean;
}) {
  const tempoLabel =
    tactics?.tempo === "fast" ? "Hızlı" : tactics?.tempo === "slow" ? "Yavaş" : "Dengeli";
  const buildUpLabel =
    tactics?.buildUp === "short_pass" ? "Kısa Pas" : tactics?.buildUp === "long_ball" ? "Uzun Top" : "Dengeli";
  const pressLabel =
    tactics?.pressing === "high_press" ? "Önde Pres" : tactics?.pressing === "park_bus" ? "Otobüs" : "Dengeli";
  const dirLabel =
    tactics?.attackDirection === "left"
      ? "Sol"
      : tactics?.attackDirection === "right"
      ? "Sağ"
      : tactics?.attackDirection === "center"
      ? "Merkez"
      : "Dengeli";

  return (
    <div className="grid grid-cols-4 gap-1 text-[10px] font-mono shrink-0 select-none">
      <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-center flex flex-col leading-tight">
        <span className="text-[8px] text-zinc-400 font-sans">Tempo</span>
        <span className="font-bold text-amber-300 truncate">{tempoLabel}</span>
      </div>
      <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-center flex flex-col leading-tight">
        <span className="text-[8px] text-zinc-400 font-sans">Pas</span>
        <span className="font-bold text-cyan-300 truncate">{buildUpLabel}</span>
      </div>
      <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-center flex flex-col leading-tight">
        <span className="text-[8px] text-zinc-400 font-sans">Pres</span>
        <span className="font-bold text-rose-300 truncate">{pressLabel}</span>
      </div>
      <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-center flex flex-col leading-tight">
        <span className="text-[8px] text-zinc-400 font-sans">Yön</span>
        <span className="font-bold text-emerald-300 truncate">{dirLabel}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StandingsTable (Puan Durumu)
// ---------------------------------------------------------------------------
function StandingsTable({
  standings,
  currentUserId,
  compact = false,
}: {
  standings: any[];
  currentUserId: string;
  compact?: boolean;
}) {
  return (
    <table className="w-full text-left font-mono text-[11px] select-none">
      <thead>
        <tr className="text-zinc-500 border-b border-white/10 text-[9px] uppercase font-sans">
          <th className="pb-1 w-5">#</th>
          <th className="pb-1">Takım</th>
          <th className="pb-1 text-center">O</th>
          <th className="pb-1 text-center">G</th>
          <th className="pb-1 text-center">B</th>
          <th className="pb-1 text-center">M</th>
          <th className="pb-1 text-center">Av</th>
          <th className="pb-1 text-right font-black">P</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {standings.map((s, idx) => {
          const isMe = s.userId === currentUserId;
          return (
            <tr
              key={s.userId}
              className={`transition-colors ${isMe ? "bg-emerald-500/10 text-emerald-300 font-bold" : "text-zinc-300"}`}
            >
              <td className="py-1 text-zinc-500 font-bold">{idx + 1}</td>
              <td className="py-1 font-sans font-bold truncate max-w-[80px]">{s.username}</td>
              <td className="py-1 text-center text-zinc-400">{s.played}</td>
              <td className="py-1 text-center text-zinc-400">{s.won}</td>
              <td className="py-1 text-center text-zinc-400">{s.drawn}</td>
              <td className="py-1 text-center text-zinc-400">{s.lost}</td>
              <td className="py-1 text-center text-zinc-400">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
              <td className="py-1 text-right font-black text-white">{s.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
