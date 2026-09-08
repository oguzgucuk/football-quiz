"use client";

/**
 * Canlı oyun odası orkestrasyon hook'u.
 * useGameRoomData ve useGameRoomSocket hook'larını birleştirerek kullanıcı etkileşimlerini
 * (takım seçme, cevap gönderme, süre bitimi ve pas oylaması) yönetir.
 */

import { useState, useCallback, useEffect } from "react";
import { RoomState, createInitialRoomState } from "@/lib/realtime/roomState";
import { Team, Nation } from "@/types/game";
import { DuelLobbySettings } from "@/lib/realtime/roomEngine";
import { useGameRoomData } from "./useGameRoomData";
import { useGameRoomSocket, MatchEloResult, RoundWinnerState } from "./useGameRoomSocket";
import {
  getStoredRoomState,
  saveStoredRoomState,
  clearStoredRoomState,
} from "./useRoomSession";

const POPULAR_CLUB_NAMES = [
  "Real Madrid",
  "FC Barcelona",
  "Galatasaray",
  "Fenerbahçe",
  "Beşiktaş",
  "AC Milan",
  "Inter Milan",
  "Juventus",
  "Manchester United",
  "Arsenal FC",
  "Chelsea FC",
  "Liverpool FC",
  "Manchester City",
  "Bayern München",
  "Borussia Dortmund",
  "Paris Saint-Germain",
  "Atlético de Madrid",
  "Trabzonspor",
  "SSC Napoli",
  "Tottenham Hotspur",
];

interface UseGameRoomProps {
  roomId: string;
  userId: string;
  username: string;
}

