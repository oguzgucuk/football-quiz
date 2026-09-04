"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Swords,
  ShieldCheck,
  Percent,
  Flame,
  User,
  LogOut,
  Bot,
  Check,
  X,
  Minus,
  RotateCcw,
  LogIn,
  UserPlus,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileStageProps {
  onGoToPlay?: () => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
}

interface RecentMatchItem {
  matchId: string;
  opponentId: string;
  opponentUsername: string;
  isBot: boolean;
  playerScore: number;
  opponentScore: number;
  isWin: boolean;
  isDraw: boolean;
  eloChange: number;
  playedAt: string | Date;
}

/** Maç tarihini kullanıcı dostu Türkçe formata çevirir */
function formatMatchDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

  if (diffMinutes < 3) return "Az önce";
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  if (diffHours < 24 && now.getDate() === d.getDate()) {
    return `Bugün ${d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProfileStage({ onGoToPlay, onOpenAuthModal }: ProfileStageProps) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Gerçek Maç Geçmişi State'i
  const [matchHistory, setMatchHistory] = useState<RecentMatchItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setIsHistoryLoading(true);

    fetch(`/api/users/${user.id}/matches?limit=30`)
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((data) => setMatchHistory(data.matches ?? []))
      .catch(() => setMatchHistory([]))
      .finally(() => setIsHistoryLoading(false));
  }, [user?.id]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onGoToPlay?.();
      router.push("/");
    } catch (err) {
      console.error("[ProfileStage] Çıkış hatası:", err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const totalMatches = (user?.matchesWon || 0) + (user?.matchesLost || 0) + (user?.matchesDraw || 0);
  const winRate =
    totalMatches > 0
      ? Math.round(((user?.matchesWon || 0) / totalMatches) * 100)
      : 0;

  if (isLoading && !user) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center bg-transparent text-white select-none font-sans p-8 lg:p-12 h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-bold text-zinc-400">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Ziyaretçi / Oturum Açmamış Kullanıcı Görünümü
  if (!user) {
    return (
      <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-white select-none font-sans p-6 sm:p-8 lg:p-12 h-full custom-scrollbar">
        {/* Arka Plan Radyal Vurgusu */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,197,94,0.1)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8">
          {/* Ana Ziyaretçi Kartı */}
          <div className="relative rounded-[32px] bg-[#0c1612]/85 backdrop-blur-xl border border-white/10 p-8 sm:p-10 shadow-[0_0_35px_rgba(34,197,94,0.15)] overflow-hidden text-center flex flex-col items-center">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            <div className="relative mb-5">
              <div className="flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shadow-lg">
                <User className="size-10 sm:size-12" />
              </div>
              <span className="absolute -bottom-1 -right-1 size-7 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md font-bold">
                <Lock className="size-3.5" />
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full mb-3">
              Hesap Bağlantısı Gerekli
            </span>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white max-w-md">
              Şu Anda Bir Hesapta Değilsiniz
            </h1>

            <p className="text-sm text-zinc-400 font-medium mt-2 max-w-lg leading-relaxed">
              Oynadığınız maçların geçmişini kaydetmek, net ELO puanı değişimlerinizi incelemek,
              galibiyet serilerinizi korumak ve arkadaşlarınızla yarışmak için oturum açmanız gerekmektedir.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-7 w-full max-w-xs">
              <button
                onClick={() => onOpenAuthModal?.("login")}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-b from-[#168841] to-[#126d34] border border-emerald-400/40 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="size-4" />
                <span>Giriş Yap</span>
              </button>

              <button
                onClick={() => onOpenAuthModal?.("register")}
                className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="size-4 text-emerald-400" />
                <span>Kayıt Ol</span>
              </button>
            </div>
          </div>

          {/* Kilitli İstatistikler ve Geçmiş Önizleme Teaser'ı */}
          <div className="relative rounded-[28px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 overflow-hidden shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-base font-black text-white">
                  Kayıtlı Oyuncu Özellikleri
                </h3>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  Hesabınızı açtığınızda profilinizde otomatik aktif olacak sistemler:
                </p>
              </div>
              <Sparkles className="size-5 text-emerald-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 filter blur-[0.3px]">
              <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">ELO Derecesi</div>
                <div className="text-lg font-black text-emerald-400 mt-1 font-mono">1000 - 2400+ ELO</div>
                <div className="text-[11px] text-zinc-400 mt-1">Lojistik formülle dinamik derecelendirme</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">Maç Geçmişi Arşivi</div>
                <div className="text-lg font-black text-white mt-1 font-mono">Son 30 Karşılaşma</div>
                <div className="text-[11px] text-zinc-400 mt-1">Skorlar, rakipler ve net puan değişimleri</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
                <div className="text-[11px] font-bold text-zinc-400 uppercase">İkili Rekabet (H2H)</div>
                <div className="text-lg font-black text-white mt-1 font-mono">Rakip Karnesi</div>
                <div className="text-[11px] text-zinc-400 mt-1">Her rakibe karşı toplam galibiyet/mağlubiyet</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-white select-none font-sans p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,197,94,0.1)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-8">
        {/* 1. Üst Profil Kartı */}
        <div className="relative rounded-[28px] bg-[#0c1612]/85 backdrop-blur-xl border border-white/10 p-8 shadow-[0_0_35px_rgba(34,197,94,0.15)] overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="flex size-20 sm:size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#168841] to-[#126d34] text-white font-black text-3xl shadow-lg border border-emerald-400/30">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : "SE"}
              </div>
              <span className="absolute -bottom-1 -right-1 size-6 rounded-full border-4 border-[#0c1612] bg-emerald-500 flex items-center justify-center" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {user?.username || "Oyuncu"}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/70 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {user?.rankTier || "bronze"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Oyuncu ID: #{user?.id ? user.id.substring(0, 8) : "TR2026"} • 2026 Sezonu
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/40 shadow-xs">
                  🏆 {user?.eloRating || 1000} ELO Derecesi
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="flex gap-3">
              <div className="flex-1 sm:flex-initial text-center p-3 px-5 rounded-2xl bg-black/35 border border-white/10">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">
                  Galibiyet
                </span>
                <span className="font-mono font-black text-xl text-emerald-400">
                  {user?.matchesWon || 0}
                </span>
              </div>
              <div className="flex-1 sm:flex-initial text-center p-3 px-5 rounded-2xl bg-black/35 border border-white/10">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400 block">
                  Mağlubiyet
                </span>
                <span className="font-mono font-black text-xl text-rose-400">
                  {user?.matchesLost || 0}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 hover:border-rose-400/50 font-extrabold text-xs transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Hesaptan Çıkış Yap"
            >
              <LogOut className="size-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>

        {/* 2. 4'lü İstatistik Metrikleri */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Swords className="size-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Toplam Maç</span>
            </div>
            <p className="font-mono font-black text-2xl text-white">{totalMatches}</p>
            <span className="text-[11px] text-zinc-400 mt-1 block">Tüm sezon boyunca</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Percent className="size-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Kazanma Oranı</span>
            </div>
            <p className="font-mono font-black text-2xl text-emerald-400">{winRate}%</p>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {user?.matchesWon || 0}G - {user?.matchesLost || 0}M{(user?.matchesDraw || 0) > 0 ? ` - ${user?.matchesDraw}B` : ""}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Flame className="size-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Galibiyet Serisi</span>
            </div>
            <p className="font-mono font-black text-2xl text-orange-400">{user?.currentStreak ?? 0} Maç</p>
            <span className="text-[11px] text-zinc-400 mt-1 block">En iyi: {user?.bestStreak ?? 0} maç</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 shadow-lg text-white">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Trophy className="size-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider">En İyi Seri</span>
            </div>
            <p className="font-mono font-black text-2xl text-white">{user?.bestStreak ?? 0} Maç</p>
            <span className="text-[11px] text-zinc-400 mt-1 block">Tüm zamanların rekoru</span>
          </div>
        </div>

        {/* 3. GERÇEK KARŞILAŞMA GEÇMİŞİ TABLOSU (Dahili Kaydırmalı / Internal Scroll) */}
        <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-lg text-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Swords className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Karşılaşma Geçmişi</h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Geçmiş rakipler, skorlar ve kazanılan/kaybedilen ELO puanları
                </p>
              </div>
            </div>
            {matchHistory.length > 0 && (
              <span className="text-xs font-mono font-bold bg-emerald-950/70 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30">
                Son {matchHistory.length} Maç
              </span>
            )}
          </div>

          {/* Dahili Kaydırmalı Liste Kutusu — Sadece tablo içinde scroll eder */}
          <div className="max-h-[420px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
            {isHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
                <RotateCcw className="size-6 animate-spin text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-400">Maç geçmişi yükleniyor...</span>
              </div>
            ) : matchHistory.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/35">
                <Swords className="size-10 text-emerald-500/40 mb-3" />
                <p className="text-sm font-bold text-white">Henüz oynanmış bir maçın bulunmuyor</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Dereceli veya botlarla maç yaparak karşılaşma geçmişini ve ELO değişimlerini burada görebilirsin.
                </p>
                {onGoToPlay && (
                  <button
                    onClick={onGoToPlay}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Hemen Maça Başla
                  </button>
                )}
              </div>
            ) : (
              matchHistory.map((match) => {
                const eloPositive = match.eloChange > 0;
                const eloNegative = match.eloChange < 0;

                return (
                  <div
                    key={match.matchId}
                    className="p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/35 border-white/10 hover:border-emerald-500/40"
                  >
                    {/* Rakip Bilgisi */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className={`size-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            match.isBot
                              ? "bg-purple-950/70 text-purple-300 border border-purple-500/30"
                              : "bg-white/10 text-emerald-400 border border-white/10"
                          }`}
                        >
                          {match.isBot ? (
                            <Bot className="size-5" />
                          ) : (
                            match.opponentUsername.substring(0, 2).toUpperCase()
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white truncate">
                            {match.opponentUsername}
                          </span>
                          {match.isBot && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30">
                              BOT
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium block mt-0.5">
                          {formatMatchDate(match.playedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Skor & Sonuç & ELO Değişimi */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                      {/* Skor */}
                      <div className="flex items-center gap-1.5 font-mono font-black text-base text-white bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                        <span>{match.playerScore}</span>
                        <span className="text-zinc-500">-</span>
                        <span>{match.opponentScore}</span>
                      </div>

                      {/* Sonuç Rozeti */}
                      {match.isWin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                          <Check className="size-3 stroke-[3]" />
                          <span>Galibiyet</span>
                        </span>
                      ) : match.isDraw ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-white/10 text-zinc-300 border border-white/10">
                          <Minus className="size-3 stroke-[3]" />
                          <span>Beraberlik</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-500/30">
                          <X className="size-3 stroke-[3]" />
                          <span>Mağlubiyet</span>
                        </span>
                      )}

                      {/* ELO Değişimi */}
                      <div className="min-w-[76px] text-right font-mono font-black text-sm">
                        {eloPositive ? (
                          <span className="inline-block text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-2xs">
                            +{match.eloChange} ELO
                          </span>
                        ) : eloNegative ? (
                          <span className="inline-block text-rose-400 bg-rose-950/70 px-2.5 py-1 rounded-xl border border-rose-500/30 shadow-2xs">
                            {match.eloChange} ELO
                          </span>
                        ) : (
                          <span className="inline-block text-zinc-400 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                            0 ELO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Çıkış Yap — "Emin misin?" Onay Modalı */}
      {isLogoutModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-[#0d1611]/95 border border-white/15 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-xs">
                <LogOut className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Çıkış Yapmak İstiyor musun?
                </h3>
                <p className="text-xs text-zinc-400 mt-1 font-medium leading-relaxed">
                  Hesabından çıkış yaptığında oturumun sonlandırılır. Tekrar maç yapabilmek ve puanlarına erişmek için yeniden giriş yapman gerekecek.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm hover:shadow-rose-600/25 disabled:opacity-60"
              >
                {isLoggingOut ? (
                  <>
                    <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Çıkış Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="size-3.5" />
                    <span>Evet, Çıkış Yap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
