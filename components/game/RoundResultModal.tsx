"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Clock, Users, Sparkles, FastForward } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface CommonPlayer {
  id: string;
  fullName: string;
  nationality?: string | null;
  birthDate?: string | null;
}

interface RoundResultModalProps {
  roundNumber: number;
  winnerUsername?: string | null;
  correctAnswer?: string | null;
  isDraw?: boolean;
  team1Id?: string | null;
  team2Id?: string | null;
}

export function RoundResultModal({
  roundNumber,
  winnerUsername,
  correctAnswer,
  isDraw = false,
  team1Id,
  team2Id,
}: RoundResultModalProps) {
  const [commonPlayers, setCommonPlayers] = useState<CommonPlayer[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);

  useEffect(() => {
    if (!team1Id || !team2Id) return;

    let isMounted = true;
    setIsLoadingExamples(true);

    fetch(`/api/teams/common-players?team1Id=${encodeURIComponent(team1Id)}&team2Id=${encodeURIComponent(team2Id)}&limit=5`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.commonPlayers)) {
          setCommonPlayers(data.commonPlayers);
        }
      })
      .catch((err) => console.error("[RoundResultModal] Ortak oyuncu fetch hatası:", err))
      .finally(() => {
        if (isMounted) setIsLoadingExamples(false);
      });

    return () => {
      isMounted = false;
    };
  }, [team1Id, team2Id]);

  const isSkip = correctAnswer?.includes("Pas Geçildi");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-zinc-900/95 border border-zinc-800 shadow-2xl text-center flex flex-col items-center">
        {/* Üst Rozet */}
        <Badge variant={isDraw ? "warning" : "brand"} className="mb-3 px-3 py-1 font-bold text-xs">
          TUR {roundNumber} TAMAMLANDI
        </Badge>

        {/* İkon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
            isDraw
              ? isSkip
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-amber-500/10"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-rose-500/10"
              : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/10"
          }`}
        >
          {isDraw ? (
            isSkip ? (
              <FastForward className="w-7 h-7" />
            ) : (
              <Clock className="w-7 h-7" />
            )
          ) : (
            <Trophy className="w-7 h-7" />
          )}
        </div>

        {/* Başlık */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          {isDraw
            ? isSkip
              ? "Tur Karşılıklı Pas Geçildi ⏩"
              : "Süre Doldu (Puan Verilmedi)"
            : `🎉 ${winnerUsername} Kazandı!`}
        </h3>

        {/* Doğru Cevap Alanı (Biri bildiyse) */}
        {!isDraw && correctAnswer && (
          <div className="my-2 p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 w-full">
            <span className="text-[11px] text-zinc-400 font-semibold block mb-0.5">
              VERİLEN DOĞRU CEVAP
            </span>
            <span className="text-base font-extrabold text-emerald-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {correctAnswer}
            </span>
          </div>
        )}

        {/* Ortak Futbolcu Örnekleri (3-5 En Popüler Oyuncu) */}
        <div className="my-2 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 w-full text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              {isDraw ? "Oynayabilecek Ortak Futbolcular (En Popüler):" : "Diğer Popüler Ortak Futbolcular:"}
            </span>
            {commonPlayers.length > 0 && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {commonPlayers.length} Örnek
              </span>
            )}
          </div>

          {isLoadingExamples ? (
            <div className="flex items-center justify-center py-2 text-xs text-zinc-500 animate-pulse">
              Oyuncular yükleniyor...
            </div>
          ) : commonPlayers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {commonPlayers.map((player) => (
                <div
                  key={player.id}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-zinc-200 text-xs font-medium flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{player.fullName}</span>
                  {player.birthDate && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({player.birthDate.substring(0, 4)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 py-1">
              Bu iki takımda ortak forma giymiş başka oyuncu bulunamadı.
            </div>
          )}
        </div>

        {/* Sayaç / Alt Bilgi */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-2">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>Sonraki tura geçiliyor...</span>
        </div>
      </div>
    </div>
  );
}