export function useGameRoom({ roomId, userId, username }: UseGameRoomProps) {
  const [roomState, setRoomState] = useState<RoomState>(() => {
    const cached = getStoredRoomState<RoomState>(roomId);
    if (cached && (cached.player1 || cached.player2)) {
      return cached;
    }
    return createInitialRoomState(roomId);
  });

  useEffect(() => {
    if (roomState.status === "match_finished") {
      clearStoredRoomState(roomId);
    } else if (roomState.player1 || roomState.player2) {
      saveStoredRoomState(roomId, roomState);
    }
  }, [roomId, roomState]);
  const [mySelectedTeam, setMySelectedTeam] = useState<Team | null>(null);
  const [mySelectedNation, setMySelectedNation] = useState<Nation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasErrorFeedback, setHasErrorFeedback] = useState(false);
  const [serverSecondsLeft, setServerSecondsLeft] = useState<number | null>(null);
  const [matchEloResult, setMatchEloResult] = useState<MatchEloResult | null>(null);
  const [lastRoundWinner, setLastRoundWinner] = useState<RoundWinnerState | null>(null);

  // 1. Veri havuzunu yükle
  const { allTeams, playerList } = useGameRoomData();

  // 2. Canlı WebSocket bağlantısını ve mesaj dinleyicilerini yönet
  const { isConnectedToSocket, sendSocketMessage } = useGameRoomSocket({
    roomId,
    userId,
    username,
    setRoomState,
    setServerSecondsLeft,
    setMySelectedTeam,
    setMySelectedNation,
    setIsSubmitting,
    setHasErrorFeedback,
    setLastRoundWinner,
    setMatchEloResult,
  });

  // 3. Kullanıcı Takım / Millet Seçimi
  const handleSelectTeam = useCallback(
    (team: Team | null) => {
      setMySelectedTeam(team);
      if (team) {
        sendSocketMessage({
          type: "TEAM_PICKED",
          userId,
          team,
        });
      } else {
        sendSocketMessage({
          type: "TEAM_UNPICKED",
          userId,
        });
      }
    },
    [userId, sendSocketMessage]
  );

  const handleSelectNation = useCallback(
    (nation: Nation | null) => {
      setMySelectedNation(nation);
      if (nation) {
        sendSocketMessage({
          type: "NATION_PICKED",
          userId,
          nation,
        });
      } else {
        sendSocketMessage({
          type: "NATION_UNPICKED",
          userId,
        });
      }
    },
    [userId, sendSocketMessage]
  );

  // 4. Cevap Gönderme ve Doğrulama
  const handleSubmitAnswer = useCallback(
    async (submittedName: string) => {
      const isCountryVsTeam = roomState.gameMode === "country_vs_team";
      const hasEntities = isCountryVsTeam
        ? Boolean(roomState.nation && roomState.team1)
        : Boolean(roomState.team1 && roomState.team2);

      if (!hasEntities) {
        console.warn("[GameRoom] Cevap gönderilemedi: Seçimler henüz tamamlanmadı", {
          gameMode: roomState.gameMode,
          nation: roomState.nation?.name,
          team1: roomState.team1?.name,
          team2: roomState.team2?.name,
        });
        return;
      }

      if (isSubmitting) return;

      setIsSubmitting(true);
      setHasErrorFeedback(false);

      // Güvenlik zaman aşımı: Sunucudan yanıt gecikse bile kilidi 2.5sn sonra otomatik aç
      const safetyTimer = setTimeout(() => {
        setIsSubmitting(false);
      }, 2500);

      try {
        const origin = typeof window !== "undefined" ? window.location.origin : undefined;
        const sent = sendSocketMessage({
          type: "SUBMIT_ANSWER",
          userId,
          name: submittedName,
          siteUrl: origin,
        });

        if (!sent) {
          clearTimeout(safetyTimer);
          setIsSubmitting(false);
        }
      } catch (err) {
        clearTimeout(safetyTimer);
        setIsSubmitting(false);
        console.error("Cevap gönderim hatası:", err);
      }
    },
    [roomState.gameMode, roomState.nation, roomState.team1, roomState.team2, isSubmitting, userId, sendSocketMessage]
  );

  // 5. Süre Dolduğunda (Server-Authoritative: Sunucu sayacı yetkilidir, istemci süreyi kesmez)
  const handleTimeExpired = useCallback(() => {
    // Round timer ve süre bitişi sunucu (Server-Authoritative) tarafından yönetilir.
  }, []);

  // 6. Pas Geçme İsteği Gönder (Mutual Skip)
  const handleVotePass = useCallback(() => {
    sendSocketMessage({
      type: "PASS_VOTE",
      userId,
    });
  }, [userId, sendSocketMessage]);

  const hasVotedPass = Boolean(roomState.passVotes?.includes(userId));
  const opponentWantsPass = Boolean(roomState.passVotes?.some((id) => id !== userId));
  const passVotesCount = roomState.passVotes?.length || 0;

  const isCountryVsTeam = roomState.gameMode === "country_vs_team";
  const isMyTurnToPickNation = isCountryVsTeam && roomState.currentNationPickerUserId === userId;
  const isMyTurnToPickTeam = isCountryVsTeam ? roomState.currentTeamPickerUserId === userId : true;

  // 6. Özel Lobi Ayarları ve Oyunu Başlatma
  const handleUpdateLobbySettings = useCallback(
    (settings: Partial<DuelLobbySettings>) => {
      // 1. Anında arayüze yansıması için yerel state'i güncelle (Optimistic UI)
      setRoomState((prev) => ({
        ...prev,
        pickDuration: settings.pickDuration !== undefined ? settings.pickDuration : (prev.pickDuration || 15),
        roundDuration: settings.answerDuration !== undefined ? settings.answerDuration : (prev.roundDuration || 15),
        lobbySettings: {
          pickDuration: settings.pickDuration !== undefined ? settings.pickDuration : (prev.lobbySettings?.pickDuration || 15),
          answerDuration: settings.answerDuration !== undefined ? settings.answerDuration : (prev.lobbySettings?.answerDuration || 15),
        },
      }));

      // 2. Canlı WebSocket ile sunucuya ve diğer oyuncuya gönder
      sendSocketMessage({
        type: "UPDATE_LOBBY_SETTINGS",
        userId,
        settings,
      });
    },
    [userId, sendSocketMessage]
  );

  const handleStartLobbyGame = useCallback(() => {
    sendSocketMessage({
      type: "START_GAME",
      userId,
    });
  }, [userId, sendSocketMessage]);

  return {
    roomState,
    allTeams,
    playerList,
    mySelectedTeam,
    mySelectedNation,
    isCountryVsTeam,
    isMyTurnToPickNation,
    isMyTurnToPickTeam,
    isSubmitting,
    hasErrorFeedback,
    serverSecondsLeft,
    isConnectedToSocket,
    lastRoundWinner,
    matchEloResult,
    hasVotedPass,
    opponentWantsPass,
    passVotesCount,
    handleSelectTeam,
    handleSelectNation,
    handleSubmitAnswer,
    handleTimeExpired,
    handleVotePass,
    handleUpdateLobbySettings,
    handleStartLobbyGame,
    addBotOpponent: () => {
      if (isConnectedToSocket) {
        sendSocketMessage({ type: "ADD_BOT" });
        sendSocketMessage({ type: "ADD_BOT_PLAYER" });
      } else {
        setRoomState((prev) => ({
          ...prev,
          player2: {
            userId: "bot_ai",
            username: "Yapay Zeka 🤖",
            score: 0,
            fouls: 0,
            isReady: true,
          },
          status: "in_round",
          roundStatus: "picking_teams",
        }));
      }
    },
  };
}
