"use client";

import { RoomState } from "@/lib/realtime/roomState";
import { PlayerSearchItem } from "@/types/game";
import { RoundTimer } from "@/components/game/RoundTimer";
import { VersusDisplay } from "@/components/game/VersusDisplay";
import { PlayerAnswerInput } from "@/components/game/PlayerAnswerInput";
import { PassVoteControl } from "@/components/game/PassVoteControl";

interface PlayRoomAnsweringPhaseProps {
  roomState: RoomState;
  isCountryVsTeam: boolean;
  serverSecondsLeft: number | null;
  onTimeExpired: () => void;
  playerList: PlayerSearchItem[];
  onSubmitAnswer: (answer: string) => void;
  isSubmitting: boolean;
  hasErrorFeedback: boolean;
  hasVotedPass: boolean;
  opponentWantsPass: boolean;
  passVotesCount: number;
  onVotePass: () => void;
}

export function PlayRoomAnsweringPhase({
  roomState,
  isCountryVsTeam,
  serverSecondsLeft,
  onTimeExpired,
  playerList,
  onSubmitAnswer,
  isSubmitting,
  hasErrorFeedback,
  hasVotedPass,
  opponentWantsPass,
  passVotesCount,
  onVotePass,
}: PlayRoomAnsweringPhaseProps) {
  return (
    <div className="w-full flex flex-col items-center animate-fadeIn">
      <div className="flex flex-col items-center gap-1.5 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {isCountryVsTeam
            ? "2. Aşama: O Milletten ve O Kulüpten Futbolcuyu İlk Yazan Kazanır"
            : "2. Aşama: Ortak Futbolcuyu İlk Yazan Kazanır"}
        </span>
        <RoundTimer
          key={`timer-${roomState.currentRound}-${roomState.roundStatus}`}
          label="Kalan Süre"
          variant="answering"
          durationSeconds={roomState.roundDuration || 15}
          serverSecondsLeft={serverSecondsLeft}
          onTimeExpired={onTimeExpired}
        />
      </div>

      <VersusDisplay
        team1={roomState.team1}
        team2={roomState.team2}
        nation={roomState.nation}
      />

      <div className="w-full mt-4 flex flex-col items-center gap-3">
        <PlayerAnswerInput
          playerList={playerList}
          onSubmitAnswer={onSubmitAnswer}
          isSubmitting={isSubmitting}
          hasErrorFeedback={hasErrorFeedback}
        />

        <PassVoteControl
          hasVotedPass={hasVotedPass}
          opponentWantsPass={opponentWantsPass}
          passVotesCount={passVotesCount}
          isSubmitting={isSubmitting}
          onVotePass={onVotePass}
        />
      </div>
    </div>
  );
}
