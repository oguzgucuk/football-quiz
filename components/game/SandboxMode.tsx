"use client";

import React, { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Shield, Sparkles, CheckCircle2, RotateCcw, Search, Wrench, Clock } from "lucide-react";
import { Team, PlayerSearchItem } from "@/types/game";
import { PlayerAnswerInput } from "./PlayerAnswerInput";
import { VersusDisplay } from "./VersusDisplay";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface SandboxModeProps {
  teams: Team[];
  playerList: PlayerSearchItem[];
}

export function SandboxMode({ teams, playerList }: SandboxModeProps) {
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasErrorFeedback, setHasErrorFeedback] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_allCommonPlayers, setAllCommonPlayers] = useState<string[] | null>(null);

  // Takım 1 Arama
  const [t1Input, setT1Input] = useState("");
  const [isT1Open, setIsT1Open] = useState(false);

  // Takım 2 Arama
  const [t2Input, setT2Input] = useState("");
  const [isT2Open, setIsT2Open] = useState(false);

  const fuseTeams = useMemo(() => {
    return new Fuse(teams, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "aliases", weight: 0.3 },
      ],
      threshold: 0.35,
      minMatchCharLength: 2,
    });
  }, [teams]);

  const t1Suggestions = useMemo(() => {
    if (!t1Input || t1Input.trim().length < 2) return [];
    return fuseTeams.search(t1Input).slice(0, 6).map((res) => res.item);
  }, [fuseTeams, t1Input]);

  const t2Suggestions = useMemo(() => {
    if (!t2Input || t2Input.trim().length < 2) return [];
    return fuseTeams.search(t2Input).slice(0, 6).map((res) => res.item);
  }, [fuseTeams, t2Input]);

  const handleStartDuel = () => {
    if (team1 && team2) {
      setIsDuelActive(true);
      setLastCorrectAnswer(null);
      setAllCommonPlayers(null);
    }
  };

  const handleReset = () => {
    setIsDuelActive(false);
    setTeam1(null);
    setTeam2(null);
    setT1Input("");
    setT2Input("");
    setLastCorrectAnswer(null);
    setAllCommonPlayers(null);
  };

  const handleSubmitAnswer = async (submittedName: string) => {
    if (!team1 || !team2 || isSubmitting) return;

    setIsSubmitting(true);
    setHasErrorFeedback(false);

    try {
      const res = await fetch("/api/game/verify-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1Id: team1.id,
          team2Id: team2.id,
          submittedName,
        }),
      });

      const data = await res.json();

      if (data.isCorrect && data.player) {
        setLastCorrectAnswer(data.player.fullName);
      } else {
        setHasErrorFeedback(true);
      }
    } catch (err) {
      console.error("Cevap doğrulama hatası:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Başlık ve Mod Bilgisi */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="brand" className="px-3 py-1 text-xs flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5" />
          Test / Serbest Sandbox Modu (Süresiz)
        </Badge>
      </div>

      {!isDuelActive ? (
        <Card variant="glass" className="w-full p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center">
            <h3 className="text-2xl font-black text-white tracking-tight">
              İstediğin İki Takımı Seç
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Süre sınırı olmadan istediğin iki kulübü eşleştir ve oyuncuları test et.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
            {/* TAKIM 1 SEÇİMİ */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                1. Takım (Sol)
              </label>
              {team1 ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TeamBadge
                      teamId={team1.id}
                      teamName={team1.name}
                      logoUrl={team1.logoUrl}
                      size="md"
                    />
                    <div>
                      <span className="font-bold text-white text-sm block">{team1.name}</span>
                      <span className="text-[11px] text-zinc-400">{team1.country}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTeam1(null)}>
                    Değiştir
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2.5">
                    <Search className="w-4 h-4 text-zinc-500 mr-2" />
                    <input
                      type="text"
                      value={t1Input}
                      onChange={(e) => {
                        setT1Input(e.target.value);
                        setIsT1Open(true);
                      }}
                      onFocus={() => setIsT1Open(true)}
                      placeholder="1. Takımı yaz (örn: Fenerbahçe)..."
                      className="w-full bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none"
                    />
                  </div>
                  {isT1Open && t1Suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-2 py-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
                      {t1Suggestions.map((t) => (
                        <li
                          key={t.id}
                          onClick={() => {
                            setTeam1(t);
                            setIsT1Open(false);
                          }}
                          className="px-4 py-2.5 hover:bg-zinc-800 text-sm text-zinc-200 cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <TeamBadge
                              teamId={t.id}
                              teamName={t.name}
                              logoUrl={t.logoUrl}
                              size="sm"
                            />
                            <span className="font-bold">{t.name}</span>
                          </div>
                          <span className="text-xs text-zinc-500">{t.country}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* TAKIM 2 SEÇİMİ */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                2. Takım (Sağ)
              </label>
              {team2 ? (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TeamBadge
                      teamId={team2.id}
                      teamName={team2.name}
                      logoUrl={team2.logoUrl}
                      size="md"
                    />
                    <div>
                      <span className="font-bold text-white text-sm block">{team2.name}</span>
                      <span className="text-[11px] text-zinc-400">{team2.country}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTeam2(null)}>
                    Değiştir
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2.5">
                    <Search className="w-4 h-4 text-zinc-500 mr-2" />
                    <input
                      type="text"
                      value={t2Input}
                      onChange={(e) => {
                        setT2Input(e.target.value);
                        setIsT2Open(true);
                      }}
                      onFocus={() => setIsT2Open(true)}
                      placeholder="2. Takımı yaz (örn: FC Barcelona)..."
                      className="w-full bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none"
                    />
                  </div>
                  {isT2Open && t2Suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-2 py-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
                      {t2Suggestions.map((t) => (
                        <li
                          key={t.id}
                          onClick={() => {
                            setTeam2(t);
                            setIsT2Open(false);
                          }}
                          className="px-4 py-2.5 hover:bg-zinc-800 text-sm text-zinc-200 cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <TeamBadge
                              teamId={t.id}
                              teamName={t.name}
                              logoUrl={t.logoUrl}
                              size="sm"
                            />
                            <span className="font-bold">{t.name}</span>
                          </div>
                          <span className="text-xs text-zinc-500">{t.country}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStartDuel}
            disabled={!team1 || !team2}
            className="w-full mt-2"
          >
            <Sparkles className="w-5 h-5" />
            Eşleşmeyi Başlat (Süresiz)
          </Button>
        </Card>
      ) : (
        <div className="w-full flex flex-col items-center animate-fadeIn">
          {/* Üst Sıfırla Butonu */}
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Süre Kısıtlaması Yok • Rahatça Deneyebilirsiniz
            </span>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Takımları Değiştir
            </Button>
          </div>

          {/* Versus Kartı */}
          <VersusDisplay team1={team1} team2={team2} />

          {/* Başarılı Doğru Cevap Bildirimi */}
          {lastCorrectAnswer && (
            <div className="w-full p-4 mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <span className="font-bold text-base block text-white">Doğru Cevap!</span>
                  <span className="text-xs text-emerald-300 font-semibold">{lastCorrectAnswer} her iki takımda da oynadı.</span>
                </div>
              </div>
            </div>
          )}

          {/* Oyuncu Girişi (Kural 12 Fuse.js Dropdown + Serbest Giriş) */}
          <div className="w-full mt-2">
            <PlayerAnswerInput
              playerList={playerList}
              onSubmitAnswer={handleSubmitAnswer}
              isSubmitting={isSubmitting}
              hasErrorFeedback={hasErrorFeedback}
            />
          </div>
        </div>
      )}
    </div>
  );
}
